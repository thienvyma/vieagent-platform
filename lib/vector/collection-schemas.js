// ChromaDB Collection Schemas Design
// Defines structure for different types of collections

/**
 * COLLECTION SCHEMA DESIGN FOR AI AGENT PLATFORM
 * 
 * 1. DOCUMENTS COLLECTION - Store uploaded documents and files
 * 2. CONVERSATIONS COLLECTION - Store chat interactions for RAG
 * 3. LEARNING COLLECTION - Store auto-learning insights
 * 4. AGENT_KNOWLEDGE COLLECTION - Store agent-specific knowledge
 */

// =============================================================================
// 1. DOCUMENTS COLLECTION SCHEMA
// =============================================================================

const DOCUMENTS_COLLECTION_CONFIG = {
    name: 'ai_agent_documents',
    description: 'Stores uploaded documents with embeddings for RAG',
    
    // Metadata schema for documents
    metadataSchema: {
        // Core identification
        documentId: 'string',           // Unique document ID
        userId: 'string',               // Owner user ID
        agentId: 'string|null',         // Associated agent (if any)
        
        // Document properties
        title: 'string',                // Document title/name
        originalFileName: 'string',     // Original file name
        fileType: 'string',             // pdf, docx, txt, csv, json
        fileSize: 'number',             // File size in bytes
        mimeType: 'string',             // MIME type
        
        // Content properties
        contentType: 'string',          // 'document', 'chunk', 'paragraph'
        chunkIndex: 'number|null',      // For chunked documents
        parentDocumentId: 'string|null', // For chunks
        wordCount: 'number',            // Word count
        language: 'string',             // Detected language
        
        // Processing status
        processingStatus: 'string',     // 'pending', 'processed', 'error'
        vectorized: 'boolean',          // Has embeddings
        indexed: 'boolean',             // Added to search index
        
        // Source information
        source: 'string',               // 'upload', 'data_import', 'manual'
        sourceMetadata: 'object',       // Additional source info
        
        // Usage tracking
        accessCount: 'number',          // How many times accessed
        lastAccessed: 'string',         // ISO date string
        relevanceScore: 'number|null',  // Calculated relevance
        
        // Timestamps
        uploadedAt: 'string',           // ISO date string
        processedAt: 'string|null',     // ISO date string
        updatedAt: 'string',            // ISO date string
        
        // Tags and categories
        tags: 'array',                  // User-defined tags
        categories: 'array',            // Auto-detected categories
        topics: 'array',                // Extracted topics
        
        // Quality metrics
        extractionQuality: 'number',    // 0-1 quality score
        readabilityScore: 'number',     // Text readability
        informationDensity: 'number'    // Information content score
    },
    
    // Collection settings
    embeddingFunction: 'openai',        // Default embedding provider
    distanceMetric: 'cosine',           // Similarity calculation
    dimensions: 1536                    // OpenAI text-embedding-3-small
};

// =============================================================================
// 2. CONVERSATIONS COLLECTION SCHEMA
// =============================================================================

const CONVERSATIONS_COLLECTION_CONFIG = {
    name: 'ai_agent_conversations',
    description: 'Stores chat interactions for context and learning',
    
    metadataSchema: {
        // Core identification
        conversationId: 'string',       // Conversation session ID
        messageId: 'string',            // Unique message ID
        userId: 'string',               // User ID
        agentId: 'string',              // Agent ID
        
        // Message properties
        messageType: 'string',          // 'user', 'assistant', 'system'
        messageRole: 'string',          // 'query', 'response', 'context'
        sequenceNumber: 'number',       // Order in conversation
        
        // Content properties
        hasContext: 'boolean',          // Used RAG context
        contextSources: 'array',        // Source document IDs
        contextRelevance: 'number',     // Context quality score
        
        // AI processing
        modelUsed: 'string',            // AI model name
        temperature: 'number',          // Generation temperature
        tokensUsed: 'number',           // Token consumption
        processingTime: 'number',       // Response time (ms)
        
        // Quality metrics
        responseQuality: 'number|null', // User/auto rating
        userSatisfaction: 'number|null', // User feedback
        relevanceScore: 'number',       // Content relevance
        coherenceScore: 'number',       // Response coherence
        
        // Learning indicators
        containsQuestion: 'boolean',    // Has user question
        containsInstruction: 'boolean', // Has user instruction
        requiresLearning: 'boolean',    // Should be learned from
        learningPriority: 'number',     // Learning importance
        
        // Session context
        conversationTopic: 'string',    // Main topic
        intentCategory: 'string',       // User intent
        emotionalTone: 'string',        // Detected emotion
        
        // Timestamps
        createdAt: 'string',            // ISO date string
        processedAt: 'string',          // When AI processed
        learnedAt: 'string|null',       // When learned from
        
        // Usage and feedback
        upvotes: 'number',              // Positive feedback
        downvotes: 'number',            // Negative feedback
        flagged: 'boolean',             // Flagged for review
        bookmarked: 'boolean'           // User bookmarked
    },
    
    embeddingFunction: 'openai',
    distanceMetric: 'cosine',
    dimensions: 1536
};

