// src/utils/textProcessor.js
export class TextProcessor {
    constructor() {
      this.fontSize = 22; // 1.375rem = 22px
      this.lineHeight = 1.9;
      this.charWidth = 0.6; // Approximate character width ratio
    }
  
    calculateSectionCapacity() {
      const safeAreaTop = 80;
      const safeAreaBottom = 80;
      const horizontalPadding = 64; // 2rem on each side
      const maxContentWidth = 720;
      
      const availableHeight = window.innerHeight - safeAreaTop - safeAreaBottom;
      const availableWidth = Math.min(window.innerWidth - horizontalPadding, maxContentWidth);
      
      const lineHeightPx = this.fontSize * this.lineHeight;
      const maxLines = Math.floor(availableHeight / lineHeightPx) - 2; // Buffer for margins
      const charsPerLine = Math.floor(availableWidth / (this.fontSize * this.charWidth));
      
      return {
        maxLines: Math.max(5, maxLines), // Minimum 5 lines
        charsPerLine: Math.max(50, charsPerLine), // Minimum 50 chars
        maxChars: Math.max(250, maxLines * charsPerLine * 0.8) // 80% efficiency
      };
    }
  
    splitTextIntoScreenSections(text) {
      const { maxChars } = this.calculateSectionCapacity();
      const sentences = text.split(/(?<=[.!?])\s+/);
      const sections = [];
      let currentSection = '';
      let charCount = 0;
  
      for (const sentence of sentences) {
        const sentenceLength = sentence.length;
        
        // If adding this sentence would exceed capacity and we have content
        if (charCount + sentenceLength > maxChars && currentSection.trim()) {
          sections.push({
            content: currentSection.trim(),
            charCount: charCount,
            id: sections.length
          });
          currentSection = sentence + ' ';
          charCount = sentenceLength + 1;
        } else {
          currentSection += sentence + ' ';
          charCount += sentenceLength + 1;
        }
      }
  
      // Add the last section if it has content
      if (currentSection.trim()) {
        sections.push({
          content: currentSection.trim(),
          charCount: charCount,
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