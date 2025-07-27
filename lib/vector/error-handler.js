// Error Handling System for Embedding Operations
// Implements retry logic, circuit breaker pattern, and comprehensive error recovery

class EmbeddingErrorHandler {
    constructor(config = {}) {
        // Retry configuration
        this.maxRetries = config.maxRetries || 3;
        this.baseDelay = config.baseDelay || 1000; // Base delay in milliseconds
        this.maxDelay = config.maxDelay || 30000; // Maximum delay (30 seconds)
        this.backoffMultiplier = config.backoffMultiplier || 2;
        this.jitterEnabled = config.jitterEnabled || true;
        
        // Circuit breaker configuration
        this.failureThreshold = config.failureThreshold || 5;
        this.recoveryTimeout = config.recoveryTimeout || 60000; // 1 minute
        this.halfOpenMaxCalls = config.halfOpenMaxCalls || 3;
        
        // Circuit breaker state
        this.circuitState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.halfOpenCalls = 0;
        
        // Error statistics
        this.errorStats = {
            totalErrors: 0,
            retryableErrors: 0,
            nonRetryableErrors: 0,
            retriesAttempted: 0,
            retriesSuccessful: 0,
            circuitBreakerTrips: 0,
            errorsByType: new Map(),
            errorsByStatus: new Map()
        };
        
        // Error type classifications
        this.retryableErrors = new Set([
            'RATE_LIMIT_EXCEEDED',
            'TIMEOUT',
            'NETWORK_ERROR',
            'SERVER_ERROR',
            'TEMPORARY_FAILURE',
            'QUOTA_EXCEEDED'
        ]);
        
        this.nonRetryableErrors = new Set([
            'INVALID_API_KEY',
            'INVALID_REQUEST',
            'AUTHENTICATION_ERROR',
            'PERMISSION_DENIED',
            'NOT_FOUND',
            'MALFORMED_REQUEST'
        ]);
        
        // HTTP status code mappings
        this.retryableStatusCodes = new Set([
            429, // Too Many Requests
            500, // Internal Server Error
            502, // Bad Gateway
            503, // Service Unavailable
            504, // Gateway Timeout
            507, // Insufficient Storage
            508, // Loop Detected
            510, // Not Extended
            511  // Network Authentication Required
        ]);
        
        this.nonRetryableStatusCodes = new Set([
            400, // Bad Request
            401, // Unauthorized
            403, // Forbidden
            404, // Not Found
            405, // Method Not Allowed
            406, // Not Acceptable
            408, // Request Timeout (sometimes retryable)
            409, // Conflict
            410, // Gone
            411, // Length Required
            412, // Precondition Failed
            413, // Payload Too Large
            414, // URI Too Long
            415, // Unsupported Media Type
            416, // Range Not Satisfiable
            417, // Expectation Failed
            422, // Unprocessable Entity
            423, // Locked
            424, // Failed Dependency
            426, // Upgrade Required
            428, // Precondition Required
            431, // Request Header Fields Too Large
            451  // Unavailable For Legal Reasons
        ]);
        
        console.log('🛡️ Error Handler initialized with comprehensive retry logic');
    }

