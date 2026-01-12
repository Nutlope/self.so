import { generateText, Output, zodSchema } from 'ai';
import { createTogetherAI } from '@ai-sdk/togetherai';
import { ResumeDataSchema } from '@/lib/resume';
import dedent from 'dedent';

const togetherai = createTogetherAI({
  apiKey: process.env.TOGETHER_API_KEY ?? '',
  baseURL: 'https://together.helicone.ai/v1',
  headers: {
    'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`,
    'Helicone-Property-AppName': 'self.so',
  },
});

export const generateResumeObject = async (resumeText: string) => {
  const startTime = Date.now();
  try {
    const { output } = await generateText({
      model: togetherai('Qwen/Qwen2.5-72B-Instruct-Turbo'),
      maxRetries: 1,
      output: Output.object({
        schema: zodSchema(ResumeDataSchema),
      }),
      prompt: dedent(`You are an expert resume writer. Generate a resume object from the following resume text. Be professional and concise.
    ## Instructions:

    - If the resume text does not include an 'about' section or specfic skills mentioned, please generate appropriate content for these sections based on the context of the resume and based on the job role.
    - For the about section: Create a professional summary that highlights the candidate's experience, expertise, and career objectives.
    - For the skills: Generate a maximum of 10 skills taken from the ones mentioned in the resume text or based on the job role / job title infer some if not present.
    - If the resume doesn't contain the full link to social media website leave the username/link as empty strings to the specific social meda websites. The username never contains any space so make sure to only return the full username for the website otherwise don't return it.

    ## Resume text:

    ${resumeText}
    `),
    });

    const endTime = Date.now();
    console.log(
      `Generating resume object took ${(endTime - startTime) / 1000} seconds`
    );

    return output;
  } catch (error) {
    console.warn('Impossible generating resume object', error);
    return undefined;
  }
};
