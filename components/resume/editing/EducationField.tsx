import React from 'react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { DateRangePicker } from '../../ui/date-range-picker';

interface Education {
  degree: string;
  school: string;
  start: string;
  end: string;
}

interface EducationFieldProps {
  edu: Education;
  index: number;
  onUpdate: (index: number, updatedEdu: Education) => void;
  onDelete: (index: number) => void;
}

export const EducationField: React.FC<EducationFieldProps> = ({
  edu,
  index,
  onUpdate,
  onDelete,
}) => {
  return (
    <div className="relative p-4 border rounded-md group">
      <button
        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
        onClick={() => onDelete(index)}
      >
        <svg
          className="w-5 h-5"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label
            htmlFor={`edu-degree-${index}`}
            className="text-sm font-medium"
          >
            Degree
          </Label>
          <Input
            id={`edu-degree-${index}`}
            value={edu.degree}
            onChange={(e) => {
              onUpdate(index, {
                ...edu,
                degree: e.target.value,
              });
            }}
            placeholder="Degree"
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label
            htmlFor={`edu-school-${index}`}
            className="text-sm font-medium"
          >
            School
          </Label>
          <Input
            id={`edu-school-${index}`}
            value={edu.school}
            onChange={(e) => {
              onUpdate(index, {
                ...edu,
                school: e.target.value,
              });
            }}
            placeholder="School"
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label className="text-sm font-medium">Date Range</Label>
          <DateRangePicker
            startDate={edu.start}
            endDate={edu.end}
            onStartDateChange={(date) => {
              onUpdate(index, {
                ...edu,
                start: date,
              });
            }}
            onEndDateChange={(date) => {
              onUpdate(index, {
                ...edu,
                end: date,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};
