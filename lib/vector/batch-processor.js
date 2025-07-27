// Batch Processing System for Multiple Text Embeddings
// Handles rate limiting, progress tracking, and efficient batch operations

const EmbeddingGenerator = require('./embedding-generator');

class BatchProcessor {
    constructor(config = {}) {
        this.embeddingGenerator = new EmbeddingGenerator(config.embeddingConfig || {});
        
        // Batch processing configuration
        this.batchSize = config.batchSize || 10;
        this.maxConcurrency = config.maxConcurrency || 5;
        this.rateLimitDelay = config.rateLimitDelay || 1000; // 1 second between batches
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 2000; // 2 seconds between retries
        
        // Progress tracking
        this.progressCallback = config.progressCallback || null;
        this.batchCallback = config.batchCallback || null;
        
        // Statistics
        this.stats = {
            totalTexts: 0,
            processedTexts: 0,
            successfulTexts: 0,
            failedTexts: 0,
            totalBatches: 0,
            processedBatches: 0,
            startTime: null,
            endTime: null,
            totalTokens: 0,
            estimatedCost: 0
        };
        
        this.isProcessing = false;
        this.shouldStop = false;
        this.currentBatch = 0;
    }

    /**
     * Process multiple texts in batches with rate limiting
     */
    async processBatch(texts, options = {}) {
        if (!Array.isArray(texts)) {
            throw new Error('Input must be an array of texts');
        }

        if (texts.length === 0) {
            return { success: true, results: [], stats: this.stats };
        }

        // Validate and clean texts
        const validTexts = this.validateAndCleanTexts(texts);
        if (validTexts.length === 0) {
            throw new Error('No valid texts provided for processing');
        }

        // Initialize processing
        this.initializeProcessing(validTexts, options);

        try {
            const results = await this.executeProcessing(validTexts, options);
            return this.finalizeBatch(results);
        } catch (error) {
            this.finalizeWithError(error);
            throw error;
        }
    }

    /**
     * Initialize batch processing
     */
    initializeProcessing(texts, options = {}) {
        this.isProcessing = true;
        this.shouldStop = false;
        this.currentBatch = 0;
        
        // Initialize stats
        this.stats = {
            totalTexts: texts.length,
            processedTexts: 0,
            successfulTexts: 0,
            failedTexts: 0,
            totalBatches: Math.ceil(texts.length / this.batchSize),
            processedBatches: 0,
            startTime: Date.now(),
            endTime: null,
            totalTokens: 0,
            estimatedCost: 0
        };

        console.log(`🚀 Starting batch processing: ${texts.length} texts in ${this.stats.totalBatches} batches`);
        
        if (this.progressCallback) {
            this.progressCallback({
                phase: 'started',
                progress: 0,
                stats: { ...this.stats }
            });
        }
    }

    /**
     * Execute the main processing logic
     */
    async executeProcessing(texts, options = {}) {
        const results = [];
        const chunks = this.chunkArray(texts, this.batchSize);

        // Process chunks with rate limiting
        for (let i = 0; i < chunks.length; i++) {
            if (this.shouldStop) {
                console.log('⚠️ Processing stopped by user request');
                break;
            }

            this.currentBatch = i + 1;
            const chunk = chunks[i];
            
            console.log(`📦 Processing batch ${this.currentBatch}/${chunks.length} (${chunk.length} texts)`);
            
            // Process current batch
            const batchResults = await this.processSingleBatch(chunk, i);
            results.push(...batchResults);

            // Update statistics
            this.updateBatchStats(batchResults);

            // Progress callback
            if (this.progressCallback) {
                this.progressCallback({
                    phase: 'processing',
                    progress: (this.currentBatch / chunks.length) * 100,
                    batchNumber: this.currentBatch,
                    totalBatches: chunks.length,
                    stats: { ...this.stats }
                });
            }

            // Rate limiting between batches
            if (i < chunks.length - 1) {
                console.log(`⏱️ Rate limiting: waiting ${this.rateLimitDelay}ms before next batch`);
                await this.sleep(this.rateLimitDelay);
            }
        }

        return results;
    }

    /**
     * Process a single batch of texts
     */
    async processSingleBatch(texts, batchIndex) {
        const results = [];
        const concurrentPromises = [];

        // Create processing promises with concurrency control
        for (let i = 0; i < texts.length; i += this.maxConcurrency) {
            const chunk = texts.slice(i, i + this.maxConcurrency);
            
            const chunkPromises = chunk.map(async (text, index) => {
                const textIndex = batchIndex * this.batchSize + i + index;
                return this.processTextWithRetry(text, textIndex);
            });

            concurrentPromises.push(...chunkPromises);
        }

        // Wait for all promises to resolve
        const batchResults = await Promise.allSettled(concurrentPromises);

        // Process results
        for (let i = 0; i < batchResults.length; i++) {
            const result = batchResults[i];
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                results.push({
                    success: false,
                    error: result.reason?.message || 'Unknown error',
                    textIndex: batchIndex * this.batchSize + i,
                    text: texts[i]
                });
            }
        }

        // Batch callback
        if (this.batchCallback) {
            this.batchCallback({
                batchNumber: batchIndex + 1,
                batchSize: texts.length,
                results: results,
                stats: { ...this.stats }
            });
        }

