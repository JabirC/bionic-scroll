// src/components/StreamingText.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { TextProcessor } from '../utils/textProcessor';

const StreamingText = ({ text, isBionicMode, onProcessingComplete }) => {
  const [processedChunks, setProcessedChunks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [visibleChunks, setVisibleChunks] = useState(10); // Start with 10 chunks visible
  const textProcessor = useMemo(() => new TextProcessor(), []);
  const containerRef = useRef(null);
  const loadingRef = useRef(null);

  // Process text when it changes or bionic mode toggles
  useEffect(() => {
    if (!text) return;

    setIsProcessing(true);
    setProcessedChunks([]);
    setProcessingProgress(0);
    setVisibleChunks(10);

    let allChunks = [];

    const handleBatchComplete = (batch) => {
      allChunks = [...allChunks, ...batch.chunks];
      setProcessedChunks([...allChunks]);
      setProcessingProgress(batch.progress);

      if (batch.isComplete) {
        setIsProcessing(false);
        onProcessingComplete?.(allChunks.length);
      }
    };

    textProcessor.processTextInBatches(text, handleBatchComplete, isBionicMode);
  }, [text, isBionicMode, textProcessor, onProcessingComplete]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isProcessing) {
          setVisibleChunks(prev => Math.min(prev + 5, processedChunks.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [processedChunks.length, isProcessing]);

  // Render visible chunks
  const renderChunks = () => {
    const chunksToRender = processedChunks.slice(0, visibleChunks);
    
    return chunksToRender.map((chunk, index) => (
      <div
        key={index}
        className="chunk-container animate-fade-in"
        style={{
          animationDelay: `${(index % 10) * 50}ms`
        }}
      >
        {chunk.isBionic ? (
          <div
            className="bionic-text preserve-formatting"
            dangerouslySetInnerHTML={{ __html: chunk.processed }}
          />
        ) : (
          <div className="reading-content preserve-formatting">
            {chunk.processed.split(/\n\s*\n/).map((paragraph, pIndex) => (
              <p key={pIndex} className="mb-6 leading-relaxed">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div ref={containerRef} className="streaming-text-container">
      {/* Processing progress indicator */}
      {isProcessing && (
        <div className="fixed top-20 right-4 bg-white rounded-lg shadow-lg p-3 z-30 border">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <div className="text-sm">
              <div className="text-gray-700 font-medium">
                {isBionicMode ? 'Processing bionic text...' : 'Loading content...'}
              </div>
              <div className="text-gray-500">
                {Math.round(processingProgress)}% complete
              </div>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Rendered chunks */}
      <div className="chunks-container">
        {renderChunks()}
      </div>

      {/* Loading trigger for infinite scroll */}
      {visibleChunks < processedChunks.length && (
        <div ref={loadingRef} className="loading-trigger py-8">
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading more content...</span>
          </div>
        </div>
      )}

      {/* End indicator */}
      {!isProcessing && visibleChunks >= processedChunks.length && processedChunks.length > 0 && (
        <div className="end-indicator py-8 text-center text-gray-400">
          <div className="text-sm">End of document</div>
        </div>
      )}
    </div>
  );
};

export default StreamingText;