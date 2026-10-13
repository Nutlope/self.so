import { z } from 'zod';
import { ResumeDataSchema, type ResumeDataSchemaType } from '@/lib/resume';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

/**
 * Hard control: resume text may only be sent to an Ollama server on this machine.
 * Enforced in code so a stray OLLAMA_BASE_URL can never ship the resume elsewhere.
 */
export function resolveOllamaBaseUrl(
  raw: string = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434',
): URL {
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new Error('Ollama URL must be http(s)');
  if (url.username || url.password) throw new Error('Ollama URL must not contain credentials');
  if (!LOOPBACK_HOSTS.has(url.hostname))
    throw new Error(
      `Refusing non-loopback Ollama host "${url.hostname}": resume text must stay on this machine`,
    );
  return url;
}

/** Ollama "cloud" models proxy prompts to ollama.com, which would defeat the purpose. */
export function assertLocalModelName(model: string): void {
  if (!/^[a-z0-9][a-z0-9._/-]*(:[a-z0-9._-]+)?$/i.test(model))
    throw new Error(`Invalid model name "${model}"`);
  if (/cloud/i.test(model)) throw new Error(`"${model}" is an Ollama cloud model; use a local model`);
}

async function ollamaPost(base: URL, path: string, body: unknown, timeoutMs: number) {
  const res = await fetch(new URL(path, base), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    redirect: 'error', // a redirect could point off-machine
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Ollama ${path} returned HTTP ${res.status}`);
  return (await res.json()) as any;
}

/** Defense in depth: /api/show reports remote_host/remote_model for cloud-backed models. */
async function assertModelIsLocal(base: URL, model: string) {
  const info = await ollamaPost(base, '/api/show', { model }, 15_000);
  if (info?.remote_host || info?.remote_model)
    throw new Error(`Model "${model}" is served remotely; refusing`);
}

/** Size the context window so Ollama never silently truncates the resume. */
export function contextWindowFor(promptChars: number): number {
  const estTokens = Math.ceil(promptChars / 3) + 4096; // prompt + room for JSON output
  const rounded = Math.ceil(estTokens / 2048) * 2048;
  return Math.min(Math.max(rounded, 8192), 32_768);
}

export async function extractWithOllama(
  resumeText: string,
  opts: { model: string; baseUrl?: URL; attempts?: number; timeoutMs?: number },
): Promise<ResumeDataSchemaType> {
  const base = opts.baseUrl ?? resolveOllamaBaseUrl();
  assertLocalModelName(opts.model);
  await assertModelIsLocal(base, opts.model);

  const format = z.toJSONSchema(ResumeDataSchema);
  const userPrompt = buildUserPrompt(resumeText);
  const num_ctx = contextWindowFor(SYSTEM_PROMPT.length + userPrompt.length + JSON.stringify(format).length);
  const attempts = opts.attempts ?? 2;
  let lastError = '';

  for (let i = 0; i < attempts; i++) {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];
    if (lastError)
      messages.push({
        role: 'user',
        content: `Your previous output failed schema validation:\n${lastError}\nReturn corrected JSON only.`,
      });

    const res = await ollamaPost(
      base,
      '/api/chat',
      { model: opts.model, messages, format, stream: false, options: { temperature: 0, num_ctx } },
      opts.timeoutMs ?? 600_000,
    );

    try {
      const parsed = ResumeDataSchema.safeParse(JSON.parse(String(res?.message?.content ?? '')));
      if (parsed.success) return parsed.data;
      lastError = z.prettifyError(parsed.error).slice(0, 1500);
    } catch {
      lastError = 'Output was not valid JSON.';
    }
  }
  throw new Error(`Model output failed validation after ${attempts} attempts:\n${lastError}`);
}
