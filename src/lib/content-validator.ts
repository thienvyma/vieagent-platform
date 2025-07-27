/**
 * ✅ Content Validator Library - Phase 2 Day 6 Step 6.4
 * Comprehensive content validation and quality verification system
 * Validate content quality, integrity, format, and readiness for processing
 */

// Content validation result interface
export interface ContentValidationResult {
  isValid: boolean;
  overallScore: number;
  validationSummary: ValidationSummary;
  categoryResults: CategoryValidationResult[];
  recommendations: string[];
  criticalIssues: string[];
  warnings: string[];
  processingTime: number;
  validatedAt: string;
}

// Validation summary interface
export interface ValidationSummary {
  totalCategories: number;
  passedCategories: number;
  failedCategories: number;
  criticalFailures: number;
  warningCount: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  readinessLevel: 'ready' | 'needs_review' | 'requires_fixes' | 'not_ready';
}

// Category validation result interface
export interface CategoryValidationResult {
  category: string;
  name: string;
  score: number;
  status: 'passed' | 'failed' | 'warning';
  critical: boolean;
  checks: ValidationCheck[];
  summary: string;
}

// Individual validation check interface
export interface ValidationCheck {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  score: number;
  expectedValue?: any;
  actualValue?: any;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Content validation options interface
export interface ContentValidationOptions {
  // Quality thresholds
  minContentLength: number;
  maxContentLength: number;
  minWordCount: number;
  maxWordCount: number;
  minSentenceCount: number;
  minParagraphCount: number;

  // Content quality
  minReadabilityScore: number;
  maxReadabilityScore: number;
  minLanguageConfidence: number;
  requireProperEncoding: boolean;

  // Structure validation
  validateStructure: boolean;
  requireParagraphs: boolean;
  requireSentences: boolean;
  validateHeadings: boolean;

  // Content integrity
  checkForCorruption: boolean;
  validateUnicode: boolean;
  checkForTruncation: boolean;
  detectDuplicateContent: boolean;

  // Format validation
  validateFormat: boolean;
  allowedFormats: string[];
  strictModeEnabled: boolean;

  // Performance validation
  validatePerformance: boolean;
  maxProcessingTime: number;
  memoryLimitMB: number;

  // Custom validation
  customValidators: CustomValidator[];
  skipOptionalChecks: boolean;
}

// Custom validator interface
export interface CustomValidator {
  id: string;
  name: string;
  description: string;
  validate: (content: any) => ValidationCheck;
  critical: boolean;
}

// Default validation options
const DEFAULT_VALIDATION_OPTIONS: ContentValidationOptions = {
  // Quality thresholds
  minContentLength: 10,
  maxContentLength: 10000000,
  minWordCount: 5,
  maxWordCount: 1000000,
  minSentenceCount: 1,
  minParagraphCount: 1,

  // Content quality
  minReadabilityScore: 0,
  maxReadabilityScore: 100,
  minLanguageConfidence: 0.5,
  requireProperEncoding: true,

  // Structure validation
  validateStructure: true,
  requireParagraphs: false,
  requireSentences: true,
  validateHeadings: false,

  // Content integrity
  checkForCorruption: true,
  validateUnicode: true,
  checkForTruncation: true,
  detectDuplicateContent: false,

  // Format validation
  validateFormat: true,
  allowedFormats: ['text/plain', 'text/html', 'application/json'],
  strictModeEnabled: false,

  // Performance validation
  validatePerformance: true,
  maxProcessingTime: 30000, // 30 seconds
  memoryLimitMB: 100,

  // Custom validation
  customValidators: [],
  skipOptionalChecks: false,
};

// Content validator class
export class ContentValidator {
  private options: ContentValidationOptions;
  private validationResults: CategoryValidationResult[];
  private startTime: number;

  constructor(options: Partial<ContentValidationOptions> = {}) {
    this.options = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
    this.validationResults = [];
    this.startTime = 0;
  }

