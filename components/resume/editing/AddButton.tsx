import React from 'react';

interface AddButtonProps {
  label: string;
  onClick: () => void;
}

export const AddButton: React.FC<AddButtonProps> = ({ label, onClick }) => {
  return (
    <button
      className="w-full p-2 border-2 border-dashed border-border rounded-md text-muted-foreground hover:border-muted-foreground"
      onClick={onClick}
    >
      + {label}
    </button>
  );
};
