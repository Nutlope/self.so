import { z } from 'zod';

const MAX_STRING = 2000;
const MAX_SHORT_STRING = 500;
const MAX_NAME_LENGTH = 200;
const MAX_URL_LENGTH = 500;
const MAX_SKILLS = 100;
const MAX_SKILL_LENGTH = 100;
const MAX_WORK_EXPERIENCES = 50;
const MAX_EDUCATIONS = 20;
const MAX_CONTACT_LENGTH = 200;

const HeaderContactsSchema = z.object({
  website: z
    .string()
    .max(MAX_URL_LENGTH)
    .nullable()
    .describe('Personal website or portfolio URL')
    .optional(),
  email: z
    .string()
    .max(MAX_CONTACT_LENGTH)
    .nullable()
    .describe('Email address')
    .optional(),
  phone: z
    .string()
    .max(MAX_CONTACT_LENGTH)
    .nullable()
    .describe('Phone number')
    .optional(),
  twitter: z
    .string()
    .max(MAX_CONTACT_LENGTH)
    .nullable()
    .describe('Twitter/X username')
    .optional(),
  linkedin: z
    .string()
    .max(MAX_CONTACT_LENGTH)
    .nullable()
    .describe('LinkedIn username')
    .optional(),
  github: z
    .string()
    .max(MAX_CONTACT_LENGTH)
    .nullable()
    .describe('GitHub username')
    .optional(),
});

const HeaderSection = z.object({
  name: z.string().max(MAX_NAME_LENGTH),
  shortAbout: z
    .string()
    .max(MAX_SHORT_STRING)
    .describe('Short description of your profile'),
  location: z
    .string()
    .max(MAX_SHORT_STRING)
    .describe("Location with format 'City, Country'")
    .optional(),
  contacts: HeaderContactsSchema,
  skills: z
    .array(z.string().max(MAX_SKILL_LENGTH))
    .max(MAX_SKILLS)
    .describe('Skills used within the different jobs the user has had.'),
});

const SummarySection = z
  .string()
  .max(MAX_STRING)
  .describe('Summary of your profile');

const WorkExperienceSection = z
  .array(
    z.object({
      company: z.string().max(MAX_SHORT_STRING).describe('Company name'),
      link: z
        .string()
        .max(MAX_URL_LENGTH)
        .optional()
        .describe('Company website URL'),
      location: z
        .string()
        .max(MAX_SHORT_STRING)
        .describe(
          "Location with format 'City, Country' or could be Hybrid or Remote",
        ),
      contract: z
        .string()
        .max(100)
        .describe('Type of work contract like Full-time, Part-time, Contract'),
      title: z.string().max(MAX_SHORT_STRING).describe('Job title'),
      start: z.string().max(20).describe("Start date in format 'YYYY-MM-DD'"),
      end: z
        .string()
        .max(20)
        .nullable()
        .describe("End date in format 'YYYY-MM-DD' or null if current"),
      description: z.string().max(MAX_STRING).describe('Job description'),
    }),
  )
  .max(MAX_WORK_EXPERIENCES);

const EducationSection = z
  .array(
    z.object({
      school: z
        .string()
        .max(MAX_SHORT_STRING)
        .describe('School or university name'),
      degree: z
        .string()
        .max(MAX_SHORT_STRING)
        .describe('Degree or certification obtained'),
      start: z.string().max(20).describe('Start year'),
      end: z.string().max(20).describe('End year'),
    }),
  )
  .max(MAX_EDUCATIONS);

export const ResumeDataSchema = z.object({
  header: HeaderSection,
  summary: SummarySection,
  workExperience: WorkExperienceSection,
  education: EducationSection,
});

export type ResumeDataSchemaType = z.infer<typeof ResumeDataSchema>;
