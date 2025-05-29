// src/components/TikTokReader.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Home, Sun, Moon, ChevronsDown, EyeOff, Eye } from "lucide-react";
import { TextProcessor } from "../utils/textProcessor";
import BionicIcon from "./BionicIcon";
import InlineSectionEditor from "./InlineSectionEditor";

const TikTokReader = ({ text, fileName, onReset }) => {
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isBionicMode, setIsBionicMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showScrollIndicators, setShowScrollIndicators] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const containerRef = useRef(null);
  const textProcessor = useRef(new TextProcessor()).current;
  const lastScrollTime = useRef(Date.now());
  const scrollIndicatorTimeout = useRef(null);

  // Handle hydration and theme
  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('bioniScroll-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Save theme preference
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('bioniScroll-theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, isClient]);

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
    
    if (isEditingSection) return; // Don't navigate while editing

    const now = Date.now();
    const deltaY = e.deltaY;
    
    if (now - lastScrollTime.current < 100) return;
    lastScrollTime.current = now;

    if (isTransitioning) return;

    showScrollIndicatorsTemporarily();

    const scrollThreshold = 50;
    if (Math.abs(deltaY) < scrollThreshold) return;

    if (deltaY > 0 && currentSectionIndex < sections.length - 1) {
      navigateToSection(currentSectionIndex + 1, 'down');
    } else if (deltaY < 0 && currentSectionIndex > 0) {
      navigateToSection(currentSectionIndex - 1, 'up');
    }
  }, [currentSectionIndex, sections.length, isTransitioning, showScrollIndicatorsTemporarily, isEditingSection]);

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
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isEditingSection) return; // Don't handle navigation when editing section

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
      } else if (e.key === 'Escape') {
        setIsEditingSection(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSectionIndex, sections.length, isBionicMode, showUI, isDarkMode, isEditingSection]);

  // Mouse wheel event
  useEffect(() => {
    const container = document.body;
    container.addEventListener('wheel', handleScroll, { passive: false });
    return () => container.removeEventListener('wheel', handleScroll);
  }, [handleScroll]);

  const currentSection = sections[currentSectionIndex];
  const canGoDown = currentSectionIndex < sections.length - 1;

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="tiktok-reader light">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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

      {/* Control Panel with integrated UI toggle */}
      <div className={`control-panel ${showUI ? 'visible' : 'hidden'}`}>
        <div className="control-group">
          <button
            onClick={() => setIsBionicMode(!isBionicMode)}
            className={`control-btn ${isBionicMode ? 'active' : ''}`}
            title="Toggle Bionic Reading (Space)"
          >
            <BionicIcon size={16} />
          </button>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="control-btn"
            title="Toggle Theme (D)"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button
            onClick={onReset}
            className="control-btn"
            title="Go Home"
          >
            <Home size={18} />
          </button>
        </div>

        <div className="section-info">
          <InlineSectionEditor
            currentSection={currentSectionIndex + 1}
            totalSections={sections.length}
            onJumpToSection={jumpToSection}
            isEditing={isEditingSection}
            onStartEdit={() => setIsEditingSection(true)}
            onCancelEdit={() => setIsEditingSection(false)}
          />
        </div>

        <div className="ui-toggle-section">
          <button
            className="ui-toggle-btn"
            onClick={() => setShowUI(!showUI)}
            title="Hide UI (H)"
          >
            <EyeOff size={18} />
          </button>
        </div>
      </div>

      {/* Standalone UI Toggle for when UI is hidden */}
      <button
        className={`standalone-ui-toggle ${showUI ? 'hidden' : 'visible'}`}
        onClick={() => setShowUI(true)}
        title="Show UI (H)"
      >
        <Eye size={18} />
      </button>

      {/* Navigation Indicators - Only down indicator */}
      {(showScrollIndicators || !showUI) && canGoDown && (
        <div className="nav-indicators">
          <div className="nav-indicator nav-down">
            <ChevronsDown size={16} />
            <span>Scroll down</span>
          </div>
        </div>
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