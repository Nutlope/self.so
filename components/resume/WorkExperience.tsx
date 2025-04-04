import { Section } from '@/components/ui/section';
import { ResumeDataSchemaType } from '@/lib/resume';

const getYear = (date: string) => {
  const dateObject = new Date(date);
  return dateObject.getFullYear();
};

export function WorkExperience({
  work,
}: {
  work: ResumeDataSchemaType['workExperience'];
}) {
  return (
    <Section>
      <h2
        className="text-lg font-bold text-resume-headings"
        id="work-experience"
      >
        Work Experience
      </h2>
      <div
        className="flex flex-col gap-4"
        role="feed"
        aria-labelledby="work-experience"
      >
        {work.map((item) => {
          return (
            <div
              key={item.company + item.location + item.title}
              className="font-mono flex flex-col justify-start items-start gap-1 print:mb-4"
            >
              <div className="flex flex-wrap justify-between items-start self-stretch gap-2">
                <div className="flex flex-wrap justify-start items-center gap-2">
                  <p className="text-base font-semibold text-left text-resume-headings">
                    {item.title}
                  </p>
                  <div className="flex justify-center items-center relative overflow-hidden gap-2.5 px-[7px] py-0.5 rounded bg-[#eeeff0]">
                    <p className="text-[12px] font-semibold text-center text-resume-subdetails bg-resume-subdetailsBg">
                      {item.location}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-right text-resume-subdetails">
                  {getYear(item.start)} -{' '}
                  {!!item.end ? getYear(item.end) : 'Present'}
                </p>
              </div>
              <div className="flex flex-col justify-start items-start relative gap-1.5">
                <p className="self-stretch text-sm font-medium text-left text-resume-subdetails font-mono capitalize flex flex-wrap gap-1">
                  <span>{item.company.toLowerCase()}</span>
                  {item.company && item.contract && <span>·</span>}
                  <span>{item.contract}</span>
                </p>
                <p className="self-stretch text-sm font-medium text-left text-resume-paragraphs">
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
