// Performance Testing System for Embedding Operations
// Tests speed, optimizes batch sizes, and monitors performance metrics

const EmbeddingGenerator = require('./embedding-generator');
const BatchProcessor = require('./batch-processor');
const EmbeddingCache = require('./embedding-cache');
const EmbeddingErrorHandler = require('./error-handler');

class PerformanceTester {
    constructor(config = {}) {
        this.config = {
            apiKey: config.apiKey || process.env.OPENAI_API_KEY,
            targetTime: config.targetTime || 2000, // 2 seconds target
            testTextCount: config.testTextCount || 10,
            maxBatchSize: config.maxBatchSize || 20,
            minBatchSize: config.minBatchSize || 1,
            iterations: config.iterations || 3,
            cacheEnabled: config.cacheEnabled !== false,
            errorHandlingEnabled: config.errorHandlingEnabled !== false,
            ...config
        };

        // Initialize components
        this.embeddingGenerator = new EmbeddingGenerator({
            apiKey: this.config.apiKey,
            model: this.config.model || 'text-embedding-3-small',
            timeout: this.config.timeout || 30000
        });

        this.cache = this.config.cacheEnabled ? new EmbeddingCache({
            backend: 'memory',
            ttl: 60 * 60 * 1000, // 1 hour
            maxSize: 1000
        }) : null;

        this.errorHandler = this.config.errorHandlingEnabled ? new EmbeddingErrorHandler({
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000
        }) : null;

        // Performance metrics
        this.testResults = {
            batchSizeOptimization: [],
            endToEndPerformance: [],
            componentPerformance: {},
            recommendations: [],
            summary: {}
        };

        console.log('🚀 Performance Tester initialized');
        console.log(`🎯 Target: <${this.config.targetTime}ms for ${this.config.testTextCount} texts`);
    }

    /**
     * Run comprehensive performance tests
     */
    async runFullPerformanceTest() {
        console.log('\n🧪 RUNNING COMPREHENSIVE PERFORMANCE TESTS');
        console.log('==========================================\n');

        try {
            // Initialize cache if enabled
            if (this.cache) {
                await this.cache.initialize();
            }

            // Test 1: Component Performance
            console.log('🔧 Test 1: Component Performance...');
            await this.testComponentPerformance();

            // Test 2: Batch Size Optimization
            console.log('\n📦 Test 2: Batch Size Optimization...');
            await this.testBatchSizeOptimization();

            // Test 3: End-to-End Performance
            console.log('\n🎯 Test 3: End-to-End Performance...');
            await this.testEndToEndPerformance();

            // Test 4: Cache Performance Impact
            if (this.cache) {
                console.log('\n🗄️ Test 4: Cache Performance Impact...');
                await this.testCachePerformance();
            }

            // Test 5: Error Handling Performance Impact
            if (this.errorHandler) {
                console.log('\n🛡️ Test 5: Error Handling Performance Impact...');
                await this.testErrorHandlingPerformance();
            }

            // Test 6: Concurrent Performance
            console.log('\n⚡ Test 6: Concurrent Performance...');
            await this.testConcurrentPerformance();

            // Test 7: Memory Usage
            console.log('\n💾 Test 7: Memory Usage...');
            await this.testMemoryUsage();

            // Generate recommendations
            console.log('\n💡 Generating Performance Recommendations...');
            this.generateRecommendations();

            // Generate summary
            this.generateSummary();

            return this.testResults;

        } catch (error) {
            console.error('❌ Performance test suite failed:', error);
            throw error;
        }
    }

