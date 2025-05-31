// src/utils/epubExtractor.js - Updated version with mobile fixes
import JSZip from 'jszip';
import { parseString as parseXML } from 'xml2js';

export class EPUBExtractor {
  async extractText(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      const contents = await zip.loadAsync(arrayBuffer);
      
      // Find and parse container.xml to get content.opf path
      const containerFile = contents.file('META-INF/container.xml');
      if (!containerFile) {
        throw new Error('Invalid EPUB: Missing container.xml');
      }
      
      // Use text encoding option for better mobile compatibility
      const containerXml = await containerFile.async('string');
      const contentOpfPath = await this.parseContainer(containerXml);
      
      // Parse content.opf to get spine order
      const contentOpfFile = contents.file(contentOpfPath);
      if (!contentOpfFile) {
        throw new Error('Invalid EPUB: Missing content.opf');
      }
      
      const contentOpfXml = await contentOpfFile.async('string');
      const { spine, manifest } = await this.parseContentOpf(contentOpfXml);
      
      // Extract text from spine files in order
      const basePath = contentOpfPath.substring(0, contentOpfPath.lastIndexOf('/'));
      const extractedTexts = [];
      
      for (const itemRef of spine) {
        const manifestItem = manifest[itemRef];
        if (manifestItem && manifestItem.mediaType === 'application/xhtml+xml') {
          const filePath = basePath ? `${basePath}/${manifestItem.href}` : manifestItem.href;
          const xhtmlFile = contents.file(filePath);
          
          if (xhtmlFile) {
            const xhtmlContent = await xhtmlFile.async('string');
            const text = this.extractTextFromXHTML(xhtmlContent);
            if (text.trim()) {
              extractedTexts.push(text);
            }
          }
        }
      }
      
      const fullText = extractedTexts.join('\n\n');
      
      if (!fullText || fullText.length < 100) {
        throw new Error('No meaningful text content found in EPUB');
      }
      
      return {
        text: this.cleanupText(fullText),
        metadata: {
          chapters: extractedTexts.length,
          totalLength: fullText.length,
          wordCount: fullText.split(/\s+/).filter(word => word.length > 0).length
        }
      };
      
    } catch (error) {
      console.error('EPUB extraction error:', error);
      throw new Error(`Failed to extract EPUB: ${error.message}`);
    }
  }
  
  async parseContainer(containerXml) {
    return new Promise((resolve, reject) => {
      // Add proper XML parsing options for mobile compatibility
      const parserOptions = {
        explicitCharkey: true,
        normalize: true,
        normalizeTags: false,
        explicitRoot: true,
        trim: true
      };
      
      parseXML(containerXml, parserOptions, (err, result) => {
        if (err) {
          console.error('XML parsing error:', err);
          reject(new Error('Failed to parse container.xml'));
          return;
        }
        
        try {
          // Defensive programming with fallbacks for different XML structures
          const container = result.container || {};
          const rootfiles = container.rootfiles || [{ rootfile: [] }];
          const rootfileArray = rootfiles[0].rootfile || [];
          
          // Handle both object and array structures
          const rootfile = Array.isArray(rootfileArray) ? rootfileArray[0] : rootfileArray;
          
          // Access attribute correctly
          const contentOpf = rootfile.$ ? rootfile.$['full-path'] : null;
          
          if (!contentOpf) {
            throw new Error('Could not find content.opf path in container.xml');
          }
          
          resolve(contentOpf);
        } catch (error) {
          console.error('Container parsing error:', error);
          reject(new Error(`Invalid container.xml structure: ${error.message}`));
        }
      });
    });
  }
  
  async parseContentOpf(contentOpfXml) {
    return new Promise((resolve, reject) => {
      const parserOptions = {
        explicitCharkey: true,
        normalize: true,
        normalizeTags: false,
        explicitRoot: true,
        trim: true
      };
      
      parseXML(contentOpfXml, parserOptions, (err, result) => {
        if (err) {
          console.error('Content OPF parsing error:', err);
          reject(new Error('Failed to parse content.opf'));
          return;
        }
        
        try {
          // Handle different namespaces and structures
          const pkg = result.package || result['opf:package'] || {};
          const manifestObj = pkg.manifest && pkg.manifest[0] || {};
          const spineObj = pkg.spine && pkg.spine[0] || {};
          
          const manifestItems = manifestObj.item || [];
          const spineItems = spineObj.itemref || [];
          
          // Build manifest map with error handling
          const manifest = {};
          manifestItems.forEach(item => {
            if (item && item.$) {
              manifest[item.$.id] = {
                href: item.$.href || '',
                mediaType: item.$['media-type'] || ''
              };
            }
          });
          
          // Build spine array with error handling
          const spine = spineItems
            .filter(item => item && item.$)
            .map(item => item.$.idref)
            .filter(Boolean);
          
          resolve({ spine, manifest });
        } catch (error) {
          console.error('Content OPF structure error:', error);
          reject(new Error(`Invalid content.opf structure: ${error.message}`));
        }
      });
    });
  }
  
  extractTextFromXHTML(xhtml) {
    try {
      // More robust HTML/XML cleaning
      let text = xhtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&[^;]+;/g, ' ');
      
      return text;
    } catch (error) {
      console.warn('XHTML extraction error:', error);
      // Fallback: strip all tags crudely if sophisticated parsing fails
      return xhtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }
  
  cleanupText(text) {
    try {
      return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n\s*\n\s*\n+/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n +/g, '\n')
        .replace(/ +\n/g, '\n')
        .trim();
    } catch (error) {
      console.warn('Text cleanup error:', error);
      return text.trim();
    }
  }
}