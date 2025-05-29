// src/utils/textFormatter.js
export const formatBionicText = (text) => {
    // Split by words while preserving whitespace and line breaks
    const parts = text.split(/(\s+)/);
  
    return parts
      .map((part) => {
        // Preserve whitespace and line breaks
        if (/^\s+$/.test(part)) {
          return part;
        }
  
        // Skip very short words (1 letter) or non-alphabetic content
        if (part.length <= 1 || !/[a-zA-Z]/.test(part)) {
          return part;
        }
  
        // Calculate bold length based on new algorithm
        let boldLength;
        if (part.length <= 3) {
          boldLength = 1; // Only first letter
        } else if (part.length <= 6) {
          boldLength = 2; // First two letters
        } else {
          boldLength = Math.ceil(part.length * 0.4); // 40% of letters
        }
  
        const boldPart = part.slice(0, boldLength);
        const normalPart = part.slice(boldLength);
  
        return `<span class="bionic-word"><strong>${boldPart}</strong>${normalPart}</span>`;
      })
      .join("");
  };
  
  // Helper function to preserve text formatting
  export const preserveTextFormatting = (text) => {
    if (!text || typeof text !== 'string') {
      return '';
    }
  
    return text
      // Preserve paragraph breaks (double line breaks)
      .replace(/\n\s*\n/g, '\n\n')
      // Ensure proper spacing after periods
      .replace(/\.\s*([A-Z])/g, '. $1')
      // Clean up excessive line breaks but preserve intentional ones
      .replace(/\n{3,}/g, '\n\n')
      // Preserve indentation patterns
      .replace(/^(\s+)/gm, '$1');
  };
  