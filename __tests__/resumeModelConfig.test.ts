import { describe, expect, it } from 'vitest';
import { RESUME_GENERATION_CONFIG } from '@/lib/server/ai/generateResumeObject';

describe('resume generation model configuration', () => {
  it('uses MiniMax M3 with a Qwen fallback, no reasoning, and a bounded retry window', () => {
    expect(RESUME_GENERATION_CONFIG).toEqual({
      model: 'MiniMaxAI/MiniMax-M3',
      fallbackModel: 'Qwen/Qwen3.5-9B',
      maxRetries: 1,
      timeout: 15_000,
      providerOptions: {
        togetherai: {
          reasoning: { enabled: false },
        },
      },
    });
  });
});