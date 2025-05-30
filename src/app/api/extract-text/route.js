// src/app/api/extract-text/route.js
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const TIMEOUT_DURATION = 60000; // 60 seconds

// User-friendly error messages
const ERROR_MESSAGES = {
  NO_FILE: 'Please select a file to upload.',
  INVALID_TYPE: 'Please upload a PDF or EPUB file only.',
  FILE_TOO_LARGE: 'File is too large. Please upload a file smaller than 200MB.',
  FILE_TOO_SMALL: 'The selected file appears to be invalid or corrupted.',
  TIMEOUT: 'File processing is taking too long. This may be due to file complexity or size. Please try a smaller file.',
  NO_TEXT: 'No readable text found in this file. The file may be image-only or corrupted.',
  PROCESSING_ERROR: 'Unable to process this file. Please try a different file or contact support.',
  NETWORK_ERROR: 'Network connection error. Please check your internet connection and try again.',
  SERVER_ERROR: 'Server error occurred. Please try again in a few moments.'
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NO_FILE },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['application/pdf', 'application/epub+zip'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_TYPE },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.FILE_TOO_LARGE },
        { status: 400 }
      );
    }

    if (file.size < 100) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.FILE_TOO_SMALL },
        { status: 400 }
      );
    }

    // Extract text based on file type
    let result;
    
    try {
      if (file.type === 'application/epub+zip') {
        // Dynamic import for EPUB extractor
        const { EPUBExtractor } = await import('../../../utils/epubExtractor');
        const epubExtractor = new EPUBExtractor();
        const extractionPromise = epubExtractor.extractText(file);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('EPUB_TIMEOUT')), TIMEOUT_DURATION);
        });
        
        result = await Promise.race([extractionPromise, timeoutPromise]);
      } else {
        // PDF extraction
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const extractionPromise = extractTextFromPDF(buffer);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('PDF_TIMEOUT')), TIMEOUT_DURATION);
        });

        result = await Promise.race([extractionPromise, timeoutPromise]);
      }

      if (!result || !result.text || result.text.trim().length < 50) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.NO_TEXT },
          { status: 422 }
        );
      }

      return NextResponse.json({
        text: result.text,
        metadata: result.metadata,
        fileType: file.type === 'application/epub+zip' ? 'epub' : 'pdf',
        success: true
      });

    } catch (extractionError) {
      console.error('Text extraction error:', extractionError);
      
      if (extractionError.message.includes('TIMEOUT')) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.TIMEOUT },
          { status: 408 }
        );
      }
      
      return NextResponse.json(
        { error: ERROR_MESSAGES.PROCESSING_ERROR },
        { status: 422 }
      );
    }

  } catch (error) {
    console.error('Request processing error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NETWORK_ERROR },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

// ... rest of the existing PDF extraction functions remain the same

async function extractTextFromPDF(buffer) {
  let extractedText = '';
  let method = 'unknown';
  
  try {
    // Method 1: Try pdf-parse-new
    try {
      const result = await extractWithPdfParse(buffer);
      if (result && result.length > 50) {
        extractedText = result;
        method = 'pdf-parse-new';
      }
    } catch (pdfParseError) {
      console.warn('pdf-parse-new extraction failed:', pdfParseError.message);
    }

    // Method 2: Manual PDF parsing if pdf-parse fails
    if (!extractedText || extractedText.length < 50) {
      try {
        const result = await extractTextManual(buffer);
        if (result && result.length > 50) {
          extractedText = result;
          method = 'manual-extraction';
        }
      } catch (manualError) {
        console.warn('Manual extraction failed:', manualError.message);
      }
    }

    // Method 3: Basic text extraction as fallback
    if (!extractedText || extractedText.length < 50) {
      try {
        const result = await extractTextBasic(buffer);
        if (result && result.length > 50) {
          extractedText = result;
          method = 'basic-extraction';
        }
      } catch (basicError) {
        console.warn('Basic extraction failed:', basicError.message);
      }
    }

    if (!extractedText || extractedText.length < 50) {
      throw new Error('No meaningful text content found in PDF');
    }

    // Clean up the extracted text
    const cleanText = cleanupExtractedText(extractedText);
    
    return {
      text: cleanText,
      metadata: {
        extractionMethod: method,
        rawLength: extractedText.length,
        cleanLength: cleanText.length,
        wordCount: cleanText.split(/\s+/).filter(word => word.length > 0).length
      }
    };

  } catch (error) {
    console.error('Error in extractTextFromPDF:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

async function extractWithPdfParse(buffer) {
  try {
    // Dynamic import to handle the module properly
    const pdfParse = (await import('pdf-parse-new')).default;
    
    const data = await pdfParse(buffer, {
      // Options for pdf-parse
      max: 0, // Parse all pages
      version: 'v2.0.550',
    });

    if (!data || !data.text) {
      throw new Error('No text found in PDF');
    }

    return data.text;
  } catch (error) {
    throw new Error(`pdf-parse extraction failed: ${error.message}`);
  }
}

async function extractTextManual(buffer) {
  try {
    const pdfData = buffer.toString('latin1');
    
    // Validate PDF header
    if (!pdfData.startsWith('%PDF-')) {
      throw new Error('Invalid PDF format');
    }

    let extractedText = '';
    
    // Extract text using different methods
    
    // Method 1: Extract from stream objects
    const streamPattern = /stream\s*\n([\s\S]*?)\nendstream/g;
    let streamMatch;
    
    while ((streamMatch = streamPattern.exec(pdfData)) !== null) {
      const streamContent = streamMatch[1];
      
      // Check if stream is not compressed (contains readable text operators)
      if (streamContent.includes('BT') && streamContent.includes('ET')) {
        const textFromStream = extractTextFromStream(streamContent);
        if (textFromStream) {
          extractedText += textFromStream + ' ';
        }
      }
    }

    // Method 2: Direct text extraction
    const textPattern = /\(([^\\)]+(?:\\.[^\\)]*)*)\)/g;
    let textMatch;
    
    while ((textMatch = textPattern.exec(pdfData)) !== null) {
      const rawText = textMatch[1];
      const decodedText = decodePDFString(rawText);
      
      if (isValidText(decodedText)) {
        extractedText += decodedText + ' ';
      }
    }

    // Method 3: Extract hex encoded text
    const hexPattern = /<([0-9A-Fa-f\s]+)>/g;
    let hexMatch;
    
    while ((hexMatch = hexPattern.exec(pdfData)) !== null) {
      const hexString = hexMatch[1].replace(/\s/g, '');
      if (hexString.length % 2 === 0) {
        const textFromHex = hexToAscii(hexString);
        if (isValidText(textFromHex)) {
          extractedText += textFromHex + ' ';
        }
      }
    }

    return extractedText.trim();
  } catch (error) {
    throw new Error(`Manual extraction failed: ${error.message}`);
  }
}

function extractTextFromStream(streamContent) {
  let text = '';
  
  try {
    // Look for text between BT (Begin Text) and ET (End Text)
    const textBlocks = streamContent.match(/BT([\s\S]*?)ET/g);
    
    if (!textBlocks) return '';
    
    for (const block of textBlocks) {
      // Extract text using PDF text operators
      
      // Tj operator: (text) Tj
      const tjMatches = block.match(/\(([^)]+)\)\s*Tj/g);
      if (tjMatches) {
        tjMatches.forEach(match => {
          const textMatch = match.match(/\(([^)]+)\)/);
          if (textMatch) {
            text += decodePDFString(textMatch[1]) + ' ';
          }
        });
      }
      
      // TJ operator: [(text1) (text2)] TJ
      const tjArrayMatches = block.match(/\[(.*?)\]\s*TJ/g);
      if (tjArrayMatches) {
        tjArrayMatches.forEach(match => {
          const arrayContent = match.match(/\[(.*?)\]/)[1];
          const stringMatches = arrayContent.match(/\(([^)]+)\)/g);
          if (stringMatches) {
            stringMatches.forEach(stringMatch => {
              const textMatch = stringMatch.match(/\(([^)]+)\)/);
              if (textMatch) {
                text += decodePDFString(textMatch[1]) + ' ';
              }
            });
          }
        });
      }
      
      // ' operator: (text) '
      const quoteMatches = block.match(/\(([^)]+)\)\s*'/g);
      if (quoteMatches) {
        quoteMatches.forEach(match => {
          const textMatch = match.match(/\(([^)]+)\)/);
          if (textMatch) {
            text += decodePDFString(textMatch[1]) + ' ';
          }
        });
      }
    }
  } catch (error) {
    console.warn('Error extracting from stream:', error);
  }
  
  return text.trim();
}

