import { generateText } from 'ai';
import { createTogetherAI } from '@ai-sdk/togetherai';

const togetherai = createTogetherAI({
  apiKey: process.env.TOGETHER_API_KEY ?? '',
});

export const isFileContentBad = async (fileContent: string) => {
  // we can for now do the AI parsing here?
  const generationResult = await generateText({
    model: togetherai('meta-llama/Meta-Llama-Guard-3-8B'),
    prompt: `You are given the following file content, evalute if content is harmful or spammy.
    ${fileContent}
    `,
  });

  if (generationResult.text.startsWith('unsafe')) {
    return true;
  } else {
    return false;
  }
};
