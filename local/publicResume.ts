import { ResumeDataSchema, type ResumeDataSchemaType } from '@/lib/resume';

/**
 * Deterministic publish filter. The model's output is untrusted and the site is public,
 * so only allowlisted contact fields survive, regardless of what the draft contains.
 * Published: name, headline, summary, experience, education, skills, email, GitHub, LinkedIn.
 * Dropped: phone, home location, website, Twitter/X, company links.
 */
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const EMAIL_RE = /^[^\s@<>()"',;:]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const GITHUB_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const LINKEDIN_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{2,99}$/;

export const scrubPhones = (s: string) => s.replace(PHONE_RE, '[redacted]');

/** Accept "user", "github.com/user" or a full URL; return a validated username or null. */
export function normalizeHandle(
  value: string | null | undefined,
  platform: 'github' | 'linkedin',
): string | null {
  if (!value) return null;
  let v = value.trim().split(/[?#]/)[0].replace(/\/+$/, '');
  if (v.includes('/')) v = v.split('/').pop() ?? '';
  v = v.replace(/^@/, '');
  return (platform === 'github' ? GITHUB_RE : LINKEDIN_RE).test(v) ? v : null;
}

export function normalizeEmail(value: string | null | undefined): string | null {
  const v = value?.trim().replace(/^mailto:/i, '');
  return v && EMAIL_RE.test(v) ? v : null;
}

export function toPublicResume(draft: ResumeDataSchemaType): ResumeDataSchemaType {
  const d = ResumeDataSchema.parse(draft);
  const skills = [...new Set(d.header.skills.map((s) => s.trim()).filter(Boolean))];

  return ResumeDataSchema.parse({
    header: {
      name: d.header.name.trim(),
      shortAbout: scrubPhones(d.header.shortAbout),
      contacts: {
        email: normalizeEmail(d.header.contacts.email),
        github: normalizeHandle(d.header.contacts.github, 'github'),
        linkedin: normalizeHandle(d.header.contacts.linkedin, 'linkedin'),
      },
      skills,
    },
    summary: scrubPhones(d.summary),
    workExperience: d.workExperience.map((w) => ({
      company: w.company,
      location: w.location,
      contract: w.contract,
      title: w.title,
      start: w.start,
      end: w.end,
      description: scrubPhones(w.description),
    })),
    education: d.education.map((e) => ({ ...e })),
  });
}

const norm = (s: string) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/**
 * Groundedness check: flag values the model produced that do not appear in the source text.
 * Warnings, not errors: a human reviews the draft before publishing.
 */
export function checkGrounding(resume: ResumeDataSchemaType, sourceText: string): string[] {
  const src = norm(sourceText);
  const warnings: string[] = [];
  const check = (label: string, value: string | null | undefined) => {
    if (value && norm(value) && !src.includes(norm(value)))
      warnings.push(`${label} "${value}" not found in the resume text`);
  };

  check('Name', resume.header.name);
  resume.workExperience.forEach((w, i) => {
    check(`Job ${i + 1} company`, w.company);
    check(`Job ${i + 1} title`, w.title);
    const year = w.start?.slice(0, 4);
    if (/^\d{4}$/.test(year ?? '') && !src.includes(year!))
      warnings.push(`Job ${i + 1} start year ${year} not found in the resume text`);
    if (!w.location) warnings.push(`Job ${i + 1} has no location`);
    if (w.description && !/[.!?)]$/.test(w.description.trim()))
      warnings.push(`Job ${i + 1} description may be truncated (does not end a sentence)`);
  });
  resume.education.forEach((e, i) => {
    check(`Education ${i + 1} school`, e.school);
    check(`Education ${i + 1} degree`, e.degree);
  });
  resume.header.skills.forEach((s) => check('Skill', s));
  check('Email', resume.header.contacts.email);
  return warnings;
}