    /**
     * Execute operation with error handling and retry logic
     */
    async executeWithRetry(operation, context = {}) {
        const operationId = context.operationId || this.generateOperationId();
        const startTime = Date.now();
        
        console.log(`🔄 Starting operation ${operationId} with retry logic`);
        
        // Check circuit breaker
        if (!this.canExecute()) {
            const error = new Error('Circuit breaker is OPEN - operation blocked');
            error.code = 'CIRCUIT_BREAKER_OPEN';
            error.operationId = operationId;
            this.recordError(error, context);
            throw error;
        }
        
        let lastError = null;
        let attempt = 0;
        
        while (attempt <= this.maxRetries) {
            try {
                // Record half-open call for circuit breaker
                if (this.circuitState === 'HALF_OPEN') {
                    this.halfOpenCalls++;
                }
                
                console.log(`⚡ Attempt ${attempt + 1}/${this.maxRetries + 1} for operation ${operationId}`);
                
                // Execute the operation
                const result = await operation();
                
                // Operation succeeded
                const duration = Date.now() - startTime;
                console.log(`✅ Operation ${operationId} succeeded after ${attempt + 1} attempts (${duration}ms)`);
                
                // Reset circuit breaker on success
                this.onSuccess();
                
                // Record retry success if this wasn't the first attempt
                if (attempt > 0) {
                    this.errorStats.retriesSuccessful++;
                }
                
                return {
                    success: true,
                    result: result,
                    attempts: attempt + 1,
                    duration: duration,
                    operationId: operationId
                };
                
            } catch (error) {
                lastError = error;
                attempt++;
                
                // Enhance error with context
                error.operationId = operationId;
                error.attempt = attempt;
                error.maxRetries = this.maxRetries;
                
                // Classify error
                const errorType = this.classifyError(error);
                const shouldRetry = this.shouldRetry(error, attempt);
                
                console.log(`❌ Attempt ${attempt}/${this.maxRetries + 1} failed: ${error.message}`);
                console.log(`🔍 Error type: ${errorType}, Should retry: ${shouldRetry}`);
                
                // Record error statistics
                this.recordError(error, context);
                
                // Check if we should retry
                if (shouldRetry && attempt <= this.maxRetries) {
                    const delay = this.calculateDelay(attempt, error);
                    console.log(`⏱️ Waiting ${delay}ms before retry ${attempt + 1}`);
                    
                    await this.sleep(delay);
                    this.errorStats.retriesAttempted++;
                    continue;
                }
                
                // No more retries or non-retryable error
                break;
            }
        }
        
        // All retries exhausted
        const duration = Date.now() - startTime;
        console.log(`💥 Operation ${operationId} failed after ${attempt} attempts (${duration}ms)`);
        
        // Record failure for circuit breaker
        this.onFailure();
        
        // Enhance final error
        lastError.operationId = operationId;
        lastError.totalAttempts = attempt;
        lastError.totalDuration = duration;
        lastError.finalFailure = true;
        
        throw lastError;
    }

    /**
     * Classify error type for retry logic
     */
    classifyError(error) {
        // Check specific error codes
        if (error.code && this.retryableErrors.has(error.code)) {
            return 'RETRYABLE';
        }
        
        if (error.code && this.nonRetryableErrors.has(error.code)) {
            return 'NON_RETRYABLE';
        }
        
        // Check HTTP status codes
        if (error.status || error.statusCode) {
            const status = error.status || error.statusCode;
            
            if (this.retryableStatusCodes.has(status)) {
                return 'RETRYABLE';
            }
            
            if (this.nonRetryableStatusCodes.has(status)) {
                return 'NON_RETRYABLE';
            }
        }
        
        // Check error message patterns
        const message = error.message.toLowerCase();
        
        if (message.includes('rate limit') || message.includes('quota') || 
            message.includes('timeout') || message.includes('network') ||
            message.includes('connection') || message.includes('server error')) {
            return 'RETRYABLE';
        }
        
        if (message.includes('invalid') || message.includes('unauthorized') ||
            message.includes('forbidden') || message.includes('not found') ||
            message.includes('bad request')) {
            return 'NON_RETRYABLE';
        }
        
        // Default to retryable for unknown errors
        return 'RETRYABLE';
    }

    /**
     * Determine if error should be retried
     */
    shouldRetry(error, attempt) {
        // Check if we have attempts left
        if (attempt > this.maxRetries) {
            return false;
        }
        
        // Check circuit breaker
        if (this.circuitState === 'OPEN') {
            return false;
        }
        
        // Check if error is retryable
        const errorType = this.classifyError(error);
        if (errorType === 'NON_RETRYABLE') {
            return false;
        }
        
        // Check specific conditions
        if (error.code === 'INVALID_API_KEY') {
            return false;
        }
        
        if (error.code === 'QUOTA_EXCEEDED') {
            // Retry quota errors with longer delays
            return true;
        }
        
        return true;
    }

    /**
     * Calculate delay for retry with exponential backoff
     */
    calculateDelay(attempt, error) {
        // Base exponential backoff
        let delay = this.baseDelay * Math.pow(this.backoffMultiplier, attempt - 1);
        
        // Add jitter to prevent thundering herd
        if (this.jitterEnabled) {
            const jitter = Math.random() * 0.5 * delay;
            delay = delay + jitter;
        }
        
        // Special handling for rate limit errors
        if (error.code === 'RATE_LIMIT_EXCEEDED' || error.status === 429) {
            // Check for Retry-After header
            if (error.retryAfter) {
                const retryAfter = parseInt(error.retryAfter) * 1000;
                delay = Math.max(delay, retryAfter);
            } else {
                // Default rate limit delay
                delay = Math.max(delay, 60000); // 1 minute minimum
            }
        }
        
        // Cap at maximum delay
        delay = Math.min(delay, this.maxDelay);
        
        return Math.round(delay);
    }

