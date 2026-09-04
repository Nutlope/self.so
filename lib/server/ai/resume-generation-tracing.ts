import type { ResumeDataSchemaType } from '@/lib/resume';

type TokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export function buildResumeGenerationTraceStart(args: {
  model: string;
  resumeText: string;
  maxOutputTokens: number;
  reasoningEnabled: boolean;
}) {
  return {
    metadata: {
      provider: 'together',
      operation: 'resume-extraction',
      model: args.model,
      inputCharacters: args.resumeText.length,
      maxOutputTokens: args.maxOutputTokens,
      reasoningEnabled: args.reasoningEnabled,
    },
  };
}
export function buildResumeGenerationTraceSuccess(args: {
  output: ResumeDataSchemaType;
  usage: TokenUsage;
  finishReason: string;
  durationMs: number;
  model: string;
}) {
  return {
    output: {
      skillCount: args.output.header.skills.length,
      workExperienceCount: args.output.workExperience.length,
      educationCount: args.output.education.length,
    },
    metadata: {
      success: true,
      finishReason: args.finishReason,
      model: args.model,
    },
    metrics: {
      duration_ms: args.durationMs,
      input_tokens: args.usage.inputTokens ?? 0,
      output_tokens: args.usage.outputTokens ?? 0,
      tokens: args.usage.totalTokens ?? 0,
    },
  };
}
