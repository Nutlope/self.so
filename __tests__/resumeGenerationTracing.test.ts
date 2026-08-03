import { describe, expect, it } from 'vitest';
import { serializeBraintrustError } from '@/lib/server/ai/braintrust';
import {
  buildResumeGenerationTraceStart,
  buildResumeGenerationTraceSuccess,
} from '@/lib/server/ai/resume-generation-tracing';

describe('resume generation tracing', () => {
  it('records useful request metadata without resume content', () => {
    const resumeText = 'Ada Lovelace\nada@example.com\nAnalytical Engine';
    const trace = buildResumeGenerationTraceStart({
      model: 'moonshotai/Kimi-K2.6',
      resumeText,
      maxOutputTokens: 4096,
    });
    const serialized = JSON.stringify(trace);

    expect(trace.metadata).toEqual({
      provider: 'together',
      operation: 'resume-extraction',
      model: 'moonshotai/Kimi-K2.6',
      inputCharacters: resumeText.length,
      maxOutputTokens: 4096,
      reasoningEnabled: false,
    });
    expect(serialized).not.toContain('Ada Lovelace');
    expect(serialized).not.toContain('ada@example.com');
  });

  it('records only section counts from the generated resume', () => {
    const trace = buildResumeGenerationTraceSuccess({
      output: {
        header: {
          name: 'Ada Lovelace',
          shortAbout: 'Mathematician',
          contacts: { email: 'ada@example.com' },
          skills: ['Mathematics', 'Programming'],
        },
        summary: 'Private generated summary',
        workExperience: [
          {
            company: 'Private Company',
            location: 'London, UK',
            contract: 'Full-time',
            title: 'Programmer',
            start: '1842-01-01',
            end: null,
            description: 'Private work description',
          },
        ],
        education: [],
      },
      usage: { inputTokens: 120, outputTokens: 80, totalTokens: 200 },
      finishReason: 'stop',
      durationMs: 2100,
    });
    const serialized = JSON.stringify(trace);

    expect(trace.output).toEqual({
      skillCount: 2,
      workExperienceCount: 1,
      educationCount: 0,
    });
    expect(trace.metrics).toEqual({
      duration_ms: 2100,
      input_tokens: 120,
      output_tokens: 80,
      tokens: 200,
    });
    expect(serialized).not.toContain('Ada Lovelace');
    expect(serialized).not.toContain('ada@example.com');
    expect(serialized).not.toContain('Private generated summary');
  });

  it('redacts API keys and resume content from provider errors', () => {
    const apiKey = 'together-secret';
    const resumeText = 'private resume content';
    const serialized = JSON.stringify(
      serializeBraintrustError(
        new Error(`Provider rejected ${apiKey}: ${resumeText}`),
        [apiKey, resumeText]
      )
    );

    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(resumeText);
    expect(serialized).toContain('[REDACTED]');
  });
});