    /**
     * Circuit breaker methods
     */
    canExecute() {
        switch (this.circuitState) {
            case 'CLOSED':
                return true;
                
            case 'OPEN':
                // Check if recovery timeout has elapsed
                if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
                    this.circuitState = 'HALF_OPEN';
                    this.halfOpenCalls = 0;
                    console.log('🔄 Circuit breaker transitioning to HALF_OPEN');
                    return true;
                }
                return false;
                
            case 'HALF_OPEN':
                return this.halfOpenCalls < this.halfOpenMaxCalls;
                
            default:
                return false;
        }
    }

    onSuccess() {
        if (this.circuitState === 'HALF_OPEN') {
            console.log('✅ Circuit breaker transitioning to CLOSED');
            this.circuitState = 'CLOSED';
            this.failureCount = 0;
            this.halfOpenCalls = 0;
        } else if (this.circuitState === 'CLOSED') {
            this.failureCount = 0;
        }
    }

    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        if (this.circuitState === 'HALF_OPEN') {
            console.log('❌ Circuit breaker transitioning to OPEN (half-open failure)');
            this.circuitState = 'OPEN';
            this.errorStats.circuitBreakerTrips++;
        } else if (this.circuitState === 'CLOSED' && this.failureCount >= this.failureThreshold) {
            console.log(`❌ Circuit breaker OPEN (${this.failureCount} failures >= ${this.failureThreshold})`);
            this.circuitState = 'OPEN';
            this.errorStats.circuitBreakerTrips++;
        }
    }

    /**
     * Record error statistics
     */
    recordError(error, context = {}) {
        this.errorStats.totalErrors++;
        
        const errorType = this.classifyError(error);
        if (errorType === 'RETRYABLE') {
            this.errorStats.retryableErrors++;
        } else {
            this.errorStats.nonRetryableErrors++;
        }
        
        // Record by error type
        const errorCode = error.code || 'UNKNOWN';
        this.errorStats.errorsByType.set(
            errorCode,
            (this.errorStats.errorsByType.get(errorCode) || 0) + 1
        );
        
        // Record by status code
        if (error.status || error.statusCode) {
            const status = error.status || error.statusCode;
            this.errorStats.errorsByStatus.set(
                status,
                (this.errorStats.errorsByStatus.get(status) || 0) + 1
            );
        }
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const totalRetries = this.errorStats.retriesAttempted;
        const successfulRetries = this.errorStats.retriesSuccessful;
        const retrySuccessRate = totalRetries > 0 ? (successfulRetries / totalRetries) * 100 : 0;
        
        return {
            ...this.errorStats,
            retrySuccessRate: retrySuccessRate,
            circuitBreakerState: this.circuitState,
            currentFailures: this.failureCount,
            errorsByType: Object.fromEntries(this.errorStats.errorsByType),
            errorsByStatus: Object.fromEntries(this.errorStats.errorsByStatus)
        };
    }

    /**
     * Reset error statistics
     */
    resetStats() {
        this.errorStats = {
            totalErrors: 0,
            retryableErrors: 0,
            nonRetryableErrors: 0,
            retriesAttempted: 0,
            retriesSuccessful: 0,
            circuitBreakerTrips: 0,
            errorsByType: new Map(),
            errorsByStatus: new Map()
        };
        
        console.log('📊 Error statistics reset');
    }

    /**
     * Reset circuit breaker
     */
    resetCircuitBreaker() {
        this.circuitState = 'CLOSED';
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.halfOpenCalls = 0;
        
        console.log('🔄 Circuit breaker reset to CLOSED');
    }

    /**
     * Utility methods
     */
    generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create standardized error
     */
    createError(message, code, details = {}) {
        const error = new Error(message);
        error.code = code;
        error.timestamp = Date.now();
        Object.assign(error, details);
        return error;
    }

    /**
     * Wrap function with error handling
     */
    wrapFunction(fn, context = {}) {
        return async (...args) => {
            return this.executeWithRetry(
                () => fn.apply(this, args),
                context
            );
        };
    }
}

module.exports = EmbeddingErrorHandler; 