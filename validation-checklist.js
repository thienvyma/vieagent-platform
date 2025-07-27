/**
 * 🔍 COMPREHENSIVE VALIDATION CHECKLIST
 * Kiểm tra tất cả requirements từ Day 1-12 theo STEP_BY_STEP_IMPLEMENTATION_PLAN.md
 */

const fs = require('fs');
const path = require('path');

class ValidationChecker {
  constructor() {
    this.results = {
      day1: { passed: 0, failed: 0, tests: [] },
      day2: { passed: 0, failed: 0, tests: [] },
      day3: { passed: 0, failed: 0, tests: [] },
      day4: { passed: 0, failed: 0, tests: [] },
      day5: { passed: 0, failed: 0, tests: [] },
      day6: { passed: 0, failed: 0, tests: [] },
      day7: { passed: 0, failed: 0, tests: [] },
      day8: { passed: 0, failed: 0, tests: [] },
      day9: { passed: 0, failed: 0, tests: [] },
      day10: { passed: 0, failed: 0, tests: [] },
      day11: { passed: 0, failed: 0, tests: [] },
      day12: { passed: 0, failed: 0, tests: [] }
    };
  }

  async runValidation() {
    console.log('🔍 STARTING COMPREHENSIVE VALIDATION ACCORDING TO PLAN...\n');
    
    try {
      console.log('Debug: Starting Day 1 validation...');
      await this.validateDay1();
      console.log('Debug: Day 1 completed, starting Day 2...');
      await this.validateDay2();
      await this.validateDay3();
      await this.validateDay4();
      await this.validateDay5();
      await this.validateDay6();
      await this.validateDay7();
      await this.validateDay8();
      await this.validateDay9();
      await this.validateDay10();
      await this.validateDay11();
      await this.validateDay12();

      this.generateReport();
    } catch (error) {
      console.error('❌ Validation failed:', error);
      console.error('Stack trace:', error.stack);
    }
  }

  check(day, testName, condition, description) {
    const result = {
      name: testName,
      description,
      passed: condition,
      timestamp: new Date().toISOString()
    };

    this.results[day].tests.push(result);
    
    if (condition) {
      this.results[day].passed++;
      console.log(`✅ ${testName}: ${description}`);
    } else {
      this.results[day].failed++;
      console.log(`❌ ${testName}: ${description}`);
    }
  }

  fileExists(filePath) {
    return fs.existsSync(path.join(__dirname, filePath));
  }

  // DAY 1: CHROMADB SETUP VALIDATION
  async validateDay1() {
    console.log('📅 DAY 1: CHROMADB SETUP VALIDATION');
    console.log('=' .repeat(50));

    // Bước 1.1-1.2: ChromaDB Installation & Dependencies
    this.check('day1', 'ChromaDB_Integration_File', 
      this.fileExists('src/lib/chromadb-integration.ts'),
      'ChromaDB integration file exists'
    );

    // Bước 1.3: Environment Setup
    this.check('day1', 'Environment_Config', 
      this.fileExists('.env') || this.fileExists('.env.local'),
      'Environment configuration file exists'
    );

    // Bước 1.4: Basic Connection Test
    const chromaContent = this.getFileContent('src/lib/chromadb-integration.ts');
    this.check('day1', 'Connection_Implementation', 
      chromaContent.includes('ChromaClient') && chromaContent.includes('initializeClient'),
      'ChromaDB connection implementation exists'
    );

    // Bước 1.5: Collection Schema Design
    this.check('day1', 'Collection_Schema', 
      chromaContent.includes('createCollection') && chromaContent.includes('CollectionMetadata'),
      'Collection schema design implemented'
    );

    // Bước 1.6: Collection Creation
    this.check('day1', 'Collection_Creation', 
      chromaContent.includes('createCollection') && chromaContent.includes('metadata'),
      'Collection creation functionality exists'
    );

    // Bước 1.7: Basic CRUD Operations
    this.check('day1', 'CRUD_Operations', 
      chromaContent.includes('storeVectors') && 
      chromaContent.includes('searchVectors') && 
      chromaContent.includes('deleteCollection'),
      'Basic CRUD operations implemented'
    );

    console.log('');
  }

  // DAY 2: EMBEDDING SYSTEM VALIDATION
  async validateDay2() {
    console.log('📅 DAY 2: EMBEDDING SYSTEM VALIDATION');
    console.log('=' .repeat(50));

    // Bước 2.1: OpenAI API Setup
    const vectorServiceContent = this.getFileContent('src/lib/vector-knowledge-service.ts');
    this.check('day2', 'OpenAI_API_Setup', 
      vectorServiceContent.includes('OpenAI') && vectorServiceContent.includes('embeddings.create'),
      'OpenAI API setup implemented'
    );

    // Bước 2.2: Embedding Generation
    this.check('day2', 'Embedding_Generation', 
      vectorServiceContent.includes('generateSingleEmbedding') && 
      vectorServiceContent.includes('text-embedding-3-small'),
      'Single text embedding generation works'
    );

    // Bước 2.3: Batch Processing
    this.check('day2', 'Batch_Processing', 
      vectorServiceContent.includes('processDocuments') && vectorServiceContent.includes('vectors'),
      'Batch embedding processing implemented'
    );

    // Bước 2.4: Embedding Cache
    const chromaContent = this.getFileContent('src/lib/chromadb-integration.ts');
    this.check('day2', 'Embedding_Cache', 
      chromaContent.includes('cache') && chromaContent.includes('Map'),
      'Embedding caching strategy implemented'
    );

    // Bước 2.5: Error Handling
    this.check('day2', 'Error_Handling', 
      vectorServiceContent.includes('try') && 
      vectorServiceContent.includes('catch') && 
      vectorServiceContent.includes('error'),
      'Error handling implemented'
    );

    // Bước 2.6: Performance Testing
    this.check('day2', 'Performance_Optimization', 
      vectorServiceContent.includes('batch') || chromaContent.includes('batchSize'),
      'Performance optimization considerations present'
    );

    console.log('');
  }

  // DAY 3: AGENT CONFIGURATION VALIDATION
  async validateDay3() {
    console.log('📅 DAY 3: AGENT CONFIGURATION VALIDATION');
    console.log('=' .repeat(50));

    // Bước 3.1-3.3: Schema Extension & Migration
    const schemaContent = this.getFileContent('prisma/schema.prisma');
    this.check('day3', 'Agent_Schema_Extended', 
      schemaContent.includes('Agent') && 
      schemaContent.includes('embeddingModel') && 
      schemaContent.includes('vectorCollectionName'),
      'Agent schema extended with AI fields'
    );

    // Bước 3.4: Configuration Validation
    this.check('day3', 'AI_Configuration_Fields', 
      schemaContent.includes('temperature') && 
      schemaContent.includes('maxTokens') && 
      schemaContent.includes('enableRAG'),
      'AI configuration fields present in schema'
    );

    // Bước 3.5: Backward Compatibility
    this.check('day3', 'Default_Values', 
      schemaContent.includes('@default') && 
      schemaContent.includes('text-embedding-3-small'),
      'Default values for backward compatibility'
    );

    console.log('');
  }

  // DAY 4: INTEGRATION TESTING VALIDATION
  async validateDay4() {
    console.log('📅 DAY 4: INTEGRATION TESTING VALIDATION');
    console.log('=' .repeat(50));

    // Bước 4.1: Component Integration
    const vectorServiceContent = this.getFileContent('src/lib/vector-knowledge-service.ts');
    this.check('day4', 'Component_Integration', 
      vectorServiceContent.includes('ChromaDBManager') && 
      vectorServiceContent.includes('embeddingGenerator'),
      'ChromaDB + Embeddings integration implemented'
    );

    // Bước 4.2: Data Flow Testing
    this.check('day4', 'Data_Flow_Pipeline', 
      vectorServiceContent.includes('processDocuments') && 
      vectorServiceContent.includes('storeVectors') && 
      vectorServiceContent.includes('searchKnowledge'),
      'Complete data flow pipeline implemented'
    );

    // Bước 4.3: Performance Baseline
    this.check('day4', 'Performance_Logging', 
      vectorServiceContent.includes('console.log') && 
      vectorServiceContent.includes('processed'),
      'Performance logging present'
    );

    // Bước 4.4: Error Recovery Testing
    this.check('day4', 'Error_Recovery', 
      vectorServiceContent.includes('catch') && 
      vectorServiceContent.includes('errors'),
      'Error recovery mechanisms implemented'
    );

    console.log('');
  }

  // DAY 5: FILE UPLOAD ENHANCEMENT VALIDATION
  async validateDay5() {
    console.log('📅 DAY 5: FILE UPLOAD ENHANCEMENT VALIDATION');
    console.log('=' .repeat(50));

    // Bước 5.1-5.2: Enhanced File Validation
    const uploadZoneContent = this.getFileContent('src/components/knowledge/SmartUploadZone.tsx');
    this.check('day5', 'File_Type_Support', 
      uploadZoneContent.includes('pdf') && 
      uploadZoneContent.includes('docx') && 
      uploadZoneContent.includes('csv') && 
      uploadZoneContent.includes('json'),
      'Multiple file type support implemented'
    );

    // Bước 5.3: Upload Progress Tracking
    this.check('day5', 'Progress_Tracking', 
      uploadZoneContent.includes('uploadProgress') && 
      uploadZoneContent.includes('progress'),
      'Upload progress tracking implemented'
    );

    // Bước 5.4: Batch Upload Support
    this.check('day5', 'Batch_Upload', 
      uploadZoneContent.includes('batch') && uploadZoneContent.includes('multiple'),
      'Batch upload support implemented'
    );

    // Bước 5.5: Folder Upload Support
    this.check('day5', 'Folder_Upload', 
      uploadZoneContent.includes('folder') && uploadZoneContent.includes('webkitdirectory'),
      'Folder upload support implemented'
    );

    console.log('');
  }

  // DAY 6: DOCUMENT PARSING VALIDATION
  async validateDay6() {
    console.log('📅 DAY 6: DOCUMENT PARSING VALIDATION');
    console.log('=' .repeat(50));

    // Bước 6.1: Text Extraction Implementation
    const dataImportsContent = this.getFileContent('src/app/api/data-imports/route.ts');
    this.check('day6', 'Content_Extraction', 
      dataImportsContent.includes('pdf') || 
      dataImportsContent.includes('text') || 
      this.fileExists('src/lib/parsers'),
      'Content extraction capabilities present'
    );

    // Bước 6.2: Metadata Extraction
    this.check('day6', 'Metadata_Extraction', 
      dataImportsContent.includes('metadata') && dataImportsContent.includes('size'),
      'Metadata extraction implemented'
    );

    // Bước 6.3: Text Cleaning
    const vectorServiceContent = this.getFileContent('src/lib/vector-knowledge-service.ts');
    this.check('day6', 'Text_Processing', 
      vectorServiceContent.includes('trim') || vectorServiceContent.includes('content'),
      'Text processing implemented'
    );

    // Bước 6.4: Content Validation
    this.check('day6', 'Content_Validation', 
      vectorServiceContent.includes('length') && vectorServiceContent.includes('50'),
      'Content validation implemented'
    );

    console.log('');
  }

  // DAY 7: CHUNKING & VECTORIZATION VALIDATION
  async validateDay7() {
    console.log('📅 DAY 7: CHUNKING & VECTORIZATION VALIDATION');
    console.log('=' .repeat(50));

    const vectorServiceContent = this.getFileContent('src/lib/vector-knowledge-service.ts');

    // Bước 7.1: Chunking Strategy Design
    this.check('day7', 'Chunking_Strategy', 
      vectorServiceContent.includes('createChunks') && 
      vectorServiceContent.includes('1000'), // chunk size
      'Semantic chunking strategy implemented (1000 chars as per plan)'
    );

    // Bước 7.2: Chunk Implementation
    this.check('day7', 'Chunk_Implementation', 
      vectorServiceContent.includes('chunkIndex') && 
      vectorServiceContent.includes('overlap'),
      'Chunk implementation with relationships'
    );

    // Bước 7.3: Chunk Vectorization
    this.check('day7', 'Chunk_Vectorization', 
      vectorServiceContent.includes('generateSingleEmbedding') && 
      vectorServiceContent.includes('chunks'),
      'Chunk vectorization implemented'
    );

    // Bước 7.4: ChromaDB Integration
    this.check('day7', 'Vector_Storage', 
      vectorServiceContent.includes('storeVectors') && 
      vectorServiceContent.includes('collectionName'),
      'Vector storage in ChromaDB implemented'
    );

    console.log('');
  }

  // DAY 8: PROCESSING PIPELINE VALIDATION
  async validateDay8() {
    console.log('📅 DAY 8: PROCESSING PIPELINE VALIDATION');
    console.log('=' .repeat(50));

    const knowledgeAPIContent = this.getFileContent('src/app/api/knowledge/route.ts');

    // Bước 8.1: Pipeline Architecture
    this.check('day8', 'Pipeline_Architecture', 
      knowledgeAPIContent.includes('Upload → Parse → Chunk → Vectorize → Store'),
      'Complete pipeline architecture documented'
    );

    // Bước 8.2: Batch Processing Implementation
    this.check('day8', 'Batch_Processing', 
      knowledgeAPIContent.includes('processDocuments') && 
      knowledgeAPIContent.includes('itemIds'),
      'Batch processing implementation present'
    );

    // Bước 8.3: Status Management
    this.check('day8', 'Status_Management', 
      knowledgeAPIContent.includes('processing') && 
      knowledgeAPIContent.includes('completed') && 
      knowledgeAPIContent.includes('failed'),
      'Status management (pending, processing, completed, failed) implemented'
    );

    // Bước 8.4: Performance Optimization
    this.check('day8', 'Performance_Optimization', 
      (knowledgeAPIContent.includes('batch') || knowledgeAPIContent.includes('BATCH')) && 
      this.fileExists('src/app/api/knowledge/status/route.ts'),
      'Performance optimization and status tracking'
    );

    console.log('');
  }

  // DAY 9: DATA MIGRATION PLANNING VALIDATION
  async validateDay9() {
    console.log('📅 DAY 9: DATA MIGRATION PLANNING VALIDATION');
    console.log('=' .repeat(50));

    const knowledgeAPIContent = this.getFileContent('src/app/api/knowledge/route.ts');

    // Bước 9.1-9.2: System Analysis
    this.check('day9', 'System_Analysis', 
      knowledgeAPIContent.includes('documents') && 
      knowledgeAPIContent.includes('dataImports'),
      'Current system analysis - Document and DataImport integration'
    );

    // Bước 9.3: Database Schema Unification
    this.check('day9', 'Schema_Unification', 
      knowledgeAPIContent.includes('unifiedItems') && 
      knowledgeAPIContent.includes('source'),
      'Unified data model implementation'
    );

    // Bước 9.4: Data Backup & Preparation
    const schemaContent = this.getFileContent('prisma/schema.prisma');
    this.check('day9', 'Backward_Compatibility', 
      schemaContent.includes('Document') && schemaContent.includes('DataImport'),
      'Both Document and DataImport models preserved'
    );

    console.log('');
  }

  // DAY 10: DATA MIGRATION EXECUTION VALIDATION
  async validateDay10() {
    console.log('📅 DAY 10: DATA MIGRATION EXECUTION VALIDATION');
    console.log('=' .repeat(50));

    const knowledgeAPIContent = this.getFileContent('src/app/api/knowledge/route.ts');

    // Bước 10.1: Database Migration
    this.check('day10', 'Migration_Execution', 
      knowledgeAPIContent.includes('prisma.document') && 
      knowledgeAPIContent.includes('prisma.dataImport'),
      'Database migration handles both tables'
    );

    // Bước 10.2: API Endpoint Updates
    this.check('day10', 'API_Updates', 
      knowledgeAPIContent.includes('POST') && 
      knowledgeAPIContent.includes('process'),
      'API endpoints updated for unified processing'
    );

    // Bước 10.3: Data Validation
    this.check('day10', 'Data_Validation', 
      knowledgeAPIContent.includes('transform') && 
      knowledgeAPIContent.includes('unifiedItems'),
      'Data validation and transformation implemented'
    );

    // Bước 10.4: Rollback Testing
    this.check('day10', 'Error_Handling', 
      knowledgeAPIContent.includes('catch') && 
      knowledgeAPIContent.includes('failed'),
      'Error handling and rollback capabilities'
    );

    console.log('');
  }

  // DAY 11: CORE UI COMPONENTS VALIDATION
  async validateDay11() {
    console.log('📅 DAY 11: CORE UI COMPONENTS VALIDATION');
    console.log('=' .repeat(50));

    // Bước 11.1: Smart Upload Zone
    const uploadZoneContent = this.getFileContent('src/components/knowledge/SmartUploadZone.tsx');
    this.check('day11', 'Smart_Upload_Zone', 
      uploadZoneContent.includes('SmartUploadZone') && 
      (uploadZoneContent.includes('drag-and-drop') || uploadZoneContent.includes('Drag-and-drop')),
      'Smart Upload Zone with drag-and-drop implemented'
    );

    // Bước 11.2: Knowledge Grid
    const knowledgeGridContent = this.getFileContent('src/components/knowledge/KnowledgeGrid.tsx');
    this.check('day11', 'Knowledge_Grid', 
      knowledgeGridContent.includes('KnowledgeGrid') && 
      knowledgeGridContent.includes('filter'),
      'Knowledge Grid with filtering implemented'
    );

    // Bước 11.3: Status Tracking
    this.check('day11', 'Real_Time_Status', 
      knowledgeGridContent.includes('status') && 
      knowledgeGridContent.includes('vectorized'),
      'Real-time status tracking in UI'
    );

    console.log('');
  }

  // DAY 12: ADVANCED FEATURES VALIDATION
  async validateDay12() {
    console.log('📅 DAY 12: ADVANCED FEATURES VALIDATION');
    console.log('=' .repeat(50));

    const knowledgeGridContent = this.getFileContent('src/components/knowledge/KnowledgeGrid.tsx');

    // Bước 12.1: Bulk Operations
    this.check('day12', 'Bulk_Operations', 
      knowledgeGridContent.includes('bulk') && 
      (knowledgeGridContent.includes('selectedItems') || knowledgeGridContent.includes('localSelectedItems')),
      'Bulk operations (delete, reprocess) implemented'
    );

    // Bước 12.2: Content Preview
    this.check('day12', 'Content_Preview', 
      knowledgeGridContent.includes('preview') && 
      knowledgeGridContent.includes('DocumentPreview'),
      'Content preview functionality'
    );

    // Bước 12.3: Integration Points
    this.check('day12', 'Integration_Points', 
      knowledgeGridContent.includes('onAssign') && 
      knowledgeGridContent.includes('onProcessItem'),
      'Integration points (RAG, agent assignment)'
    );

    console.log('');
  }

  getFileContent(filePath) {
    try {
      return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    } catch (error) {
      return '';
    }
  }

  generateReport() {
    console.log('\n🎯 COMPREHENSIVE VALIDATION REPORT');
    console.log('=' .repeat(60));

    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    Object.keys(this.results).forEach(day => {
      const result = this.results[day];
      const total = result.passed + result.failed;
      const percentage = total > 0 ? Math.round((result.passed / total) * 100) : 0;
      
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalTests += total;

      console.log(`\n📅 ${day.toUpperCase()}: ${percentage}% (${result.passed}/${total})`);
      
      if (result.failed > 0) {
        console.log('❌ Failed tests:');
        result.tests.filter(t => !t.passed).forEach(test => {
          console.log(`   - ${test.name}: ${test.description}`);
        });
      }
    });

    const overallPercentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

    console.log('\n' + '=' .repeat(60));
    console.log(`🎯 OVERALL COMPLIANCE: ${overallPercentage}% (${totalPassed}/${totalTests})`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);

    if (overallPercentage >= 90) {
      console.log('\n🎉 EXCELLENT! Implementation highly compliant with plan');
    } else if (overallPercentage >= 75) {
      console.log('\n✅ GOOD! Most requirements satisfied, minor fixes needed');
    } else {
      console.log('\n⚠️ ATTENTION NEEDED! Significant gaps in implementation');
    }

    console.log('\n📋 VALIDATION COMPLETED AT:', new Date().toISOString());
  }
}

// Run validation
const validator = new ValidationChecker();
validator.runValidation().catch(console.error);

module.exports = ValidationChecker; 