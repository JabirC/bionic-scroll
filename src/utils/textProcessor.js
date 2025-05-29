// src/utils/textProcessor.js
export class TextProcessor {
  constructor() {
    this.fontSize = 22;
    this.lineHeight = 1.9;
    this.charWidth = 0.6;
    this.marginBottom = 32;
  }

  calculateSectionCapacity() {
    const safeAreaTop = 80;
    const safeAreaBottom = 80;
    const horizontalPadding = 64;
    const maxContentWidth = 720;
    
    const availableHeight = window.innerHeight - safeAreaTop - safeAreaBottom;
    const availableWidth = Math.min(window.innerWidth - horizontalPadding, maxContentWidth);
    
    const lineHeightPx = this.fontSize * this.lineHeight;
    const maxLines = Math.floor(availableHeight / lineHeightPx) - 1;
    const charsPerLine = Math.floor(availableWidth / (this.fontSize * this.charWidth));
    
    return {
      maxLines: Math.max(3, maxLines),
      charsPerLine: Math.max(50, charsPerLine),
      maxChars: Math.max(150, maxLines * charsPerLine * 0.7),
      lineHeightPx,
      availableHeight: availableHeight - 40
    };
  }

  estimateTextHeight(text) {
    const { charsPerLine, lineHeightPx } = this.calculateSectionCapacity();
    const paragraphs = text.split(/\n\s*\n/);
    let totalHeight = 0;

    paragraphs.forEach((paragraph, index) => {
      const chars = paragraph.length;
      const lines = Math.ceil(chars / charsPerLine);
      const paragraphHeight = lines * lineHeightPx;
      
      totalHeight += paragraphHeight;
      
      if (index < paragraphs.length - 1) {
        totalHeight += this.marginBottom;
      }
    });

    return totalHeight;
  }

  splitLongParagraph(paragraph, maxChars) {
    if (paragraph.length <= maxChars) {
      return [paragraph];
    }

    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChars && currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence + ' ';
      } else {
        currentChunk += sentence + ' ';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    const finalChunks = [];
    for (const chunk of chunks) {
      if (chunk.length > maxChars) {
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
    
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    const sections = [];
    let currentSection = '';
    let currentHeight = 0;
    let currentCharIndex = 0; // Track character position in original text

    for (const paragraph of paragraphs) {
      const paragraphHeight = this.estimateTextHeight(paragraph + '\n\n');
      
      if (paragraphHeight > availableHeight * 0.8) {
        if (currentSection.trim()) {
          sections.push({
            content: currentSection.trim(),
            estimatedHeight: currentHeight,
            id: sections.length,
            startCharIndex: currentCharIndex - currentSection.length,
            endCharIndex: currentCharIndex,
            characterCount: currentSection.length
          });
          currentSection = '';
          currentHeight = 0;
        }

        const chunks = this.splitLongParagraph(paragraph, maxChars);
        
        for (const chunk of chunks) {
          const chunkWithNewlines = chunk.trim() + '\n\n';
          sections.push({
            content: chunk.trim(),
            estimatedHeight: this.estimateTextHeight(chunk),
            id: sections.length,
            startCharIndex: currentCharIndex,
            endCharIndex: currentCharIndex + chunk.length,
            characterCount: chunk.length
          });
          currentCharIndex += chunkWithNewlines.length;
        }
      } else {
        if (currentHeight + paragraphHeight > availableHeight * 0.8 && currentSection.trim()) {
          sections.push({
            content: currentSection.trim(),
            estimatedHeight: currentHeight,
            id: sections.length,
            startCharIndex: currentCharIndex - currentSection.length,
            endCharIndex: currentCharIndex,
            characterCount: currentSection.length
          });
          
          const paragraphWithNewlines = paragraph + '\n\n';
          currentSection = paragraphWithNewlines;
          currentHeight = paragraphHeight;
          currentCharIndex += paragraphWithNewlines.length;
        } else {
          const paragraphWithNewlines = paragraph + '\n\n';
          currentSection += paragraphWithNewlines;
          currentHeight += paragraphHeight;
          currentCharIndex += paragraphWithNewlines.length;
        }
      }
    }

    if (currentSection.trim()) {
      sections.push({
        content: currentSection.trim(),
        estimatedHeight: currentHeight,
        id: sections.length,
        startCharIndex: currentCharIndex - currentSection.length,
        endCharIndex: currentCharIndex,
        characterCount: currentSection.length
      });
    }

    return sections;
  }

  findSectionByCharacterIndex(sections, targetCharIndex) {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (targetCharIndex >= section.startCharIndex && targetCharIndex <= section.endCharIndex) {
        return i;
      }
    }
    return 0; // Default to first section if not found
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