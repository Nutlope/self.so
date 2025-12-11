import { ResumeDataSchemaType } from '@/lib/resume';
import { Section } from '../ui/section';

interface AboutProps {
  summary: ResumeDataSchemaType['summary'];
  className?: string;
}

/**
 * Summary section component
 * Displays a summary of professional experience and goals
 */
export function Summary({ summary, className }: AboutProps) {
  return (
    <Section className={className}>
      <h2 className="text-xl font-bold" id="about-section">
        About
      </h2>
      <div
        className="text-pretty font-mono text-sm text-muted-foreground print:text-[12px]"
        aria-labelledby="about-section"
      >
        {summary}
      </div>
    </Section>
  );
}
