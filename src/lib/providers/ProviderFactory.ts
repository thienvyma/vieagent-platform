/**
 * 🏭 Provider Factory Implementation
 *
 * Central factory for creating and managing AI model providers
 * Handles provider registration, instantiation, and configuration
 *
 * DAY 19 - Provider Abstraction Implementation
 */

import {
  IModelProvider,
  IProviderFactory,
  ProviderType,
  ProviderConfig,
  ValidationResult,
  ProviderRegistration,
  OpenAIConfig,
  AnthropicConfig,
  GoogleConfig,
  PROVIDER_DEFAULTS,
} from './IModelProvider';

import OpenAIProvider from './OpenAIProvider';
import AnthropicProvider from './AnthropicProvider';
import GoogleProvider from './GoogleProvider';

// Add missing export that is referenced in ProviderManager
export class ProviderSelector {
  static selectOptimalProvider(
    providers: ProviderType[],
    requirements: {
      cost?: 'low' | 'medium' | 'high';
      speed?: 'fast' | 'medium' | 'slow';
      quality?: 'high' | 'medium' | 'low';
    }
  ): ProviderType {
    // Simple selection logic - can be enhanced
    if (requirements.cost === 'low') return 'google';
    if (requirements.speed === 'fast') return 'openai';
    if (requirements.quality === 'high') return 'anthropic';
    return providers[0] || 'openai';
  }
}

export class ProviderFactory implements IProviderFactory {
  private static instance: ProviderFactory;
  private providers: Map<ProviderType, ProviderRegistration> = new Map();
  private activeProviders: Map<string, IModelProvider> = new Map();

  private constructor() {
    this.registerBuiltInProviders();
  }

  public static getInstance(): ProviderFactory {
    if (!ProviderFactory.instance) {
      ProviderFactory.instance = new ProviderFactory();
    }
    return ProviderFactory.instance;
  }

  // =============================================================================
  // PROVIDER REGISTRATION
  // =============================================================================

  private registerBuiltInProviders(): void {
    // Register OpenAI Provider
    this.providers.set('openai', {
      type: 'openai',
      name: 'OpenAI',
      description: 'OpenAI GPT models including GPT-4, GPT-3.5, and embeddings',
      constructor: OpenAIProvider as any,
      defaultConfig: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000,
        timeout: 30000,
        retries: 3,
        enableCaching: true,
        enableMetrics: true,
      },
      requiredConfig: ['apiKey', 'model'],
    });