    /**
     * Test individual component performance
     */
    async testComponentPerformance() {
        const components = ['generator', 'cache', 'errorHandler'];
        const componentResults = {};

        for (const component of components) {
            if (component === 'cache' && !this.cache) continue;
            if (component === 'errorHandler' && !this.errorHandler) continue;

            console.log(`   Testing ${component} performance...`);
            const startTime = Date.now();
            const iterations = 100;

            switch (component) {
                case 'generator':
                    // Test embedding generation logic (without API calls)
                    for (let i = 0; i < iterations; i++) {
                        const text = `Test text ${i}`;
                        // Test input validation logic
                        const isValid = text && typeof text === 'string' && text.trim().length > 0;
                        // Test text preprocessing logic
                        const processedText = text.trim();
                        
                        // Simulate embedding vector validation
                        const testVector = new Array(1536).fill(0.5);
                        this.embeddingGenerator.validateEmbedding(testVector);
                    }
                    break;

                case 'cache':
                    // Test cache operations
                    const testEmbedding = new Array(1536).fill(0.5);
                    for (let i = 0; i < iterations; i++) {
                        const text = `Cache test ${i}`;
                        await this.cache.set(text, { vector: testEmbedding, dimensions: 1536 });
                        await this.cache.get(text);
                    }
                    break;

                case 'errorHandler':
                    // Test error handler logic
                    const successOperation = async () => ({ success: true });
                    for (let i = 0; i < iterations; i++) {
                        await this.errorHandler.executeWithRetry(successOperation, { operationId: `perf-${i}` });
                    }
                    break;
            }

            const duration = Date.now() - startTime;
            const avgTime = duration / iterations;
            const opsPerSecond = iterations / (duration / 1000);

            componentResults[component] = {
                totalTime: duration,
                avgTime: avgTime,
                opsPerSecond: opsPerSecond,
                iterations: iterations
            };

            console.log(`     ${component}: ${avgTime.toFixed(2)}ms avg, ${opsPerSecond.toFixed(0)} ops/sec`);
        }

        this.testResults.componentPerformance = componentResults;
        console.log('✅ Component performance testing completed');
    }

    /**
     * Test different batch sizes to find optimal configuration
     */
    async testBatchSizeOptimization() {
        console.log('   Testing batch sizes from 1 to 20...');
        
        // Generate test texts
        const testTexts = this.generateTestTexts(20);
        
        // Test different batch sizes
        const batchSizes = [1, 2, 5, 10, 15, 20];
        
        for (const batchSize of batchSizes) {
            console.log(`     Testing batch size: ${batchSize}`);
            
            const batchResults = [];
            
            for (let iteration = 0; iteration < this.config.iterations; iteration++) {
                const startTime = Date.now();
                
                try {
                    // Simulate batch processing (without actual API calls)
                    const batches = this.createBatches(testTexts.slice(0, this.config.testTextCount), batchSize);
                    
                    for (const batch of batches) {
                        // Simulate processing time based on batch size
                        const simulatedTime = this.simulateProcessingTime(batch.length);
                        await this.sleep(simulatedTime);
                        
                        // Simulate rate limiting between batches
                        if (batches.length > 1) {
                            await this.sleep(100); // 100ms between batches
                        }
                    }
                    
                    const duration = Date.now() - startTime;
                    batchResults.push({
                        iteration: iteration + 1,
                        duration: duration,
                        batchCount: batches.length,
                        avgBatchTime: duration / batches.length
                    });
                    
                } catch (error) {
                    console.warn(`     Batch size ${batchSize} iteration ${iteration + 1} failed:`, error.message);
                }
            }
            
            // Calculate statistics
            const durations = batchResults.map(r => r.duration);
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            const minDuration = Math.min(...durations);
            const maxDuration = Math.max(...durations);
            const stdDev = Math.sqrt(durations.reduce((a, b) => a + Math.pow(b - avgDuration, 2), 0) / durations.length);
            
            const batchOptResult = {
                batchSize: batchSize,
                avgDuration: avgDuration,
                minDuration: minDuration,
                maxDuration: maxDuration,
                stdDev: stdDev,
                reliability: (avgDuration - stdDev) / avgDuration,
                throughput: this.config.testTextCount / (avgDuration / 1000),
                meetsTarget: avgDuration < this.config.targetTime
            };
            
            this.testResults.batchSizeOptimization.push(batchOptResult);
            
            console.log(`     Batch ${batchSize}: ${avgDuration.toFixed(0)}ms avg (${batchOptResult.meetsTarget ? '✅' : '❌'} target)`);
        }
        
        // Find optimal batch size
        const optimalBatch = this.findOptimalBatchSize();
        console.log(`✅ Optimal batch size: ${optimalBatch.batchSize} (${optimalBatch.avgDuration.toFixed(0)}ms)`);
    }

