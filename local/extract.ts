import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { extractResumeText } from './extractText';
import { extractWithOllama, resolveOllamaBaseUrl } from './ollama';
import { checkGrounding } from './publicResume';

export const OUT_DIR = 'local/out'; // gitignored: holds the full private extraction
export const DRAFT_PATH = path.join(OUT_DIR, 'resume.draft.json');
export const TEXT_PATH = path.join(OUT_DIR, 'resume.text.txt');

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: bun run local:extract <path-to-resume.docx|pdf>');
    process.exit(2);
  }
  const model = process.env.OLLAMA_MODEL ?? 'llama3.1:8b';
  const baseUrl = resolveOllamaBaseUrl();

  const text = await extractResumeText(path.resolve(input));
  console.log(`Read ${text.length} characters. Sending to ${model} at ${baseUrl.origin} (loopback only)...`);

  const started = Date.now();
  const draft = await extractWithOllama(text, { model, baseUrl });
  const secs = ((Date.now() - started) / 1000).toFixed(1);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(TEXT_PATH, text + '\n');
  await writeFile(DRAFT_PATH, JSON.stringify(draft, null, 2) + '\n');

  console.log(
    `Done in ${secs}s: ${draft.workExperience.length} jobs, ${draft.education.length} education, ${draft.header.skills.length} skills.`,
  );
  const warnings = checkGrounding(draft, text);
  if (warnings.length) {
    console.log(`\n${warnings.length} grounding warning(s), review these:`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
  console.log(`\nReview and edit ${DRAFT_PATH}, then run: bun run local:publish`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
