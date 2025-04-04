import { z } from 'zod';

const HeaderSection = z.object({
  name: z.string(),
  shortAbout: z.string().describe('Short description of your profile'),
  location: z
    .string()
    .describe("Location with format 'City, Country, Timezone'"),
  contacts: z.object({
    website: z.string().describe('Personal website or portfolio URL'),
    email: z.string().describe('Email address').optional(),
    phone: z.string().describe('Phone number').optional(),
    twitter: z.string().describe('Twitter/X username').optional(),
    linkedin: z.string().describe('LinkedIn username').optional(),
    github: z.string().describe('GitHub username').optional(),
  }),
  cta: z
    .object({
      label: z.string().max(40).describe('Call to action label').optional(),
      url: z.string().url().describe('Call to action URL').optional(),
    })
    .optional(),
  skills: z
    .array(z.string())
    .max(15)
    .describe('Skills used within the different jobs the user has had.'),
});

const SummarySection = z.string().describe('Summary of your profile');

const WorkExperienceSection = z.array(
  z.object({
    company: z.string().describe('Company name'),
    link: z.string().describe('Company website URL'),
    location: z
      .string()
      .describe(
        "Location with format 'City, Country' or could be Hybrid or Remote"
      ),
    contract: z
      .string()
      .describe('Type of work contract like Full-time, Part-time, Contract'),
    title: z.string().describe('Job title'),
    start: z.string().describe("Start date in format 'YYYY-MM-DD'"),
    end: z
      .string()
      .optional()
      .nullable()
      .describe("End date in format 'YYYY-MM-DD'"),
    description: z.string().describe('Job description'),
  })
);

const EducationSection = z.array(
  z.object({
    school: z.string().describe('School or university name'),
    degree: z.string().describe('Degree or certification obtained'),
    start: z.string().describe('Start year'),
    end: z.string().describe('End year'),
  })
);

export const ResumeDataSchema = z.object({
  header: HeaderSection,
  summary: SummarySection,
  workExperience: WorkExperienceSection,
  education: EducationSection,
});

export type ResumeDataSchemaType = z.infer<typeof ResumeDataSchema>;
