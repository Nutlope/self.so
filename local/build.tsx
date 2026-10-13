import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import baseConfig from '../tailwind.config';
import { ResumeDataSchema } from '@/lib/resume';
import { renderHtml } from './render';

const SITE_JSON = 'site/resume.json';
const OUT_DIR = 'site-dist';
const SOURCE_URL = process.env.SITE_SOURCE_URL ?? 'https://github.com/niravpatidar37/self.so';

async function main() {
  const resume = ResumeDataSchema.parse(JSON.parse(await readFile(SITE_JSON, 'utf8')));
  const siteUrl = process.env.SITE_URL || undefined;
  if (siteUrl && !/^https:\/\//.test(siteUrl)) throw new Error('SITE_URL must be https');

  const html = renderHtml(resume, { siteUrl, sourceUrl: SOURCE_URL });

  // Purge Tailwind against the exact rendered HTML, so the CSS holds only used classes.
  const globals = await readFile('app/globals.css', 'utf8');
  const { css } = await postcss([
    tailwindcss({ ...baseConfig, content: [{ raw: html, extension: 'html' }] }),
  ]).process(globals, { from: 'app/globals.css' });

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, 'index.html'), html);
  await writeFile(path.join(OUT_DIR, 'styles.css'), css);
  await writeFile(path.join(OUT_DIR, '.nojekyll'), '');
  console.log(`Built ${OUT_DIR}/index.html (${html.length} B) and styles.css (${css.length} B)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
