// src/utils/textProcessor.js
export class TextProcessor {
    constructor() {
      this.wordsPerScreen = 120; // Reduced for better readability
    }
  
    // Split text into screen-sized sections
    splitTextIntoScreenSections(text) {
      const sentences = text.split(/(?<=[.!?])\s+/);
      const sections = [];
      let currentSection = '';
      let wordCount = 0;
  
      for (const sentence of sentences) {
        const sentenceWords = sentence.split(/\s+/).length;
        
        if (wordCount + sentenceWords > this.wordsPerScreen && currentSection) {
          sections.push({
            content: currentSection.trim(),
            wordCount: wordCount,
            id: sections.length
          });
          currentSection = sentence + ' ';
          wordCount = sentenceWords;
        } else {
          currentSection += sentence + ' ';
          wordCount += sentenceWords;
        }
      }
  
      if (currentSection.trim()) {
        sections.push({
          content: currentSection.trim(),
          wordCount: wordCount,
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
  
    // Format text consistently whether bionic is on or off
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