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
      reasoningEnabled: false,
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

  it('records only allowlisted provider error fields', () => {
    const error = Object.assign(
      new Error(
        'Provider rejected ada@example.com and returned Ada Lovelace at Private Company'
      ),
      {
        name: 'AI_APICallError',
        statusCode: 429,
        isRetryable: true,
        responseBody: 'Generated private resume content',
      }
    );
    const traceError = serializeBraintrustError(error);
    const serialized = JSON.stringify(traceError);

    expect(traceError).toEqual({
      category: 'provider_api_error',
      statusCode: 429,
      retryable: true,
    });
    expect(serialized).not.toContain('ada@example.com');
    expect(serialized).not.toContain('Ada Lovelace');
    expect(serialized).not.toContain('Private Company');
    expect(serialized).not.toContain('Generated private resume content');
    expect(serialized).not.toContain('message');
    expect(serialized).not.toContain('stack');
  });
});
