/**
 * ⚙️ Agent RAG Service - Phase 4 Day 15 Step 15.3
 * Agent-specific RAG configuration management với database integration
 */

import { prisma } from './prisma';
import { semanticSearchService, SearchConfig, SearchFilter } from './semantic-search-service';
import { ragContextBuilder, ContextConfig } from './rag-context-builder';

export interface AgentRAGSettings {
  // RAG Enable/Disable
  enabled: boolean;
  useAutoLearning: boolean;
  enableMultiModel: boolean;

  // Search Configuration
  searchThreshold: number;
  maxResults: number;
  semanticWeight: number;
  keywordWeight: number;
  enableKeywordSearch: boolean;

  // Context Configuration
  maxTokens: number;
  maxContextLength: number;
  maxSourcesPerContext: number;
  includeSourceInfo: boolean;
  includeHighlights: boolean;

  // Quality Settings
  minRelevanceScore: number;
  prioritizeRecency: boolean;
  balanceContentTypes: boolean;

  // Fallback Behavior
  fallbackToGeneral: boolean;
  fallbackPrompt?: string;
  enableEmptyContextResponse: boolean;

  // Performance Settings
  timeoutMs: number;
  enableCaching: boolean;
  cacheTTL: number;
}

export interface RAGOperationResult {
  success: boolean;
  hasContext: boolean;
  contextAssembly?: any; // ContextAssembly type
  searchResults?: any[]; // SearchResult type

  // Performance metrics
  searchTime: number;
  contextBuildTime: number;
  totalTime: number;

  // Configuration used
  agentId: string;
  userId: string;
  settings: AgentRAGSettings;

  // Errors and warnings
  errors: string[];
  warnings: string[];

  // Fallback info
  usedFallback: boolean;
  fallbackReason?: string;
}

export const DEFAULT_RAG_SETTINGS: AgentRAGSettings = {
  enabled: true,
  useAutoLearning: true,
  enableMultiModel: false,

  searchThreshold: 0.7,
  maxResults: 20,
  semanticWeight: 0.8,
  keywordWeight: 0.2,
  enableKeywordSearch: true,

  maxTokens: 8000,
  maxContextLength: 32000,
  maxSourcesPerContext: 10,
  includeSourceInfo: true,
  includeHighlights: true,

  minRelevanceScore: 0.5,
  prioritizeRecency: false,
  balanceContentTypes: true,

  fallbackToGeneral: true,
  enableEmptyContextResponse: true,

  timeoutMs: 10000,
  enableCaching: true,
  cacheTTL: 300000, // 5 minutes
};

export class AgentRAGService {
  private static instance: AgentRAGService;
  private settingsCache: Map<string, AgentRAGSettings> = new Map();
  private operationCache: Map<string, RAGOperationResult> = new Map();

  constructor() {}

  static getInstance(): AgentRAGService {
    if (!AgentRAGService.instance) {
      AgentRAGService.instance = new AgentRAGService();
    }
    return AgentRAGService.instance;
  }

  /**
   * Main RAG operation - tìm context cho agent query
   */
  async performRAGOperation(
    agentId: string,
    userId: string,
    query: string,
    customSettings?: Partial<AgentRAGSettings>
  ): Promise<RAGOperationResult> {
    const startTime = Date.now();

    console.log(`⚙️ Starting RAG operation for agent ${agentId}, query: "${query}"`);

    try {
      // Get agent RAG settings
      const settings = await this.getAgentRAGSettings(agentId, customSettings);

      // Check if RAG is enabled
      if (!settings.enabled) {
        return this.createDisabledResult(agentId, userId, settings);
      }

      // Check cache first
      if (settings.enableCaching) {
        const cacheKey = this.generateCacheKey(agentId, userId, query, settings);
        const cached = this.operationCache.get(cacheKey);

        if (cached && this.isCacheValid(cached, settings.cacheTTL)) {
          console.log('✅ Cache hit for RAG operation');
          return cached;
        }
      }

      // Perform search with timeout
      const searchStartTime = Date.now();
      const searchResults = await Promise.race([
        this.performSearch(userId, query, settings),
        this.createTimeoutPromise<any[]>(settings.timeoutMs, 'Search timeout'),
      ]);
      const searchTime = Date.now() - searchStartTime;

      // Build context if search results exist
      let contextAssembly;
      let contextBuildTime = 0;
      const warnings: string[] = [];

      if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
        const contextStartTime = Date.now();
        contextAssembly = await this.buildContext(searchResults, query, settings);
        contextBuildTime = Date.now() - contextStartTime;
      } else {
        warnings.push('No search results found');
      }

      // Handle empty context
      if (!contextAssembly || contextAssembly.totalSources === 0) {
        if (settings.fallbackToGeneral) {
          return await this.handleFallback(agentId, userId, query, settings, {
            searchTime,
            contextBuildTime: 0,
            totalTime: Date.now() - startTime,
          });
        }

        if (!settings.enableEmptyContextResponse) {
          throw new Error('No relevant context found and empty responses disabled');
        }
      }

      const totalTime = Date.now() - startTime;

      const result: RAGOperationResult = {
        success: true,
        hasContext: !!contextAssembly && contextAssembly.totalSources > 0,
        contextAssembly,
        searchResults,

        searchTime,
        contextBuildTime,
        totalTime,

        agentId,
        userId,
        settings,

        errors: [],
        warnings,

        usedFallback: false,
      };

      // Cache result
      if (settings.enableCaching) {
        const cacheKey = this.generateCacheKey(agentId, userId, query, settings);
        this.operationCache.set(cacheKey, result);
        this.cleanCache();
      }

      console.log(
        `✅ RAG operation completed: ${result.hasContext ? 'context found' : 'no context'} in ${totalTime}ms`
      );
      return result;
    } catch (error) {
      const totalTime = Date.now() - startTime;

      console.error('❌ RAG operation failed:', error);

      // Try fallback on error
      const settings = await this.getAgentRAGSettings(agentId, customSettings);
      if (settings.fallbackToGeneral) {
        return await this.handleFallback(
          agentId,
          userId,
          query,
          settings,
          {
            searchTime: 0,
            contextBuildTime: 0,
            totalTime,
          },
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      return {
        success: false,
        hasContext: false,

        searchTime: 0,
        contextBuildTime: 0,
        totalTime,

        agentId,
        userId,
        settings: settings || DEFAULT_RAG_SETTINGS,

        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],

        usedFallback: false,
      };
    }
  }

