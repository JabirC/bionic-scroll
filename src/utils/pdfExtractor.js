// src/utils/pdfExtractor.js

/**
 * Extracts text from PDF using server-side processing
 * @param {File} file - The PDF file to extract text from
 * @returns {Promise<string>} - Promise that resolves to the extracted text
 */
export const extractTextFromPDF = async (file) => {
    try {
      // Validate file before sending
      validatePDFFile(file);
  
      // Create FormData to send file
      const formData = new FormData();
      formData.append('file', file);
  
      // Send to our API route with retry logic
      const response = await fetchWithRetry('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process PDF');
      }
  
      if (!result.success || !result.text) {
        throw new Error('No text content extracted from PDF');
      }
  
      console.log('Extraction successful:', result.metadata);
      return result.text;
  
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      
      // Provide user-friendly error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  };
  
  /**
   * Fetch with retry logic
   */
  async function fetchWithRetry(url, options, maxRetries = 2) {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        return response;
      } catch (error) {
        if (i === maxRetries) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  /**
   * Validates if a file is a valid PDF
   * @param {File} file - The file to validate
   * @throws {Error} - Throws error if validation fails
   */
  export const validatePDFFile = (file) => {
    if (!file) {
      throw new Error('No file provided');
    }
  
    // Check file type
    if (file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Only PDF files are supported.');
    }
  
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Invalid file extension. File must have .pdf extension.');
    }
  
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size too large. Please select a PDF smaller than 50MB.');
    }
  
    // Check minimum file size
    if (file.size < 100) {
      throw new Error('File appears to be too small to be a valid PDF.');
    }
  
    return true;
  };
  
  /**
   * Gets estimated reading time for text
   * @param {string} text - The text to analyze
   * @param {number} wpm - Words per minute (default: 200)
   * @returns {Object} - Object with word count and reading time
   */
  export const getReadingStats = (text, wmp = 200) => {
    if (!text || typeof text !== 'string') {
      return { wordCount: 0, readingTimeMinutes: 0 };
    }
  
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const readingTimeMinutes = Math.ceil(wordCount / wmp);
  
    return {
      wordCount,
      readingTimeMinutes,
      charactersCount: text.length
    };
  };