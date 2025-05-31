// src/components/TikTokReader.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Home, Sun, Moon, EyeOff, Eye } from "lucide-react";
import { TextProcessor } from "../utils/textProcessor";
import { FileLibrary } from "../utils/fileLibrary";
import BionicIcon from "./BionicIcon";
import InlineSectionEditor from "./InlineSectionEditor";
import ScrollHint from "./ScrollHint";

const TikTokReader = ({ text, fileName, onReset, fileId }) => {
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isBionicMode, setIsBionicMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [fontSizeIndex, setFontSizeIndex] = useState(1); // Default to medium (index 1)
  
  const containerRef = useRef(null);
  const textProcessor = useRef(new TextProcessor()).current;
  const fileLibrary = useRef(new FileLibrary()).current;
  const lastScrollTime = useRef(Date.now());
  
  // Touch handling state
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isScrolling = useRef(false);

  // Three font sizes: small, medium, large
  const FONT_SIZES = [18, 22, 26];
  const FONT_SIZE_LABELS = ['Small', 'Medium', 'Large'];
  
  // Add a ref to track content for repositioning - FONT SIZE JUMP FIX
  const findMatchingSectionRef = useRef(null);

  // Handle hydration and theme
  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('readFaster-theme');
    const savedFontSize = localStorage.getItem('readFaster-fontSizeIndex');
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
    if (savedFontSize) {
      const parsedIndex = parseInt(savedFontSize, 10);
      if (parsedIndex >= 0 && parsedIndex < FONT_SIZES.length) {
        setFontSizeIndex(parsedIndex);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('readFaster-theme', isDarkMode ? 'dark' : 'light');
      localStorage.setItem('readFaster-fontSizeIndex', fontSizeIndex.toString());
    }
  }, [isDarkMode, fontSizeIndex, isClient]);

  // Update text processor font size
  useEffect(() => {
    textProcessor.setFontSize(FONT_SIZES[fontSizeIndex]);
  }, [fontSizeIndex, textProcessor]);

  // Initialize sections and restore position
  useEffect(() => {
    if (text) {
      const rawSections = textProcessor.splitTextIntoScreenSections(text);
      const processedSections = rawSections.map(section => 
        textProcessor.processSection(section, isBionicMode)
      );
      setSections(processedSections);

      // Restore reading position if file is saved
      if (fileId) {
        const file = fileLibrary.getFile(fileId);
        if (file && file.readingPosition) {
          const targetCharIndex = fileLibrary.findPositionInText(
            text, 
            file.readingPosition.characterIndex,
            file.readingPosition.textSnippet
          );
          
          const sectionIndex = textProcessor.findSectionByCharacterIndex(
            rawSections, 
            targetCharIndex
          );
          
          setCurrentSectionIndex(sectionIndex);
        }
      }
    }
  }, [text, textProcessor, fileId, fileLibrary, fontSizeIndex]);

  // Recalculate sections on window resize or font size change - FONT SIZE JUMP FIX
  useEffect(() => {
    const handleResize = () => {
      if (text && sections.length > 0) {
        // Store current position before resize
        const currentSection = sections[currentSectionIndex];
        const currentContent = currentSection ? currentSection.content : '';
        const contentToFind = findMatchingSectionRef.current || 
                              currentContent.trim().split(/\s+/).slice(0, 10).join(' ');
        
        // Recalculate sections
        const rawSections = textProcessor.splitTextIntoScreenSections(text);
        const processedSections = rawSections.map(section => 
          textProcessor.processSection(section, isBionicMode)
        );
        setSections(processedSections);
        
        // Find section containing the same content
        let bestMatchIndex = 0;
        let bestMatchScore = -1;
        
        for (let i = 0; i < rawSections.length; i++) {
          if (rawSections[i].content.includes(contentToFind)) {
            const score = rawSections[i].content.indexOf(contentToFind);
            if (score === 0) {
              bestMatchIndex = i;
              break; // Perfect match at beginning
            } else if (score > bestMatchScore) {
              bestMatchIndex = i;
              bestMatchScore = score;
            }
          }
        }
        
        setCurrentSectionIndex(bestMatchIndex);
        findMatchingSectionRef.current = null;
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Call resize handler when font size changes - FONT SIZE JUMP FIX
    if (findMatchingSectionRef.current) {
      handleResize();
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [text, textProcessor, isBionicMode, sections, currentSectionIndex, fontSizeIndex]);

  // Re-process sections when bionic mode changes
  useEffect(() => {
    if (sections.length > 0) {
      setSections(prevSections => prevSections.map(section => 
        textProcessor.processSection(section, isBionicMode)
      ));
    }
  }, [isBionicMode, textProcessor]);

  // Update reading position when section changes
  useEffect(() => {
    if (fileId && sections.length > 0 && sections[currentSectionIndex]) {
      const currentSection = sections[currentSectionIndex];
      const percentage = ((currentSectionIndex + 1) / sections.length) * 100;
      
      // Get text snippet for verification
      const textStart = Math.max(0, currentSection.startCharIndex);
      const textSnippet = text.substring(textStart, textStart + 100);
      
      fileLibrary.updateReadingPosition(
        fileId,
        currentSection.startCharIndex,
        percentage,
        textSnippet,
        currentSectionIndex
      );
    }
  }, [currentSectionIndex, sections, fileId, text, fileLibrary]);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    if (isEditingSection) return;
    
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isScrolling.current = false;
  }, [isEditingSection]);

  const handleTouchMove = useCallback((e) => {
    if (isEditingSection) return;
    
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartY.current - touchY;
    
    if (Math.abs(deltaY) > 10) {
      isScrolling.current = true;
    }
  }, [isEditingSection]);

  const handleTouchEnd = useCallback((e) => {
    if (isEditingSection || !isScrolling.current) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;
    const deltaTime = Date.now() - touchStartTime.current;
    
    // Minimum swipe distance and maximum time for a valid swipe
    const minSwipeDistance = 50;
    const maxSwipeTime = 500;
    
    if (Math.abs(deltaY) < minSwipeDistance || deltaTime > maxSwipeTime) {
      return;
    }
    
    if (isTransitioning) return;

    if (deltaY > 0 && currentSectionIndex < sections.length - 1) {
      // Swipe up - next section
      navigateToSection(currentSectionIndex + 1, 'down');
    } else if (deltaY < 0 && currentSectionIndex > 0) {
      // Swipe down - previous section
      navigateToSection(currentSectionIndex - 1, 'up');
    }
  }, [currentSectionIndex, sections.length, isTransitioning, isEditingSection]);

  const handleScroll = useCallback((e) => {
    e.preventDefault();
    
    if (isEditingSection) return;

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
  }, [currentSectionIndex, sections.length, isTransitioning, isEditingSection]);

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
          }, 500);
        });
      }, 75);
    }
  };

  const jumpToSection = (sectionNumber) => {
    const newIndex = sectionNumber - 1;
    if (newIndex >= 0 && newIndex < sections.length && newIndex !== currentSectionIndex) {
      const direction = newIndex > currentSectionIndex ? 'down' : 'up';
      navigateToSection(newIndex, direction);
    }
  };

  // Font size controls - FONT SIZE JUMP FIX
  const increaseFontSize = () => {
    if (fontSizeIndex >= FONT_SIZES.length - 1) return;
    
    // Store reference content for repositioning
    if (sections[currentSectionIndex]) {
      const currentContent = sections[currentSectionIndex].content;
      const firstWords = currentContent.trim().split(/\s+/).slice(0, 10).join(' ');
      findMatchingSectionRef.current = firstWords;
    }
    
    setFontSizeIndex(prev => Math.min(prev + 1, FONT_SIZES.length - 1));
  };

  // Font size controls - FONT SIZE JUMP FIX
  const decreaseFontSize = () => {
    if (fontSizeIndex <= 0) return;
    
    // Store reference content for repositioning
    if (sections[currentSectionIndex]) {
      const currentContent = sections[currentSectionIndex].content;
      const firstWords = currentContent.trim().split(/\s+/).slice(0, 10).join(' ');
      findMatchingSectionRef.current = firstWords;
    }
    
    setFontSizeIndex(prev => Math.max(prev - 1, 0));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isEditingSection) return;

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
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        increaseFontSize();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        decreaseFontSize();
      } else if (e.key === 'Escape') {
        setIsEditingSection(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSectionIndex, sections.length, isBionicMode, showUI, isDarkMode, isEditingSection]);

  // Event listeners
  useEffect(() => {
    const container = document.body;
    
    // Mouse wheel
    container.addEventListener('wheel', handleScroll, { passive: false });
    
    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('wheel', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleScroll, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const currentSection = sections[currentSectionIndex];

  if (!isClient) {
    return (
      <div className="reader-container light">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`reader-container ${isDarkMode ? 'dark' : 'light'}`}>
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
            <BionicIcon size={16} />
          </button>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="control-btn"
            title="Toggle Theme (D)"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          <button
            onClick={onReset}
            className="control-btn"
            title="Go Home"
          >
            <Home size={16} />
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
            <EyeOff size={16} />
          </button>
        </div>
      </div>

      {/* Font Controls - Bottom Right Corner */}
      <div className={`font-controls ${showUI ? 'visible' : 'hidden'}`}>
        <button
          onClick={decreaseFontSize}
          className={`font-btn font-btn-small ${fontSizeIndex <= 0 ? 'disabled' : ''}`}
          title="Decrease Font Size"
          disabled={fontSizeIndex <= 0}
        >
          A
        </button>
        
        <button
          onClick={increaseFontSize}
          className={`font-btn font-btn-large ${fontSizeIndex >= FONT_SIZES.length - 1 ? 'disabled' : ''}`}
          title="Increase Font Size"
          disabled={fontSizeIndex >= FONT_SIZES.length - 1}
        >
          A
        </button>
      </div>

      <button
        className={`standalone-ui-toggle ${showUI ? 'hidden' : 'visible'}`}
        onClick={() => setShowUI(true)}
        title="Show UI (H)"
      >
        <Eye size={18} />
      </button>

      <ScrollHint 
        currentSectionIndex={currentSectionIndex}
        totalSections={sections.length}
        isDarkMode={isDarkMode}
      />

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
                    style={{ fontSize: `${FONT_SIZES[fontSizeIndex]}px` }}
                    dangerouslySetInnerHTML={{ __html: currentSection.processed }}
                  />
                ) : (
                  <div 
                    className="text-content regular-text"
                    style={{ fontSize: `${FONT_SIZES[fontSizeIndex]}px` }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: currentSection.regularFormatted }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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