async function extractTextBasic(buffer) {
  try {
    // Convert to different encodings and try to find readable text
    const encodings = ['latin1', 'utf8', 'ascii'];
    let bestText = '';
    let bestScore = 0;
    
    for (const encoding of encodings) {
      try {
        const text = buffer.toString(encoding);
        const extractedText = extractReadableStrings(text);
        const score = calculateTextScore(extractedText);
        
        if (score > bestScore && extractedText.length > 50) {
          bestText = extractedText;
          bestScore = score;
        }
      } catch (encodingError) {
        continue;
      }
    }
    
    return bestText;
  } catch (error) {
    throw new Error(`Basic extraction failed: ${error.message}`);
  }
}

function extractReadableStrings(data) {
  // Extract strings that look like readable text
  const readablePattern = /[a-zA-Z\s]{10,}/g;
  const matches = data.match(readablePattern);
  
  if (!matches) return '';
  
  return matches
    .filter(match => {
      // Filter out strings that are too repetitive or look like binary data
      const uniqueChars = new Set(match.toLowerCase()).size;
      return uniqueChars > 5 && match.trim().length > 10;
    })
    .join(' ');
}

function calculateTextScore(text) {
  if (!text) return 0;
  
  const words = text.split(/\s+/);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const letterRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
  
  // Score based on reasonable word length and letter ratio
  return avgWordLength * letterRatio * Math.log(words.length + 1);
}