        return results;
    }

    /**
     * Process single text with retry logic
     */
    async processTextWithRetry(text, textIndex) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const result = await this.embeddingGenerator.generateSingleEmbedding(text);
                
                if (result.success) {
                    return {
                        success: true,
                        textIndex: textIndex,
                        text: text,
                        embedding: result.vector,
                        dimensions: result.dimensions,
                        usage: result.usage,
                        metadata: {
                            ...result.metadata,
                            attempt: attempt,
                            processingTime: Date.now()
                        }
                    };
                } else {
                    lastError = result.error;
                    if (attempt < this.retryAttempts) {
                        console.log(`⚠️ Attempt ${attempt} failed for text ${textIndex}: ${lastError}`);
                        await this.sleep(this.retryDelay * attempt); // Exponential backoff
                    }
                }
            } catch (error) {
                lastError = error.message;
                if (attempt < this.retryAttempts) {
                    console.log(`⚠️ Attempt ${attempt} failed for text ${textIndex}: ${lastError}`);
                    await this.sleep(this.retryDelay * attempt);
                }
            }
        }

        return {
            success: false,
            textIndex: textIndex,
            text: text,
            error: lastError,
            attempts: this.retryAttempts
        };
    }

    /**
     * Update batch statistics
     */
    updateBatchStats(batchResults) {
        this.stats.processedBatches++;
        
        batchResults.forEach(result => {
            this.stats.processedTexts++;
            
            if (result.success) {
                this.stats.successfulTexts++;
                if (result.usage) {
                    this.stats.totalTokens += result.usage.total_tokens || 0;
                    this.stats.estimatedCost += (result.usage.total_tokens || 0) * 0.00002; // Approximate cost
                }
            } else {
                this.stats.failedTexts++;
            }
        });

        // Progress logging
        const progress = (this.stats.processedTexts / this.stats.totalTexts) * 100;
        console.log(`📊 Progress: ${this.stats.processedTexts}/${this.stats.totalTexts} texts (${progress.toFixed(1)}%)`);
        console.log(`   ✅ Successful: ${this.stats.successfulTexts} | ❌ Failed: ${this.stats.failedTexts}`);
    }

    /**
     * Finalize batch processing
     */
    finalizeBatch(results) {
        this.stats.endTime = Date.now();
        this.stats.totalDuration = this.stats.endTime - this.stats.startTime;
        this.isProcessing = false;

        const successRate = (this.stats.successfulTexts / this.stats.totalTexts) * 100;
        
        console.log('\n🎉 BATCH PROCESSING COMPLETED!');
        console.log(`📊 Final Statistics:`);
        console.log(`   Total texts: ${this.stats.totalTexts}`);
        console.log(`   Successful: ${this.stats.successfulTexts} (${successRate.toFixed(1)}%)`);
        console.log(`   Failed: ${this.stats.failedTexts}`);
        console.log(`   Total batches: ${this.stats.totalBatches}`);
        console.log(`   Total tokens: ${this.stats.totalTokens}`);
        console.log(`   Estimated cost: $${this.stats.estimatedCost.toFixed(6)}`);
        console.log(`   Duration: ${this.stats.totalDuration}ms`);
        console.log(`   Average time per text: ${(this.stats.totalDuration / this.stats.totalTexts).toFixed(2)}ms`);

        if (this.progressCallback) {
            this.progressCallback({
                phase: 'completed',
                progress: 100,
                stats: { ...this.stats }
            });
        }

        return {
            success: true,
            results: results,
            stats: { ...this.stats }
        };
    }

    /**
     * Finalize with error
     */
    finalizeWithError(error) {
        this.stats.endTime = Date.now();
        this.stats.totalDuration = this.stats.endTime - this.stats.startTime;
        this.isProcessing = false;

        console.error(`❌ Batch processing failed: ${error.message}`);
        
        if (this.progressCallback) {
            this.progressCallback({
                phase: 'error',
                error: error.message,
                stats: { ...this.stats }
            });
        }
    }

    /**
     * Stop processing
     */
    stop() {
        this.shouldStop = true;
        console.log('🛑 Stop signal sent to batch processor');
    }

    /**
     * Validate and clean input texts
     */
    validateAndCleanTexts(texts) {
        const validTexts = [];
        
        texts.forEach((text, index) => {
            if (typeof text === 'string' && text.trim().length > 0) {
                validTexts.push(text.trim());
            } else {
                console.warn(`⚠️ Skipping invalid text at index ${index}: ${typeof text}`);
            }
        });

        return validTexts;
    }

    /**
     * Chunk array into smaller arrays
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current statistics
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Get processing status
     */
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            shouldStop: this.shouldStop,
            currentBatch: this.currentBatch,
            stats: { ...this.stats }
        };
    }

    /**
     * Reset processor state
     */
    reset() {
        this.isProcessing = false;
        this.shouldStop = false;
        this.currentBatch = 0;
        this.stats = {
            totalTexts: 0,
            processedTexts: 0,
            successfulTexts: 0,
            failedTexts: 0,
            totalBatches: 0,
            processedBatches: 0,
            startTime: null,
            endTime: null,
            totalTokens: 0,
            estimatedCost: 0
        };
        console.log('🔄 Batch processor reset');
    }
}

module.exports = BatchProcessor; 