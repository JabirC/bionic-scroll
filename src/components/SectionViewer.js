// src/components/SectionViewer.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, Eye, EyeOff, RotateCcw, Home } from 'lucide-react';
import { TextProcessor } from '../utils/textProcessor';

const SectionViewer = ({ text, fileName, onReset }) => {
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isBionicMode, setIsBionicMode] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef(null);
  const textProcessor = new TextProcessor();
  const scrollTimeoutRef = useRef(null);

  // Initialize sections
  useEffect(() => {
    if (!text) return;
    
    const rawSections = textProcessor.splitTextIntoSections(text);
    const processedSections = rawSections.map(section => 
      textProcessor.processSection(section, isBionicMode)
    );
    setSections(processedSections);
    setCurrentSectionIndex(0);
  }, [text]);

  // Reprocess sections when bionic mode changes
  useEffect(() => {
    if (sections.length === 0) return;
    
    const reprocessedSections = sections.map(section => 
      textProcessor.processSection(section, isBionicMode)
    );
    setSections(reprocessedSections);
  }, [isBionicMode]);

  // Handle wheel scrolling with snap behavior
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    if (isScrolling) return;
    
    setIsScrolling(true);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    const delta = e.deltaY;
    const threshold = 50; // Minimum scroll force required
    
    if (Math.abs(delta) > threshold) {
      if (delta > 0 && currentSectionIndex < sections.length - 1) {
        // Scroll down
        setCurrentSectionIndex(prev => prev + 1);
      } else if (delta < 0 && currentSectionIndex > 0) {
        // Scroll up
        setCurrentSectionIndex(prev => prev - 1);
      }
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 300);
  }, [currentSectionIndex, sections.length, isScrolling]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          if (currentSectionIndex < sections.length - 1) {
            setCurrentSectionIndex(prev => prev + 1);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentSectionIndex > 0) {
            setCurrentSectionIndex(prev => prev - 1);
          }
          break;
        case 'b':
        case 'B':
          setIsBionicMode(prev => !prev);
          break;
        case 'Escape':
          onReset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSectionIndex, sections.length, onReset]);

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const currentSection = sections[currentSectionIndex];
  const progress = sections.length > 0 ? ((currentSectionIndex + 1) / sections.length) * 100 : 0;

  const renderSection = () => {
    if (!currentSection) return null;

    if (currentSection.isBionic) {
      return (
        <div
          className="section-content bionic-text"
          dangerouslySetInnerHTML={{ __html: currentSection.processed }}
        />
      );
    }

    return (
      <div className="section-content reading-content">
        {currentSection.processed.split(/\n\s*\n/).map((paragraph, index) => (
          <p key={index} className="paragraph">
            {paragraph.trim()}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="section-viewer" ref={containerRef}>
      {/* Floating Controls */}
      <div className="floating-controls">
        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div className="progress-dots">
            {sections.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${index === currentSectionIndex ? 'active' : ''} ${index < currentSectionIndex ? 'completed' : ''}`}
                onClick={() => setCurrentSectionIndex(index)}
              />
            ))}
          </div>
          <div className="progress-text">
            {currentSectionIndex + 1} of {sections.length}
          </div>
        </div>

        {/* Bionic Toggle */}
        <button
          className={`bionic-toggle ${isBionicMode ? 'active' : ''}`}
          onClick={() => setIsBionicMode(!isBionicMode)}
          title="Toggle Bionic Reading (B)"
        >
          {isBionicMode ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>

        {/* Home Button */}
        <button
          className="home-button"
          onClick={onReset}
          title="Back to Upload (Esc)"
        >
          <Home size={16} />
        </button>
      </div>

      {/* Navigation Hints */}
      <div className="navigation-hints">
        {currentSectionIndex > 0 && (
          <div className="nav-hint nav-hint-up">
            <ChevronUp size={20} />
            <span>Previous section</span>
          </div>
        )}
        {currentSectionIndex < sections.length - 1 && (
          <div className="nav-hint nav-hint-down">
            <ChevronDown size={20} />
            <span>Next section</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="section-container">
        <div className="section-wrapper">
          {renderSection()}
        </div>
      </div>

      {/* Document Info */}
      <div className="document-info">
        <div className="document-title">{fileName.replace('.pdf', '')}</div>
      </div>
    </div>
  );
};

export default SectionViewer;