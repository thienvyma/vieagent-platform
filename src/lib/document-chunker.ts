/**
 * 🧩 Document Chunker Library - Phase 2 Day 7 Step 7.1
 * Semantic chunking system với intelligent boundary detection
 * Support multiple chunking strategies và overlapping contexts
 */

// Chunk result interface
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  relationships: ChunkRelationships;
  statistics: ChunkStatistics;
  createdAt: string;
}

// Chunk metadata interface
export interface ChunkMetadata {
  documentId: string;
  documentTitle: string;
  documentType: string;
  chunkIndex: number;
  totalChunks: number;
  startPosition: number;
  endPosition: number;
  chunkType: 'paragraph' | 'section' | 'page' | 'semantic' | 'fixed_size';
  language: string;
  processingMethod: string;
  qualityScore: number;
}

// Chunk relationships interface
export interface ChunkRelationships {
  previousChunkId?: string;
  nextChunkId?: string;
  parentChunkId?: string;
  childChunkIds: string[];
  overlapsWith: string[];
  semanticGroup?: string;
}

// Chunk statistics interface
export interface ChunkStatistics {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  readabilityScore: number;
  contentDensity: number;
}

// Chunking options interface
export interface ChunkingOptions {
  // Size parameters
  targetWordCount: number;
  minWordCount: number;
  maxWordCount: number;
  targetCharacterCount: number;

  // Overlap settings
  enableOverlap: boolean;
  overlapPercentage: number;
  overlapMinWords: number;
  overlapMaxWords: number;

  // Boundary detection
  respectSentenceBoundaries: boolean;
  respectParagraphBoundaries: boolean;
  respectSectionBoundaries: boolean;
  enableSemanticBoundaries: boolean;

  // Structure preservation
  preserveHeadings: boolean;
  preserveLists: boolean;
  preserveTables: boolean;
  preserveCodeBlocks: boolean;

  // Quality control
  minQualityScore: number;
  skipEmptyChunks: boolean;
  skipShortChunks: boolean;
  mergeTinyChunks: boolean;

  // Strategy selection
  chunkingStrategy: 'semantic' | 'fixed_size' | 'paragraph' | 'section' | 'adaptive';
  languageSpecific: boolean;

  // Advanced options
  enableContentAnalysis: boolean;
  maintainContext: boolean;
  generateTitles: boolean;
  extractKeywords: boolean;
}

// Chunking result interface
export interface ChunkingResult {
  chunks: DocumentChunk[];
  statistics: ChunkingStatistics;
  metadata: ChunkingMetadata;
  processingTime: number;
  warnings: string[];
  recommendations: string[];
}

// Chunking statistics interface
export interface ChunkingStatistics {
  totalChunks: number;
  averageWordCount: number;
  averageCharacterCount: number;
  totalOverlaps: number;
  qualityDistribution: Record<string, number>;
  chunkSizeDistribution: number[];
  processingEfficiency: number;
}

// Chunking metadata interface
export interface ChunkingMetadata {
  documentId: string;
  originalLength: number;
  chunkingStrategy: string;
  processingMethod: string;
  boundariesDetected: number;
  structurePreserved: boolean;
  languageDetected: string;
  chunkedAt: string;
}

// Default chunking options
const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  // Size parameters
  targetWordCount: 750,
  minWordCount: 200,
  maxWordCount: 1200,
  targetCharacterCount: 4000,

  // Overlap settings
  enableOverlap: true,
  overlapPercentage: 10,
  overlapMinWords: 50,
  overlapMaxWords: 150,

  // Boundary detection
  respectSentenceBoundaries: true,
  respectParagraphBoundaries: true,
  respectSectionBoundaries: true,
  enableSemanticBoundaries: true,

  // Structure preservation
  preserveHeadings: true,
  preserveLists: true,
  preserveTables: true,
  preserveCodeBlocks: true,

  // Quality control
  minQualityScore: 0.6,
  skipEmptyChunks: true,
  skipShortChunks: false,
  mergeTinyChunks: true,

  // Strategy selection
  chunkingStrategy: 'semantic',
  languageSpecific: true,

  // Advanced options
  enableContentAnalysis: true,
  maintainContext: true,
  generateTitles: true,
  extractKeywords: true,
};

