import { Section } from '@/components/ui/section';
import { ResumeDataSchemaType } from '@/lib/resume';
import { getShortMonth, getYear } from './resumeUtils';
import { useMemo } from 'react';

export function WorkExperience({
  work,
}: {
  work: ResumeDataSchemaType['workExperience'];
}) {
  // Filter out invalid work experiences and pre-format dates
  const validWork = useMemo(() => {
    return work
      .filter(
        (item) =>
          item.company && item.location && item.title && item.description
      )
      .map((item) => ({
        ...item,
        formattedDate: `${getShortMonth(item.start)} ${getYear(item.start)} - ${
          !!item.end
            ? `${getShortMonth(item.end)} ${getYear(item.end)}`
            : 'Present'
        }`,
        companyLower: item.company.toLowerCase(),
      }));
  }, [work]);

  if (validWork.length === 0) {
    return null;
  }

  return (
    <Section>
      <h2 className="text-lg font-bold" id="work-experience">
        Work Experience
      </h2>
      <div
        className="flex flex-col gap-4"
        role="feed"
        aria-labelledby="work-experience"
      >
        {validWork.map((item) => {
          return (
            <div
              key={item.company + item.location + item.title}
              className="font-mono flex flex-col justify-start items-start gap-1 print:mb-4"
            >
              <div className="flex flex-wrap justify-between items-start self-stretch gap-2">
                <div className="flex flex-wrap justify-start items-center gap-2">
                  <p className="text-base font-semibold text-left text-foreground">
                    {item.title}
                  </p>
                  <div className="flex justify-center items-center relative overflow-hidden gap-2.5 px-[7px] py-0.5 rounded bg-muted">
                    <p className="text-[12px] font-semibold text-center text-muted-foreground">
                      {item.location}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-right text-muted-foreground">
                  {item.formattedDate}
                </p>
              </div>
              <div className="flex flex-col justify-start items-start relative gap-1.5">
                <p className="self-stretch text-sm font-medium text-left text-muted-foreground font-mono capitalize flex flex-wrap gap-1">
                  <span>{item.companyLower}</span>
                  {item.company && item.contract && <span>·</span>}
                  <span>{item.contract}</span>
                </p>
                <p className="self-stretch text-sm font-medium text-left text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
