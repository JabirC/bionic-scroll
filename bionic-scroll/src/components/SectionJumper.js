// src/components/SectionJumper.js
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SectionJumper = ({ currentSection, totalSections, onJumpToSection, onClose, isDarkMode }) => {
  const [inputValue, setInputValue] = useState(currentSection.toString());
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

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
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`section-jumper-overlay ${isDarkMode ? 'dark' : 'light'}`}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div className="section-jumper-modal">
        <div className="section-jumper-header">
          <h3>Jump to Section</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="section-jumper-form">
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`1 - ${totalSections}`}
              className="section-input"
            />
            <span className="input-range">of {totalSections}</span>
          </div>
          
          <div className="button-group">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="jump-btn">
              Jump
            </button>
          </div>
        </form>
        
        <div className="shortcuts">
          <div className="shortcut">
            <kbd>Enter</kbd> Jump to section
          </div>
          <div className="shortcut">
            <kbd>Esc</kbd> Cancel
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionJumper;