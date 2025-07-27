/**
 * 🗜️ Vector Storage Optimization Test API
 * Day 2.2 - Test endpoint to validate optimization features in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { vectorKnowledgeService } from '@/lib/vector-knowledge-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { testType = 'comprehensive', documentCount = 10 } = body;

    console.log(`🗜️ Starting optimization test: ${testType} with ${documentCount} documents`);

    const results = {
      testType,
      startTime: new Date().toISOString(),
      endTime: null,
      userId: session.user.id,
      optimizationFeatures: {
        compression: { tested: false, results: null },
        deduplication: { tested: false, results: null },
        tieredStorage: { tested: false, results: null },
        analytics: { tested: false, results: null },
      },
      performance: {
        baselineTime: 0,
        optimizedTime: 0,
        spaceSavings: 0,
        processingTime: 0,
      },
      summary: {
        success: false,
        score: 0,
        recommendations: [],
      },
    };

    const startTime = Date.now();

    try {
      // Test 1: Compression Test
      console.log('📊 Testing compression...');
      const compressionResults = await testCompression(session.user.id, documentCount);
      results.optimizationFeatures.compression = {
        tested: true,
        results: compressionResults,
      };

      // Test 2: Deduplication Test
      console.log('🔍 Testing deduplication...');
      const deduplicationResults = await testDeduplication(session.user.id, documentCount);
      results.optimizationFeatures.deduplication = {
        tested: true,
        results: deduplicationResults,
      };

      // Test 3: Tiered Storage Test
      console.log('🏢 Testing tiered storage...');
      const tieredResults = await testTieredStorage(session.user.id);
      results.optimizationFeatures.tieredStorage = {
        tested: true,
        results: tieredResults,
      };

      // Test 4: Analytics Test
      console.log('📈 Testing analytics...');
      const analyticsResults = await testAnalytics(session.user.id);
      results.optimizationFeatures.analytics = {
        tested: true,
        results: analyticsResults,
      };

      // Calculate performance metrics
      results.performance.processingTime = Date.now() - startTime;
      results.performance.spaceSavings = calculateSpaceSavings(results);

      // Generate overall score and recommendations
      results.summary = generateSummary(results);
      results.endTime = new Date().toISOString();

      console.log(`✅ Optimization test complete: ${results.summary.score}/100 score`);

      return NextResponse.json({
        success: true,
        results,
        message: `Optimization test completed with ${results.summary.score}/100 score`,
      });
    } catch (error) {
      console.error('❌ Optimization test failed:', error);

      results.endTime = new Date().toISOString();
      results.summary = {
        success: false,
        score: 0,
        recommendations: [`Test failed: ${error.message}`],
      };

      return NextResponse.json(
        {
          success: false,
          results,
          error: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Test API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Test compression features
 */
async function testCompression(userId: string, documentCount: number) {
  const testDocuments = generateTestDocuments(documentCount, 'compression');
  const collectionName = `test_compression_${userId}_${Date.now()}`;

  const result = await vectorKnowledgeService.processDocuments(testDocuments, collectionName);

  const compressionMetrics = result.vectorStorageResult?.metadata?.optimizationMetrics;

  return {
    documentsProcessed: result.processed,
    compressionRatio: compressionMetrics?.averageCompressionRatio || 1.0,
    compressedVectors: compressionMetrics?.compressedVectors || 0,
    spaceSavings: result.vectorStorageResult?.metadata?.spaceSavingsPercent || 0,
    quality: compressionMetrics?.averageCompressionRatio
      ? compressionMetrics.averageCompressionRatio > 0.5
        ? 'good'
        : 'poor'
      : 'unknown',
  };
}

/**
 * Test deduplication features
 */
async function testDeduplication(userId: string, documentCount: number) {
  // Generate documents with intentional duplicates
  const testDocuments = generateTestDocuments(documentCount, 'deduplication');
  const duplicateDocuments = testDocuments.slice(0, Math.floor(documentCount * 0.3));
  const allDocuments = [...testDocuments, ...duplicateDocuments]; // 30% duplicates

  const collectionName = `test_dedup_${userId}_${Date.now()}`;

  const result = await vectorKnowledgeService.processDocuments(allDocuments, collectionName);

  const deduplicationMetrics = result.vectorStorageResult?.metadata?.optimizationMetrics;

  return {
    inputDocuments: allDocuments.length,
    outputDocuments: result.processed,
    duplicatesDetected: deduplicationMetrics?.duplicatesDetected || 0,
    deduplicationRate: deduplicationMetrics?.duplicatesDetected
      ? (deduplicationMetrics.duplicatesDetected / allDocuments.length) * 100
      : 0,
    effectiveness: deduplicationMetrics?.duplicatesDetected > 0 ? 'working' : 'not_detected',
  };
}

/**
 * Test tiered storage features
 */
async function testTieredStorage(userId: string) {
  // This is a simplified test since tiered storage requires access patterns over time
  const testDocuments = generateTestDocuments(10, 'tiered');
  const collectionName = `test_tiered_${userId}_${Date.now()}`;

  const result = await vectorKnowledgeService.processDocuments(testDocuments, collectionName);

  const tieredMetrics = result.vectorStorageResult?.metadata?.optimizationMetrics;

  return {
    hotStorageCount: tieredMetrics?.hotStorageCount || 0,
    coldStorageCount: tieredMetrics?.coldStorageCount || 0,
    classificationWorking:
      (tieredMetrics?.hotStorageCount || 0) + (tieredMetrics?.coldStorageCount || 0) > 0,
    distribution: {
      hot: tieredMetrics?.hotStorageCount || 0,
      cold: tieredMetrics?.coldStorageCount || 0,
    },
  };
}

/**
 * Test analytics features
 */
async function testAnalytics(userId: string) {
  const testDocuments = generateTestDocuments(5, 'analytics');
  const collectionName = `test_analytics_${userId}_${Date.now()}`;

  const result = await vectorKnowledgeService.processDocuments(testDocuments, collectionName);

  const metrics = result.vectorStorageResult?.metadata?.optimizationMetrics;
  const recommendations = result.vectorStorageResult?.recommendations || [];

  return {
    metricsGenerated: metrics ? Object.keys(metrics).length : 0,
    recommendationsGenerated: recommendations.length,
    metricsAvailable: !!metrics,
    sampleMetrics: metrics
      ? {
          totalVectors: metrics.totalVectors,
          compressedVectors: metrics.compressedVectors,
          duplicatesDetected: metrics.duplicatesDetected,
          averageCompressionRatio: metrics.averageCompressionRatio,
        }
      : null,
  };
}

/**
 * Generate test documents for different optimization features
 */
function generateTestDocuments(count: number, testType: string) {
  const documents = [];

  for (let i = 0; i < count; i++) {
    let content = '';

    switch (testType) {
      case 'compression':
        // Generate compressible content with patterns
        content =
          `Compression test document ${i}. `.repeat(20) +
          `This document contains repetitive patterns that should compress well. ` +
          `Pattern: ${Math.floor(i / 3)} `.repeat(10);
        break;

      case 'deduplication':
        // Generate content with potential duplicates
        content =
          i < count / 2
            ? `Unique document ${i} with specific content about topic ${i}`
            : `Unique document ${i - Math.floor(count / 2)} with specific content about topic ${i - Math.floor(count / 2)}`;
        break;

      case 'tiered':
        // Generate documents with different access patterns
        content = `Tiered storage test document ${i}. Priority: ${i < count / 3 ? 'high' : 'low'}`;
        break;

      case 'analytics':
        // Generate analytical content
        content = `Analytics test document ${i}. Performance metrics and optimization data for analysis.`;
        break;

      default:
        content = `Test document ${i} for ${testType} testing`;
    }

    documents.push({
      id: `test_${testType}_${i}`,
      content,
      metadata: {
        testType,
        documentIndex: i,
        generatedAt: new Date().toISOString(),
      },
    });
  }

  return documents;
}

/**
 * Calculate overall space savings
 */
function calculateSpaceSavings(results: any): number {
  const compressionSavings = results.optimizationFeatures.compression.results?.spaceSavings || 0;
  const deduplicationSavings =
    results.optimizationFeatures.deduplication.results?.deduplicationRate || 0;

  return Math.max(compressionSavings, deduplicationSavings);
}

/**
 * Generate summary and recommendations
 */
function generateSummary(results: any) {
  let score = 0;
  const recommendations = [];

  // Score compression (25 points)
  const compressionResults = results.optimizationFeatures.compression.results;
  if (compressionResults) {
    if (compressionResults.compressionRatio > 0.5) score += 25;
    else if (compressionResults.compressionRatio > 0.3) score += 15;
    else score += 5;

    if (compressionResults.quality === 'poor') {
      recommendations.push('Consider adjusting compression level or algorithm');
    }
  }

  // Score deduplication (25 points)
  const deduplicationResults = results.optimizationFeatures.deduplication.results;
  if (deduplicationResults) {
    if (deduplicationResults.effectiveness === 'working') score += 25;
    else score += 5;

    if (deduplicationResults.deduplicationRate < 10) {
      recommendations.push('Deduplication rate is low - review content preprocessing');
    }
  }

  // Score tiered storage (25 points)
  const tieredResults = results.optimizationFeatures.tieredStorage.results;
  if (tieredResults && tieredResults.classificationWorking) {
    score += 25;
  } else {
    score += 5;
    recommendations.push('Tiered storage classification needs improvement');
  }

  // Score analytics (25 points)
  const analyticsResults = results.optimizationFeatures.analytics.results;
  if (analyticsResults) {
    if (analyticsResults.metricsAvailable && analyticsResults.recommendationsGenerated > 0) {
      score += 25;
    } else if (analyticsResults.metricsAvailable) {
      score += 15;
    } else {
      score += 5;
    }
  }

  // Overall recommendations
  if (score >= 80) {
    recommendations.push('Vector storage optimization is working well');
    recommendations.push('Ready to proceed to Day 2.3: Large Folder Processing');
  } else if (score >= 60) {
    recommendations.push('Vector optimization partially working - review failed tests');
  } else {
    recommendations.push('Significant optimization issues detected - review implementation');
  }

  return {
    success: score >= 60,
    score,
    recommendations,
  };
}

// GET method for test status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      available: true,
      supportedTests: ['comprehensive', 'compression', 'deduplication', 'tiered', 'analytics'],
      message: 'Vector storage optimization test endpoint is ready',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
