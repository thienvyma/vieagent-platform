/**
 * 🔢 OpenAI Embedding Service - Simple Implementation
 * For use with production vector knowledge service
 */

import OpenAI from 'openai';

export interface EmbeddingOptions {
  apiKey: string;
  model?: string;
  dimensions?: number;
  timeout?: number;
  maxRetries?: number;
}

export interface EmbeddingResult {
  embedding: number[];
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
  model: string;
}

export class OpenAIEmbeddingService {
  private client: OpenAI;
  private options: Required<EmbeddingOptions>;

  constructor(options: EmbeddingOptions) {
    this.options = {
      apiKey: options.apiKey,
      model: options.model || 'text-embedding-3-small',
      dimensions: options.dimensions || 1536,
      timeout: options.timeout || 30000,
      maxRetries: options.maxRetries || 3,
    };

    this.client = new OpenAI({
      apiKey: this.options.apiKey,
      timeout: this.options.timeout,
    });
  }

  /**
   * Generate embedding for single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.options.model,
        input: text.trim(),
        dimensions: this.options.dimensions,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ OpenAI embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.options.model,
        input: texts.map(text => text.trim()),
        dimensions: this.options.dimensions,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('❌ OpenAI batch embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate embedding with detailed result
   */
  async generateEmbeddingWithDetails(text: string): Promise<EmbeddingResult> {
    try {
      const response = await this.client.embeddings.create({
        model: this.options.model,
        input: text.trim(),
        dimensions: this.options.dimensions,
      });

      return {
        embedding: response.data[0].embedding,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens,
        },
        model: response.model,
      };
    } catch (error) {
      console.error('❌ OpenAI embedding generation with details failed:', error);
      throw error;
    }
  }

  /**
   * Test connection to OpenAI
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.embeddings.create({
        model: this.options.model,
        input: 'test',
        dimensions: this.options.dimensions,
      });

      return response.data.length > 0;
    } catch (error) {
      console.error('❌ OpenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * Get service configuration
   */
  getConfig(): Omit<Required<EmbeddingOptions>, 'apiKey'> {
    return {
      model: this.options.model,
      dimensions: this.options.dimensions,
      timeout: this.options.timeout,
      maxRetries: this.options.maxRetries,
    };
  }
}

// Export default instance
export const openAIEmbeddingService = new OpenAIEmbeddingService({
  apiKey: process.env.OPENAI_API_KEY || '',
  model: 'text-embedding-3-small',
  dimensions: 1536,
});

export default OpenAIEmbeddingService;
