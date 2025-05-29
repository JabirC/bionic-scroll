// src/utils/textProcessor.js
export class TextProcessor {
    constructor() {
      this.chunkSize = 10000; // Process 10k characters at a time
      this.batchSize = 50; // Process 50 chunks per batch
    }
  
    // Split text into manageable chunks while preserving paragraphs
    splitTextIntoChunks(text) {
      const paragraphs = text.split(/\n\s*\n/);
      const chunks = [];
      let currentChunk = '';
      let currentSize = 0;
  
      for (const paragraph of paragraphs) {
        const paragraphWithBreaks = paragraph + '\n\n';
        
        if (currentSize + paragraphWithBreaks.length > this.chunkSize && currentChunk) {
          chunks.push({
            content: currentChunk.trim(),
            isComplete: true
          });
          currentChunk = paragraphWithBreaks;
          currentSize = paragraphWithBreaks.length;
        } else {
          currentChunk += paragraphWithBreaks;
          currentSize += paragraphWithBreaks.length;
        }
      }
  
      if (currentChunk) {
        chunks.push({
          content: currentChunk.trim(),
          isComplete: true
        });
      }
  
      return chunks;
    }
  
    // Process chunks in batches
    async processTextInBatches(text, onBatchComplete, isBionic = false) {
      const chunks = this.splitTextIntoChunks(text);
      const totalBatches = Math.ceil(chunks.length / this.batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * this.batchSize;
        const batchEnd = Math.min(batchStart + this.batchSize, chunks.length);
        const batchChunks = chunks.slice(batchStart, batchEnd);
        
        // Process batch with small delay to prevent blocking
        await new Promise(resolve => {
          setTimeout(() => {
            const processedChunks = batchChunks.map(chunk => ({
              ...chunk,
              processed: isBionic ? this.formatBionicTextFast(chunk.content) : chunk.content,
              isBionic
            }));
            
            onBatchComplete({
              batchIndex,
              chunks: processedChunks,
              isComplete: batchIndex === totalBatches - 1,
              progress: ((batchIndex + 1) / totalBatches) * 100
            });
            
            resolve();
          }, 0);
        });
      }
    }
  
    // Optimized bionic text formatting
    formatBionicTextFast(text) {
      // Use regex for faster processing while preserving formatting
      return text.replace(/\b([a-zA-Z]+)\b/g, (word) => {
        if (word.length <= 1) return word;
  
        let boldLength;
        if (word.length <= 3) {
          boldLength = 1;
        } else if (word.length <= 6) {
          boldLength = 2;
        } else {
          boldLength = Math.ceil(word.length * 0.4);
        }
  
        const boldPart = word.slice(0, boldLength);
        const normalPart = word.slice(boldLength);
        return `<span class="bionic-word"><strong>${boldPart}</strong>${normalPart}</span>`;
      });
    }
  }