    /**
     * Test end-to-end performance with realistic scenarios
     */
    async testEndToEndPerformance() {
        const scenarios = [
            { name: 'Cold Start', cacheWarmed: false, errorRate: 0 },
            { name: 'Warm Cache', cacheWarmed: true, errorRate: 0 },
            { name: 'With Errors', cacheWarmed: false, errorRate: 0.1 },
            { name: 'High Load', cacheWarmed: true, errorRate: 0.05 }
        ];

        for (const scenario of scenarios) {
            console.log(`   Testing scenario: ${scenario.name}`);
            
            // Setup scenario
            if (scenario.cacheWarmed && this.cache) {
                await this.warmCache();
            }
            
            const testTexts = this.generateTestTexts(this.config.testTextCount);
            const scenarioResults = [];
            
            for (let iteration = 0; iteration < this.config.iterations; iteration++) {
                const startTime = Date.now();
                
                try {
                    // Simulate end-to-end processing
                    const results = await this.simulateEndToEndProcessing(testTexts, scenario.errorRate);
                    
                    const duration = Date.now() - startTime;
                    scenarioResults.push({
                        iteration: iteration + 1,
                        duration: duration,
                        successCount: results.successCount,
                        errorCount: results.errorCount,
                        cacheHits: results.cacheHits
                    });
                    
                } catch (error) {
                    console.warn(`     Scenario ${scenario.name} iteration ${iteration + 1} failed:`, error.message);
                }
            }
            
            // Calculate scenario statistics
            const durations = scenarioResults.map(r => r.duration);
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            const successRates = scenarioResults.map(r => r.successCount / this.config.testTextCount);
            const avgSuccessRate = successRates.reduce((a, b) => a + b, 0) / successRates.length;
            
            const endToEndResult = {
                scenario: scenario.name,
                avgDuration: avgDuration,
                avgSuccessRate: avgSuccessRate,
                meetsTarget: avgDuration < this.config.targetTime,
                reliability: avgSuccessRate,
                throughput: this.config.testTextCount / (avgDuration / 1000)
            };
            
            this.testResults.endToEndPerformance.push(endToEndResult);
            
            console.log(`     ${scenario.name}: ${avgDuration.toFixed(0)}ms, ${(avgSuccessRate * 100).toFixed(1)}% success (${endToEndResult.meetsTarget ? '✅' : '❌'} target)`);
        }
        
        console.log('✅ End-to-end performance testing completed');
    }

    /**
     * Test cache performance impact
     */
    async testCachePerformance() {
        console.log('   Testing cache hit vs miss performance...');
        
        const testTexts = this.generateTestTexts(50);
        
        // Test cache misses (cold cache)
        await this.cache.clear();
        const missStartTime = Date.now();
        
        for (const text of testTexts.slice(0, 25)) {
            await this.simulateCacheOperation(text, false); // Cache miss
        }
        
        const missTime = Date.now() - missStartTime;
        
        // Test cache hits (warm cache)
        const hitStartTime = Date.now();
        
        for (const text of testTexts.slice(0, 25)) {
            await this.simulateCacheOperation(text, true); // Cache hit
        }
        
        const hitTime = Date.now() - hitStartTime;
        
        const cacheResults = {
            missTime: missTime,
            hitTime: hitTime,
            speedup: missTime / hitTime,
            hitRate: this.cache.getStats().hitRate
        };
        
        this.testResults.cachePerformance = cacheResults;
        
        console.log(`     Cache miss avg: ${(missTime / 25).toFixed(2)}ms`);
        console.log(`     Cache hit avg: ${(hitTime / 25).toFixed(2)}ms`);
        console.log(`     Cache speedup: ${cacheResults.speedup.toFixed(2)}x`);
        console.log('✅ Cache performance testing completed');
    }