// =============================================================================
// 3. LEARNING COLLECTION SCHEMA
// =============================================================================

const LEARNING_COLLECTION_CONFIG = {
    name: 'ai_agent_learning',
    description: 'Stores auto-learning insights and extracted knowledge',
    
    metadataSchema: {
        // Core identification
        learningId: 'string',           // Unique learning entry ID
        sourceType: 'string',           // 'conversation', 'feedback', 'pattern'
        sourceId: 'string',             // Source conversation/document ID
        agentId: 'string',              // Learning agent ID
        
        // Learning content
        learningType: 'string',         // 'fact', 'preference', 'pattern', 'correction'
        knowledgeCategory: 'string',    // Category of knowledge
        confidenceScore: 'number',      // Learning confidence 0-1
        validationStatus: 'string',     // 'pending', 'validated', 'rejected'
        
        // Extracted insights
        keyTopics: 'array',             // Main topics learned
        entities: 'array',              // Named entities
        relationships: 'array',         // Entity relationships
        patterns: 'array',              // Behavioral patterns
        
        // Quality and validation
        extractionQuality: 'number',    // Quality of extraction
        humanValidated: 'boolean',      // Human validation
        autoValidated: 'boolean',       // Auto validation
        validationScore: 'number',      // Validation confidence
        
        // Usage and application
        appliedCount: 'number',         // Times applied
        successRate: 'number',          // Application success rate
        lastApplied: 'string|null',     // Last application date
        
        // Context and triggers
        contextTriggers: 'array',       // When to apply
        applicableScenarios: 'array',   // Use case scenarios
        conflictsWith: 'array',         // Conflicting knowledge IDs
        
        // Learning metadata
        learningSource: 'string',       // How learned (auto, feedback, etc.)
        learningContext: 'object',      // Context when learned
        improvementMetric: 'number',    // Performance improvement
        
        // Timestamps
        extractedAt: 'string',          // When learned
        validatedAt: 'string|null',     // When validated
        lastUpdated: 'string',          // Last update
        expiresAt: 'string|null',       // Knowledge expiry
        
        // Relationships
        relatedKnowledge: 'array',      // Related learning IDs
        supersedes: 'array',            // Older knowledge replaced
        parentKnowledge: 'string|null'  // Parent knowledge entry
    },
    
    embeddingFunction: 'openai',
    distanceMetric: 'cosine',
    dimensions: 1536
};

// =============================================================================
// 4. AGENT_KNOWLEDGE COLLECTION SCHEMA
// =============================================================================

const AGENT_KNOWLEDGE_CONFIG = {
    name: 'agent_specific_knowledge',
    description: 'Agent-specific knowledge and customizations',
    
    metadataSchema: {
        // Core identification
        knowledgeId: 'string',          // Unique knowledge ID
        agentId: 'string',              // Owner agent ID
        userId: 'string',               // Creator user ID
        
        // Knowledge properties
        knowledgeType: 'string',        // 'instruction', 'fact', 'procedure', 'preference'
        priority: 'number',             // Priority level 1-10
        visibility: 'string',           // 'private', 'shared', 'public'
        
        // Content classification
        domain: 'string',               // Knowledge domain
        complexity: 'number',           // Complexity level 1-5
        specificity: 'number',          // How specific 1-5
        
        // Application rules
        triggers: 'array',              // When to activate
        conditions: 'array',            // Conditions for use
        constraints: 'array',           // Usage constraints
        
        // Performance tracking
        useCount: 'number',             // Usage frequency
        successRate: 'number',          // Success rate
        userRating: 'number|null',      // User satisfaction
        
        // Version control
        version: 'number',              // Knowledge version
        parentVersion: 'string|null',   // Previous version
        changelog: 'array',             // Change history
        
        // Timestamps
        createdAt: 'string',
        updatedAt: 'string',
        lastUsed: 'string|null',
        
        // Source and provenance
        source: 'string',               // How created
        authorId: 'string',             // Creator ID
        verified: 'boolean',            // Verification status
        confidence: 'number'            // Confidence score
    },
    
    embeddingFunction: 'openai',
    distanceMetric: 'cosine',
    dimensions: 1536
};

