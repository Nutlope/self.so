import { generateObject } from 'ai';
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
    const { object } = await generateObject({
      model: togetherai('Qwen/Qwen2.5-72B-Instruct-Turbo'),
      maxRetries: 1,
      schema: ResumeDataSchema,
      mode: 'json',
      prompt:
        dedent(`You are an expert resume writer. Generate a resume object from the following resume text. Be professional and concise.
    ## Instructions:

    - If the resume text does not include an 'about' section or specfic skills mentioned, please generate appropriate content for these sections based on the context of the resume and based on the job role.
    - For the about section: Create a professional summary that highlights the candidate's experience, expertise, and career objectives.
    - For the skills: Generate a maximum of 10 skills taken from the ones mentioned in the resume text or based on the job role / job title infer some if not present.
    - If the resume doesn't contain the full link to a social media website, leave the username/link as empty strings for the specific social media websites.  
    - The username never contains any spaces, so only return the full username for the website if it is present; otherwise, don't return it.  
    - Do not change, reformat, or normalize the username in any way.  
    - Extract the username EXACTLY as it appears in the provided text or URL, preserving all characters, hyphens, numbers, and letter casing.  
    - The username must be taken from the last segment of the URL path (after the final '/'), excluding any query parameters or fragments.  
    - If the resume does not contain a valid username for that platform, return an empty string.

    ## Resume text:

    ${resumeText}
    `),
    });

    const endTime = Date.now();
    console.log(
      `Generating resume object took ${(endTime - startTime) / 1000} seconds`
    );

    return object;
  } catch (error) {
    console.warn('Impossible generating resume object', error);
    return undefined;
  }
};
