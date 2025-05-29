// src/components/TikTokReader.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, Eye, EyeOff, ChevronsUp, ChevronsDown, Settings2, Moon, Sun } from "lucide-react";
import { TextProcessor } from "../utils/textProcessor";

const TikTokReader = ({ text, fileName, onReset }) => {
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isBionicMode, setIsBionicMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const containerRef = useRef(null);
  const textProcessor = useRef(new TextProcessor()).current;
  const lastScrollTime = useRef(Date.now());

  // Initialize sections with screen-sized chunks
  useEffect(() => {
    if (text) {
      const rawSections = textProcessor.splitTextIntoScreenSections(text);
      setSections(rawSections.map(section => 
        textProcessor.processSection(section, isBionicMode)
      ));
    }
  }, [text, textProcessor]);

  // Re-process sections when bionic mode changes
  useEffect(() => {
    if (sections.length > 0) {
      setSections(prevSections => prevSections.map(section => 
        textProcessor.processSection(section, isBionicMode)
      ));
    }
  }, [isBionicMode, textProcessor]);

  // Handle scroll for navigation
  const handleScroll = useCallback((e) => {
    e.preventDefault();
    
    const now = Date.now();
    const deltaY = e.deltaY;
    
    if (now - lastScrollTime.current < 100) return;
    lastScrollTime.current = now;

    if (isTransitioning) return;

    const scrollThreshold = 50;
    if (Math.abs(deltaY) < scrollThreshold) return;

    if (deltaY > 0 && currentSectionIndex < sections.length - 1) {
      navigateToSection(currentSectionIndex + 1, 'down');
    } else if (deltaY < 0 && currentSectionIndex > 0) {
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
        
        requestAnimationFrame(() => {
          container.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
          container.style.transform = 'translateY(0)';
          
          setTimeout(() => {
            setIsTransitioning(false);
          }, 400);
        });
      }, 200);
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
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShowUI(!showUI);
      } else if (e.key === 'd' || e.key === 'D') {
        setIsDarkMode(!isDarkMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSectionIndex, sections.length, isBionicMode, showUI, isDarkMode]);

  // Mouse wheel event
  useEffect(() => {
    const container = document.body;
    container.addEventListener('wheel', handleScroll, { passive: false });
    return () => container.removeEventListener('wheel', handleScroll);
  }, [handleScroll]);

  const currentSection = sections[currentSectionIndex];

  return (
    <div className={`tiktok-reader ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Progress Bar */}
      <div className={`progress-bar ${showUI ? 'visible' : 'hidden'}`}>
        <div 
          className="progress-fill"
          style={{ 
            width: `${sections.length > 0 ? ((currentSectionIndex + 1) / sections.length) * 100 : 0}%` 
          }}
        />
      </div>

      {/* Settings Toggle - Always visible */}
      <button
        className="settings-toggle"
        onClick={() => setShowUI(!showUI)}
        title="Toggle UI (H)"
      >
        <Settings2 size={20} />
      </button>

      {/* Control Panel */}
      <div className={`control-panel ${showUI ? 'visible' : 'hidden'}`}>
        <div className="control-group">
          <button
            onClick={() => setIsBionicMode(!isBionicMode)}
            className={`control-btn bionic-btn ${isBionicMode ? 'active' : ''}`}
            title="Toggle Bionic Reading (Space)"
          >
            {isBionicMode ? <Eye size={18} /> : <EyeOff size={18} />}
            <span className="control-label">Bionic</span>
          </button>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`control-btn theme-btn`}
            title="Toggle Dark Mode (D)"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="control-label">Theme</span>
          </button>
          
          <button
            onClick={onReset}
            className="control-btn reset-btn"
            title="Upload New Document"
          >
            <RotateCcw size={18} />
            <span className="control-label">New PDF</span>
          </button>
        </div>

        <div className="section-info">
          <span className="section-counter">
            {currentSectionIndex + 1} / {sections.length}
          </span>
        </div>
      </div>

      {/* Navigation Indicators */}
      <div className={`nav-indicators ${showUI ? 'visible' : 'hidden'}`}>
        {currentSectionIndex > 0 && (
          <div className="nav-indicator nav-up">
            <ChevronsUp size={16} />
            <span>Scroll up</span>
          </div>
        )}
        {currentSectionIndex < sections.length - 1 && (
          <div className="nav-indicator nav-down">
            <ChevronsDown size={16} />
            <span>Scroll down</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="content-wrapper">
        <div 
          ref={containerRef}
          className="section-container"
        >
          {currentSection && (
            <div className="section-content">
              <div className="text-wrapper">
                {currentSection.isBionic ? (
                  <div
                    className="text-content bionic-text"
                    dangerouslySetInnerHTML={{ __html: currentSection.processed }}
                  />
                ) : (
                  <div className="text-content regular-text">
                    <div dangerouslySetInnerHTML={{ __html: currentSection.regularFormatted }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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

export default TikTokReader;