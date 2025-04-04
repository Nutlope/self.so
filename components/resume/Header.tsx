import {
  GlobeIcon,
  MailIcon,
  PhoneIcon,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResumeDataSchemaType } from '@/lib/resume';
import { useMemo } from 'react';

interface SocialButtonProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

function SocialButton({ href, icon: Icon, label }: SocialButtonProps) {
  return (
    <Button
      className="size-8 hover:text-resume-subheadings/90 print:hidden"
      variant="outline"
      size="icon"
      asChild
    >
      <a
        href={
          href.startsWith('mailto:') || href.startsWith('tel:')
            ? href
            : `${href}${href.includes('?') ? '&' : '?'}ref=selfso`
        }
        aria-label={label}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon className="size-4" aria-hidden="true" />
      </a>
    </Button>
  );
}

/**
 * Header component displaying personal information and contact details
 */
export function Header({
  header,
  picture,
}: {
  header: ResumeDataSchemaType['header'];
  picture?: string;
}) {
  const prefixUrl = (stringToFix?: string) => {
    if (!stringToFix) return undefined;
    const url = stringToFix.trim();
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const website = useMemo(() => {
    return prefixUrl(header.contacts.website);
  }, [header.contacts.website]);

  const github = useMemo(() => {
    return prefixUrl(header.contacts.github);
  }, [header.contacts.github]);
  const twitter = useMemo(() => {
    return prefixUrl(header.contacts.twitter);
  }, [header.contacts.twitter]);
  const linkedin = useMemo(() => {
    return prefixUrl(header.contacts.linkedin);
  }, [header.contacts.linkedin]);

  return (
    <header className="flex items-start md:items-center justify-between gap-4 ">
      <div className="flex-1 space-y-1.5">
        <h1
          className="text-2xl font-bold text-resume-headings"
          id="resume-name"
        >
          {header.name}
        </h1>
        <p
          className="max-w-md text-pretty font-mono text-sm text-resume-paragraphs print:text-[12px]"
          aria-labelledby="resume-name"
        >
          {header.shortAbout}
        </p>

        <p className="max-w-md items-center text-pretty font-mono text-xs text-foreground">
          <a
            className="inline-flex gap-x-1.5 align-baseline leading-none hover:underline text-resume-subdetails"
            href={`https://www.google.com/maps/search/${encodeURIComponent(
              header.location
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Location: ${header.location}`}
          >
            {header.location}
          </a>
        </p>

        <div
          className="flex gap-x-1 pt-1 font-mono text-sm text-resume-subdetails"
          role="list"
          aria-label="Contact links"
        >
          {website && (
            <SocialButton
              href={website}
              icon={GlobeIcon}
              label="Personal website"
            />
          )}
          {header.contacts.email && (
            <SocialButton
              href={`mailto:${header.contacts.email}`}
              icon={MailIcon}
              label="Email"
            />
          )}
          {header.contacts.phone && (
            <SocialButton
              href={`tel:${header.contacts.phone}`}
              icon={PhoneIcon}
              label="Phone"
            />
          )}
          {github && (
            <SocialButton href={`${github}`} icon={Github} label="GitHub" />
          )}
          {twitter && (
            <SocialButton href={`${twitter}`} icon={Twitter} label="Twitter" />
          )}
          {linkedin && (
            <SocialButton
              href={`${linkedin}`}
              icon={Linkedin}
              label="LinkedIn"
            />
          )}
        </div>

        <div
          className="hidden gap-x-2 font-mono text-sm text-resume-paragraphs print:flex print:text-[12px]"
          aria-label="Print contact information"
        >
          {website && (
            <>
              <a className="underline hover:text-foreground/70" href={website}>
                {new URL(website).hostname}
              </a>
              <span aria-hidden="true">/</span>
            </>
          )}
          {header.contacts.email && (
            <>
              <a
                className="underline hover:text-foreground/70"
                href={`mailto:${header.contacts.email}`}
              >
                {header.contacts.email}
              </a>
              <span aria-hidden="true">/</span>
            </>
          )}
          {header.contacts.phone && (
            <a
              className="underline hover:text-foreground/70"
              href={`tel:${header.contacts.phone}`}
            >
              {header.contacts.phone}
            </a>
          )}
        </div>
      </div>

      <Avatar className="size-20 md:size-28" aria-hidden="true">
        <AvatarImage src={picture} alt={`${header.name}'s profile picture`} />
        <AvatarFallback>
          {header.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