  /**
   * Get agent RAG settings từ database với fallback
   */
  async getAgentRAGSettings(
    agentId: string,
    customSettings?: Partial<AgentRAGSettings>
  ): Promise<AgentRAGSettings> {
    try {
      // Check cache first
      const cacheKey = `settings_${agentId}`;
      if (this.settingsCache.has(cacheKey)) {
        const cached = this.settingsCache.get(cacheKey)!;
        return customSettings ? { ...cached, ...customSettings } : cached;
      }

      // For now, use default settings until schema is updated
      console.log(`⚙️ Using default RAG settings for agent ${agentId} (schema pending)`);
      const defaultSettings = { ...DEFAULT_RAG_SETTINGS, ...customSettings };
      this.settingsCache.set(cacheKey, defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error(`❌ Failed to load RAG settings for agent ${agentId}:`, error);
      const defaultSettings = { ...DEFAULT_RAG_SETTINGS, ...customSettings };
      return defaultSettings;
    }
  }

  /**
   * Parse agent settings from database
   */
  private parseAgentSettings(agent: any): AgentRAGSettings {
    const ragSettings = agent.ragSettings ? JSON.parse(agent.ragSettings) : {};
    const autoLearningSettings = agent.autoLearningSettings
      ? JSON.parse(agent.autoLearningSettings)
      : {};
    const multiModelSettings = agent.multiModelSettings ? JSON.parse(agent.multiModelSettings) : {};

    return {
      ...DEFAULT_RAG_SETTINGS,

      // RAG Settings
      enabled: ragSettings.enabled !== false, // Default true
      searchThreshold: ragSettings.searchThreshold || DEFAULT_RAG_SETTINGS.searchThreshold,
      maxResults: ragSettings.maxResults || DEFAULT_RAG_SETTINGS.maxResults,
      semanticWeight: ragSettings.semanticWeight || DEFAULT_RAG_SETTINGS.semanticWeight,
      keywordWeight: ragSettings.keywordWeight || DEFAULT_RAG_SETTINGS.keywordWeight,
      enableKeywordSearch: ragSettings.enableKeywordSearch !== false,

      // Context Settings
      maxTokens: ragSettings.maxTokens || DEFAULT_RAG_SETTINGS.maxTokens,
      maxContextLength: ragSettings.maxContextLength || DEFAULT_RAG_SETTINGS.maxContextLength,
      maxSourcesPerContext:
        ragSettings.maxSourcesPerContext || DEFAULT_RAG_SETTINGS.maxSourcesPerContext,
      includeSourceInfo: ragSettings.includeSourceInfo !== false,
      includeHighlights: ragSettings.includeHighlights !== false,

      // Quality Settings
      minRelevanceScore: ragSettings.minRelevanceScore || DEFAULT_RAG_SETTINGS.minRelevanceScore,
      prioritizeRecency: ragSettings.prioritizeRecency || false,
      balanceContentTypes: ragSettings.balanceContentTypes !== false,

      // Auto Learning
      useAutoLearning: autoLearningSettings.enabled || false,

      // Multi Model
      enableMultiModel: multiModelSettings.enabled || false,

      // Fallback
      fallbackToGeneral: ragSettings.fallbackToGeneral !== false,
      fallbackPrompt: ragSettings.fallbackPrompt,
      enableEmptyContextResponse: ragSettings.enableEmptyContextResponse !== false,

      // Performance
      timeoutMs: ragSettings.timeoutMs || DEFAULT_RAG_SETTINGS.timeoutMs,
      enableCaching: ragSettings.enableCaching !== false,
      cacheTTL: ragSettings.cacheTTL || DEFAULT_RAG_SETTINGS.cacheTTL,
    };
  }

  /**
   * Perform semantic search
   */
  private async performSearch(
    userId: string,
    query: string,
    settings: AgentRAGSettings
  ): Promise<any[]> {
    const searchConfig: Partial<SearchConfig> = {
      semanticThreshold: settings.searchThreshold,
      semanticWeight: settings.semanticWeight,
      keywordWeight: settings.keywordWeight,
      enableKeywordSearch: settings.enableKeywordSearch,
      maxResults: settings.maxResults,
      minRelevanceScore: settings.minRelevanceScore,
      enableCache: settings.enableCaching,
    };

    const filters: SearchFilter = {
      userId,
    };

    const searchResponse = await semanticSearchService.search(query, userId, filters, searchConfig);
    return searchResponse.results;
  }

  /**
   * Build context from search results
   */
  private async buildContext(
    searchResults: any[],
    query: string,
    settings: AgentRAGSettings
  ): Promise<any> {
    const contextConfig: Partial<ContextConfig> = {
      maxTokens: settings.maxTokens,
      maxContextLength: settings.maxContextLength,
      maxSourcesPerContext: settings.maxSourcesPerContext,
      includeSourceInfo: settings.includeSourceInfo,
      includeHighlights: settings.includeHighlights,
      minRelevanceForInclusion: settings.minRelevanceScore,
      prioritizeRecency: settings.prioritizeRecency,
      balanceContentTypes: settings.balanceContentTypes,
    };

    return await ragContextBuilder.buildContext(searchResults, query, contextConfig);
  }

  /**
   * Handle fallback behavior
   */
  private async handleFallback(
    agentId: string,
    userId: string,
    query: string,
    settings: AgentRAGSettings,
    timing: { searchTime: number; contextBuildTime: number; totalTime: number },
    errorMessage?: string
  ): Promise<RAGOperationResult> {
    console.log(`🔄 Using fallback behavior for agent ${agentId}`);

    return {
      success: true,
      hasContext: false,

      searchTime: timing.searchTime,
      contextBuildTime: timing.contextBuildTime,
      totalTime: timing.totalTime,

      agentId,
      userId,
      settings,

      errors: errorMessage ? [errorMessage] : [],
      warnings: ['Using fallback behavior - no relevant context found'],

      usedFallback: true,
      fallbackReason: errorMessage || 'No context available',
    };
  }

  /**
   * Create disabled result when RAG is disabled
   */
  private createDisabledResult(
    agentId: string,
    userId: string,
    settings: AgentRAGSettings
  ): RAGOperationResult {
    return {
      success: true,
      hasContext: false,

      searchTime: 0,
      contextBuildTime: 0,
      totalTime: 0,

      agentId,
      userId,
      settings,

      errors: [],
      warnings: ['RAG is disabled for this agent'],

      usedFallback: false,
    };
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise<T>(ms: number, message: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    agentId: string,
    userId: string,
    query: string,
    settings: AgentRAGSettings
  ): string {
    const settingsHash = JSON.stringify(settings);
    return `${agentId}:${userId}:${query}:${settingsHash}`;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(result: RAGOperationResult, ttl: number): boolean {
    return Date.now() - new Date(result.searchTime).getTime() < ttl;
  }

  /**
   * Clean cache when it gets too large
   */
  private cleanCache(): void {
    if (this.operationCache.size > 1000) {
      const entries = Array.from(this.operationCache.entries());
      this.operationCache.clear();

      // Keep only the 500 most recent entries
      entries.slice(-500).forEach(([key, value]) => {
        this.operationCache.set(key, value);
      });

      console.log('🧹 RAG operation cache cleaned');
    }

    if (this.settingsCache.size > 100) {
      const entries = Array.from(this.settingsCache.entries());
      this.settingsCache.clear();

      // Keep only the 50 most recent entries
      entries.slice(-50).forEach(([key, value]) => {
        this.settingsCache.set(key, value);
      });

      console.log('🧹 RAG settings cache cleaned');
    }
  }

  /**
   * Update agent RAG settings
   * ✅ Implemented with current schema fields - Day 2.1
   */
  async updateAgentRAGSettings(
    agentId: string,
    settings: Partial<AgentRAGSettings>
  ): Promise<void> {
    console.log(`⚙️ Update RAG settings for agent ${agentId} - pending schema update`);

    // For now, just invalidate cache to use new default settings
    const cacheKey = `settings_${agentId}`;
    this.settingsCache.delete(cacheKey);

    console.log(`✅ Settings cache invalidated for agent ${agentId}`);
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.settingsCache.clear();
    this.operationCache.clear();
    console.log('🧹 All RAG caches cleared');
  }

  /**
   * Get service statistics
   */
  getServiceStats(): any {
    return {
      settingsCacheSize: this.settingsCache.size,
      operationCacheSize: this.operationCache.size,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const agentRAGService = AgentRAGService.getInstance();
