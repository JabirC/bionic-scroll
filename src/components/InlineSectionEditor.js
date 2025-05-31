// src/components/InlineSectionEditor.js
import React, { useState, useRef, useEffect } from 'react';

const InlineSectionEditor = ({ 
  currentSection, 
  totalSections, 
  onJumpToSection, 
  isEditing, 
  onStartEdit,
  onCancelEdit 
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      setInputValue(currentSection.toString());
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, currentSection]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const sectionNumber = parseInt(inputValue, 10);
    
    if (isNaN(sectionNumber) || sectionNumber < 1 || sectionNumber > totalSections) {
      // Invalid input - shake the input
      if (inputRef.current) {
        inputRef.current.classList.add('shake');
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.classList.remove('shake');
          }
        }, 500);
      }
      return;
    }
    
    onJumpToSection(sectionNumber);
    onCancelEdit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const handleBlur = () => {
    // Small delay to allow form submission if Enter was pressed
    setTimeout(() => {
      onCancelEdit();
    }, 100);
  };

  // Calculate width for current section input based on number of digits
  const getCurrentSectionWidth = () => {
    const digits = inputValue ? inputValue.toString().length : 1;
    return `${Math.max(1.5, digits * 0.7)}rem`;
  };

  // Calculate displayed width for the current section number
  const getCurrentSectionDisplayWidth = () => {
    const digits = currentSection.toString().length;
    return `${Math.max(1.5, digits * 0.7)}rem`;
  };

  if (isEditing) {
    return (
      <div className="section-editor-container">
        <form onSubmit={handleSubmit} className="section-editor-form">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="section-editor-input"
            style={{ width: getCurrentSectionWidth() }}
            placeholder="" // Empty placeholder so no default value appears
          />
        </form>
        <span className="section-separator">/ </span>
        <span className="section-total">{totalSections}</span>
      </div>
    );
  }

  return (
    <button
      className="section-counter-container"
      onClick={onStartEdit}
      title="Edit section number"
    >
      <span 
        className="section-current"
        style={{ minWidth: getCurrentSectionDisplayWidth() }}
      >
        {currentSection}
      </span>
      <span className="section-separator">/ </span>
      <span className="section-total">{totalSections}</span>
    </button>
  );
};

export default InlineSectionEditor;