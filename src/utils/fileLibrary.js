// src/utils/fileLibrary.js
export class FileLibrary {
    constructor() {
      this.storageKey = 'bioniScroll-library';
      this.textStorageKey = 'bioniScroll-texts';
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
          readingProgress: 0,
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
  
    updateReadingProgress(fileId, progress, sectionIndex = 0) {
      try {
        const library = this.getLibrary();
        const fileIndex = library.findIndex(file => file.id === fileId);
        
        if (fileIndex !== -1) {
          library[fileIndex].readingProgress = progress;
          library[fileIndex].lastRead = new Date().toISOString();
          library[fileIndex].currentSection = sectionIndex;
          localStorage.setItem(this.storageKey, JSON.stringify(library));
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error updating progress:', error);
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
  }