// src/components/TikTokReader.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Palette, BookOpen, ChevronsUp, ChevronsDown, Eye } from "lucide-react";
import { TextProcessor } from "../utils/textProcessor";
import SectionJumper from "./SectionJumper";

const TikTokReader = ({ text, fileName, onReset }) => {
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isBionicMode, setIsBionicMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bioniScroll-theme') === 'dark';
    }
    return false;
  });
  const [showScrollIndicators, setShowScrollIndicators] = useState(false);
  const [showSectionJumper, setShowSectionJumper] = useState(false);
  
  const containerRef = useRef(null);
  const textProcessor = useRef(new TextProcessor()).current;
  const lastScrollTime = useRef(Date.now());
  const scrollIndicatorTimeout = useRef(null);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('bioniScroll-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Initialize sections with screen-sized chunks
  useEffect(() => {
    if (text) {
      const rawSections = textProcessor.splitTextIntoScreenSections(text);
      setSections(rawSections.map(section => 
        textProcessor.processSection(section, isBionicMode)
      ));
    }
  }, [text, textProcessor]);

  // Recalculate sections on window resize
  useEffect(() => {
    const handleResize = () => {
      if (text) {
        const rawSections = textProcessor.splitTextIntoScreenSections(text);
        setSections(rawSections.map(section => 
          textProcessor.processSection(section, isBionicMode)
        ));
        // Reset to first section to avoid index out of bounds
        setCurrentSectionIndex(0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [text, textProcessor, isBionicMode]);

  // Re-process sections when bionic mode changes
  useEffect(() => {
    if (sections.length > 0) {
      setSections(prevSections => prevSections.map(section => 
        textProcessor.processSection(section, isBionicMode)
      ));
    }
  }, [isBionicMode, textProcessor]);

  // Show scroll indicators temporarily
  const showScrollIndicatorsTemporarily = useCallback(() => {
    setShowScrollIndicators(true);
    if (scrollIndicatorTimeout.current) {
      clearTimeout(scrollIndicatorTimeout.current);
    }
    scrollIndicatorTimeout.current = setTimeout(() => {
      setShowScrollIndicators(false);
    }, 2000);
  }, []);

  // Handle scroll for navigation
  const handleScroll = useCallback((e) => {
    e.preventDefault();
    
    const now = Date.now();
    const deltaY = e.deltaY;
    
    if (now - lastScrollTime.current < 100) return;
    lastScrollTime.current = now;

    if (isTransitioning) return;

    // Show scroll indicators when user attempts to scroll
    showScrollIndicatorsTemporarily();

    const scrollThreshold = 50;
    if (Math.abs(deltaY) < scrollThreshold) return;

    if (deltaY > 0 && currentSectionIndex < sections.length - 1) {
      navigateToSection(currentSectionIndex + 1, 'down');
    } else if (deltaY < 0 && currentSectionIndex > 0) {
      navigateToSection(currentSectionIndex - 1, 'up');
    }
  }, [currentSectionIndex, sections.length, isTransitioning, showScrollIndicatorsTemporarily]);

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

  const jumpToSection = (sectionNumber) => {
    const newIndex = sectionNumber - 1;
    if (newIndex >= 0 && newIndex < sections.length && newIndex !== currentSectionIndex) {
      const direction = newIndex > currentSectionIndex ? 'down' : 'up';
      navigateToSection(newIndex, direction);
    }
    setShowSectionJumper(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showSectionJumper) return; // Don't handle navigation when section jumper is open

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
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setShowSectionJumper(true);
      } else if (e.key === 'Escape') {
        setShowSectionJumper(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSectionIndex, sections.length, isBionicMode, showUI, isDarkMode, showSectionJumper]);

  // Mouse wheel event
  useEffect(() => {
    const container = document.body;
    container.addEventListener('wheel', handleScroll, { passive: false });
    return () => container.removeEventListener('wheel', handleScroll);
  }, [handleScroll]);

  const currentSection = sections[currentSectionIndex];
  const canGoUp = currentSectionIndex > 0;
  const canGoDown = currentSectionIndex < sections.length - 1;

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

      {/* Control Panel */}
      <div className={`control-panel ${showUI ? 'visible' : 'hidden'}`}>
        <div className="control-group">
          <button
            onClick={() => setIsBionicMode(!isBionicMode)}
            className={`control-btn ${isBionicMode ? 'active' : ''}`}
            title="Toggle Bionic Reading (Space)"
          >
            <Eye size={18} />
          </button>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="control-btn"
            title="Toggle Theme (D)"
          >
            <Palette size={18} />
          </button>
          
          <button
            onClick={onReset}
            className="control-btn"
            title="Upload New Document"
          >
            <Upload size={18} />
          </button>

          <button
            onClick={() => setShowUI(!showUI)}
            className="control-btn"
            title="Hide UI (H)"
          >
            <BookOpen size={18} />
          </button>
        </div>

        <div className="section-info">
          <button
            className="section-counter"
            onClick={() => setShowSectionJumper(true)}
            title="Jump to section (G)"
          >
            {currentSectionIndex + 1} / {sections.length}
          </button>
        </div>
      </div>

      {/* Navigation Indicators - Smart Display */}
      {(showScrollIndicators || !showUI) && (
        <div className="nav-indicators">
          {canGoUp && (
            <div className="nav-indicator nav-up">
              <ChevronsUp size={16} />
              <span>Scroll up</span>
            </div>
          )}
          {canGoDown && (
            <div className="nav-indicator nav-down">
              <ChevronsDown size={16} />
              <span>Scroll down</span>
            </div>
          )}
        </div>
      )}

      {/* Section Jumper Modal */}
      {showSectionJumper && (
        <SectionJumper
          currentSection={currentSectionIndex + 1}
          totalSections={sections.length}
          onJumpToSection={jumpToSection}
          onClose={() => setShowSectionJumper(false)}
          isDarkMode={isDarkMode}
        />
      )}

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