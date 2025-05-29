// utils/textFormatter.js
export const formatBionicText = (text) => {
    const words = text.split(/(\s+)/);
  
    return words
      .map((word) => {
        // Skip whitespace
        if (/^\s+$/.test(word)) {
          return word;
        }
  
        // Skip very short words
        if (word.length <= 2) {
          return word;
        }
  
        // Calculate how many characters to bold (roughly half)
        const boldLength = Math.ceil(word.length * 0.4);
        const boldPart = word.slice(0, boldLength);
        const normalPart = word.slice(boldLength);
  
        return `<span class="bionic-word"><strong>${boldPart}</strong>${normalPart}</span>`;
      })
      .join("");
  };
  