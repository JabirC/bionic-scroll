// src/components/Reader.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Eye, EyeOff, RotateCcw, BookOpen } from "lucide-react";
import VerticalProgressBar from "./VerticalProgressBar";
import { formatBionicText, preserveTextFormatting } from "../utils/textFormatter";

const Reader = ({ text, fileName, onReset }) => {
  const [isBionicMode, setIsBionicMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const contentRef = useRef(null);
  const containerRef = useRef(null);

  // Process text to preserve formatting
  const formattedText = preserveTextFormatting(text);
  const totalWords = formattedText.split(/\s+/).filter((word) => word.length > 0).length;
  const estimatedReadingTime = Math.ceil(totalWords / 200); // 200 words per minute

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(Math.min(progress, 100));

      // Estimate words read based on scroll position
      const wordsReadEstimate = Math.floor((progress / 100) * totalWords);
      setWordsRead(wordsReadEstimate);
    }
  }, [totalWords]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const renderText = () => {
    if (isBionicMode) {
      return (
        <div 
          className="bionic-text"
          dangerouslySetInnerHTML={{ __html: formatBionicText(formattedText) }} 
        />
      );
    }
    return (
      <div className="reading-content">
        {formatTextWithParagraphs(formattedText)}
      </div>
    );
  };

  // Helper function to format text with proper paragraphs
  const formatTextWithParagraphs = (text) => {
    return text
      .split(/\n\s*\n/) // Split on double line breaks (paragraph breaks)
      .map((paragraph, index) => (
        <p key={index} className="mb-6 leading-relaxed">
          {paragraph.trim()}
        </p>
      ));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-roboto">
      {/* Vertical Progress Bar */}
      <VerticalProgressBar progress={scrollProgress} />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onReset}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to upload"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-medium text-gray-900 truncate max-w-xs">
                  {fileName.replace(".pdf", "")}
                </h2>
                <p className="text-sm text-gray-500">
                  {totalWords.toLocaleString()} words • ~{estimatedReadingTime} min read • {Math.round(scrollProgress)}% complete
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsBionicMode(!isBionicMode)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-medium
                  ${
                    isBionicMode
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {isBionicMode ? (
                  <>
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Bionic On</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Bionic Off</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div
            ref={contentRef}
            className={`
              prose prose-lg max-w-none text-gray-800
              ${isBionicMode ? "bionic-text" : "reading-content"}
            `}
            style={{
              fontSize: '1.125rem',
              lineHeight: '1.8',
              fontFamily: 'Roboto, sans-serif'
            }}
          >
            {renderText()}
          </div>

          {/* End of document indicator */}
          <div className="mt-16 mb-8 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-400">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">End of document</span>
            </div>
            <div className="mt-6">
              <button
                onClick={onReset}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Upload another PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reader;