// =============================================================================
// COLLECTION MANAGEMENT UTILITIES
// =============================================================================

const COLLECTION_CONFIGS = {
    documents: DOCUMENTS_COLLECTION_CONFIG,
    conversations: CONVERSATIONS_COLLECTION_CONFIG,
    learning: LEARNING_COLLECTION_CONFIG,
    agentKnowledge: AGENT_KNOWLEDGE_CONFIG
};

// Validation functions
function validateMetadata(collectionType, metadata) {
    const config = COLLECTION_CONFIGS[collectionType];
    if (!config) {
        throw new Error(`Unknown collection type: ${collectionType}`);
    }
    
    // Basic validation logic
    // This would be expanded with actual validation rules
    return true;
}

// Schema utilities
function getCollectionSchema(collectionType) {
    return COLLECTION_CONFIGS[collectionType];
}

function getAllCollectionNames() {
    return Object.values(COLLECTION_CONFIGS).map(config => config.name);
}

module.exports = {
    COLLECTION_CONFIGS,
    DOCUMENTS_COLLECTION_CONFIG,
    CONVERSATIONS_COLLECTION_CONFIG,
    LEARNING_COLLECTION_CONFIG,
    AGENT_KNOWLEDGE_CONFIG,
    validateMetadata,
    getCollectionSchema,
    getAllCollectionNames
};

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
// Example document metadata
const exampleDocumentMetadata = {
    documentId: 'doc_12345',
    userId: 'user_67890',
    agentId: 'agent_abc123',
    title: 'AI Strategy Document',
    originalFileName: 'ai_strategy_2024.pdf',
    fileType: 'pdf',
    fileSize: 2048576,
    mimeType: 'application/pdf',
    contentType: 'document',
    chunkIndex: null,
    parentDocumentId: null,
    wordCount: 5420,
    language: 'en',
    processingStatus: 'processed',
    vectorized: true,
    indexed: true,
    source: 'upload',
    sourceMetadata: { uploadMethod: 'drag_drop' },
    accessCount: 15,
    lastAccessed: '2024-01-15T10:30:00Z',
    relevanceScore: 0.87,
    uploadedAt: '2024-01-10T09:00:00Z',
    processedAt: '2024-01-10T09:05:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    tags: ['strategy', 'ai', 'planning'],
    categories: ['business', 'technology'],
    topics: ['artificial intelligence', 'strategic planning'],
    extractionQuality: 0.92,
    readabilityScore: 0.78,
    informationDensity: 0.85
};

// Example conversation metadata
const exampleConversationMetadata = {
    conversationId: 'conv_12345',
    messageId: 'msg_67890',
    userId: 'user_123',
    agentId: 'agent_456',
    messageType: 'assistant',
    messageRole: 'response',
    sequenceNumber: 3,
    hasContext: true,
    contextSources: ['doc_12345', 'doc_67890'],
    contextRelevance: 0.84,
    modelUsed: 'gpt-4',
    temperature: 0.7,
    tokensUsed: 450,
    processingTime: 1200,
    responseQuality: 0.9,
    userSatisfaction: null,
    relevanceScore: 0.88,
    coherenceScore: 0.91,
    containsQuestion: false,
    containsInstruction: true,
    requiresLearning: true,
    learningPriority: 8,
    conversationTopic: 'AI implementation strategy',
    intentCategory: 'information_seeking',
    emotionalTone: 'neutral',
    createdAt: '2024-01-15T14:30:00Z',
    processedAt: '2024-01-15T14:30:15Z',
    learnedAt: null,
    upvotes: 1,
    downvotes: 0,
    flagged: false,
    bookmarked: true
};
*/ 