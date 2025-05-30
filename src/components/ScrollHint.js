// src/components/ScrollHint.js
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const ScrollHint = ({ currentSectionIndex, totalSections, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCount, setShowCount] = useState(0);
  const hintRef = useRef(null);

  useEffect(() => {
    // Show hint whenever user is on first section, but limit frequency
    if (currentSectionIndex === 0 && totalSections > 1) {
      // Check if we've shown the hint too many times recently
      const lastShown = localStorage.getItem('readFaster-hint-last-shown');
      const now = Date.now();
      
      if (!lastShown || now - parseInt(lastShown) > 300000) { // 5 minutes
        // Show after a delay
        const timer = setTimeout(() => {
          setIsVisible(true);
          setShowCount(prev => prev + 1);
          localStorage.setItem('readFaster-hint-last-shown', now.toString());
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
      // Add visible class after state is set
      const timer = setTimeout(() => {
        if (hintRef.current) {
          hintRef.current.classList.add('visible');
        }
      }, 50);

      // Auto hide after 4 seconds
      const hideTimer = setTimeout(() => {
        if (hintRef.current) {
          hintRef.current.classList.remove('visible');
        }
        setTimeout(() => setIsVisible(false), 500); // Wait for transition
      }, 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [isVisible, showCount]);

  if (!isVisible || currentSectionIndex > 0 || totalSections <= 1) {
    return null;
  }

  return (
    <div ref={hintRef} className={`scroll-hint ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="scroll-hint-content">
        <span className="scroll-hint-text">Scroll to continue reading</span>
        <ChevronDown size={20} className="scroll-hint-icon" />
      </div>
    </div>
  );
};

export default ScrollHint;