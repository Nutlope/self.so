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
  console.log("resumeText: ", resumeText);

  const startTime = Date.now();
  try {
    const { output } = await generateText({
      model: togetherai('Qwen/Qwen3-Next-80B-A3B-Instruct'),
      maxRetries: 2,
      output: Output.object({
        schema: zodSchema(ResumeDataSchema),
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

    - Extract information from the resume text and map it to this exact JSON structure
    - If information is missing, use reasonable defaults or leave optional fields empty
    - For skills: Extract up to 10 relevant skills from the resume
    - For contacts: Only include social media usernames if explicitly mentioned in the resume
    - IMPORTANT: All date fields (start, end) must be strings, not numbers
    - Ensure all required fields are present with appropriate data types

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