// Document chunker class
export class DocumentChunker {
  private options: ChunkingOptions;
  private chunkCounter: number;
  private documentMetadata: any;

  constructor(options: Partial<ChunkingOptions> = {}) {
    this.options = { ...DEFAULT_CHUNKING_OPTIONS, ...options };
    this.chunkCounter = 0;
    this.documentMetadata = null;
  }

  /**
   * Chunk document into semantic segments
   */
  async chunkDocument(
    content: string,
    documentId: string,
    metadata?: any
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    this.chunkCounter = 0;
    this.documentMetadata = metadata;

    try {
      // Analyze document structure
      const documentAnalysis = await this.analyzeDocumentStructure(content);

      // Select optimal chunking strategy
      const strategy = this.selectChunkingStrategy(content, documentAnalysis);

      // Apply chunking strategy
      let chunks: DocumentChunk[];
      switch (strategy) {
        case 'semantic':
          chunks = await this.semanticChunking(content, documentId, documentAnalysis);
          break;
        case 'paragraph':
          chunks = await this.paragraphBasedChunking(content, documentId, documentAnalysis);
          break;
        case 'section':
          chunks = await this.sectionBasedChunking(content, documentId, documentAnalysis);
          break;
        case 'fixed_size':
          chunks = await this.fixedSizeChunking(content, documentId);
          break;
        case 'adaptive':
          chunks = await this.adaptiveChunking(content, documentId, documentAnalysis);
          break;
        default:
          chunks = await this.semanticChunking(content, documentId, documentAnalysis);
      }

      // Apply overlap if enabled
      if (this.options.enableOverlap) {
        chunks = await this.applyOverlapping(chunks, content);
      }

      // Post-process chunks
      chunks = await this.postProcessChunks(chunks);

      // Generate chunk relationships
      chunks = this.generateChunkRelationships(chunks);

      // Calculate statistics
      const statistics = this.calculateChunkingStatistics(chunks);
      const processingMetadata = this.generateChunkingMetadata(content, documentId, strategy);

      // Generate recommendations
      const { warnings, recommendations } = this.generateRecommendations(chunks, statistics);

      return {
        chunks,
        statistics,
        metadata: processingMetadata,
        processingTime: Date.now() - startTime,
        warnings,
        recommendations,
      };
    } catch (error) {
      throw new Error(
        `Document chunking failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Analyze document structure untuk optimal chunking
   */
  private async analyzeDocumentStructure(content: string): Promise<{
    hasHeadings: boolean;
    headingLevels: number[];
    paragraphCount: number;
    sectionCount: number;
    listCount: number;
    tableCount: number;
    codeBlockCount: number;
    averageParagraphLength: number;
    contentType: 'article' | 'documentation' | 'academic' | 'general';
    language: string;
    complexity: 'low' | 'medium' | 'high';
  }> {
    // Detect headings
    const headingMatches = content.match(/^#{1,6}\s+.+$/gm) || [];
    const htmlHeadingMatches = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
    const hasHeadings = headingMatches.length > 0 || htmlHeadingMatches.length > 0;

    // Extract heading levels
    const headingLevels = [
      ...new Set([
        ...headingMatches.map(h => h.match(/^(#{1,6})/)?.[1].length || 1),
        ...htmlHeadingMatches.map(h => parseInt(h.match(/<h([1-6])/i)?.[1] || '1')),
      ]),
    ].sort();

    // Count structural elements
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;
    const sectionCount =
      headingLevels.length > 0 ? headingMatches.length + htmlHeadingMatches.length : 0;
    const listCount =
      (content.match(/^\s*[-*+]\s+/gm) || []).length +
      (content.match(/^\s*\d+\.\s+/gm) || []).length;
    const tableCount =
      (content.match(/\|.*\|/g) || []).length + (content.match(/<table/gi) || []).length;
    const codeBlockCount =
      (content.match(/```[\s\S]*?```/g) || []).length + (content.match(/<code/gi) || []).length;

    // Calculate average paragraph length
    const averageParagraphLength =
      paragraphs.length > 0
        ? paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / paragraphs.length
        : 0;

    // Determine content type
    let contentType: 'article' | 'documentation' | 'academic' | 'general' = 'general';
    if (codeBlockCount > 0 && hasHeadings) contentType = 'documentation';
    else if (content.includes('Abstract') || content.includes('References'))
      contentType = 'academic';
    else if (hasHeadings && sectionCount >= 3) contentType = 'article';

    // Detect language (simple detection)
    const vietnameseWords = ['của', 'và', 'trong', 'là', 'một', 'các', 'có', 'được'];
    const englishWords = ['the', 'and', 'or', 'is', 'are', 'was', 'were', 'have'];
    const vnScore = vietnameseWords.reduce(
      (score, word) => score + (content.toLowerCase().split(word).length - 1),
      0
    );
    const enScore = englishWords.reduce(
      (score, word) => score + (content.toLowerCase().split(word).length - 1),
      0
    );
    const language = vnScore > enScore ? 'vietnamese' : 'english';

    // Determine complexity
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    const complexityScore = sectionCount + listCount + tableCount + codeBlockCount;
    if (complexityScore < 5) complexity = 'low';
    else if (complexityScore > 15) complexity = 'high';

    return {
      hasHeadings,
      headingLevels,
      paragraphCount,
      sectionCount,
      listCount,
      tableCount,
      codeBlockCount,
      averageParagraphLength,
      contentType,
      language,
      complexity,
    };
  }

  /**
   * Select optimal chunking strategy based on document analysis
   */
  private selectChunkingStrategy(
    content: string,
    analysis: any
  ): ChunkingOptions['chunkingStrategy'] {
    // If user specified strategy, use it
    if (this.options.chunkingStrategy !== 'adaptive') {
      return this.options.chunkingStrategy;
    }

    // Auto-select based on document characteristics
    if (analysis.contentType === 'documentation' && analysis.hasHeadings) {
      return 'section';
    } else if (analysis.contentType === 'academic' && analysis.complexity === 'high') {
      return 'semantic';
    } else if (analysis.paragraphCount > 0 && analysis.averageParagraphLength > 50) {
      return 'paragraph';
    } else if (analysis.hasHeadings && analysis.sectionCount >= 3) {
      return 'section';
    } else {
      return 'semantic';
    }
  }

  /**
   * Semantic chunking với intelligent boundary detection
   */
  private async semanticChunking(
    content: string,
    documentId: string,
    analysis: any
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];

    // Split into semantic units (sentences first)
    const sentences = this.splitIntoSentences(content);
    let currentChunk = '';
    let currentWordCount = 0;
    let chunkStartPosition = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceWordCount = this.countWords(sentence);

      // Check if adding sentence would exceed limits
      if (
        currentWordCount + sentenceWordCount > this.options.maxWordCount &&
        currentChunk.length > 0
      ) {
        // Create chunk from current content
        const chunk = await this.createChunk(
          currentChunk.trim(),
          documentId,
          chunkStartPosition,
          chunkStartPosition + currentChunk.length,
          'semantic'
        );
        chunks.push(chunk);

        // Start new chunk
        currentChunk = sentence + ' ';
        currentWordCount = sentenceWordCount;
        chunkStartPosition = content.indexOf(sentence, chunkStartPosition);
      } else {
        currentChunk += sentence + ' ';
        currentWordCount += sentenceWordCount;
      }

      // Check if we've reached target size
      if (currentWordCount >= this.options.targetWordCount) {
        // Look for good breaking point
        const breakPoint = this.findSemanticBreakPoint(sentences, i);
        if (breakPoint > i) {
          // Add sentences up to break point
          for (let j = i + 1; j <= breakPoint; j++) {
            if (j < sentences.length) {
              currentChunk += sentences[j] + ' ';
              currentWordCount += this.countWords(sentences[j]);
            }
          }
          i = breakPoint;
        }

        // Create chunk
        const chunk = await this.createChunk(
          currentChunk.trim(),
          documentId,
          chunkStartPosition,
          chunkStartPosition + currentChunk.length,
          'semantic'
        );
        chunks.push(chunk);

        // Reset for next chunk
        currentChunk = '';
        currentWordCount = 0;
        chunkStartPosition = content.indexOf(
          sentences[Math.min(i + 1, sentences.length - 1)],
          chunkStartPosition
        );
      }
    }

    // Handle remaining content
    if (currentChunk.trim().length > 0) {
      const chunk = await this.createChunk(
        currentChunk.trim(),
        documentId,
        chunkStartPosition,
        content.length,
        'semantic'
      );
      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Paragraph-based chunking
   */
  private async paragraphBasedChunking(
    content: string,
    documentId: string,
    analysis: any
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    let currentChunk = '';
    let currentWordCount = 0;
    let chunkStartPosition = 0;

    for (const paragraph of paragraphs) {
      const paragraphWordCount = this.countWords(paragraph);

      // If single paragraph is too large, split it
      if (paragraphWordCount > this.options.maxWordCount) {
        // Save current chunk if exists
        if (currentChunk.length > 0) {
          const chunk = await this.createChunk(
            currentChunk.trim(),
            documentId,
            chunkStartPosition,
            chunkStartPosition + currentChunk.length,
            'paragraph'
          );
          chunks.push(chunk);
          currentChunk = '';
          currentWordCount = 0;
        }

        // Split large paragraph using semantic chunking
        const paragraphChunks = await this.semanticChunking(paragraph, documentId, analysis);
        chunks.push(...paragraphChunks);

        chunkStartPosition = content.indexOf(paragraph, chunkStartPosition) + paragraph.length;
        continue;
      }

      // Check if adding paragraph would exceed limits
      if (
        currentWordCount + paragraphWordCount > this.options.maxWordCount &&
        currentChunk.length > 0
      ) {
        const chunk = await this.createChunk(
          currentChunk.trim(),
          documentId,
          chunkStartPosition,
          chunkStartPosition + currentChunk.length,
          'paragraph'
        );
        chunks.push(chunk);

        currentChunk = paragraph + '\n\n';
        currentWordCount = paragraphWordCount;
        chunkStartPosition = content.indexOf(paragraph, chunkStartPosition);
      } else {
        currentChunk += paragraph + '\n\n';
        currentWordCount += paragraphWordCount;
      }
    }

    // Handle remaining content
    if (currentChunk.trim().length > 0) {
      const chunk = await this.createChunk(
        currentChunk.trim(),
        documentId,
        chunkStartPosition,
        content.length,
        'paragraph'
      );
      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Section-based chunking using headings
   */
  private async sectionBasedChunking(
    content: string,
    documentId: string,
    analysis: any
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];

    // Find all headings
    const headingMatches = Array.from(content.matchAll(/^(#{1,6})\s+(.+)$/gm));
    const htmlHeadingMatches = Array.from(content.matchAll(/<(h[1-6])[^>]*>(.*?)<\/\1>/gi));

    if (headingMatches.length === 0 && htmlHeadingMatches.length === 0) {
      // No headings found, fall back to paragraph chunking
      return this.paragraphBasedChunking(content, documentId, analysis);
    }

    // Create sections based on headings
    const sections: { start: number; end: number; level: number; title: string }[] = [];

    // Process markdown headings
    headingMatches.forEach((match, index) => {
      const level = match[1].length;
      const title = match[2];
      const start = match.index || 0;
      const nextHeading = headingMatches[index + 1];
      const end = nextHeading ? nextHeading.index || content.length : content.length;

      sections.push({ start, end, level, title });
    });

    // Process HTML headings
    htmlHeadingMatches.forEach((match, index) => {
      const level = parseInt(match[1].charAt(1));
      const title = match[2].replace(/<[^>]*>/g, '');
      const start = match.index || 0;
      const nextHeading = htmlHeadingMatches[index + 1];
      const end = nextHeading ? nextHeading.index || content.length : content.length;

      sections.push({ start, end, level, title });
    });

    // Sort sections by position
    sections.sort((a, b) => a.start - b.start);

    // Create chunks from sections
    for (const section of sections) {
      const sectionContent = content.substring(section.start, section.end).trim();
      const wordCount = this.countWords(sectionContent);

      if (wordCount <= this.options.maxWordCount) {
        // Section fits in one chunk
        const chunk = await this.createChunk(
          sectionContent,
          documentId,
          section.start,
          section.end,
          'section'
        );
        chunk.metadata.chunkType = 'section';
        chunks.push(chunk);
      } else {
        // Section too large, split using semantic chunking
        const sectionChunks = await this.semanticChunking(sectionContent, documentId, analysis);
        chunks.push(...sectionChunks);
      }
    }

    return chunks;
  }

  /**
   * Fixed-size chunking
   */
  private async fixedSizeChunking(content: string, documentId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const words = content.split(/\s+/);

    for (let i = 0; i < words.length; i += this.options.targetWordCount) {
      const chunkWords = words.slice(i, i + this.options.targetWordCount);
      const chunkContent = chunkWords.join(' ');

      const startPosition = content.indexOf(
        chunkWords[0],
        i > 0 ? chunks[chunks.length - 1]?.metadata.endPosition || 0 : 0
      );
      const endPosition = startPosition + chunkContent.length;

      const chunk = await this.createChunk(
        chunkContent,
        documentId,
        startPosition,
        endPosition,
        'fixed_size'
      );
      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Adaptive chunking based on content analysis
   */
  private async adaptiveChunking(
    content: string,
    documentId: string,
    analysis: any
  ): Promise<DocumentChunk[]> {
    // Choose strategy based on analysis
    if (analysis.hasHeadings && analysis.sectionCount >= 3) {
      return this.sectionBasedChunking(content, documentId, analysis);
    } else if (analysis.paragraphCount > 5 && analysis.averageParagraphLength > 30) {
      return this.paragraphBasedChunking(content, documentId, analysis);
    } else {
      return this.semanticChunking(content, documentId, analysis);
    }
  }

  /**
   * Apply overlapping between chunks
   */
  private async applyOverlapping(
    chunks: DocumentChunk[],
    originalContent: string
  ): Promise<DocumentChunk[]> {
    if (chunks.length <= 1) return chunks;

    const overlappedChunks: DocumentChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let enhancedContent = chunk.content;

      // Add overlap with previous chunk
      if (i > 0 && this.options.overlapPercentage > 0) {
        const previousChunk = chunks[i - 1];
        const overlapWords = Math.min(
          Math.floor((previousChunk.statistics.wordCount * this.options.overlapPercentage) / 100),
          this.options.overlapMaxWords
        );

        if (overlapWords >= this.options.overlapMinWords) {
          const previousWords = previousChunk.content.split(/\s+/);
          const overlapContent = previousWords.slice(-overlapWords).join(' ');
          enhancedContent = `...${overlapContent} ${enhancedContent}`;

          // Track overlap relationship
          chunk.relationships.overlapsWith.push(previousChunk.id);
        }
      }

      // Add overlap with next chunk
      if (i < chunks.length - 1 && this.options.overlapPercentage > 0) {
        const nextChunk = chunks[i + 1];
        const overlapWords = Math.min(
          Math.floor((nextChunk.statistics.wordCount * this.options.overlapPercentage) / 100),
          this.options.overlapMaxWords
        );

        if (overlapWords >= this.options.overlapMinWords) {
          const nextWords = nextChunk.content.split(/\s+/);
          const overlapContent = nextWords.slice(0, overlapWords).join(' ');
          enhancedContent = `${enhancedContent} ${overlapContent}...`;

          // Track overlap relationship
          chunk.relationships.overlapsWith.push(nextChunk.id);
        }
      }

      // Update chunk content và statistics
      const updatedChunk = { ...chunk };
      updatedChunk.content = enhancedContent;
      updatedChunk.statistics = this.calculateChunkStatistics(enhancedContent);

      overlappedChunks.push(updatedChunk);
    }

    return overlappedChunks;
  }

  /**
   * Post-process chunks for quality và consistency
   */
  private async postProcessChunks(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    const processedChunks: DocumentChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Skip empty chunks
      if (this.options.skipEmptyChunks && chunk.content.trim().length === 0) {
        continue;
      }

      // Skip short chunks
      if (this.options.skipShortChunks && chunk.statistics.wordCount < this.options.minWordCount) {
        continue;
      }

      // Merge tiny chunks with neighbors
      if (
        this.options.mergeTinyChunks &&
        chunk.statistics.wordCount < this.options.minWordCount / 2
      ) {
        if (i > 0 && processedChunks.length > 0) {
          const previousChunk = processedChunks[processedChunks.length - 1];
          previousChunk.content += ' ' + chunk.content;
          previousChunk.statistics = this.calculateChunkStatistics(previousChunk.content);
          previousChunk.metadata.endPosition = chunk.metadata.endPosition;
          continue;
        }
      }

      // Skip low quality chunks
      if (chunk.metadata.qualityScore < this.options.minQualityScore) {
        continue;
      }

      // Generate title if enabled
      if (this.options.generateTitles) {
        chunk.metadata.documentTitle = this.generateChunkTitle(chunk.content);
      }

      // Extract keywords if enabled
      if (this.options.extractKeywords) {
        // This would be implemented để extract key terms
        // For now, placeholder implementation
      }

      processedChunks.push(chunk);
    }

    return processedChunks;
  }

  // Helper methods
  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting - could be enhanced với proper NLP
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private findSemanticBreakPoint(sentences: string[], currentIndex: number): number {
    // Look for natural breaking points (paragraph ends, etc.)
    for (let i = currentIndex + 1; i < Math.min(currentIndex + 5, sentences.length); i++) {
      if (sentences[i].includes('\n\n') || sentences[i].trim().endsWith(':')) {
        return i;
      }
    }
    return currentIndex;
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  private async createChunk(
    content: string,
    documentId: string,
    startPosition: number,
    endPosition: number,
    chunkType: ChunkMetadata['chunkType']
  ): Promise<DocumentChunk> {
    const chunkId = `${documentId}_chunk_${++this.chunkCounter}`;
    const statistics = this.calculateChunkStatistics(content);
    const qualityScore = this.calculateQualityScore(content, statistics);

    return {
      id: chunkId,
      content,
      metadata: {
        documentId,
        documentTitle: this.documentMetadata?.title || 'Untitled Document',
        documentType: this.documentMetadata?.fileType || 'text',
        chunkIndex: this.chunkCounter,
        totalChunks: 0, // Will be updated later
        startPosition,
        endPosition,
        chunkType,
        language: this.documentMetadata?.language || 'english',
        processingMethod: `${this.options.chunkingStrategy}_chunking`,
        qualityScore,
      },
      relationships: {
        previousChunkId: undefined,
        nextChunkId: undefined,
        parentChunkId: undefined,
        childChunkIds: [],
        overlapsWith: [],
        semanticGroup: undefined,
      },
      statistics,
      createdAt: new Date().toISOString(),
    };
  }

  private calculateChunkStatistics(content: string): ChunkStatistics {
    const words = content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    const sentences = this.splitIntoSentences(content);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    return {
      wordCount: words.length,
      characterCount: content.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
      readabilityScore: this.calculateReadabilityScore(content),
      contentDensity: this.calculateContentDensity(content),
    };
  }

  private calculateQualityScore(content: string, statistics: ChunkStatistics): number {
    let score = 1.0;

    // Penalize very short or very long chunks
    if (statistics.wordCount < this.options.minWordCount) {
      score *= 0.7;
    }
    if (statistics.wordCount > this.options.maxWordCount) {
      score *= 0.8;
    }

    // Reward good sentence structure
    if (statistics.averageWordsPerSentence > 5 && statistics.averageWordsPerSentence < 25) {
      score *= 1.1;
    }

    // Penalize chunks với mostly special characters
    const specialCharRatio = (content.match(/[^a-zA-Z0-9\s]/g) || []).length / content.length;
    if (specialCharRatio > 0.3) {
      score *= 0.6;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateReadabilityScore(content: string): number {
    // Simple readability calculation
    const words = this.countWords(content);
    const sentences = this.splitIntoSentences(content).length;
    const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;

    // Flesch-inspired formula (simplified)
    return Math.max(0, Math.min(100, 206.835 - 1.015 * avgWordsPerSentence));
  }

  private calculateContentDensity(content: string): number {
    // Calculate information density (placeholder implementation)
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/));
    const totalWords = this.countWords(content);
    return totalWords > 0 ? uniqueWords.size / totalWords : 0;
  }

  private generateChunkTitle(content: string): string {
    // Extract first meaningful sentence as title
    const sentences = this.splitIntoSentences(content);
    const firstSentence = sentences[0]?.trim() || 'Untitled Chunk';
    return firstSentence.substring(0, 100) + (firstSentence.length > 100 ? '...' : '');
  }

  private generateChunkRelationships(chunks: DocumentChunk[]): DocumentChunk[] {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Update total chunks count
      chunk.metadata.totalChunks = chunks.length;

      // Set previous/next relationships
      if (i > 0) {
        chunk.relationships.previousChunkId = chunks[i - 1].id;
      }
      if (i < chunks.length - 1) {
        chunk.relationships.nextChunkId = chunks[i + 1].id;
      }
    }

    return chunks;
  }

  private calculateChunkingStatistics(chunks: DocumentChunk[]): ChunkingStatistics {
    if (chunks.length === 0) {
      return {
        totalChunks: 0,
        averageWordCount: 0,
        averageCharacterCount: 0,
        totalOverlaps: 0,
        qualityDistribution: {},
        chunkSizeDistribution: [],
        processingEfficiency: 0,
      };
    }

    const totalWordCount = chunks.reduce((sum, chunk) => sum + chunk.statistics.wordCount, 0);
    const totalCharCount = chunks.reduce((sum, chunk) => sum + chunk.statistics.characterCount, 0);
    const totalOverlaps = chunks.reduce(
      (sum, chunk) => sum + chunk.relationships.overlapsWith.length,
      0
    );

    // Quality distribution
    const qualityDistribution: Record<string, number> = {};
    chunks.forEach(chunk => {
      const qualityBucket =
        chunk.metadata.qualityScore >= 0.8
          ? 'high'
          : chunk.metadata.qualityScore >= 0.6
            ? 'medium'
            : chunk.metadata.qualityScore >= 0.4
              ? 'low'
              : 'poor';
      qualityDistribution[qualityBucket] = (qualityDistribution[qualityBucket] || 0) + 1;
    });

    // Size distribution
    const chunkSizeDistribution = chunks.map(chunk => chunk.statistics.wordCount);

    return {
      totalChunks: chunks.length,
      averageWordCount: totalWordCount / chunks.length,
      averageCharacterCount: totalCharCount / chunks.length,
      totalOverlaps,
      qualityDistribution,
      chunkSizeDistribution,
      processingEfficiency:
        chunks.filter(c => c.metadata.qualityScore >= 0.6).length / chunks.length,
    };
  }

  private generateChunkingMetadata(
    content: string,
    documentId: string,
    strategy: string
  ): ChunkingMetadata {
    return {
      documentId,
      originalLength: content.length,
      chunkingStrategy: strategy,
      processingMethod: `${strategy}_chunking_v1.0`,
      boundariesDetected: this.chunkCounter,
      structurePreserved: this.options.preserveHeadings || this.options.preserveLists,
      languageDetected: this.documentMetadata?.language || 'english',
      chunkedAt: new Date().toISOString(),
    };
  }

  private generateRecommendations(
    chunks: DocumentChunk[],
    statistics: ChunkingStatistics
  ): {
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check quality distribution
    const lowQualityCount = statistics.qualityDistribution['poor'] || 0;
    if (lowQualityCount > chunks.length * 0.1) {
      warnings.push(`${lowQualityCount} chunks have poor quality scores`);
      recommendations.push('Consider adjusting chunking strategy or content preprocessing');
    }

    // Check chunk size distribution
    const oversizedChunks = chunks.filter(
      c => c.statistics.wordCount > this.options.maxWordCount
    ).length;
    if (oversizedChunks > 0) {
      warnings.push(`${oversizedChunks} chunks exceed maximum word count`);
      recommendations.push('Consider reducing target chunk size or improving boundary detection');
    }

    // Check processing efficiency
    if (statistics.processingEfficiency < 0.8) {
      warnings.push('Low processing efficiency detected');
      recommendations.push('Consider adjusting quality thresholds or chunking parameters');
    }

    return { warnings, recommendations };
  }

  /**
   * Get chunking options
   */
  public getOptions(): ChunkingOptions {
    return { ...this.options };
  }

  /**
   * Update chunking options
   */
  public updateOptions(newOptions: Partial<ChunkingOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}

// Export utility functions
export const DocumentChunkerUtils = {
  getDefaultOptions: (): ChunkingOptions => ({ ...DEFAULT_CHUNKING_OPTIONS }),

  createChunkingPreset: (
    preset: 'small' | 'medium' | 'large' | 'academic' | 'documentation'
  ): Partial<ChunkingOptions> => {
    const presets: Record<string, Partial<ChunkingOptions>> = {
      small: {
        targetWordCount: 400,
        minWordCount: 100,
        maxWordCount: 600,
        overlapPercentage: 15,
      },
      medium: {
        targetWordCount: 750,
        minWordCount: 200,
        maxWordCount: 1200,
        overlapPercentage: 10,
      },
      large: {
        targetWordCount: 1200,
        minWordCount: 400,
        maxWordCount: 2000,
        overlapPercentage: 5,
      },
      academic: {
        targetWordCount: 800,
        chunkingStrategy: 'section',
        preserveHeadings: true,
        enableSemanticBoundaries: true,
        respectSectionBoundaries: true,
      },
      documentation: {
        targetWordCount: 600,
        chunkingStrategy: 'section',
        preserveHeadings: true,
        preserveCodeBlocks: true,
        preserveLists: true,
      },
    };

    return presets[preset] || presets.medium;
  },

  validateChunkingOptions: (
    options: Partial<ChunkingOptions>
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (
      options.minWordCount &&
      options.maxWordCount &&
      options.minWordCount >= options.maxWordCount
    ) {
      errors.push('minWordCount must be less than maxWordCount');
    }

    if (
      options.overlapPercentage &&
      (options.overlapPercentage < 0 || options.overlapPercentage > 50)
    ) {
      errors.push('overlapPercentage must be between 0 and 50');
    }

    if (
      options.targetWordCount &&
      options.minWordCount &&
      options.targetWordCount < options.minWordCount
    ) {
      errors.push('targetWordCount should be at least minWordCount');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

export default DocumentChunker;