function decodePDFString(str) {
  if (!str) return '';
  
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\([0-7]{1,3})/g, (match, octal) => {
      const code = parseInt(octal, 8);
      return (code >= 32 && code <= 126) ? String.fromCharCode(code) : ' ';
    })
    .replace(/\\./g, '') // Remove other escape sequences
    .trim();
}

function hexToAscii(hex) {
  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    const charCode = parseInt(hex.substr(i, 2), 16);
    if (charCode >= 32 && charCode <= 126) {
      result += String.fromCharCode(charCode);
    } else if (charCode === 32) {
      result += ' ';
    }
  }
  return result;
}

function isValidText(text) {
  if (!text || text.length < 2) return false;
  
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
  const digitCount = (text.match(/[0-9]/g) || []).length;
  const spaceCount = (text.match(/\s/g) || []).length;
  const totalChars = text.length;
  
  // Text should have a reasonable mix of letters and some spaces
  const letterRatio = letterCount / totalChars;
  const nonControlRatio = (letterCount + digitCount + spaceCount) / totalChars;
  
  return letterRatio >= 0.5 && nonControlRatio >= 0.8 && letterCount >= 3;
}

function cleanupExtractedText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
  
    return text
      // First, normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Preserve intentional paragraph breaks
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Multiple line breaks become double
      .replace(/([.!?])\s*\n+\s*([A-Z])/g, '$1\n\n$2') // Period + line break + capital = new paragraph
      // Fix sentence spacing
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
      // Fix word boundaries
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Remove excessive spaces within lines
      .replace(/[^\S\n]+/g, ' ') // Replace all whitespace except newlines with single space
      // Clean up quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Remove control characters but preserve newlines
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Final cleanup
      .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs become single space
      .replace(/\n +/g, '\n') // Remove spaces at start of lines
      .replace(/ +\n/g, '\n') // Remove spaces at end of lines
      .trim();
  }

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}