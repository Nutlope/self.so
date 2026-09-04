import { generateText, Output } from 'ai';
import { createTogetherAI } from '@ai-sdk/togetherai';
import { ResumeDataSchema } from '@/lib/resume';
import dedent from 'dedent';
import {
  endAndFlushBraintrustSpanAfterResponse,
  logBraintrustEvent,
  serializeBraintrustError,
  startBraintrustSpan,
} from './braintrust';
import {
  buildResumeGenerationTraceStart,
  buildResumeGenerationTraceSuccess,
} from './resume-generation-tracing';

// Silence "responseFormat" warning spam in Together AI benchmark runs
(globalThis as any).AI_SDK_LOG_WARNINGS = false;

const togetherai = createTogetherAI({
  apiKey: process.env.TOGETHER_API_KEY ?? '',
});

export const RESUME_GENERATION_CONFIG = {
  model: 'MiniMaxAI/MiniMax-M3',
  fallbackModel: 'Qwen/Qwen3.5-9B',
  maxRetries: 1,
  timeout: 15_000,
  providerOptions: {
    togetherai: {
      reasoning: { enabled: false },
    },
  },
} as const;

const MAX_OUTPUT_TOKENS = 4096;

const runResumeGeneration = async (model: string, resumeText: string) => {
  const { output, usage, finishReason } = await generateText({
    model: togetherai(model),
    maxRetries: RESUME_GENERATION_CONFIG.maxRetries,
    timeout: RESUME_GENERATION_CONFIG.timeout,
    providerOptions: RESUME_GENERATION_CONFIG.providerOptions,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    output: Output.object({
      schema: ResumeDataSchema,
    }),
    prompt: dedent(`You are an expert resume writer. Generate a resume object from the following resume text with this EXACT structure:

    {
      "header": {
        "name": "Full Name",
        "shortAbout": "Brief professional summary",
        "location": "City, Country (optional)",
        "contacts": {
          "website": "website URL (optional)",
          "email": "email address (optional)",
          "phone": "phone number (optional)",
          "twitter": "twitter username (optional)",
          "linkedin": "linkedin username (optional)",
          "github": "github username (optional)"
        },
        "skills": ["skill1", "skill2", "skill3"]
      },
      "summary": "Detailed professional summary paragraph",
      "workExperience": [
        {
          "company": "Company Name",
          "link": "Company website URL",
          "location": "City, Country or Remote",
          "contract": "Full-time/Part-time/Contract",
          "title": "Job Title",
          "start": "YYYY-MM-DD",
          "end": "YYYY-MM-DD or null if current",
          "description": "Job description"
        }
      ],
      "education": [
        {
          "school": "School/University Name",
          "degree": "Degree obtained",
          "start": "Start year as string (e.g., '2014')",
          "end": "End year as string (e.g., '2018')"
        }
      ]
    }

     ## Instructions:

     ### General Processing Rules
     - Extract information from the resume text and map it to this exact JSON structure.
     - If information is missing, use reasonable defaults or leave optional fields empty.
     - Ensure all required fields are present with appropriate data types.
     - IMPORTANT: All date fields (start, end) must be strings, not numbers.

     ### Content Generation
     - If the resume text does not include an 'about' section or specific skills mentioned, please generate appropriate content for these sections based on the context of the resume and based on the job role.
     - For the about section: Create a professional summary that highlights the candidate's experience, expertise, and career objectives.

     ### Skills Handling
     - Generate a maximum of 10 skills taken from the ones mentioned in the resume text or based on the job role/job title; infer some if not present.
     - Extract up to 10 relevant skills from the resume.

     ### Contacts and Social Media
     - If the resume doesn't contain the full link to a social media website, leave the username/link as empty strings for the specific social media websites.
     - Only include social media usernames if explicitly mentioned in the resume.
     - The username never contains any spaces, so only return the full username for the website if it is present; otherwise, don't return it.
     - Do not change, reformat, or normalize the username in any way.
     - Extract the username EXACTLY as it appears in the provided text or URL, preserving all characters, hyphens, numbers, and letter casing.
     - The username must be taken from the last segment of the URL path (after the final '/'), excluding any query parameters or fragments.
     - If the resume does not contain a valid username for that platform, return an empty string.

    ## Resume text:

    ${resumeText}
    `),
  });
  return { output, usage, finishReason };
};

export const generateResumeObject = async (
  resumeText: string,
  model?: string
) => {
  // Explicit models (benchmarks, experiments) run alone so failures stay
  // attributable to that model; production calls go primary → fallback.
  const models = model
    ? [model]
    : [RESUME_GENERATION_CONFIG.model, RESUME_GENERATION_CONFIG.fallbackModel];
  const startTime = Date.now();
  const span = startBraintrustSpan({
    name: 'self-so.generate-resume',
    type: 'llm',
    event: buildResumeGenerationTraceStart({
      model: models[0],
      resumeText,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      reasoningEnabled:
        RESUME_GENERATION_CONFIG.providerOptions.togetherai.reasoning.enabled,
    }),
  });

  try {
    let lastError: unknown;
    for (const currentModel of models) {
      try {
        const { output, usage, finishReason } = await runResumeGeneration(
          currentModel,
          resumeText
        );
        console.log(
          `[generateResumeObject] AI generation completed with ${currentModel}`
        );

        const endTime = Date.now();
        console.log(
          `[generateResumeObject] Total time: ${(endTime - startTime) / 1000} seconds`
        );

        logBraintrustEvent(
          span,
          buildResumeGenerationTraceSuccess({
            output,
            usage,
            finishReason,
            durationMs: endTime - startTime,
            model: currentModel,
          })
        );

        return output;
      } catch (error) {
        lastError = error;
        const msg =
          error instanceof Error
            ? `${error.constructor.name}: ${error.message.slice(0, 120)}`
            : String(error).slice(0, 120);
        console.warn(`[generateResumeObject] ${currentModel} failed: ${msg}`);
      }
    }

    logBraintrustEvent(span, {
      error: serializeBraintrustError(lastError),
      metadata: { success: false },
      metrics: { duration_ms: Date.now() - startTime },
    });
    return undefined;
  } finally {
    endAndFlushBraintrustSpanAfterResponse(span);
  }
};