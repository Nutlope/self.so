import LoadingFallback from '../LoadingFallback';
import { ResumeData } from '../../lib/server/redisActions';
import { Education } from './Education';
import { Header } from './Header';
import { Skills } from './Skills';
import { Summary } from './Summary';
import { WorkExperience } from './WorkExperience';

export const FullResume = ({
  resume,
  profilePicture,
  allSkills,
  isEditMode = false,
  onCtaChange,
}: {
  resume?: ResumeData | null;
  profilePicture?: string;
  allSkills: string[];
  isEditMode?: boolean;
  onCtaChange?: (cta: { label: string; url: string } | undefined) => void;
}) => {
  if (!resume) {
    return <LoadingFallback message="Loading Resume..." />;
  }

  return (
    <section
      className="mx-auto w-full max-w-2xl space-y-8 bg-white print:space-y-4 my-8 px-4"
      aria-label="Resume Content"
    >
      <Header
        header={resume?.header}
        picture={profilePicture}
        isEditMode={isEditMode}
        onCtaChange={onCtaChange}
      />

      <div className="flex flex-col gap-6">
        <Summary summary={resume?.summary} />

        <WorkExperience work={resume?.workExperience} />

        <Education educations={resume.education} />

        <Skills skills={allSkills} />
      </div>
    </section>
  );
};
