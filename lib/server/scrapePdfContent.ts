import * as pdfjs from 'pdfjs-dist';

// Maximum PDF size: 15 MB
const MAX_PDF_SIZE = 15 * 1024 * 1024;

function isAllowedPdfUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') return false;

    // Allow only S3 and common cloud storage hostnames.
    // Adjust the allowed pattern to match your S3 bucket / CDN domain(s).
    const allowedPatterns = [
      /\.s3[\w.-]*\.amazonaws\.com$/i,
      // /\.r2\.cloudflarestorage\.com$/i,
      // /\.digitaloceanspaces\.com$/i,
      // /\.storage\.googleapis\.com$/i,
    ];

    return allowedPatterns.some((pattern) => pattern.test(url.hostname));
  } catch {
    return false;
  }
}

export async function scrapePdfContent(pdfUrl: string) {
  if (!isAllowedPdfUrl(pdfUrl)) {
    throw new Error('Invalid PDF URL: only approved storage hostnames are allowed');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(pdfUrl, {
      signal: controller.signal,
      headers: {
        // Prevent servers from sending us HTML disguised as PDF
        Accept: 'application/pdf',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/pdf') && !contentType.includes('octet-stream')) {
      throw new Error('Fetched resource is not a PDF');
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_PDF_SIZE) {
      throw new Error('PDF exceeds maximum allowed size of 15 MB');
    }

    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false, // Critical defense-in-depth: disable JS execution in PDF.js
    }).promise;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      text += pageText + '\n';
    }

    await pdf.destroy();
    return text;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
