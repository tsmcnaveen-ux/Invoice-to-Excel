import React, { useState, useEffect, useRef } from 'react';

interface EditableCellProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  className?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ initialValue, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    // Only call onSave if the value has actually changed
    if (value.trim() !== initialValue.trim()) {
        onSave(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(initialValue); // Revert changes
      setIsEditing(false);
    }
  };
  
  // Separate padding classes (px-*, py-*, p-*) from other utility classes.
  const baseClassName = className?.replace(/p[xy]?-[\d.]+/g, '').trim() || '';
  const paddingClassName = className?.match(/p[xy]?-[\d.]+/g)?.join(' ') || 'px-6 py-4';


  return (
    <td
      className={`${baseClassName} p-0 relative cursor-pointer`}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {/* 
        This div acts as a "sizer" to maintain column width. 
        It becomes invisible during editing but still occupies its original space.
      */}
      <div className={`${paddingClassName} ${isEditing ? 'invisible' : ''}`}>
        {/* Use a non-breaking space for empty cells to prevent collapsing */}
        {value || '\u00A0'}
      </div>

      {isEditing && (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          // This input is absolutely positioned to overlay the cell perfectly.
          className={`
            absolute inset-0 w-full h-full box-border
            bg-white
            outline-none ring-2 ring-inset ring-blue-500
            ${paddingClassName}
          `}
        />
      )}
    </td>
  );
};

export default EditableCell;
