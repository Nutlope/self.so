import { renderToStaticMarkup } from 'react-dom/server';
import { FullResume } from '@/components/resume/FullResume';
import type { ResumeDataSchemaType } from '@/lib/resume';
import { toPublicResume } from './publicResume';

/**
 * The generated page ships zero JavaScript, so the CSP can forbid scripts entirely.
 * (application/ld+json is a data block and is never executed.)
 */
export const CSP =
  "default-src 'none'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

export function renderHtml(
  input: ResumeDataSchemaType,
  opts: { siteUrl?: string; sourceUrl: string },
): string {
  // Re-apply the publish filter at build time, so a hand-edited site/resume.json
  // can't reintroduce a phone number or an unsafe link.
  const r = toPublicResume(input);
  const { name, shortAbout, contacts } = r.header;

  const body = renderToStaticMarkup(
    <>
      <FullResume resume={r} />
      <footer className="text-center mt-8 mb-4 font-mono text-sm text-design-gray">
        Built with a fork of{' '}
        <a className="text-design-black underline underline-offset-2" href={opts.sourceUrl}>
          self.so
        </a>
      </footer>
    </>,
  );

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: shortAbout,
    description: r.summary,
    email: contacts.email ? `mailto:${contacts.email}` : undefined,
    url: opts.siteUrl,
    sameAs: [
      contacts.github && `https://github.com/${contacts.github}`,
      contacts.linkedin && `https://www.linkedin.com/in/${contacts.linkedin}`,
    ].filter(Boolean),
    knowsAbout: r.header.skills,
  }).replace(/</g, '\\u003c');

  const title = shortAbout ? `${name} | ${shortAbout}` : name;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${esc(CSP)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(r.summary.slice(0, 300))}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(r.summary.slice(0, 300))}">
<meta property="og:type" content="profile">
${opts.siteUrl ? `<link rel="canonical" href="${esc(opts.siteUrl)}">\n` : ''}<link rel="stylesheet" href="styles.css">
<script type="application/ld+json">${jsonLd}</script>
</head>
<body class="font-mono min-h-screen bg-white">
<main>${body}</main>
</body>
</html>
`;
}
