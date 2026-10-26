import * as pdfjs from 'pdfjs-dist';
import { MAX_FILE_CONTENT_LENGTH } from '@/lib/server/redisActions';
import { getUploadObjectUrl, MAX_PDF_SIZE } from '@/lib/server/s3';

const MAX_PDF_PAGES = 30;

async function readBodyWithLimit(response: Response, maxBytes: number) {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error('PDF exceeds maximum allowed size of 15 MB');
  }
  if (!response.body) throw new Error('Empty PDF response');

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error('PDF exceeds maximum allowed size of 15 MB');
    }
    chunks.push(value);
  }

  const data = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return data;
}

export async function scrapePdfContent(file: { bucket: string; key: string }) {
  const pdfUrl = getUploadObjectUrl(file.bucket, file.key);
  if (!pdfUrl) {
    throw new Error('Invalid PDF location');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(pdfUrl, {
      signal: controller.signal,
      redirect: 'error',
      headers: {
        // Prevent servers from sending us HTML disguised as PDF
        Accept: 'application/pdf',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/pdf') && !contentType.includes('octet-stream')) {
      throw new Error('Fetched resource is not a PDF');
    }

    const data = await readBodyWithLimit(response, MAX_PDF_SIZE);
    clearTimeout(timeout);

    const pdf = await pdfjs.getDocument({
      data,
      useSystemFonts: true,
      isEvalSupported: false, // Critical defense-in-depth: disable JS execution in PDF.js
    }).promise;

    let text = '';
    const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);
    for (let i = 1; i <= pageCount && text.length < MAX_FILE_CONTENT_LENGTH; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      text += pageText + '\n';
    }

    await pdf.destroy();
    return text.slice(0, MAX_FILE_CONTENT_LENGTH);
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