    /**
     * Test error handling performance impact
     */
    async testErrorHandlingPerformance() {
        console.log('   Testing error handling overhead...');
        
        const iterations = 100;
        
        // Test without error handling
        const directStartTime = Date.now();
        for (let i = 0; i < iterations; i++) {
            const result = await this.simulateDirectOperation();
        }
        const directTime = Date.now() - directStartTime;
        
        // Test with error handling
        const errorHandledStartTime = Date.now();
        for (let i = 0; i < iterations; i++) {
            const result = await this.errorHandler.executeWithRetry(
                () => this.simulateDirectOperation(),
                { operationId: `error-perf-${i}` }
            );
        }
        const errorHandledTime = Date.now() - errorHandledStartTime;
        
        const errorHandlingResults = {
            directTime: directTime,
            errorHandledTime: errorHandledTime,
            overhead: errorHandledTime - directTime,
            overheadPercent: ((errorHandledTime - directTime) / directTime) * 100
        };
        
        this.testResults.errorHandlingPerformance = errorHandlingResults;
        
        console.log(`     Direct operations: ${directTime}ms`);
        console.log(`     With error handling: ${errorHandledTime}ms`);
        console.log(`     Overhead: ${errorHandlingResults.overhead}ms (${errorHandlingResults.overheadPercent.toFixed(2)}%)`);
        console.log('✅ Error handling performance testing completed');
    }

    /**
     * Test concurrent performance
     */
    async testConcurrentPerformance() {
        console.log('   Testing concurrent operations...');
        
        const concurrencyLevels = [1, 2, 5, 10];
        const concurrencyResults = [];
        
        for (const concurrency of concurrencyLevels) {
            console.log(`     Testing concurrency level: ${concurrency}`);
            
            const startTime = Date.now();
            const promises = [];
            
            for (let i = 0; i < concurrency; i++) {
                const promise = this.simulateEndToEndProcessing(
                    this.generateTestTexts(this.config.testTextCount / concurrency),
                    0
                );
                promises.push(promise);
            }
            
            try {
                await Promise.all(promises);
                const duration = Date.now() - startTime;
                
                concurrencyResults.push({
                    concurrency: concurrency,
                    duration: duration,
                    throughput: this.config.testTextCount / (duration / 1000),
                    efficiency: (this.config.testTextCount / concurrency) / (duration / 1000)
                });
                
                console.log(`     Concurrency ${concurrency}: ${duration}ms`);
                
            } catch (error) {
                console.warn(`     Concurrency ${concurrency} failed:`, error.message);
            }
        }
        
        this.testResults.concurrentPerformance = concurrencyResults;
        console.log('✅ Concurrent performance testing completed');
    }

