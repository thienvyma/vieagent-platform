/**
 * 📄 Document Parser Library - Phase 2 Day 6 Implementation
 * Content extraction cho multiple file types: PDF, DOCX, TXT, CSV, JSON
 * Support metadata extraction, text cleaning, content validation
 */

import { createReadStream, readFileSync } from 'fs';
import path from 'path';

// Document content interface
export interface DocumentContent {
  id: string;
  type: 'pdf' | 'docx' | 'txt' | 'csv' | 'json' | 'unknown';
  title: string;
  content: string;
  rawContent?: string;
  metadata: DocumentMetadata;
  statistics: DocumentStatistics;
  processingTime: number;
  warnings: string[];
  errors: string[];
}

// Document metadata interface
export interface DocumentMetadata {
  filename: string;
  fileSize: number;
  mimeType: string;
  encoding: string;
  language: string;
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  createdAt?: string;
  modifiedAt?: string;
  pageCount?: number;
  wordCount?: number;
  characterCount?: number;
  properties: Record<string, any>;
}

// Document statistics interface
export interface DocumentStatistics {
  totalWords: number;
  totalCharacters: number;
  totalSentences: number;
  totalParagraphs: number;
  totalLines: number;
  averageWordsPerSentence: number;
  averageWordsPerParagraph: number;
  readabilityScore: number;
  contentQuality: number;
}

// Parsing options interface
export interface ParsingOptions {
  preserveFormatting: boolean;
  extractMetadata: boolean;
  performCleaning: boolean;
  detectLanguage: boolean;
  validateContent: boolean;
  encoding?: string;
  textOnly: boolean;
  includeImages: boolean;
  includeHeaders: boolean;
  includeFooters: boolean;
  maxContentLength?: number;
}

// Parsing result interface
export interface ParsingResult {
  success: boolean;
  content?: DocumentContent;
  error?: string;
  processingTime: number;
  warnings: string[];
}

// Default parsing options
const DEFAULT_PARSING_OPTIONS: ParsingOptions = {
  preserveFormatting: true,
  extractMetadata: true,
  performCleaning: true,
  detectLanguage: true,
  validateContent: true,
  encoding: 'utf-8',
  textOnly: false,
  includeImages: false,
  includeHeaders: true,
  includeFooters: false,
  maxContentLength: 10000000, // 10MB text limit
};

// Document parser class
export class DocumentParser {
  private options: ParsingOptions;

  constructor(options: Partial<ParsingOptions> = {}) {
    this.options = { ...DEFAULT_PARSING_OPTIONS, ...options };
  }

  /**
   * Parse document based on file type
   */
  async parseDocument(filePath: string, originalName?: string): Promise<ParsingResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // Detect file type
      const fileType = this.detectFileType(filePath, originalName);

      if (fileType === 'unknown') {
        return {
          success: false,
          error: 'Unsupported file type',
          processingTime: Date.now() - startTime,
          warnings,
        };
      }

      // Parse based on type
      let content: DocumentContent;

      switch (fileType) {
        case 'pdf':
          content = await this.parsePDF(filePath, warnings);
          break;
        case 'docx':
          content = await this.parseDOCX(filePath, warnings);
          break;
        case 'txt':
          content = await this.parseTXT(filePath, warnings);
          break;
        case 'csv':
          content = await this.parseCSV(filePath, warnings);
          break;
        case 'json':
          content = await this.parseJSON(filePath, warnings);
          break;
        default:
          throw new Error(`Parser not implemented for ${fileType}`);
      }

      // Post-processing
      if (this.options.performCleaning) {
        content = await this.cleanContent(content);
      }

      if (this.options.detectLanguage) {
        content.metadata.language = this.detectLanguage(content.content);
      }

      if (this.options.validateContent) {
        const validation = this.validateContent(content);
        warnings.push(...validation.warnings);
      }

      content.processingTime = Date.now() - startTime;
      content.warnings = warnings;

