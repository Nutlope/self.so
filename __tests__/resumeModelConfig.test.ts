import { describe, expect, it } from 'vitest';
import { RESUME_GENERATION_CONFIG } from '@/lib/server/ai/generateResumeObject';

describe('resume generation model configuration', () => {
  it('uses Kimi K2.6 without reasoning and with a bounded retry window', () => {
    expect(RESUME_GENERATION_CONFIG).toEqual({
      model: 'moonshotai/Kimi-K2.6',
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