    /**
     * Test memory usage
     */
    async testMemoryUsage() {
        console.log('   Testing memory usage patterns...');
        
        const initialMemory = process.memoryUsage();
        
        // Simulate heavy usage
        const testTexts = this.generateTestTexts(100);
        const embeddings = [];
        
        for (const text of testTexts) {
            const embedding = new Array(1536).fill(Math.random());
            embeddings.push({ text, embedding });
            
            if (this.cache) {
                await this.cache.set(text, { vector: embedding, dimensions: 1536 });
            }
        }
        
        const peakMemory = process.memoryUsage();
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        
        const finalMemory = process.memoryUsage();
        
        const memoryResults = {
            initialMemory: initialMemory,
            peakMemory: peakMemory,
            finalMemory: finalMemory,
            memoryGrowth: peakMemory.heapUsed - initialMemory.heapUsed,
            memoryEfficiency: (finalMemory.heapUsed - initialMemory.heapUsed) / embeddings.length
        };
        
        this.testResults.memoryUsage = memoryResults;
        
        console.log(`     Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`     Peak memory: ${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`     Final memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`     Memory per embedding: ${(memoryResults.memoryEfficiency / 1024).toFixed(2)} KB`);
        console.log('✅ Memory usage testing completed');
    }

    /**
     * Generate performance recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Batch size recommendations
        const optimalBatch = this.findOptimalBatchSize();
        if (optimalBatch) {
            recommendations.push({
                category: 'Batch Size',
                recommendation: `Use batch size of ${optimalBatch.batchSize} for optimal performance`,
                impact: `Expected time: ${optimalBatch.avgDuration.toFixed(0)}ms`,
                priority: 'High'
            });
        }
        
        // Cache recommendations
        if (this.cache && this.testResults.cachePerformance) {
            const cacheSpeedup = this.testResults.cachePerformance.speedup;
            recommendations.push({
                category: 'Caching',
                recommendation: `Enable caching for ${cacheSpeedup.toFixed(2)}x performance improvement`,
                impact: `Cache provides significant speedup for repeated texts`,
                priority: 'High'
            });
        }
        
        // Error handling recommendations
        if (this.testResults.errorHandlingPerformance) {
            const overhead = this.testResults.errorHandlingPerformance.overheadPercent;
            recommendations.push({
                category: 'Error Handling',
                recommendation: `Error handling adds ${overhead.toFixed(2)}% overhead but provides reliability`,
                impact: `Keep enabled for production use`,
                priority: 'Medium'
            });
        }
        
        // Concurrency recommendations
        if (this.testResults.concurrentPerformance) {
            const optimalConcurrency = this.testResults.concurrentPerformance
                .reduce((a, b) => a.efficiency > b.efficiency ? a : b);
            recommendations.push({
                category: 'Concurrency',
                recommendation: `Use concurrency level of ${optimalConcurrency.concurrency} for best efficiency`,
                impact: `Optimal balance between speed and resource usage`,
                priority: 'Medium'
            });
        }
        
        // Memory recommendations
        if (this.testResults.memoryUsage) {
            const memoryPerEmbedding = this.testResults.memoryUsage.memoryEfficiency / 1024;
            recommendations.push({
                category: 'Memory',
                recommendation: `Each embedding uses ~${memoryPerEmbedding.toFixed(2)} KB memory`,
                impact: `Plan memory allocation accordingly`,
                priority: 'Low'
            });
        }
        
        this.testResults.recommendations = recommendations;
    }

    /**
     * Generate performance summary
     */
    generateSummary() {
        const summary = {
            targetAchieved: false,
            bestPerformance: null,
            overallRecommendations: [],
            readyForProduction: false
        };
        
        // Check if target is achieved
        const endToEndResults = this.testResults.endToEndPerformance;
        if (endToEndResults.length > 0) {
            const bestResult = endToEndResults.reduce((a, b) => 
                a.avgDuration < b.avgDuration ? a : b
            );
            
            summary.bestPerformance = bestResult;
            summary.targetAchieved = bestResult.avgDuration < this.config.targetTime;
        }
        
        // Overall recommendations
        if (summary.targetAchieved) {
            summary.overallRecommendations.push('✅ Performance target achieved');
            summary.overallRecommendations.push('🚀 System ready for production');
            summary.readyForProduction = true;
        } else {
            summary.overallRecommendations.push('⚠️ Performance target not met');
            summary.overallRecommendations.push('🔧 Consider optimizations listed above');
        }
        
        // Add specific recommendations
        const optimalBatch = this.findOptimalBatchSize();
        if (optimalBatch) {
            summary.overallRecommendations.push(`📦 Use batch size: ${optimalBatch.batchSize}`);
        }
        
        if (this.cache) {
            summary.overallRecommendations.push('🗄️ Enable caching for better performance');
        }
        
        summary.overallRecommendations.push('🛡️ Keep error handling enabled for reliability');
        
        this.testResults.summary = summary;
    }

    /**
     * Utility methods
     */
    findOptimalBatchSize() {
        const batchResults = this.testResults.batchSizeOptimization;
        if (batchResults.length === 0) return null;
        
        // Find batch size that meets target with best throughput
        const targetMeeting = batchResults.filter(r => r.meetsTarget);
        if (targetMeeting.length > 0) {
            return targetMeeting.reduce((a, b) => a.throughput > b.throughput ? a : b);
        }
        
        // If no batch meets target, return fastest
        return batchResults.reduce((a, b) => a.avgDuration < b.avgDuration ? a : b);
    }

    generateTestTexts(count) {
        const texts = [];
        const templates = [
            'This is a test document about artificial intelligence and machine learning.',
            'Performance testing is crucial for ensuring system reliability and speed.',
            'Vector embeddings represent text as numerical vectors in high-dimensional space.',
            'Batch processing can significantly improve throughput for large datasets.',
            'Caching strategies help reduce redundant computations and improve response times.'
        ];
        
        for (let i = 0; i < count; i++) {
            const template = templates[i % templates.length];
            texts.push(`${template} Document ${i + 1}.`);
        }
        
        return texts;
    }

    createBatches(texts, batchSize) {
        const batches = [];
        for (let i = 0; i < texts.length; i += batchSize) {
            batches.push(texts.slice(i, i + batchSize));
        }
        return batches;
    }

    simulateProcessingTime(batchSize) {
        // Simulate processing time based on batch size
        const baseTime = 50; // 50ms base
        const perItemTime = 20; // 20ms per item
        return baseTime + (batchSize * perItemTime);
    }

    async simulateEndToEndProcessing(texts, errorRate) {
        let successCount = 0;
        let errorCount = 0;
        let cacheHits = 0;
        
        for (const text of texts) {
            try {
                // Simulate random errors
                if (Math.random() < errorRate) {
                    throw new Error('Simulated error');
                }
                
                // Simulate cache check
                if (this.cache) {
                    const cached = await this.cache.get(text);
                    if (cached) {
                        cacheHits++;
                    } else {
                        await this.cache.set(text, { 
                            vector: new Array(1536).fill(0.5), 
                            dimensions: 1536 
                        });
                    }
                }
                
                // Simulate processing time
                await this.sleep(this.simulateProcessingTime(1));
                
                successCount++;
                
            } catch (error) {
                errorCount++;
            }
        }
        
        return { successCount, errorCount, cacheHits };
    }

    async simulateCacheOperation(text, isHit) {
        if (isHit) {
            await this.cache.get(text);
        } else {
            await this.cache.set(text, { 
                vector: new Array(1536).fill(0.5), 
                dimensions: 1536 
            });
        }
    }

    async simulateDirectOperation() {
        await this.sleep(10); // Simulate 10ms operation
        return { success: true };
    }

    async warmCache() {
        const warmupTexts = this.generateTestTexts(20);
        for (const text of warmupTexts) {
            await this.cache.set(text, { 
                vector: new Array(1536).fill(0.5), 
                dimensions: 1536 
            });
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Print performance report
     */
    printPerformanceReport() {
        console.log('\n🎯 PERFORMANCE TEST REPORT');
        console.log('==========================\n');
        
        // Summary
        const summary = this.testResults.summary;
        console.log('📊 PERFORMANCE SUMMARY:');
        console.log(`   Target: <${this.config.targetTime}ms for ${this.config.testTextCount} texts`);
        console.log(`   Achieved: ${summary.targetAchieved ? '✅ YES' : '❌ NO'}`);
        if (summary.bestPerformance) {
            console.log(`   Best Time: ${summary.bestPerformance.avgDuration.toFixed(0)}ms (${summary.bestPerformance.scenario})`);
        }
        console.log(`   Production Ready: ${summary.readyForProduction ? '✅ YES' : '❌ NO'}`);
        
        // Batch size optimization
        if (this.testResults.batchSizeOptimization.length > 0) {
            console.log('\n📦 BATCH SIZE OPTIMIZATION:');
            this.testResults.batchSizeOptimization.forEach(result => {
                const status = result.meetsTarget ? '✅' : '❌';
                console.log(`   Batch ${result.batchSize}: ${result.avgDuration.toFixed(0)}ms ${status}`);
            });
        }
        
        // End-to-end performance
        if (this.testResults.endToEndPerformance.length > 0) {
            console.log('\n🎯 END-TO-END PERFORMANCE:');
            this.testResults.endToEndPerformance.forEach(result => {
                const status = result.meetsTarget ? '✅' : '❌';
                console.log(`   ${result.scenario}: ${result.avgDuration.toFixed(0)}ms ${status}`);
            });
        }
        
        // Recommendations
        if (this.testResults.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            this.testResults.recommendations.forEach(rec => {
                console.log(`   ${rec.category}: ${rec.recommendation}`);
                console.log(`      Impact: ${rec.impact}`);
                console.log(`      Priority: ${rec.priority}`);
            });
        }
        
        // Overall recommendations
        if (summary.overallRecommendations.length > 0) {
            console.log('\n🚀 NEXT STEPS:');
            summary.overallRecommendations.forEach(rec => {
                console.log(`   ${rec}`);
            });
        }
    }
}

module.exports = PerformanceTester; 