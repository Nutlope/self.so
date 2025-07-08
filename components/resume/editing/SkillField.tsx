import React from 'react';

interface SkillFieldProps {
  skill: string;
  index: number;
  onUpdate: (index: number, updatedSkill: string) => void;
  onDelete: (index: number) => void;
}

export const SkillField: React.FC<SkillFieldProps> = ({
  skill,
  index,
  onUpdate,
  onDelete,
}) => {
  return (
    <div className="group relative bg-muted px-3 py-1 rounded-full w-fit flex items-center gap-2">
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          // Trim whitespace from both ends to prevent inconsistencies
          const trimmedSkill = (e.currentTarget.textContent || '').trim();
          onUpdate(index, trimmedSkill);
        }}
        className="bg-transparent outline-none h-6 py-0 min-w-[40px] overflow-hidden"
        style={{ width: 'fit-content' }}
      >
        {skill}
      </div>
      <button
        className="text-muted-foreground hover:text-destructive transition-colors"
        onClick={() => onDelete(index)}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};
