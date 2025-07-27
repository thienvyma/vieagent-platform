/**
 * 🚀 Provider Manager - Day 19 Step 19.5
 * Unified interface for managing all AI providers with intelligent routing and failover
 */

import {
  IModelProvider,
  ChatRequest,
  ChatResponse,
  EmbedRequest,
  EmbedResponse,
  ProviderType,
  ProviderConfig,
  ValidationResult,
  HealthStatus,
  ProviderMetrics,
  ProviderCapabilities,
  ProviderError,
  ERROR_CODES,
  createProviderError,
} from './IModelProvider';

import { ProviderFactory, ProviderSelector } from './ProviderFactory';
import { MultiProviderConfigSchema } from './ProviderConfig';

/**
 * 📊 Provider Manager Configuration
 */
export interface ProviderManagerConfig {
  defaultProvider: string;
  fallbackProviders: string[];
  enableHealthChecks: boolean;
  healthCheckInterval: number; // minutes
  enableFailover: boolean;
  failoverThreshold: number; // consecutive failures
  enableLoadBalancing: boolean;
  requestTimeout: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

/**
 * 📈 Provider Performance Metrics
 */
export interface ProviderMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalLatency: number;
  averageLatency: number;
  uptime: number;
  lastRequestTime: Date | null;
  failureStreak: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

/**
 * 🎯 Smart Request Routing
 */
export interface SmartRoutingOptions {
  preferredProvider?: string;
  requireCapabilities?: string[];
  excludeProviders?: string[];
  maxLatency?: number;
  minSuccessRate?: number;
  loadBalanceBy?: 'round-robin' | 'lowest-latency' | 'success-rate';
}

/**
 * 🚀 Provider Manager Implementation
 */
export class ProviderManager {
  private static instance: ProviderManager;
  private factory: ProviderFactory;
  private selector: ProviderSelector;
  private config: ProviderManagerConfig;
  private metrics: Map<string, ProviderMetrics> = new Map();
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private roundRobinIndex: number = 0;

