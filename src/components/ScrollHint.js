// src/components/ScrollHint.js
import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const ScrollHint = ({ currentSectionIndex, totalSections, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    // Check if hint has been shown before
    const hintShown = localStorage.getItem('bioniScroll-hint-shown');
    
    if (!hintShown && currentSectionIndex === 0 && totalSections > 1) {
      // Show hint after a short delay on first section
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasBeenShown(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentSectionIndex, totalSections]);

  useEffect(() => {
    if (hasBeenShown) {
      // Hide hint after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        localStorage.setItem('bioniScroll-hint-shown', 'true');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [hasBeenShown]);

  useEffect(() => {
    // Hide hint if user navigates away from first section
    if (currentSectionIndex > 0 && isVisible) {
      setIsVisible(false);
      localStorage.setItem('bioniScroll-hint-shown', 'true');
    }
  }, [currentSectionIndex, isVisible]);

  if (!isVisible || currentSectionIndex > 0 || totalSections <= 1) {
    return null;
  }

  return (
    <div className={`scroll-hint ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="scroll-hint-content">
        <ChevronDown size={20} className="scroll-hint-icon" />
        <span className="scroll-hint-text">Scroll to continue reading</span>
      </div>
    </div>
  );
};

export default ScrollHint;