    // Register Anthropic Provider
    this.providers.set('anthropic', {
      type: 'anthropic',
      name: 'Anthropic',
      description: 'Anthropic Claude models including Claude 3.5 Sonnet, Opus, and Haiku',
      constructor: AnthropicProvider as any,
      defaultConfig: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        maxTokens: 1000,
        timeout: 30000,
        retries: 3,
        enableCaching: true,
        enableMetrics: true,
      },
      requiredConfig: ['apiKey', 'model'],
    });

    // Register Google Provider
    this.providers.set('google', {
      type: 'google',
      name: 'Google',
      description: 'Google Gemini models including Gemini Pro, Flash, and embeddings',
      constructor: GoogleProvider as any,
      defaultConfig: {
        provider: 'google',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 1000,
        timeout: 30000,
        retries: 3,
        enableCaching: true,
        enableMetrics: true,
      },
      requiredConfig: ['apiKey', 'model'],
    });

    console.log('📝 Built-in providers registered:', Array.from(this.providers.keys()));
  }

  public registerProvider(registration: ProviderRegistration): void {
    this.providers.set(registration.type, registration);
    console.log(`📝 Provider ${registration.name} registered`);
  }

  public unregisterProvider(type: ProviderType): boolean {
    const removed = this.providers.delete(type);
    if (removed) {
      console.log(`🗑️ Provider ${type} unregistered`);
    }
    return removed;
  }

  // =============================================================================
  // PROVIDER CREATION
  // =============================================================================

  public createProvider(config: ProviderConfig): IModelProvider {
    const registration = this.providers.get(config.provider);
    if (!registration) {
      throw new Error(`Provider '${config.provider}' is not registered`);
    }

    // Validate configuration
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    // Merge with default configuration
    const mergedConfig = this.mergeWithDefaults(config, registration.defaultConfig);

    // Create provider instance
    try {
      const ProviderClass = registration.constructor;
      const provider = new ProviderClass(mergedConfig);

      console.log(`✅ Created ${registration.name} provider with model: ${config.model}`);
      return provider;
    } catch (error) {
      console.error(`❌ Failed to create ${registration.name} provider:`, error);
      throw new Error(`Failed to create provider: ${(error as Error).message}`);
    }
  }

  public async createAndInitializeProvider(config: ProviderConfig): Promise<IModelProvider> {
    const provider = this.createProvider(config);

    try {
      await provider.initialize();
      console.log(`🚀 Provider ${config.provider} initialized successfully`);
      return provider;
    } catch (error) {
      console.error(`❌ Failed to initialize ${config.provider} provider:`, error);
      throw new Error(`Failed to initialize provider: ${(error as Error).message}`);
    }
  }

  // =============================================================================
  // PROVIDER MANAGEMENT
  // =============================================================================

  public async getOrCreateProvider(
    providerId: string,
    config: ProviderConfig
  ): Promise<IModelProvider> {
    // Check if provider already exists
    let provider = this.activeProviders.get(providerId);

    if (provider) {
      // Update configuration if needed
      const currentConfig = provider.getConfig();
      if (this.hasConfigChanged(currentConfig, config)) {
        console.log(`🔄 Updating configuration for provider ${providerId}`);
        provider.updateConfig(config);
      }
      return provider;
    }

    // Create new provider
    provider = await this.createAndInitializeProvider(config);
    this.activeProviders.set(providerId, provider);

    console.log(`📦 Cached provider ${providerId} for reuse`);
    return provider;
  }

  public async destroyProvider(providerId: string): Promise<boolean> {
    const provider = this.activeProviders.get(providerId);
    if (!provider) {
      return false;
    }

    try {
      await provider.cleanup();
      this.activeProviders.delete(providerId);
      console.log(`🗑️ Provider ${providerId} destroyed`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to destroy provider ${providerId}:`, error);
      return false;
    }
  }

  public async destroyAllProviders(): Promise<void> {
    const promises = Array.from(this.activeProviders.keys()).map(id => this.destroyProvider(id));

    await Promise.all(promises);
    console.log('🧹 All providers destroyed');
  }

  // =============================================================================
  // PROVIDER DISCOVERY
  // =============================================================================

  public getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  public getProviderInfo(type: ProviderType): ProviderRegistration | null {
    return this.providers.get(type) || null;
  }

  public getAllProviderInfo(): ProviderRegistration[] {
    return Array.from(this.providers.values());
  }

  public getActiveProviders(): string[] {
    return Array.from(this.activeProviders.keys());
  }

  public getProvider(providerId: string): IModelProvider {
    const provider = this.activeProviders.get(providerId);
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`);
    }
    return provider;
  }

  public getActiveProviderCount(): number {
    return this.activeProviders.size;
  }

  // =============================================================================
  // CONFIGURATION MANAGEMENT
  // =============================================================================

  public validateConfig(config: ProviderConfig): ValidationResult {
    const registration = this.providers.get(config.provider);
    if (!registration) {
      return {
        isValid: false,
        errors: [`Provider '${config.provider}' is not registered`],
        warnings: [],
        supportedFeatures: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    for (const field of registration.requiredConfig) {
      if (!config[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Provider-specific validation
    if (config.provider === 'openai') {
      const openaiConfig = config as OpenAIConfig;
      if (
        openaiConfig.temperature &&
        (openaiConfig.temperature < 0 || openaiConfig.temperature > 2)
      ) {
        warnings.push('Temperature should be between 0 and 2');
      }
    }

    if (config.provider === 'anthropic') {
      const anthropicConfig = config as AnthropicConfig;
      if (
        anthropicConfig.temperature &&
        (anthropicConfig.temperature < 0 || anthropicConfig.temperature > 1)
      ) {
        warnings.push('Temperature should be between 0 and 1');
      }
    }

    if (config.provider === 'google') {
      const googleConfig = config as GoogleConfig;
      if (
        googleConfig.temperature &&
        (googleConfig.temperature < 0 || googleConfig.temperature > 1)
      ) {
        warnings.push('Temperature should be between 0 and 1');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      supportedFeatures: registration.defaultConfig.provider
        ? [registration.defaultConfig.provider]
        : [],
    };
  }

  public getDefaultConfig(provider: ProviderType): Partial<ProviderConfig> {
    const registration = this.providers.get(provider);
    if (!registration) {
      throw new Error(`Provider '${provider}' is not registered`);
    }

    return {
      ...PROVIDER_DEFAULTS,
      ...registration.defaultConfig,
    };
  }

  public mergeWithDefaults(
    config: ProviderConfig,
    defaults: Partial<ProviderConfig>
  ): ProviderConfig {
    return {
      ...PROVIDER_DEFAULTS,
      ...defaults,
      ...config,
    };
  }

  // =============================================================================
  // TESTING & COMPARISON
  // =============================================================================

  public async compareProviders(
    configs: ProviderConfig[],
    testPrompt: string = 'Hello, how are you?'
  ): Promise<
    Array<{
      provider: ProviderType;
      model: string;
      responseTime: number;
      success: boolean;
      error?: string;
      response?: string;
    }>
  > {
    const results = [];

    for (const config of configs) {
      const startTime = Date.now();
      try {
        const provider = this.createProvider(config);
        await provider.initialize();

        const response = await provider.chat({
          messages: [{ role: 'user', content: testPrompt }],
          model: config.model,
          maxTokens: 100,
        });

        results.push({
          provider: config.provider,
          model: config.model,
          responseTime: Date.now() - startTime,
          success: true,
          response: response.choices[0]?.message?.content || 'No response',
        });

        await provider.cleanup();
      } catch (error) {
        results.push({
          provider: config.provider,
          model: config.model,
          responseTime: Date.now() - startTime,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  // =============================================================================
  // HEALTH MONITORING
  // =============================================================================

  public async healthCheckAll(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [providerId, provider] of this.activeProviders) {
      try {
        results[providerId] = await provider.healthCheck();
      } catch (error) {
        results[providerId] = {
          status: 'unhealthy',
          error: (error as Error).message,
          lastChecked: new Date(),
        };
      }
    }

    return results;
  }

  public listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  public updateProviderConfig(providerName: string, config: Partial<ProviderConfig>): void {
    const provider = this.activeProviders.get(providerName);
    if (provider) {
      provider.updateConfig(config);
    }
  }

  public getRegistry(): { listRegisteredProviders(): ProviderType[] } {
    return {
      listRegisteredProviders: () => Array.from(this.providers.keys()),
    };
  }

  public async checkAllProvidersHealth(): Promise<Map<string, any>> {
    const healthMap = new Map<string, any>();

    for (const [providerId, provider] of this.activeProviders) {
      try {
        const health = await provider.healthCheck();
        healthMap.set(providerId, health);
      } catch (error) {
        healthMap.set(providerId, {
          status: 'unhealthy',
          error: (error as Error).message,
          lastChecked: new Date(),
        });
      }
    }

    return healthMap;
  }

  public async getProvidersMetrics(): Promise<Map<string, any>> {
    const metricsMap = new Map<string, any>();

    for (const [providerId, provider] of this.activeProviders) {
      try {
        const metrics = provider.getMetrics();
        metricsMap.set(providerId, metrics);
      } catch (error) {
        metricsMap.set(providerId, {
          error: (error as Error).message,
          timestamp: new Date(),
        });
      }
    }

    return metricsMap;
  }

  public getSupportedModels(provider: ProviderType): string[] {
    const registration = this.providers.get(provider);
    if (!registration) {
      throw new Error(`Provider '${provider}' is not registered`);
    }

    try {
      const tempProvider = this.createProvider({
        provider,
        apiKey: 'dummy',
        model: 'dummy',
      } as ProviderConfig);
      return tempProvider.getSupportedModels();
    } catch (error) {
      console.warn(`Could not get supported models for ${provider}:`, error);
      return [];
    }
  }

  public getProviderCapabilities(provider: ProviderType): any {
    const registration = this.providers.get(provider);
    if (!registration) {
      throw new Error(`Provider '${provider}' is not registered`);
    }

    try {
      const tempProvider = this.createProvider({
        provider,
        apiKey: 'dummy',
        model: 'dummy',
      } as ProviderConfig);
      return tempProvider.capabilities;
    } catch (error) {
      console.warn(`Could not get capabilities for ${provider}:`, error);
      return null;
    }
  }

  public estimateRequestCost(
    provider: ProviderType,
    prompt: string,
    maxTokens: number = 1000
  ): number {
    const registration = this.providers.get(provider);
    if (!registration) {
      throw new Error(`Provider '${provider}' is not registered`);
    }

    try {
      const tempProvider = this.createProvider({
        provider,
        apiKey: 'dummy',
        model: registration.defaultConfig.model || 'default',
      } as ProviderConfig);

      return tempProvider.estimateCost({
        messages: [{ role: 'user', content: prompt }],
        model: registration.defaultConfig.model || 'default',
        maxTokens,
      });
    } catch (error) {
      console.warn(`Could not estimate cost for ${provider}:`, error);
      return 0;
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private hasConfigChanged(currentConfig: ProviderConfig, newConfig: ProviderConfig): boolean {
    const relevantFields = ['model', 'temperature', 'maxTokens', 'apiKey'];

    return relevantFields.some(
      field =>
        currentConfig[field as keyof ProviderConfig] !== newConfig[field as keyof ProviderConfig]
    );
  }

  // =============================================================================
  // STATIC CONVENIENCE METHODS
  // =============================================================================

  public static async createQuickProvider(
    provider: ProviderType,
    apiKey: string,
    model?: string
  ): Promise<IModelProvider> {
    const factory = ProviderFactory.getInstance();
    const defaultConfig = factory.getDefaultConfig(provider);

    const config = {
      ...defaultConfig,
      provider,
      apiKey,
      model: model || defaultConfig.model || 'default',
    } as ProviderConfig;

    return factory.createAndInitializeProvider(config);
  }

  public static async testProvider(
    provider: ProviderType,
    apiKey: string,
    model?: string
  ): Promise<boolean> {
    try {
      const providerInstance = await ProviderFactory.createQuickProvider(provider, apiKey, model);
      const health = await providerInstance.healthCheck();
      await providerInstance.cleanup();
      return health.status === 'healthy';
    } catch (error) {
      console.error(`Provider test failed for ${provider}:`, error);
      return false;
    }
  }
}

export default ProviderFactory;
