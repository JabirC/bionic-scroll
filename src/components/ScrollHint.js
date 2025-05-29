// src/components/ScrollHint.js
import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const ScrollHint = ({ currentSectionIndex, totalSections, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCount, setShowCount] = useState(0);

  useEffect(() => {
    // Show hint whenever user is on first section, but limit frequency
    if (currentSectionIndex === 0 && totalSections > 1) {
      // Check if we've shown the hint too many times recently
      const lastShown = localStorage.getItem('bioniScroll-hint-last-shown');
      const now = Date.now();
      
      if (!lastShown || now - parseInt(lastShown) > 300000) { // 5 minutes
        // Show after a delay
        const timer = setTimeout(() => {
          setIsVisible(true);
          setShowCount(prev => prev + 1);
          localStorage.setItem('bioniScroll-hint-last-shown', now.toString());
        }, 1500);

        return () => clearTimeout(timer);
      }
    } else {
      // Hide hint when not on first section
      setIsVisible(false);
    }
  }, [currentSectionIndex, totalSections]);

  useEffect(() => {
    if (isVisible) {
      // Auto hide after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, showCount]);

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