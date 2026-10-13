import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';

// Resumes are small; anything larger is almost certainly the wrong file.
export const MAX_INPUT_BYTES = 5 * 1024 * 1024;
export const MAX_TEXT_CHARS = 40_000;
const MIN_TEXT_CHARS = 200;

const DOCX_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // "PK\x03\x04" (zip container)
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

export type ResumeFileKind = 'docx' | 'pdf';

const hasMagic = (head: Uint8Array, magic: number[]) =>
  head.length >= magic.length && magic.every((b, i) => head[i] === b);

/** Extension AND file signature must agree; anything else is rejected. */
export function detectKind(filePath: string, head: Uint8Array): ResumeFileKind {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.docx' && hasMagic(head, DOCX_MAGIC)) return 'docx';
  if (ext === '.pdf' && hasMagic(head, PDF_MAGIC)) return 'pdf';
  throw new Error(
    'Unsupported file: expected a .docx or .pdf whose contents match its extension',
  );
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

/** Convert mammoth's HTML to plain text, keeping hyperlink targets (LinkedIn/GitHub URLs often live only in links). */
export function htmlToTextWithLinks(html: string): string {
  const links = new Set<string>();
  for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"/gi)) {
    const href = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:)/i.test(href)) links.add(href);
  }
  const text = html
    .replace(/<\/(p|li|tr|h[1-6])>|<br\s*\/?>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' | ')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (e) => ENTITIES[e] ?? e);
  return links.size ? `${text}\n\nLinks:\n${[...links].join('\n')}` : text;
}

export function normalizeText(raw: string): string {
  return raw
    .replace(/\x0d/g, '')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function docxToText(buf: Buffer): Promise<string> {
  const { value } = await mammoth.convertToHtml({ buffer: buf });
  return htmlToTextWithLinks(value);
}

async function pdfToText(buf: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buf),
    isEvalSupported: false, // never evaluate PDF-embedded code
    useSystemFonts: true,
  }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => ('str' in it ? it.str : '')).join(' ') + '\n';
  }
  await pdf.destroy();
  return text;
}

export async function extractResumeText(filePath: string): Promise<string> {
  const info = await stat(filePath);
  if (!info.isFile()) throw new Error('Input path is not a file');
  if (info.size > MAX_INPUT_BYTES) throw new Error('Input file exceeds 5 MB');

  const buf = await readFile(filePath);
  const kind = detectKind(filePath, buf.subarray(0, 8));
  const text = normalizeText(kind === 'docx' ? await docxToText(buf) : await pdfToText(buf));

  if (text.length < MIN_TEXT_CHARS)
    throw new Error('Extracted text is too short; is this a scanned image?');
  if (text.length > MAX_TEXT_CHARS)
    throw new Error(`Extracted text exceeds ${MAX_TEXT_CHARS} characters`);
  return text;
}
