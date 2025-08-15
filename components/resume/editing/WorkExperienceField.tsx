import React from 'react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { DateRangePicker } from '../../ui/date-range-picker';
import { normalizeDate } from './editingFormUtils';

interface WorkExperience {
  title: string;
  company: string;
  description: string;
  location: string;
  link: string;
  contract: string;
  start: string;
  end?: string | null;
}

interface WorkExperienceFieldProps {
  work: WorkExperience;
  index: number;
  onUpdate: (index: number, updatedWork: WorkExperience) => void;
  onDelete: (index: number) => void;
}

export const WorkExperienceField: React.FC<WorkExperienceFieldProps> = ({
  work,
  index,
  onUpdate,
  onDelete,
}) => {
  return (
    <div className="relative p-4 border rounded-md group">
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
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
            htmlFor={`work-title-${index}`}
            className="text-sm font-medium"
          >
            Job Title
          </Label>
          <Input
            id={`work-title-${index}`}
            value={work.title}
            onChange={(e) => {
              onUpdate(index, {
                ...work,
                title: e.target.value,
              });
            }}
            placeholder="Job Title"
            required
          />
        </div>

        <div>
          <Label
            htmlFor={`work-company-${index}`}
            className="text-sm font-medium"
          >
            Company
          </Label>
          <Input
            id={`work-company-${index}`}
            value={work.company}
            onChange={(e) => {
              onUpdate(index, {
                ...work,
                company: e.target.value,
              });
            }}
            placeholder="Company"
            required
          />
        </div>

        <div>
          <Label
            htmlFor={`work-location-${index}`}
            className="text-sm font-medium"
          >
            Location
          </Label>
          <Input
            id={`work-location-${index}`}
            value={work.location}
            onChange={(e) => {
              onUpdate(index, {
                ...work,
                location: e.target.value,
              });
            }}
            placeholder="Location"
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label className="text-sm font-medium">Date Range</Label>
          <DateRangePicker
            startDate={work.start}
            endDate={work.end}
            onStartDateChange={(date) => {
              onUpdate(index, {
                ...work,
                start: date,
              });
            }}
            onEndDateChange={(date) => {
              onUpdate(index, {
                ...work,
                end: date,
              });
            }}
          />
        </div>

        <div className="md:col-span-2">
          <Label
            htmlFor={`work-description-${index}`}
            className="text-sm font-medium"
          >
            Description
          </Label>
          <textarea
            id={`work-description-${index}`}
            className="w-full p-2 border rounded-md font-mono text-sm"
            value={work.description}
            onChange={(e) => {
              onUpdate(index, {
                ...work,
                description: e.target.value,
              });
            }}
            placeholder="Description"
            rows={3}
            required
          />
        </div>
      </div>
    </div>
  );
};
