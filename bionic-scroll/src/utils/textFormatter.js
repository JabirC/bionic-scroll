// src/utils/textFormatter.js
// Keep this simple since heavy processing is now in TextProcessor
export const preserveTextFormatting = (text) => {
    if (!text || typeof text !== 'string') {
      return '';
    }
  
    return text
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/\.\s*([A-Z])/g, '. $1')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^(\s+)/gm, '$1')
      .trim();
  };
  
  // Simple version for backwards compatibility
  export const formatBionicText = (text) => {
    // This is now handled by TextProcessor for better performance
    return text;
  };