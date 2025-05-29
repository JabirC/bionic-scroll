// src/components/TikTokReader.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { TextProcessor } from "../utils/textProcessor";

const TikTokReader = ({ text, fileName, onReset }) => {
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isBionicMode, setIsBionicMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const containerRef = useRef(null);
  const textProcessor = useRef(new TextProcessor()).current;
  const scrollPosition = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const controlsTimeout = useRef(null);

  // Initialize sections
  useEffect(() => {
    if (text) {
      const rawSections = textProcessor.splitTextIntoSections(text);
      setSections(rawSections.map(section => 
        textProcessor.processSection(section, isBionicMode)
      ));
    }
  }, [text, textProcessor]);

  // Re-process sections when bionic mode changes
  useEffect(() => {
    if (sections.length > 0) {
      setSections(sections.map(section => 
        textProcessor.processSection(section, isBionicMode)
      ));
    }
  }, [isBionicMode, sections.length, textProcessor]);

  // Handle scroll for navigation
  const handleScroll = useCallback((e) => {
    e.preventDefault();
    
    const now = Date.now();
    const deltaY = e.deltaY;
    
    // Throttle scroll events
    if (now - lastScrollTime.current < 150) return;
    lastScrollTime.current = now;
    
    // Show controls on scroll
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);

    if (isTransitioning) return;

    // Determine scroll direction and magnitude
    const scrollThreshold = 100;
    if (Math.abs(deltaY) < scrollThreshold) return;

    if (deltaY > 0 && currentSectionIndex < sections.length - 1) {
      // Scroll down - next section
      navigateToSection(currentSectionIndex + 1, 'down');
    } else if (deltaY < 0 && currentSectionIndex > 0) {
      // Scroll up - previous section
      navigateToSection(currentSectionIndex - 1, 'up');
    }
  }, [currentSectionIndex, sections.length, isTransitioning]);

  const navigateToSection = (newIndex, direction) => {
    setIsTransitioning(true);
    
    const container = containerRef.current;
    if (container) {
      container.style.transform = `translateY(${direction === 'down' ? '-100vh' : '100vh'})`;
      
      setTimeout(() => {
        setCurrentSectionIndex(newIndex);
        container.style.transition = 'none';
        container.style.transform = `translateY(${direction === 'down' ? '100vh' : '-100vh'})`;
        
        setTimeout(() => {
          container.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          container.style.transform = 'translateY(0)';
          
          setTimeout(() => {
            setIsTransitioning(false);
          }, 600);
        }, 50);
      }, 300);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' && currentSectionIndex < sections.length - 1) {
        navigateToSection(currentSectionIndex + 1, 'down');
      } else if (e.key === 'ArrowUp' && currentSectionIndex > 0) {
        navigateToSection(currentSectionIndex - 1, 'up');
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsBionicMode(!isBionicMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSectionIndex, sections.length, isBionicMode]);

  // Mouse wheel event
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleScroll, { passive: false });
      return () => container.removeEventListener('wheel', handleScroll);
    }
  }, [handleScroll]);

  // Hide controls after inactivity
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const currentSection = sections[currentSectionIndex];
  const progress = sections.length > 0 ? ((currentSectionIndex + 1) / sections.length) * 100 : 0;

  return (
    <div className="tiktok-reader">
      {/* Floating Controls */}
      <div className={`floating-controls ${showControls ? 'visible' : 'hidden'}`}>
        {/* Progress Indicator */}
        <div className="progress-dots">
          {sections.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index === currentSectionIndex ? 'active' : ''} ${index < currentSectionIndex ? 'completed' : ''}`}
              onClick={() => !isTransitioning && setCurrentSectionIndex(index)}
            />
          ))}
        </div>

        {/* Control Buttons */}
        <div className="control-buttons">
          <button
            onClick={() => setIsBionicMode(!isBionicMode)}
            className={`bionic-toggle ${isBionicMode ? 'active' : ''}`}
            title="Toggle Bionic Reading"
          >
            {isBionicMode ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          
          <button
            onClick={onReset}
            className="reset-button"
            title="Upload New Document"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Navigation Hints */}
        <div className="navigation-hints">
          {currentSectionIndex > 0 && (
            <div className="nav-hint nav-up">
              <ArrowUp size={16} />
              <span>Previous</span>
            </div>
          )}
          {currentSectionIndex < sections.length - 1 && (
            <div className="nav-hint nav-down">
              <ArrowDown size={16} />
              <span>Next</span>
            </div>
          )}
        </div>

        {/* Document Info */}
        <div className="document-info">
          <div className="doc-title">{fileName?.replace('.pdf', '')}</div>
          <div className="section-info">
            Section {currentSectionIndex + 1} of {sections.length}
            {currentSection && ` • ${currentSection.wordCount} words`}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        ref={containerRef}
        className="section-container"
        style={{
          transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
        }}
      >
        {currentSection && (
          <div className="section-content">
            {currentSection.isBionic ? (
              <div
                className="bionic-text"
                dangerouslySetInnerHTML={{ __html: currentSection.processed }}
              />
            ) : (
              <div className="regular-text">
                {formatTextWithParagraphs(currentSection.processed)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {sections.length === 0 && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Processing your document...</p>
        </div>
      )}
    </div>
  );
};

// Helper function for formatting regular text
const formatTextWithParagraphs = (text) => {
  return text.split(/\n\s*\n/).map((paragraph, index) => (
    <p key={index} className="paragraph">
      {paragraph.trim()}
    </p>
  ));
};

export default TikTokReader;