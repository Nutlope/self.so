import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { ResumeDataSchema } from '@/lib/resume';
import { checkGrounding, toPublicResume } from './publicResume';

const DRAFT_PATH = 'local/out/resume.draft.json';
const TEXT_PATH = 'local/out/resume.text.txt';
const SITE_JSON = 'site/resume.json';

async function main() {
  const draft = ResumeDataSchema.parse(JSON.parse(await readFile(process.argv[2] ?? DRAFT_PATH, 'utf8')));
  const pub = toPublicResume(draft);

  const dropped: string[] = [];
  const c = draft.header.contacts;
  if (c.phone) dropped.push('phone');
  if (draft.header.location) dropped.push('home location');
  if (c.website) dropped.push('website');
  if (c.twitter) dropped.push('twitter');
  if (c.email && !pub.header.contacts.email) dropped.push('email (invalid format)');
  if (c.github && !pub.header.contacts.github) dropped.push('github (invalid username)');
  if (c.linkedin && !pub.header.contacts.linkedin) dropped.push('linkedin (invalid username)');

  if (existsSync(TEXT_PATH)) {
    const warnings = checkGrounding(pub, await readFile(TEXT_PATH, 'utf8'));
    for (const w of warnings) console.log(`warning: ${w}`);
  }

  await mkdir('site', { recursive: true });
  await writeFile(SITE_JSON, JSON.stringify(pub, null, 2) + '\n');
  console.log(`Wrote ${SITE_JSON} (public). Dropped: ${dropped.join(', ') || 'nothing'}.`);
  console.log('Next: bun run local:build, open site-dist/index.html, then commit site/resume.json.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
