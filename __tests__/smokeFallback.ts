import 'dotenv/config';

import { generateResumeObject } from '../lib/server/ai/generateResumeObject';

const sampleResume = `Jane Doe
Software Engineer
London, UK
Email: jane.doe@example.com | GitHub: janedoe

SUMMARY
Frontend engineer with 5 years of experience building React applications.

SKILLS
TypeScript, React, Node.js, CSS, Testing

EXPERIENCE
Software Engineer | Acme Corp | London | 2020-Present
- Built customer dashboard used by 50k users

EDUCATION
BSc Computer Science | University of London | 2020`;

// No model arg → production chain: MiniMax-M3 primary, Qwen3.5-9B fallback
const result = await generateResumeObject(sampleResume);

if (result === undefined) {
  console.error('SMOKE FAILED: generation returned undefined');
  process.exit(1);
}

console.log(
  `SMOKE OK: name=${result.header.name}, skills=${result.header.skills.length}, jobs=${result.workExperience.length}`
);
process.exit(0);