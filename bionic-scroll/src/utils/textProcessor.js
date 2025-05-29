// src/utils/textProcessor.js
export class TextProcessor {
    constructor() {
      this.sectionSize = 800; // Words per section (like TikTok video length)
      this.threshold = 0.7; // Scroll threshold to advance to next section
    }
  
    // Split text into TikTok-style sections
    splitTextIntoSections(text) {
      const sentences = text.split(/(?<=[.!?])\s+/);
      const sections = [];
      let currentSection = '';
      let wordCount = 0;
  
      for (const sentence of sentences) {
        const sentenceWords = sentence.split(/\s+/).length;
        
        if (wordCount + sentenceWords > this.sectionSize && currentSection) {
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
  
    // Updated bionic text formatting
    formatBionicTextOptimized(text) {
      return text.replace(/\b([a-zA-Z]+)\b/g, (word) => {
        if (word.length <= 1) return word;
  
        let boldLength;
        if (word.length <= 3) {
          boldLength = 1; // Only first letter
        } else {
          boldLength = Math.ceil(word.length * 0.5); // 50% rounded up
        }
  
        const boldPart = word.slice(0, boldLength);
        const normalPart = word.slice(boldLength);
        return `<span class="bionic-word"><strong>${boldPart}</strong>${normalPart}</span>`;
      });
    }
  
    // Process single section
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