// Embedding Generation System
// Handles single and batch embedding generation with OpenAI API

const OpenAI = require('openai');

class EmbeddingGenerator {
    constructor(options = {}) {
        this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
        this.model = options.model || 'text-embedding-3-small';
        this.dimensions = options.dimensions || 1536;
        this.timeout = options.timeout || 30000;
        this.maxRetries = options.maxRetries || 3;
        
        if (!this.apiKey) {
            console.warn('⚠️ No OpenAI API key provided. Embedding generation will fail.');
            console.warn('💡 Add OPENAI_API_KEY to environment or pass apiKey option');
        }

        this.openai = new OpenAI({
            apiKey: this.apiKey || 'dummy-key'
        });

        // Embedding generation statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            totalCost: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }

    /**
     * Generate embedding for a single text
     * @param {string} text - Text to generate embedding for
     * @param {Object} options - Optional parameters
     * @returns {Promise<Object>} - Embedding result with vector and metadata
     */
    async generateSingleEmbedding(text, options = {}) {
        console.log(`🧠 Generating embedding for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        
        try {
            // Input validation
            if (!text || typeof text !== 'string') {
                throw new Error('Text must be a non-empty string');
            }

            if (text.trim().length === 0) {
                throw new Error('Text cannot be empty or whitespace only');
            }

            if (text.length > 8000) {
                console.warn(`⚠️ Text length (${text.length}) exceeds recommended limit (8000 chars)`);
            }

            if (!this.apiKey || this.apiKey === 'dummy-key') {
                throw new Error('Valid OpenAI API key required for embedding generation');
            }

            // Prepare request
            const startTime = Date.now();
            this.stats.totalRequests++;

            const requestOptions = {
                model: options.model || this.model,
                input: text.trim(),
                ...options.apiOptions
            };

            // Add dimensions for text-embedding-3-small/large
            if (this.model.includes('text-embedding-3')) {
                requestOptions.dimensions = options.dimensions || this.dimensions;
            }

            console.log(`📊 Request details: model=${requestOptions.model}, dimensions=${requestOptions.dimensions || 'default'}`);

            // Make API call with retry logic
            let lastError;
            for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                try {
                    const response = await this.openai.embeddings.create(requestOptions);
                    
                    const endTime = Date.now();
                    const duration = endTime - startTime;

                    // Extract embedding data
                    const embedding = response.data[0];
                    const vector = embedding.embedding;
                    
                    // Update statistics
                    this.stats.successfulRequests++;
                    this.stats.totalTokens += response.usage.total_tokens;
                    this.stats.totalCost += this.calculateCost(response.usage.total_tokens);

                    console.log(`✅ Embedding generated successfully in ${duration}ms`);
                    console.log(`📊 Tokens used: ${response.usage.total_tokens}, Vector dimensions: ${vector.length}`);

                    // Return structured result
                    return {
                        success: true,
                        vector: vector,
                        dimensions: vector.length,
                        model: requestOptions.model,
                        usage: response.usage,
                        metadata: {
                            text: text,
                            textLength: text.length,
                            tokenCount: response.usage.total_tokens,
                            generatedAt: new Date().toISOString(),
                            duration: duration,
                            attempt: attempt
                        }
                    };

                } catch (error) {
                    lastError = error;
                    console.warn(`⚠️ Attempt ${attempt}/${this.maxRetries} failed: ${error.message}`);
                    
                    if (attempt < this.maxRetries) {
                        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                        console.log(`⏳ Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            // All retries failed
            this.stats.failedRequests++;
            throw new Error(`Failed after ${this.maxRetries} attempts. Last error: ${lastError.message}`);

        } catch (error) {
            console.error(`❌ Embedding generation failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                vector: null,
                metadata: {
                    text: text,
                    textLength: text ? text.length : 0,
                    failedAt: new Date().toISOString(),
                    errorType: error.code || 'unknown'
                }
            };
        }
    }

    /**
     * Validate embedding vector
     * @param {Array<number>} vector - Embedding vector to validate
     * @returns {Object} - Validation result
     */
    validateEmbedding(vector) {
        console.log('🔍 Validating embedding vector...');
        
        const validation = {
            isValid: true,
            issues: [],
            vector: vector,
            dimensions: vector ? vector.length : 0
        };

        try {
            // Check if vector exists
            if (!vector) {
                validation.isValid = false;
                validation.issues.push('Vector is null or undefined');
                return validation;
            }

            // Check if vector is array
            if (!Array.isArray(vector)) {
                validation.isValid = false;
                validation.issues.push('Vector must be an array');
                return validation;
            }

            // Check dimensions
            if (vector.length !== this.dimensions) {
                validation.isValid = false;
                validation.issues.push(`Expected ${this.dimensions} dimensions, got ${vector.length}`);
            }

            // Check for valid numbers
            const invalidIndices = [];
            vector.forEach((value, index) => {
                if (typeof value !== 'number' || !isFinite(value)) {
                    invalidIndices.push(index);
                }
            });

            if (invalidIndices.length > 0) {
                validation.isValid = false;
                validation.issues.push(`Invalid values at indices: ${invalidIndices.slice(0, 5).join(', ')}${invalidIndices.length > 5 ? '...' : ''}`);
            }

            // Calculate vector magnitude for additional validation
            const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
            validation.magnitude = magnitude;

            if (magnitude === 0) {
                validation.isValid = false;
                validation.issues.push('Vector has zero magnitude');
            }

            // Check for reasonable magnitude (OpenAI embeddings typically have magnitude ~0.4-1.0)
            if (magnitude > 10 || magnitude < 0.01) {
                validation.issues.push(`Unusual vector magnitude: ${magnitude.toFixed(6)} (expected ~0.1-2.0)`);
            }

            console.log(`✅ Vector validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
            if (validation.issues.length > 0) {
                console.log(`⚠️ Issues found: ${validation.issues.join(', ')}`);
            }

            return validation;

        } catch (error) {
            validation.isValid = false;
            validation.issues.push(`Validation error: ${error.message}`);
            return validation;
        }
    }

    /**
     * Calculate embedding generation cost
     * @param {number} tokens - Number of tokens used
     * @returns {number} - Cost in USD
     */
    calculateCost(tokens) {
        // OpenAI pricing for text-embedding-3-small: $0.00002 per 1K tokens
        const pricePerToken = 0.00002 / 1000;
        return tokens * pricePerToken;
    }

    /**
     * Get generation statistics
     * @returns {Object} - Current statistics
     */
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalRequests > 0 ? 
                (this.stats.successfulRequests / this.stats.totalRequests) * 100 : 0,
            averageTokensPerRequest: this.stats.successfulRequests > 0 ? 
                this.stats.totalTokens / this.stats.successfulRequests : 0,
            estimatedCost: this.stats.totalCost
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            totalCost: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        console.log('📊 Statistics reset');
    }
}

module.exports = EmbeddingGenerator; 