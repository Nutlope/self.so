import { generateObject } from 'ai';
import { createTogetherAI } from '@ai-sdk/togetherai';
import { ResumeDataSchema } from '@/lib/resume';
import dedent from 'dedent';

const togetherai = createTogetherAI({
  apiKey: process.env.TOGETHER_API_KEY ?? '',
});

export const generateResumeObject = async (resumeText: string) => {
  const startTime = Date.now();
  const { object } = await generateObject({
    model: togetherai('Qwen/Qwen2.5-72B-Instruct-Turbo'),
    maxRetries: 1,
    schema: ResumeDataSchema,
    prompt: dedent`You are an expert resume writer. Generate a resume object from the following resume text. Be professional and concise.

    ## Instructions:

    - If the resume text does not include an 'about' section or specfic skills mentioned, please generate appropriate content for these sections based on the context of the resume and based on the job role.
    - For the about section: Create a professional summary that highlights the candidate's experience, expertise, and career objectives.
    - For the skills: Generate a maximum of 10 skills taken from the ones mentioned in the resume text or based on the job role / job title infer some if not present.
    - Do not generate a CTA (call-to-action) - this is an optional field that the user can add manually later.

    ## Resume text:

    ${resumeText}
    `,
  });

  const endTime = Date.now();
  console.log(
    `Generating resume object took ${(endTime - startTime) / 1000} seconds`
  );

  return object;
};
