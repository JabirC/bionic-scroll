// src/utils/textProcessor.js
export class TextProcessor {
    constructor() {
      this.wordsPerScreen = 150; // Approximate words that fit comfortably on screen
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
        } else {
          boldLength = Math.ceil(word.length * 0.5);
        }
  
        const boldPart = word.slice(0, boldLength);
        const normalPart = word.slice(boldLength);
        return `<span class="bionic-word"><strong>${boldPart}</strong>${normalPart}</span>`;
      });
    }
  
    processSection(section, isBionic = false) {
      const processed = isBionic 
        ? this.formatBionicTextOptimized(section.content)
        : section.content;
  
      return {
        ...section,
        processed,
        isBionic
      };
    }
  }