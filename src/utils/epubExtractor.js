// src/utils/epubExtractor.js
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
      
      const containerXml = await containerFile.async('text');
      const contentOpfPath = await this.parseContainer(containerXml);
      
      // Parse content.opf to get spine order
      const contentOpfFile = contents.file(contentOpfPath);
      if (!contentOpfFile) {
        throw new Error('Invalid EPUB: Missing content.opf');
      }
      
      const contentOpfXml = await contentOpfFile.async('text');
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
            const xhtmlContent = await xhtmlFile.async('text');
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
      parseXML(containerXml, (err, result) => {
        if (err) {
          reject(new Error('Failed to parse container.xml'));
          return;
        }
        
        try {
          const rootfiles = result.container.rootfiles[0].rootfile;
          const contentOpf = rootfiles[0].$['full-path'];
          resolve(contentOpf);
        } catch (error) {
          reject(new Error('Invalid container.xml structure'));
        }
      });
    });
  }
  
  async parseContentOpf(contentOpfXml) {
    return new Promise((resolve, reject) => {
      parseXML(contentOpfXml, (err, result) => {
        if (err) {
          reject(new Error('Failed to parse content.opf'));
          return;
        }
        
        try {
          const pkg = result.package || result['opf:package'];
          const manifestItems = pkg.manifest[0].item;
          const spineItems = pkg.spine[0].itemref;
          
          // Build manifest map
          const manifest = {};
          manifestItems.forEach(item => {
            manifest[item.$.id] = {
              href: item.$.href,
              mediaType: item.$['media-type']
            };
          });
          
          // Build spine array
          const spine = spineItems.map(item => item.$.idref);
          
          resolve({ spine, manifest });
        } catch (error) {
          reject(new Error('Invalid content.opf structure'));
        }
      });
    });
  }
  
  extractTextFromXHTML(xhtml) {
    // Remove XML/HTML tags and extract text content
    let text = xhtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&[^;]+;/g, ' ');
    
    return text;
  }
  
  cleanupText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n +/g, '\n')
      .replace(/ +\n/g, '\n')
      .trim();
  }
}