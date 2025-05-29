// src/utils/fileLibrary.js
export class FileLibrary {
    constructor() {
      this.storageKey = 'omniReader-library';
      this.textStorageKey = 'omniReader-texts';
    }
  
    getLibrary() {
      try {
        const library = localStorage.getItem(this.storageKey);
        return library ? JSON.parse(library) : [];
      } catch (error) {
        console.error('Error reading library:', error);
        return [];
      }
    }
  
    saveFile(fileInfo, extractedText) {
      try {
        const library = this.getLibrary();
        const fileId = this.generateFileId();
        
        const fileData = {
          id: fileId,
          name: fileInfo.name,
          size: fileInfo.size,
          type: fileInfo.type,
          dateAdded: new Date().toISOString(),
          lastRead: null,
          readingPosition: {
            characterIndex: 0,
            percentage: 0,
            textSnippet: extractedText.substring(0, 100), // First 100 chars for verification
            sectionHint: 0 // Hint for which section, but not relied upon
          },
          metadata: fileInfo.metadata || {}
        };
  
        library.push(fileData);
        localStorage.setItem(this.storageKey, JSON.stringify(library));
        
        // Store extracted text separately
        const texts = this.getTexts();
        texts[fileId] = extractedText;
        localStorage.setItem(this.textStorageKey, JSON.stringify(texts));
        
        return fileId;
      } catch (error) {
        console.error('Error saving file:', error);
        throw new Error('Failed to save file to library');
      }
    }
  
    getFile(fileId) {
      const library = this.getLibrary();
      return library.find(file => file.id === fileId);
    }
  
    getText(fileId) {
      try {
        const texts = this.getTexts();
        return texts[fileId] || null;
      } catch (error) {
        console.error('Error reading text:', error);
        return null;
      }
    }
  
    getTexts() {
      try {
        const texts = localStorage.getItem(this.textStorageKey);
        return texts ? JSON.parse(texts) : {};
      } catch (error) {
        console.error('Error reading texts:', error);
        return {};
      }
    }
  
    updateReadingPosition(fileId, characterIndex, percentage, textSnippet, sectionHint = 0) {
      try {
        const library = this.getLibrary();
        const fileIndex = library.findIndex(file => file.id === fileId);
        
        if (fileIndex !== -1) {
          library[fileIndex].readingPosition = {
            characterIndex,
            percentage,
            textSnippet: textSnippet.substring(0, 100),
            sectionHint
          };
          library[fileIndex].lastRead = new Date().toISOString();
          localStorage.setItem(this.storageKey, JSON.stringify(library));
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error updating reading position:', error);
        return false;
      }
    }
  
    deleteFile(fileId) {
      try {
        let library = this.getLibrary();
        library = library.filter(file => file.id !== fileId);
        localStorage.setItem(this.storageKey, JSON.stringify(library));
        
        const texts = this.getTexts();
        delete texts[fileId];
        localStorage.setItem(this.textStorageKey, JSON.stringify(texts));
        
        return true;
      } catch (error) {
        console.error('Error deleting file:', error);
        return false;
      }
    }
  
    generateFileId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
  
    getStorageUsage() {
      try {
        const library = JSON.stringify(this.getLibrary());
        const texts = JSON.stringify(this.getTexts());
        return {
          library: new Blob([library]).size,
          texts: new Blob([texts]).size,
          total: new Blob([library]).size + new Blob([texts]).size
        };
      } catch (error) {
        return { library: 0, texts: 0, total: 0 };
      }
    }
  
    findPositionInText(text, targetCharacterIndex, fallbackSnippet = '') {
      // Primary method: use character index
      if (targetCharacterIndex >= 0 && targetCharacterIndex < text.length) {
        return targetCharacterIndex;
      }
  
      // Fallback: try to find the text snippet
      if (fallbackSnippet && fallbackSnippet.length > 10) {
        const index = text.indexOf(fallbackSnippet);
        if (index !== -1) {
          return index;
        }
      }
  
      // Default: return 0
      return 0;
    }
  }