  /**
   * Validate content comprehensively
   */
  async validateContent(
    content: string,
    metadata?: any,
    cleaningResult?: any
  ): Promise<ContentValidationResult> {
    this.startTime = Date.now();
    this.validationResults = [];

    try {
      // Category 1: Basic Content Validation
      const basicValidation = await this.validateBasicContent(content);
      this.validationResults.push(basicValidation);

      // Category 2: Content Quality Validation
      const qualityValidation = await this.validateContentQuality(content, metadata);
      this.validationResults.push(qualityValidation);

      // Category 3: Structure Validation
      if (this.options.validateStructure) {
        const structureValidation = await this.validateContentStructure(content);
        this.validationResults.push(structureValidation);
      }

      // Category 4: Integrity Validation
      const integrityValidation = await this.validateContentIntegrity(content);
      this.validationResults.push(integrityValidation);

      // Category 5: Format Validation
      if (this.options.validateFormat) {
        const formatValidation = await this.validateContentFormat(content, metadata);
        this.validationResults.push(formatValidation);
      }

      // Category 6: Performance Validation
      if (this.options.validatePerformance) {
        const performanceValidation = await this.validatePerformance(content);
        this.validationResults.push(performanceValidation);
      }

      // Category 7: Custom Validations
      if (this.options.customValidators.length > 0) {
        const customValidation = await this.runCustomValidations(content);
        this.validationResults.push(customValidation);
      }

      // Calculate overall results
      const validationSummary = this.calculateValidationSummary();
      const overallScore = this.calculateOverallScore();
      const isValid = this.determineOverallValidity();

      const recommendations = this.generateRecommendations();
      const criticalIssues = this.extractCriticalIssues();
      const warnings = this.extractWarnings();

      return {
        isValid,
        overallScore,
        validationSummary,
        categoryResults: this.validationResults,
        recommendations,
        criticalIssues,
        warnings,
        processingTime: Date.now() - this.startTime,
        validatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Content validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate basic content properties
   */
  private async validateBasicContent(content: string): Promise<CategoryValidationResult> {
    const checks: ValidationCheck[] = [];

    // Content length check
    checks.push({
      id: 'content_length',
      name: 'Content Length',
      description: 'Validate content length within acceptable range',
      status:
        content.length >= this.options.minContentLength &&
        content.length <= this.options.maxContentLength
          ? 'passed'
          : 'failed',
      score:
        content.length >= this.options.minContentLength &&
        content.length <= this.options.maxContentLength
          ? 100
          : 0,
      expectedValue: `${this.options.minContentLength}-${this.options.maxContentLength} characters`,
      actualValue: `${content.length} characters`,
      message:
        content.length < this.options.minContentLength
          ? 'Content is too short'
          : content.length > this.options.maxContentLength
            ? 'Content is too long'
            : 'Content length is acceptable',
      severity: 'high',
    });

    // Word count check
    const wordCount = this.countWords(content);
    checks.push({
      id: 'word_count',
      name: 'Word Count',
      description: 'Validate word count within acceptable range',
      status:
        wordCount >= this.options.minWordCount && wordCount <= this.options.maxWordCount
          ? 'passed'
          : 'failed',
      score:
        wordCount >= this.options.minWordCount && wordCount <= this.options.maxWordCount ? 100 : 0,
      expectedValue: `${this.options.minWordCount}-${this.options.maxWordCount} words`,
      actualValue: `${wordCount} words`,
      message:
        wordCount < this.options.minWordCount
          ? 'Word count is too low'
          : wordCount > this.options.maxWordCount
            ? 'Word count is too high'
            : 'Word count is acceptable',
      severity: 'high',
    });

    // Empty content check
    checks.push({
      id: 'empty_content',
      name: 'Empty Content',
      description: 'Validate content is not empty',
      status: content.trim().length > 0 ? 'passed' : 'failed',
      score: content.trim().length > 0 ? 100 : 0,
      expectedValue: 'Non-empty content',
      actualValue: content.trim().length > 0 ? 'Has content' : 'Empty content',
      message: content.trim().length > 0 ? 'Content is not empty' : 'Content is empty',
      severity: 'critical',
    });

    // Calculate category score
    const categoryScore = this.calculateCategoryScore(checks);
    const categoryStatus = this.determineCategoryStatus(checks);

    return {
      category: 'basic_content',
      name: 'Basic Content Validation',
      score: categoryScore,
      status: categoryStatus,
      critical: true,
      checks,
      summary: `Basic content validation ${categoryStatus} with ${categoryScore}% score`,
    };
  }

  /**
   * Validate content quality
   */
  private async validateContentQuality(
    content: string,
    metadata?: any
  ): Promise<CategoryValidationResult> {
    const checks: ValidationCheck[] = [];

    // Language detection confidence
    if (metadata?.language && metadata?.languageConfidence !== undefined) {
      checks.push({
        id: 'language_confidence',
        name: 'Language Confidence',
        description: 'Validate language detection confidence',
        status:
          metadata.languageConfidence >= this.options.minLanguageConfidence ? 'passed' : 'warning',
        score: metadata.languageConfidence >= this.options.minLanguageConfidence ? 100 : 60,
        expectedValue: `>= ${this.options.minLanguageConfidence}`,
        actualValue: metadata.languageConfidence,
        message:
          metadata.languageConfidence >= this.options.minLanguageConfidence
            ? 'Language detection confidence is acceptable'
            : 'Language detection confidence is low',
        severity: 'medium',
      });
    }

    // Readability score
    if (metadata?.readabilityScore !== undefined) {
      checks.push({
        id: 'readability_score',
        name: 'Readability Score',
        description: 'Validate content readability score',
        status:
          metadata.readabilityScore >= this.options.minReadabilityScore &&
          metadata.readabilityScore <= this.options.maxReadabilityScore
            ? 'passed'
            : 'warning',
        score:
          metadata.readabilityScore >= this.options.minReadabilityScore &&
          metadata.readabilityScore <= this.options.maxReadabilityScore
            ? 100
            : 70,
        expectedValue: `${this.options.minReadabilityScore}-${this.options.maxReadabilityScore}`,
        actualValue: metadata.readabilityScore,
        message: 'Readability score is within acceptable range',
        severity: 'low',
      });
    }

    // Content complexity
    if (metadata?.contentComplexity) {
      const complexityScore = this.getComplexityScore(metadata.contentComplexity);
      checks.push({
        id: 'content_complexity',
        name: 'Content Complexity',
        description: 'Validate content complexity level',
        status: complexityScore >= 70 ? 'passed' : 'warning',
        score: complexityScore,
        expectedValue: 'Appropriate complexity level',
        actualValue: metadata.contentComplexity,
        message: `Content complexity is ${metadata.contentComplexity}`,
        severity: 'low',
      });
    }

    // Encoding validation
    if (this.options.requireProperEncoding) {
      const encodingValid = this.validateEncoding(content);
      checks.push({
        id: 'encoding_validation',
        name: 'Encoding Validation',
        description: 'Validate content encoding is proper',
        status: encodingValid ? 'passed' : 'failed',
        score: encodingValid ? 100 : 0,
        expectedValue: 'Valid UTF-8 encoding',
        actualValue: encodingValid ? 'Valid encoding' : 'Invalid encoding',
        message: encodingValid ? 'Content encoding is valid' : 'Content encoding has issues',
        severity: 'high',
      });
    }

    const categoryScore = this.calculateCategoryScore(checks);
    const categoryStatus = this.determineCategoryStatus(checks);

    return {
      category: 'content_quality',
      name: 'Content Quality Validation',
      score: categoryScore,
      status: categoryStatus,
      critical: false,
      checks,
      summary: `Content quality validation ${categoryStatus} with ${categoryScore}% score`,
    };
  }

  /**
   * Validate content structure
   */
  private async validateContentStructure(content: string): Promise<CategoryValidationResult> {
    const checks: ValidationCheck[] = [];

    // Sentence structure
    if (this.options.requireSentences) {
      const sentenceCount = this.countSentences(content);
      checks.push({
        id: 'sentence_count',
        name: 'Sentence Count',
        description: 'Validate minimum sentence count',
        status: sentenceCount >= this.options.minSentenceCount ? 'passed' : 'failed',
        score: sentenceCount >= this.options.minSentenceCount ? 100 : 0,
        expectedValue: `>= ${this.options.minSentenceCount} sentences`,
        actualValue: `${sentenceCount} sentences`,
        message:
          sentenceCount >= this.options.minSentenceCount
            ? 'Adequate sentence count'
            : 'Insufficient sentence count',
        severity: 'medium',
      });
    }

    // Paragraph structure
    if (this.options.requireParagraphs) {
      const paragraphCount = this.countParagraphs(content);
      checks.push({
        id: 'paragraph_count',
        name: 'Paragraph Count',
        description: 'Validate minimum paragraph count',
        status: paragraphCount >= this.options.minParagraphCount ? 'passed' : 'failed',
        score: paragraphCount >= this.options.minParagraphCount ? 100 : 0,
        expectedValue: `>= ${this.options.minParagraphCount} paragraphs`,
        actualValue: `${paragraphCount} paragraphs`,
        message:
          paragraphCount >= this.options.minParagraphCount
            ? 'Adequate paragraph count'
            : 'Insufficient paragraph count',
        severity: 'medium',
      });
    }

    // Heading validation
    if (this.options.validateHeadings) {
      const hasHeadings = this.hasHeadings(content);
      checks.push({
        id: 'heading_structure',
        name: 'Heading Structure',
        description: 'Validate presence of headings',
        status: hasHeadings ? 'passed' : 'warning',
        score: hasHeadings ? 100 : 70,
        expectedValue: 'Document has headings',
        actualValue: hasHeadings ? 'Has headings' : 'No headings',
        message: hasHeadings
          ? 'Document has proper heading structure'
          : 'Document lacks heading structure',
        severity: 'low',
      });
    }

    // Line break validation
    const hasProperLineBreaks = this.validateLineBreaks(content);
    checks.push({
      id: 'line_breaks',
      name: 'Line Breaks',
      description: 'Validate proper line break usage',
      status: hasProperLineBreaks ? 'passed' : 'warning',
      score: hasProperLineBreaks ? 100 : 80,
      expectedValue: 'Proper line breaks',
      actualValue: hasProperLineBreaks ? 'Valid line breaks' : 'Irregular line breaks',
      message: hasProperLineBreaks ? 'Line breaks are proper' : 'Line breaks may need attention',
      severity: 'low',
    });

    const categoryScore = this.calculateCategoryScore(checks);
    const categoryStatus = this.determineCategoryStatus(checks);

    return {
      category: 'content_structure',
      name: 'Content Structure Validation',
      score: categoryScore,
      status: categoryStatus,
      critical: false,
      checks,
      summary: `Content structure validation ${categoryStatus} with ${categoryScore}% score`,
    };
  }

  /**
   * Validate content integrity
   */
  private async validateContentIntegrity(content: string): Promise<CategoryValidationResult> {
    const checks: ValidationCheck[] = [];

    // Corruption detection
    if (this.options.checkForCorruption) {
      const isCorrupted = this.detectCorruption(content);
      checks.push({
        id: 'corruption_detection',
        name: 'Corruption Detection',
        description: 'Detect content corruption',
        status: !isCorrupted ? 'passed' : 'failed',
        score: !isCorrupted ? 100 : 0,
        expectedValue: 'No corruption detected',
        actualValue: isCorrupted ? 'Corruption detected' : 'No corruption',
        message: !isCorrupted ? 'Content is not corrupted' : 'Content corruption detected',
        severity: 'critical',
      });
    }

    // Unicode validation
    if (this.options.validateUnicode) {
      const unicodeValid = this.validateUnicodeIntegrity(content);
      checks.push({
        id: 'unicode_validation',
        name: 'Unicode Validation',
        description: 'Validate Unicode character integrity',
        status: unicodeValid ? 'passed' : 'failed',
        score: unicodeValid ? 100 : 0,
        expectedValue: 'Valid Unicode characters',
        actualValue: unicodeValid ? 'Valid Unicode' : 'Invalid Unicode',
        message: unicodeValid
          ? 'Unicode characters are valid'
          : 'Unicode character issues detected',
        severity: 'high',
      });
    }

    // Truncation detection
    if (this.options.checkForTruncation) {
      const isTruncated = this.detectTruncation(content);
      checks.push({
        id: 'truncation_detection',
        name: 'Truncation Detection',
        description: 'Detect content truncation',
        status: !isTruncated ? 'passed' : 'warning',
        score: !isTruncated ? 100 : 70,
        expectedValue: 'Complete content',
        actualValue: isTruncated ? 'May be truncated' : 'Complete content',
        message: !isTruncated ? 'Content appears complete' : 'Content may be truncated',
        severity: 'medium',
      });
    }

    const categoryScore = this.calculateCategoryScore(checks);
    const categoryStatus = this.determineCategoryStatus(checks);

    return {
      category: 'content_integrity',
      name: 'Content Integrity Validation',
      score: categoryScore,
      status: categoryStatus,
      critical: true,
      checks,
      summary: `Content integrity validation ${categoryStatus} with ${categoryScore}% score`,
    };
  }

  /**
   * Validate content format
   */
  private async validateContentFormat(
    content: string,
    metadata?: any
  ): Promise<CategoryValidationResult> {
    const checks: ValidationCheck[] = [];

    // Format compatibility
    if (metadata?.mimeType) {
      const formatAllowed = this.options.allowedFormats.includes(metadata.mimeType);
      checks.push({
        id: 'format_compatibility',
        name: 'Format Compatibility',
        description: 'Validate content format compatibility',
        status: formatAllowed ? 'passed' : 'failed',
        score: formatAllowed ? 100 : 0,
        expectedValue: `One of: ${this.options.allowedFormats.join(', ')}`,
        actualValue: metadata.mimeType,
        message: formatAllowed ? 'Format is compatible' : 'Format is not allowed',
        severity: 'high',
      });
    }

    // JSON validation (if applicable)
    if (metadata?.mimeType === 'application/json') {
      const jsonValid = this.validateJSONFormat(content);
      checks.push({
        id: 'json_validation',
        name: 'JSON Validation',
        description: 'Validate JSON format correctness',
        status: jsonValid ? 'passed' : 'failed',
        score: jsonValid ? 100 : 0,
        expectedValue: 'Valid JSON format',
        actualValue: jsonValid ? 'Valid JSON' : 'Invalid JSON',
        message: jsonValid ? 'JSON format is valid' : 'JSON format is invalid',
        severity: 'critical',
      });
    }

    const categoryScore = this.calculateCategoryScore(checks);
    const categoryStatus = this.determineCategoryStatus(checks);

    return {
      category: 'content_format',
      name: 'Content Format Validation',
      score: categoryScore,
      status: categoryStatus,
      critical: false,
      checks,
      summary: `Content format validation ${categoryStatus} with ${categoryScore}% score`,
    };
  }

  /**
   * Validate performance metrics
   */
  private async validatePerformance(content: string): Promise<CategoryValidationResult> {
    const checks: ValidationCheck[] = [];

    // Processing time validation
    const processingTime = Date.now() - this.startTime;
    checks.push({
      id: 'processing_time',
      name: 'Processing Time',
      description: 'Validate processing time within limits',
      status: processingTime <= this.options.maxProcessingTime ? 'passed' : 'warning',
      score: processingTime <= this.options.maxProcessingTime ? 100 : 70,
      expectedValue: `<= ${this.options.maxProcessingTime}ms`,
      actualValue: `${processingTime}ms`,
      message:
        processingTime <= this.options.maxProcessingTime
          ? 'Processing time is acceptable'
          : 'Processing time is high',
      severity: 'low',
    });

    // Memory usage estimation
    const memoryUsageMB = this.estimateMemoryUsage(content);
    checks.push({
      id: 'memory_usage',
      name: 'Memory Usage',
      description: 'Validate estimated memory usage',
      status: memoryUsageMB <= this.options.memoryLimitMB ? 'passed' : 'warning',
      score: memoryUsageMB <= this.options.memoryLimitMB ? 100 : 70,
      expectedValue: `<= ${this.options.memoryLimitMB}MB`,
      actualValue: `${memoryUsageMB}MB`,
      message:
        memoryUsageMB <= this.options.memoryLimitMB
          ? 'Memory usage is acceptable'
          : 'Memory usage is high',
      severity: 'low',
    });

    const categoryScore = this.calculateCategoryScore(checks);
    const categoryStatus = this.determineCategoryStatus(checks);

    return {
      category: 'performance',
      name: 'Performance Validation',
      score: categoryScore,
      status: categoryStatus,
      critical: false,
      checks,
      summary: `Performance validation ${categoryStatus} with ${categoryScore}% score`,
    };
  }

  /**
   * Run custom validations
   */
  private async runCustomValidations(content: string): Promise<CategoryValidationResult> {
    const checks: ValidationCheck[] = [];

    for (const validator of this.options.customValidators) {
      try {
        const result = validator.validate(content);
        checks.push(result);
      } catch (error) {
        checks.push({
          id: validator.id,
          name: validator.name,
          description: validator.description,
          status: 'failed',
          score: 0,
          message: `Custom validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: validator.critical ? 'critical' : 'medium',
        });
      }
    }

    const categoryScore = this.calculateCategoryScore(checks);
    const categoryStatus = this.determineCategoryStatus(checks);

    return {
      category: 'custom_validation',
      name: 'Custom Validation',
      score: categoryScore,
      status: categoryStatus,
      critical: this.options.customValidators.some(v => v.critical),
      checks,
      summary: `Custom validation ${categoryStatus} with ${categoryScore}% score`,
    };
  }

  // Helper methods
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  private countSentences(text: string): number {
    return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
  }

  private countParagraphs(text: string): number {
    return text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0).length;
  }

  private hasHeadings(text: string): boolean {
    return /^#{1,6}\s+.+$/m.test(text) || /<h[1-6][^>]*>.*?<\/h[1-6]>/i.test(text);
  }

  private validateLineBreaks(text: string): boolean {
    // Check for consistent line breaks
    const hasWindowsBreaks = text.includes('\r\n');
    const hasUnixBreaks = text.includes('\n');
    const hasMacBreaks = text.includes('\r');

    return !(hasWindowsBreaks && hasUnixBreaks && hasMacBreaks);
  }

  private detectCorruption(text: string): boolean {
    // Check for common corruption indicators
    const corruptionPatterns = [
      /\uFFFD/, // Replacement character
      /[\x00-\x08\x0E-\x1F\x7F]/, // Control characters
      /\u0000/, // Null characters
    ];

    return corruptionPatterns.some(pattern => pattern.test(text));
  }

  private validateUnicodeIntegrity(text: string): boolean {
    try {
      // Try to encode and decode to check for Unicode issues
      const encoded = new TextEncoder().encode(text);
      const decoded = new TextDecoder().decode(encoded);
      return decoded === text;
    } catch {
      return false;
    }
  }

  private detectTruncation(text: string): boolean {
    // Check for truncation indicators
    const truncationPatterns = [
      /\.\.\.$/, // Ends with ellipsis
      /\s+$/, // Ends with whitespace
      /[^.!?]$/, // Doesn't end with proper punctuation
    ];

    return truncationPatterns.some(pattern => pattern.test(text));
  }

  private validateEncoding(text: string): boolean {
    // Check for encoding issues
    return !text.includes('�') && !text.includes('\uFFFD');
  }

  private validateJSONFormat(content: string): boolean {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  private estimateMemoryUsage(content: string): number {
    // Simple estimation based on content length
    return Math.ceil(content.length / 1024 / 1024);
  }

  private getComplexityScore(complexity: string): number {
    const scores = {
      simple: 100,
      moderate: 85,
      complex: 70,
      very_complex: 60,
    };
    return scores[complexity as keyof typeof scores] || 70;
  }

  private calculateCategoryScore(checks: ValidationCheck[]): number {
    if (checks.length === 0) return 100;

    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    return Math.round(totalScore / checks.length);
  }

  private determineCategoryStatus(checks: ValidationCheck[]): 'passed' | 'failed' | 'warning' {
    const hasFailed = checks.some(check => check.status === 'failed');
    const hasWarning = checks.some(check => check.status === 'warning');

    if (hasFailed) return 'failed';
    if (hasWarning) return 'warning';
    return 'passed';
  }

  private calculateValidationSummary(): ValidationSummary {
    const totalCategories = this.validationResults.length;
    const passedCategories = this.validationResults.filter(r => r.status === 'passed').length;
    const failedCategories = this.validationResults.filter(r => r.status === 'failed').length;
    const criticalFailures = this.validationResults.filter(
      r => r.status === 'failed' && r.critical
    ).length;

    const warningCount = this.validationResults.reduce((count, result) => {
      return count + result.checks.filter(check => check.status === 'warning').length;
    }, 0);

    const overallScore = this.calculateOverallScore();
    const overallGrade = this.calculateGrade(overallScore);
    const readinessLevel = this.calculateReadinessLevel();

    return {
      totalCategories,
      passedCategories,
      failedCategories,
      criticalFailures,
      warningCount,
      overallGrade,
      readinessLevel,
    };
  }

  private calculateOverallScore(): number {
    if (this.validationResults.length === 0) return 0;

    const totalScore = this.validationResults.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / this.validationResults.length);
  }

  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private calculateReadinessLevel(): 'ready' | 'needs_review' | 'requires_fixes' | 'not_ready' {
    const criticalFailures = this.validationResults.filter(
      r => r.status === 'failed' && r.critical
    ).length;
    const overallScore = this.calculateOverallScore();

    if (criticalFailures > 0) return 'not_ready';
    if (overallScore >= 90) return 'ready';
    if (overallScore >= 70) return 'needs_review';
    return 'requires_fixes';
  }

  private determineOverallValidity(): boolean {
    const criticalFailures = this.validationResults.filter(
      r => r.status === 'failed' && r.critical
    ).length;
    return criticalFailures === 0;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    this.validationResults.forEach(result => {
      result.checks.forEach(check => {
        if (check.status === 'failed' || check.status === 'warning') {
          recommendations.push(`${result.name}: ${check.message}`);
        }
      });
    });

    return recommendations;
  }

  private extractCriticalIssues(): string[] {
    const criticalIssues: string[] = [];

    this.validationResults.forEach(result => {
      result.checks.forEach(check => {
        if (check.status === 'failed' && check.severity === 'critical') {
          criticalIssues.push(`${result.name}: ${check.message}`);
        }
      });
    });

    return criticalIssues;
  }

  private extractWarnings(): string[] {
    const warnings: string[] = [];

    this.validationResults.forEach(result => {
      result.checks.forEach(check => {
        if (check.status === 'warning') {
          warnings.push(`${result.name}: ${check.message}`);
        }
      });
    });

    return warnings;
  }

  /**
   * Get validation options
   */
  public getOptions(): ContentValidationOptions {
    return { ...this.options };
  }

  /**
   * Update validation options
   */
  public updateOptions(newOptions: Partial<ContentValidationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}

// Export utility functions
export const ContentValidatorUtils = {
  getDefaultOptions: (): ContentValidationOptions => ({ ...DEFAULT_VALIDATION_OPTIONS }),

  createValidationPreset: (
    preset: 'strict' | 'standard' | 'lenient' | 'basic'
  ): Partial<ContentValidationOptions> => {
    const presets: Record<string, Partial<ContentValidationOptions>> = {
      strict: {
        minContentLength: 50,
        minWordCount: 10,
        minSentenceCount: 2,
        minParagraphCount: 1,
        minReadabilityScore: 30,
        minLanguageConfidence: 0.8,
        requireProperEncoding: true,
        validateStructure: true,
        checkForCorruption: true,
        validateUnicode: true,
        strictModeEnabled: true,
      },
      standard: {
        ...DEFAULT_VALIDATION_OPTIONS,
      },
      lenient: {
        minContentLength: 5,
        minWordCount: 2,
        minSentenceCount: 1,
        minParagraphCount: 0,
        minReadabilityScore: 0,
        minLanguageConfidence: 0.3,
        requireProperEncoding: false,
        validateStructure: false,
        checkForCorruption: false,
        strictModeEnabled: false,
      },
      basic: {
        minContentLength: 1,
        minWordCount: 1,
        minSentenceCount: 0,
        minParagraphCount: 0,
        validateStructure: false,
        checkForCorruption: false,
        validateFormat: false,
        validatePerformance: false,
        skipOptionalChecks: true,
      },
    };

    return presets[preset] || presets.standard;
  },

  formatValidationResult: (result: ContentValidationResult): string => {
    const lines: string[] = [];

    lines.push(`Validation Result: ${result.isValid ? 'VALID' : 'INVALID'}`);
    lines.push(
      `Overall Score: ${result.overallScore}% (Grade: ${result.validationSummary.overallGrade})`
    );
    lines.push(`Readiness Level: ${result.validationSummary.readinessLevel.toUpperCase()}`);

    if (result.criticalIssues.length > 0) {
      lines.push(`\nCritical Issues (${result.criticalIssues.length}):`);
      result.criticalIssues.forEach(issue => lines.push(`  - ${issue}`));
    }

    if (result.warnings.length > 0) {
      lines.push(`\nWarnings (${result.warnings.length}):`);
      result.warnings.forEach(warning => lines.push(`  - ${warning}`));
    }

    return lines.join('\n');
  },
};

export default ContentValidator;