      return {
        success: true,
        content,
        processingTime: Date.now() - startTime,
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Parsing failed',
        processingTime: Date.now() - startTime,
        warnings,
      };
    }
  }

  /**
   * Parse PDF files
   */
  private async parsePDF(filePath: string, warnings: string[]): Promise<DocumentContent> {
    try {
      // Note: In real implementation, use pdf-parse library
      // For now, return mock implementation
      warnings.push('PDF parsing requires pdf-parse library installation');

      const mockContent = this.createMockDocumentContent(filePath, 'pdf');
      mockContent.content =
        'PDF content extracted (mock implementation - install pdf-parse library for actual parsing)';
      mockContent.metadata.pageCount = 1;

      return mockContent;
    } catch (error) {
      throw new Error(
        `PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse DOCX files
   */
  private async parseDOCX(filePath: string, warnings: string[]): Promise<DocumentContent> {
    try {
      // Note: In real implementation, use mammoth library
      // For now, return mock implementation
      warnings.push('DOCX parsing requires mammoth library installation');

      const mockContent = this.createMockDocumentContent(filePath, 'docx');
      mockContent.content =
        'DOCX content extracted (mock implementation - install mammoth library for actual parsing)';

      return mockContent;
    } catch (error) {
      throw new Error(
        `DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse TXT files
   */
  private async parseTXT(filePath: string, warnings: string[]): Promise<DocumentContent> {
    try {
      const fileBuffer = readFileSync(filePath);
      const encoding = this.options.encoding || 'utf-8';

      let content = fileBuffer.toString(encoding as BufferEncoding);

      // Handle encoding issues
      if (content.includes('�')) {
        warnings.push('Encoding issues detected, trying alternative encodings');
        content = fileBuffer.toString('latin1');
      }

      const documentContent = this.createDocumentContent(filePath, 'txt', content);
      return documentContent;
    } catch (error) {
      throw new Error(
        `TXT parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse CSV files
   */
  private async parseCSV(filePath: string, warnings: string[]): Promise<DocumentContent> {
    try {
      const fileBuffer = readFileSync(filePath);
      const encoding = this.options.encoding || 'utf-8';
      const csvContent = fileBuffer.toString(encoding as BufferEncoding);

      // Simple CSV parsing (in real implementation, use csv-parser library)
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split(',').map(h => h.trim()) || [];
      const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));

      // Convert to readable content
      let content = `CSV Data with ${rows.length} rows and ${headers.length} columns:\n\n`;
      content += `Headers: ${headers.join(', ')}\n\n`;

      // Add sample rows (first 10)
      const sampleRows = rows.slice(0, 10);
      for (const row of sampleRows) {
        content += `${row.join(' | ')}\n`;
      }

      if (rows.length > 10) {
        content += `\n... and ${rows.length - 10} more rows`;
      }

      const documentContent = this.createDocumentContent(filePath, 'csv', content);
      documentContent.metadata.properties = {
        rowCount: rows.length,
        columnCount: headers.length,
        headers: headers,
      };

      return documentContent;
    } catch (error) {
      throw new Error(
        `CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse JSON files
   */
  private async parseJSON(filePath: string, warnings: string[]): Promise<DocumentContent> {
    try {
      const fileBuffer = readFileSync(filePath);
      const encoding = this.options.encoding || 'utf-8';
      const jsonContent = fileBuffer.toString(encoding as BufferEncoding);

      // Parse JSON
      const jsonData = JSON.parse(jsonContent);

      // Convert to readable content
      let content = `JSON Document Content:\n\n`;
      content += JSON.stringify(jsonData, null, 2);

      // Extract text content if it's structured data
      const textContent = this.extractTextFromJSON(jsonData);
      if (textContent) {
        content += `\n\nExtracted Text Content:\n${textContent}`;
      }

      const documentContent = this.createDocumentContent(filePath, 'json', content);
      documentContent.metadata.properties = {
        jsonStructure: this.analyzeJSONStructure(jsonData),
        isArray: Array.isArray(jsonData),
        objectKeys: typeof jsonData === 'object' ? Object.keys(jsonData) : [],
      };

      return documentContent;
    } catch (error) {
      throw new Error(
        `JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create document content object
   */
  private createDocumentContent(
    filePath: string,
    type: DocumentContent['type'],
    content: string
  ): DocumentContent {
    const stats = readFileSync(filePath);
    const filename = path.basename(filePath);

    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: filename.replace(/\.[^/.]+$/, ''), // Remove extension
      content,
      rawContent: content,
      metadata: {
        filename,
        fileSize: stats.length,
        mimeType: this.getMimeType(type),
        encoding: this.options.encoding || 'utf-8',
        language: 'unknown',
        wordCount: this.countWords(content),
        characterCount: content.length,
        properties: {},
      },
      statistics: this.calculateStatistics(content),
      processingTime: 0,
      warnings: [],
      errors: [],
    };
  }

  /**
   * Create mock document content for unsupported parsers
   */
  private createMockDocumentContent(
    filePath: string,
    type: DocumentContent['type']
  ): DocumentContent {
    const stats = readFileSync(filePath);
    const filename = path.basename(filePath);

    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: filename.replace(/\.[^/.]+$/, ''),
      content: '',
      rawContent: '',
      metadata: {
        filename,
        fileSize: stats.length,
        mimeType: this.getMimeType(type),
        encoding: this.options.encoding || 'utf-8',
        language: 'unknown',
        wordCount: 0,
        characterCount: 0,
        properties: {},
      },
      statistics: {
        totalWords: 0,
        totalCharacters: 0,
        totalSentences: 0,
        totalParagraphs: 0,
        totalLines: 0,
        averageWordsPerSentence: 0,
        averageWordsPerParagraph: 0,
        readabilityScore: 0,
        contentQuality: 0,
      },
      processingTime: 0,
      warnings: [],
      errors: [],
    };
  }

  /**
   * Detect file type from path and name
   */
  private detectFileType(filePath: string, originalName?: string): DocumentContent['type'] {
    const filename = originalName || path.basename(filePath);
    const extension = path.extname(filename).toLowerCase();

    switch (extension) {
      case '.pdf':
        return 'pdf';
      case '.docx':
      case '.doc':
        return 'docx';
      case '.txt':
      case '.text':
        return 'txt';
      case '.csv':
        return 'csv';
      case '.json':
        return 'json';
      default:
        return 'unknown';
    }
  }

  /**
   * Get MIME type for file type
   */
  private getMimeType(type: DocumentContent['type']): string {
    switch (type) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt':
        return 'text/plain';
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Clean content
   */
  private async cleanContent(content: DocumentContent): Promise<DocumentContent> {
    let cleanedText = content.content;

    // Remove unwanted characters
    cleanedText = cleanedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Normalize whitespace
    cleanedText = cleanedText.replace(/\s+/g, ' ');
    cleanedText = cleanedText.replace(/\n\s*\n/g, '\n\n');

    // Trim
    cleanedText = cleanedText.trim();

    content.content = cleanedText;
    return content;
  }

  /**
   * Detect language (simple implementation)
   */
  private detectLanguage(content: string): string {
    // Simple language detection based on common words
    const vietnameseWords = ['của', 'và', 'trong', 'với', 'là', 'có', 'được', 'không', 'để', 'từ'];
    const englishWords = ['the', 'and', 'in', 'with', 'is', 'have', 'been', 'not', 'to', 'from'];

    const words = content.toLowerCase().split(/\s+/).slice(0, 100); // Check first 100 words

    const viCount = vietnameseWords.filter(word => words.includes(word)).length;
    const enCount = englishWords.filter(word => words.includes(word)).length;

    if (viCount > enCount) return 'vi';
    if (enCount > viCount) return 'en';
    return 'unknown';
  }

  /**
   * Validate content
   */
  private validateContent(content: DocumentContent): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (content.content.length === 0) {
      warnings.push('Document appears to be empty');
    }

    if (content.content.length < 50) {
      warnings.push('Document content is very short');
    }

    if (content.statistics.totalWords < 10) {
      warnings.push('Document has very few words');
    }

    const maxLength = this.options.maxContentLength || 10000000;
    if (content.content.length > maxLength) {
      warnings.push(`Document exceeds maximum length (${maxLength} characters)`);
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  /**
   * Calculate document statistics
   */
  private calculateStatistics(content: string): DocumentStatistics {
    const words = content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const lines = content.split('\n');

    return {
      totalWords: words.length,
      totalCharacters: content.length,
      totalSentences: sentences.length,
      totalParagraphs: paragraphs.length,
      totalLines: lines.length,
      averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
      averageWordsPerParagraph: paragraphs.length > 0 ? words.length / paragraphs.length : 0,
      readabilityScore: this.calculateReadabilityScore(words, sentences),
      contentQuality: this.calculateContentQuality(content),
    };
  }

  /**
   * Calculate readability score (simple implementation)
   */
  private calculateReadabilityScore(words: string[], sentences: string[]): number {
    if (sentences.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord =
      words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;

    // Simplified Flesch Reading Ease
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate content quality score
   */
  private calculateContentQuality(content: string): number {
    let score = 0.5; // Base score

    // Length bonus
    if (content.length > 100) score += 0.1;
    if (content.length > 500) score += 0.1;
    if (content.length > 1000) score += 0.1;

    // Structure bonus
    if (content.includes('\n\n')) score += 0.1; // Has paragraphs
    if (/[.!?]/.test(content)) score += 0.1; // Has sentences

    return Math.min(1, score);
  }

  /**
   * Count syllables in word (simple implementation)
   */
  private countSyllables(word: string): number {
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (const char of word.toLowerCase()) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) count++;
      previousWasVowel = isVowel;
    }

    return Math.max(1, count);
  }

  /**
   * Extract text from JSON object
   */
  private extractTextFromJSON(data: any): string {
    if (typeof data === 'string') return data;
    if (typeof data === 'number' || typeof data === 'boolean') return String(data);
    if (Array.isArray(data)) return data.map(item => this.extractTextFromJSON(item)).join(' ');
    if (typeof data === 'object' && data !== null) {
      return Object.values(data)
        .map(value => this.extractTextFromJSON(value))
        .join(' ');
    }
    return '';
  }

  /**
   * Analyze JSON structure
   */
  private analyzeJSONStructure(data: any): string {
    if (Array.isArray(data)) return `array[${data.length}]`;
    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      return `object{${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}}`;
    }
    return typeof data;
  }

  /**
   * Update parsing options
   */
  updateOptions(newOptions: Partial<ParsingOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current options
   */
  getOptions(): ParsingOptions {
    return { ...this.options };
  }
}

// Note: All types and DocumentParser class are already exported above
