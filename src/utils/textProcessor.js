// src/utils/textProcessor.js
export class TextProcessor {
    constructor() {
      this.fontSize = 22; // 1.375rem = 22px
      this.lineHeight = 1.9;
      this.charWidth = 0.6; // Approximate character width ratio
      this.marginBottom = 32; // 2rem margin between paragraphs
    }
  
    calculateSectionCapacity() {
      const safeAreaTop = 80;
      const safeAreaBottom = 80;
      const horizontalPadding = 64; // 2rem on each side
      const maxContentWidth = 720;
      
      const availableHeight = window.innerHeight - safeAreaTop - safeAreaBottom;
      const availableWidth = Math.min(window.innerWidth - horizontalPadding, maxContentWidth);
      
      const lineHeightPx = this.fontSize * this.lineHeight;
      const maxLines = Math.floor(availableHeight / lineHeightPx) - 1; // Buffer for safety
      const charsPerLine = Math.floor(availableWidth / (this.fontSize * this.charWidth));
      
      return {
        maxLines: Math.max(3, maxLines), // Minimum 3 lines
        charsPerLine: Math.max(50, charsPerLine), // Minimum 50 chars
        maxChars: Math.max(150, maxLines * charsPerLine * 0.7), // More conservative
        lineHeightPx,
        availableHeight: availableHeight - 40 // Extra buffer
      };
    }
  
    // Estimate rendered height of text
    estimateTextHeight(text) {
      const { charsPerLine, lineHeightPx } = this.calculateSectionCapacity();
      const paragraphs = text.split(/\n\s*\n/);
      let totalHeight = 0;
  
      paragraphs.forEach((paragraph, index) => {
        const chars = paragraph.length;
        const lines = Math.ceil(chars / charsPerLine);
        const paragraphHeight = lines * lineHeightPx;
        
        totalHeight += paragraphHeight;
        
        // Add margin between paragraphs (except last)
        if (index < paragraphs.length - 1) {
          totalHeight += this.marginBottom;
        }
      });
  
      return totalHeight;
    }
  
    // Split long paragraphs that would exceed viewport
    splitLongParagraph(paragraph, maxChars) {
      if (paragraph.length <= maxChars) {
        return [paragraph];
      }
  
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      const chunks = [];
      let currentChunk = '';
  
      for (const sentence of sentences) {
        // If adding this sentence would exceed maxChars and we have content
        if (currentChunk.length + sentence.length > maxChars && currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence + ' ';
        } else {
          currentChunk += sentence + ' ';
        }
      }
  
      // Add the last chunk if it has content
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
  
      // If we still have chunks that are too long, split them more aggressively
      const finalChunks = [];
      for (const chunk of chunks) {
        if (chunk.length > maxChars) {
          // Split by words as last resort
          const words = chunk.split(/\s+/);
          let wordChunk = '';
          
          for (const word of words) {
            if (wordChunk.length + word.length > maxChars && wordChunk.trim()) {
              finalChunks.push(wordChunk.trim());
              wordChunk = word + ' ';
            } else {
              wordChunk += word + ' ';
            }
          }
          
          if (wordChunk.trim()) {
            finalChunks.push(wordChunk.trim());
          }
        } else {
          finalChunks.push(chunk);
        }
      }
  
      return finalChunks.length > 0 ? finalChunks : [paragraph];
    }
  
    splitTextIntoScreenSections(text) {
      const { maxChars, availableHeight } = this.calculateSectionCapacity();
      
      // First split by natural paragraph breaks
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
      const sections = [];
      let currentSection = '';
      let currentHeight = 0;
  
      for (const paragraph of paragraphs) {
        // Estimate height if we add this paragraph
        const paragraphHeight = this.estimateTextHeight(paragraph + '\n\n');
        
        // If this paragraph alone exceeds available height, split it
        if (paragraphHeight > availableHeight * 0.8) { // Use 80% of available height for safety
          // If we have content in current section, save it
          if (currentSection.trim()) {
            sections.push({
              content: currentSection.trim(),
              estimatedHeight: currentHeight,
              id: sections.length
            });
            currentSection = '';
            currentHeight = 0;
          }
  
          // Split the long paragraph
          const chunks = this.splitLongParagraph(paragraph, maxChars);
          
          for (const chunk of chunks) {
            sections.push({
              content: chunk.trim(),
              estimatedHeight: this.estimateTextHeight(chunk),
              id: sections.length
            });
          }
        } else {
          // Check if adding this paragraph would exceed height limit
          if (currentHeight + paragraphHeight > availableHeight * 0.8 && currentSection.trim()) {
            // Save current section
            sections.push({
              content: currentSection.trim(),
              estimatedHeight: currentHeight,
              id: sections.length
            });
            currentSection = paragraph + '\n\n';
            currentHeight = paragraphHeight;
          } else {
            // Add to current section
            currentSection += paragraph + '\n\n';
            currentHeight += paragraphHeight;
          }
        }
      }
  
      // Add the last section if it has content
      if (currentSection.trim()) {
        sections.push({
          content: currentSection.trim(),
          estimatedHeight: currentHeight,
          id: sections.length
        });
      }
  
      return sections;
    }
  
    formatBionicTextOptimized(text) {
      return text.replace(/\b([a-zA-Z]+)\b/g, (word) => {
        if (word.length <= 1) return word;
  
        let boldLength;
        if (word.length <= 3) {
          boldLength = 1;
        } else if (word.length <= 5) {
          boldLength = 2;
        } else {
          boldLength = Math.max(3, Math.ceil(word.length * 0.4));
        }
  
        const boldPart = word.slice(0, boldLength);
        const normalPart = word.slice(boldLength);
        return `<span class="bionic-word"><strong>${boldPart}</strong>${normalPart}</span>`;
      });
    }
  
    formatText(text) {
      return text
        .split(/\n\s*\n/)
        .filter(p => p.trim())
        .map(p => `<p>${p.trim()}</p>`)
        .join('');
    }
  
    processSection(section, isBionic = false) {
      const regularFormatted = this.formatText(section.content);
      const processed = isBionic 
        ? this.formatText(this.formatBionicTextOptimized(section.content))
        : regularFormatted;
  
      return {
        ...section,
        processed,
        regularFormatted,
        isBionic
      };
    }
  }