  private constructor() {
    this.factory = ProviderFactory.getInstance();
    this.selector = new ProviderSelector(this.factory);
    this.config = this.getDefaultConfig();
    this.initializeMetrics();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  /**
   * Initialize provider manager
   */
  async initialize(
    configs: Record<string, ProviderConfig>,
    managerConfig?: Partial<ProviderManagerConfig>
  ): Promise<void> {
    if (managerConfig) {
      this.config = { ...this.config, ...managerConfig };
    }

    console.log('🚀 Initializing Provider Manager...');

    // Initialize all providers
    for (const [providerName, config] of Object.entries(configs)) {
      try {
        await this.addProvider(providerName, config);
        console.log(`✅ Provider ${providerName} initialized successfully`);
      } catch (error) {
        console.error(`❌ Failed to initialize provider ${providerName}:`, error);
      }
    }

    // Start health checks if enabled
    if (this.config.enableHealthChecks) {
      this.startHealthChecks();
    }

    console.log(
      `🎯 Provider Manager initialized with ${this.getAvailableProviders().length} providers`
    );
  }

  /**
   * Add a provider
   */
  async addProvider(providerName: string, config: ProviderConfig): Promise<void> {
    console.log(`🔧 Adding provider: ${providerName}`);

    // Validate configuration
    const validationResult = await this.validateProviderConfig(providerName, config);
    if (!validationResult.valid) {
      throw new ProviderError(
        `Invalid configuration for ${providerName}: ${validationResult.errors.join(', ')}`,
        providerName,
        'INVALID_CONFIG'
      );
    }

    // Create provider
    const provider = await this.factory.createProvider(config);

    // Initialize metrics
    this.initializeProviderMetrics(providerName);

    console.log(`✅ Provider ${providerName} added successfully`);
  }

  /**
   * Remove a provider
   */
  async removeProvider(providerName: string): Promise<void> {
    console.log(`🗑️ Removing provider: ${providerName}`);

    await this.factory.destroyProvider(providerName);
    this.metrics.delete(providerName);

    console.log(`✅ Provider ${providerName} removed successfully`);
  }

  /**
   * Smart chat with automatic provider selection
   */
  async smartChat(
    request: ChatRequest,
    options?: SmartRoutingOptions
  ): Promise<ChatResponse & { providerId: string }> {
    const startTime = Date.now();

    // Select best provider
    const selectedProvider = await this.selectProvider(request.model, 'chat', options);
    if (!selectedProvider) {
      throw new ProviderError('No suitable provider found', 'manager', 'NO_PROVIDER');
    }

    console.log(`🤖 Smart Chat routing to: ${selectedProvider}`);

    try {
      // Get default config for the provider
      const defaultConfig = this.factory.getDefaultConfig(selectedProvider as any);

      // Create provider config
      const providerConfig = {
        ...defaultConfig,
        provider: selectedProvider,
        model: request.model,
        apiKey: process.env[`${selectedProvider.toUpperCase()}_API_KEY`] || '',
      };

      // Get or create provider instance
      const provider = await this.factory.getOrCreateProvider(
        `${selectedProvider}-smart-chat`,
        providerConfig as any
      );

      // Execute request with timeout
      const response = await this.executeWithTimeout(
        provider.chat(request),
        this.config.requestTimeout
      );

      // Record success
      this.recordSuccess(selectedProvider, Date.now() - startTime);

      return {
        ...response,
        providerId: selectedProvider,
      };
    } catch (error) {
      // Record failure
      this.recordFailure(selectedProvider, Date.now() - startTime);

      // Try failover if enabled
      if (this.config.enableFailover && this.shouldFailover(selectedProvider)) {
        console.log(`🔄 Attempting failover from ${selectedProvider}`);
        return this.attemptFailover(request, selectedProvider, options);
      }

      throw error;
    }
  }

  /**
   * Smart embedding with automatic provider selection
   */
  async smartEmbed(
    request: EmbedRequest,
    options?: SmartRoutingOptions
  ): Promise<EmbedResponse & { providerId: string }> {
    const startTime = Date.now();

    // Select best provider
    const selectedProvider = await this.selectProvider(request.model, 'embedding', options);
    if (!selectedProvider) {
      throw new ProviderError('No suitable provider found for embedding', 'manager', 'NO_PROVIDER');
    }

    console.log(`🔢 Smart Embedding routing to: ${selectedProvider}`);

    try {
      const provider = this.factory.getProvider(selectedProvider);
      if (!provider) {
        throw new ProviderError(
          `Provider ${selectedProvider} not available`,
          selectedProvider,
          'PROVIDER_NOT_FOUND'
        );
      }

      // Execute request with timeout
      const response = await this.executeWithTimeout(
        provider.embed(request),
        this.config.requestTimeout
      );

      // Record success
      this.recordSuccess(selectedProvider, Date.now() - startTime);

      return {
        ...response,
        providerId: selectedProvider,
      };
    } catch (error) {
      // Record failure
      this.recordFailure(selectedProvider, Date.now() - startTime);

      // Try failover if enabled
      if (this.config.enableFailover && this.shouldFailover(selectedProvider)) {
        console.log(`🔄 Attempting failover from ${selectedProvider}`);
        return this.attemptEmbeddingFailover(request, selectedProvider, options);
      }

      throw error;
    }
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(providerName?: string): Promise<Record<string, HealthStatus>> {
    if (providerName) {
      const provider = this.factory.getProvider(providerName);
      if (!provider) {
        throw new ProviderError(
          `Provider ${providerName} not found`,
          providerName,
          'PROVIDER_NOT_FOUND'
        );
      }
      return { [providerName]: await provider.healthCheck() };
    }

    // Get health for all providers
    return await this.factory.healthCheckAll();
  }

  /**
   * Get provider metrics
   */
  getProviderMetrics(providerName?: string): Record<string, ProviderMetrics> {
    if (providerName) {
      const metrics = this.metrics.get(providerName);
      if (!metrics) {
        throw new ProviderError(
          `Metrics for provider ${providerName} not found`,
          providerName,
          'METRICS_NOT_FOUND'
        );
      }
      return { [providerName]: metrics };
    }

    // Return all metrics
    return Object.fromEntries(this.metrics.entries());
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return this.factory.listProviders();
  }

  /**
   * Get supported models by provider
   */
  getSupportedModels(providerName?: string): Record<string, string[]> {
    const providers = providerName ? [providerName] : this.getAvailableProviders();
    const models: Record<string, string[]> = {};

    for (const name of providers) {
      const provider = this.factory.getProvider(name);
      if (provider) {
        models[name] = provider.getSupportedModels();
      }
    }

    return models;
  }

  /**
   * Update provider configuration
   */
  async updateProviderConfig(providerName: string, config: ProviderConfig): Promise<void> {
    await this.factory.updateProviderConfig(providerName, config);
    console.log(`🔧 Provider ${providerName} configuration updated`);
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Provider Manager...');

    // Stop health checks
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Destroy all providers
    await this.factory.destroyAllProviders();

    // Clear metrics
    this.metrics.clear();

    console.log('✅ Provider Manager shut down successfully');
  }

  /**
   * Private helper methods
   */

  private getDefaultConfig(): ProviderManagerConfig {
    return {
      defaultProvider: 'openai',
      fallbackProviders: ['anthropic', 'google'],
      enableHealthChecks: true,
      healthCheckInterval: 5, // minutes
      enableFailover: true,
      failoverThreshold: 3,
      enableLoadBalancing: true,
      requestTimeout: 30000, // 30 seconds
      retryAttempts: 2,
      retryDelay: 1000, // 1 second
    };
  }

  private initializeMetrics(): void {
    const providers = this.factory.getRegistry().listRegisteredProviders();
    for (const provider of providers) {
      this.initializeProviderMetrics(provider);
    }
  }

  private initializeProviderMetrics(providerName: string): void {
    this.metrics.set(providerName, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalLatency: 0,
      averageLatency: 0,
      uptime: 100,
      lastRequestTime: null,
      failureStreak: 0,
      healthStatus: 'healthy',
    });
  }

  private async selectProvider(
    model: string,
    capability: string,
    options?: SmartRoutingOptions
  ): Promise<string | null> {
    const availableProviders = this.getAvailableProviders();

    if (availableProviders.length === 0) {
      return null;
    }

    // Filter by options
    let candidates = availableProviders;

    if (options?.excludeProviders) {
      candidates = candidates.filter(p => !options.excludeProviders!.includes(p));
    }

    if (options?.preferredProvider && candidates.includes(options.preferredProvider)) {
      const provider = this.factory.getProvider(options.preferredProvider);
      if (provider && this.providerSupportsModel(provider, model)) {
        return options.preferredProvider;
      }
    }

    // Filter by capability and model support
    candidates = candidates.filter(name => {
      const provider = this.factory.getProvider(name);
      if (!provider) return false;

      // Check model support
      if (!this.providerSupportsModel(provider, model)) return false;

      // Check capability
      if (capability === 'chat' && !this.checkCapability(provider, capability)) return false;
      if (capability === 'embedding' && !this.checkCapability(provider, capability)) return false;

      return true;
    });

    if (candidates.length === 0) {
      return null;
    }

    // Apply load balancing strategy
    if (this.config.enableLoadBalancing && options?.loadBalanceBy) {
      return this.selectByLoadBalancing(candidates, options.loadBalanceBy);
    }

    // Default to first available or round-robin
    if (candidates.length === 1) {
      return candidates[0];
    }

    // Round-robin selection
    this.roundRobinIndex = (this.roundRobinIndex + 1) % candidates.length;
    return candidates[this.roundRobinIndex];
  }

  private providerSupportsModel(provider: IModelProvider, model: string): boolean {
    return provider.getSupportedModels().includes(model);
  }

  private checkCapability(provider: IModelProvider, capability: string): boolean {
    if (capability === 'chat' && !provider.capabilities.supportsStreaming) return false;
    if (capability === 'embedding' && !provider.capabilities.supportsEmbedding) return false;
    return true;
  }

  private selectByLoadBalancing(candidates: string[], strategy: string): string {
    switch (strategy) {
      case 'lowest-latency':
        return candidates.reduce((best, current) => {
          const currentMetrics = this.metrics.get(current);
          const bestMetrics = this.metrics.get(best);

          if (!currentMetrics) return best;
          if (!bestMetrics) return current;

          return currentMetrics.averageLatency < bestMetrics.averageLatency ? current : best;
        });

      case 'success-rate':
        return candidates.reduce((best, current) => {
          const currentMetrics = this.metrics.get(current);
          const bestMetrics = this.metrics.get(best);

          if (!currentMetrics) return best;
          if (!bestMetrics) return current;

          const currentSuccessRate =
            currentMetrics.totalRequests > 0
              ? currentMetrics.successfulRequests / currentMetrics.totalRequests
              : 0;
          const bestSuccessRate =
            bestMetrics.totalRequests > 0
              ? bestMetrics.successfulRequests / bestMetrics.totalRequests
              : 0;

          return currentSuccessRate > bestSuccessRate ? current : best;
        });

      default: // round-robin
        this.roundRobinIndex = (this.roundRobinIndex + 1) % candidates.length;
        return candidates[this.roundRobinIndex];
    }
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private recordSuccess(providerName: string, latency: number): void {
    const metrics = this.metrics.get(providerName);
    if (metrics) {
      metrics.totalRequests++;
      metrics.successfulRequests++;
      metrics.totalLatency += latency;
      metrics.averageLatency = metrics.totalLatency / metrics.totalRequests;
      metrics.lastRequestTime = new Date();
      metrics.failureStreak = 0;
      metrics.healthStatus = 'healthy';
    }
  }

  private recordFailure(providerName: string, latency: number): void {
    const metrics = this.metrics.get(providerName);
    if (metrics) {
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.totalLatency += latency;
      metrics.averageLatency = metrics.totalLatency / metrics.totalRequests;
      metrics.lastRequestTime = new Date();
      metrics.failureStreak++;

      if (metrics.failureStreak >= this.config.failoverThreshold) {
        metrics.healthStatus = 'unhealthy';
      }
    }
  }

  private shouldFailover(providerName: string): boolean {
    const metrics = this.metrics.get(providerName);
    return metrics ? metrics.failureStreak >= this.config.failoverThreshold : false;
  }

  private async attemptFailover(
    request: ChatRequest,
    failedProvider: string,
    options?: SmartRoutingOptions
  ): Promise<ChatResponse & { providerId: string }> {
    const fallbackOptions = {
      ...options,
      excludeProviders: [...(options?.excludeProviders || []), failedProvider],
    };

    for (const fallbackProvider of this.config.fallbackProviders) {
      if (fallbackProvider === failedProvider) continue;

      try {
        const provider = this.factory.getProvider(fallbackProvider);
        if (!provider) continue;

        // Try to use the same model, or fallback to a supported model
        let model = request.model;
        if (!provider.getSupportedModels().includes(model)) {
          const supportedModels = provider.getSupportedModels();
          if (supportedModels.length === 0) continue;
          model = supportedModels[0];
        }

        const response = await provider.chat({ ...request, model });
        this.recordSuccess(fallbackProvider, 0);

        console.log(`✅ Successful failover to ${fallbackProvider}`);
        return {
          ...response,
          providerId: fallbackProvider,
        };
      } catch (error) {
        this.recordFailure(fallbackProvider, 0);
        console.warn(`❌ Failover to ${fallbackProvider} failed:`, error);
        continue;
      }
    }

    throw new ProviderError('All failover attempts failed', 'manager', 'FAILOVER_FAILED');
  }

  private async attemptEmbeddingFailover(
    request: EmbedRequest,
    failedProvider: string,
    options?: SmartRoutingOptions
  ): Promise<EmbedResponse & { providerId: string }> {
    for (const fallbackProvider of this.config.fallbackProviders) {
      if (fallbackProvider === failedProvider) continue;

      try {
        const provider = this.factory.getProvider(fallbackProvider);
        if (!provider || !this.checkCapability(provider, 'embedding')) continue;

        // Try to use the same model, or fallback to a supported model
        let model = request.model;
        if (!provider.getSupportedModels().includes(model)) {
          const supportedModels = provider
            .getSupportedModels()
            .filter(m => m.includes('embedding'));
          if (supportedModels.length === 0) continue;
          model = supportedModels[0];
        }

        const response = await provider.embed({ ...request, model });
        this.recordSuccess(fallbackProvider, 0);

        console.log(`✅ Successful embedding failover to ${fallbackProvider}`);
        return {
          ...response,
          providerId: fallbackProvider,
        };
      } catch (error) {
        this.recordFailure(fallbackProvider, 0);
        console.warn(`❌ Embedding failover to ${fallbackProvider} failed:`, error);
        continue;
      }
    }

    throw new ProviderError('All embedding failover attempts failed', 'manager', 'FAILOVER_FAILED');
  }

  private async validateProviderConfig(
    providerName: string,
    config: ProviderConfig
  ): Promise<ValidationResult> {
    try {
      // Validate with Zod schema
      const providerSchema = (MultiProviderConfigSchema as any)[providerName];
      if (providerSchema) {
        providerSchema.parse(config);
      }

      // Create temporary provider for validation
      const tempProvider = await this.factory.createProvider(config);
      const result = await tempProvider.validate(config);

      // Clean up temporary provider
      await tempProvider.cleanup();

      return result;
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
        warnings: [],
        capabilities: {} as any,
      };
    }
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(
      async () => {
        const healthChecks = await this.getProviderHealth();

        for (const [providerName, health] of Object.entries(healthChecks)) {
          const metrics = this.metrics.get(providerName);
          if (metrics) {
            metrics.healthStatus = health.status;
          }
        }
      },
      this.config.healthCheckInterval * 60 * 1000
    );

    console.log(`🏥 Health checks started (interval: ${this.config.healthCheckInterval} minutes)`);
  }

  async findBestProvider(
    capability: 'chat' | 'embedding',
    requirements?: {
      maxLatency?: number;
      minQuality?: number;
      maxCost?: number;
    }
  ): Promise<IModelProvider | null> {
    const suitableProviders = [];

    for (const [name, provider] of this.providers) {
      try {
        // Check if provider supports the capability
        if (capability === 'chat' && !provider.capabilities.supportsStreaming) continue;
        if (capability === 'embedding' && !provider.capabilities.supportsEmbedding) continue;

        // Check health
        const health = await provider.healthCheck();
        if (health.status !== 'healthy') continue;

        // Check requirements
        if (requirements) {
          if (requirements.maxLatency && health.responseTime > requirements.maxLatency) continue;
          // Add more requirement checks as needed
        }

        suitableProviders.push({ name, provider, health });
      } catch (error) {
        console.warn(`Provider ${name} failed health check:`, error);
      }
    }

    if (suitableProviders.length === 0) return null;

    // Sort by response time (fastest first)
    suitableProviders.sort((a, b) => a.health.responseTime - b.health.responseTime);

    return suitableProviders[0].provider;
  }
}

// Export singleton instance
export const providerManager = ProviderManager.getInstance();
