/**
 * 🌐 ChromaDB Network Handler
 * Handles external ChromaDB connections to Railway with retry logic
 */

interface NetworkOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  enableLogging?: boolean;
}

export class ChromaDBNetworkHandler {
  private baseUrl: string;
  private maxRetries: number;
  private retryDelayMs: number;
  private timeoutMs: number;
  private enableLogging: boolean;

  constructor(baseUrl: string, options: NetworkOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.maxRetries = options.maxRetries || 3;
    this.retryDelayMs = options.retryDelayMs || 1000;
    this.timeoutMs = options.timeoutMs || 30000;
    this.enableLogging = options.enableLogging || false;
  }

  private log(message: string, type: 'info' | 'error' | 'warn' = 'info') {
    if (this.enableLogging) {
      const timestamp = new Date().toISOString();
      const emoji = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '📡';
      console.log(`${emoji} [ChromaDB-Network ${timestamp}] ${message}`);
    }
  }

  async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    this.log(`Making request to: ${url}`);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        this.log(`Request successful (attempt ${attempt})`);
        return response;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.log(`Request attempt ${attempt} failed: ${errorMessage}`, 'error');
        
        if (attempt === this.maxRetries) {
          throw new Error(
            `ChromaDB connection failed after ${this.maxRetries} attempts: ${errorMessage}`
          );
        }
        
        // Exponential backoff with jitter
        const delay = this.retryDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
        this.log(`Retrying in ${Math.round(delay)}ms...`, 'warn');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Unexpected error in ChromaDB request');
  }

  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('/api/v1/heartbeat');
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        this.log(`Health check successful (${latency}ms)`);
        return { healthy: true, latency };
      } else {
        return { healthy: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Health check failed: ${errorMessage}`, 'error');
      return { healthy: false, error: errorMessage };
    }
  }

  async testConnection(): Promise<{
    connected: boolean;
    version?: string;
    latency?: number;
    error?: string;
  }> {
    try {
      // Test basic heartbeat
      const healthResult = await this.healthCheck();
      if (!healthResult.healthy) {
        return { connected: false, error: healthResult.error };
      }

      // Test version endpoint
      const versionResponse = await this.makeRequest('/api/v1/version');
      const versionData = await versionResponse.json();

      return {
        connected: true,
        version: versionData.version || 'unknown',
        latency: healthResult.latency,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { connected: false, error: errorMessage };
    }
  }

  // Helper methods for common ChromaDB operations
  async listCollections(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/api/v1/collections');
      const collections = await response.json();
      return collections.map((c: any) => c.name);
    } catch (error) {
      this.log(`Failed to list collections: ${error}`, 'error');
      throw error;
    }
  }

  async createCollection(name: string, metadata?: any): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/v1/collections', {
        method: 'POST',
        body: JSON.stringify({
          name,
          metadata: metadata || {},
        }),
      });
      
      return response.ok;
    } catch (error) {
      this.log(`Failed to create collection ${name}: ${error}`, 'error');
      throw error;
    }
  }

  async deleteCollection(name: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/api/v1/collections/${name}`, {
        method: 'DELETE',
      });
      
      return response.ok;
    } catch (error) {
      this.log(`Failed to delete collection ${name}: ${error}`, 'error');
      throw error;
    }
  }
}

// Export configured instance for Railway
export const railwayChromaDB = new ChromaDBNetworkHandler(
  process.env.CHROMADB_API_BASE || 
  `https://${process.env.CHROMADB_HOST || 'localhost:8000'}`,
  {
    maxRetries: parseInt(process.env.CHROMADB_RETRY_ATTEMPTS || '3'),
    retryDelayMs: 2000,
    timeoutMs: parseInt(process.env.CHROMADB_CONNECTION_TIMEOUT || '30000'),
    enableLogging: process.env.NODE_ENV === 'development',
  }
);

// Connection test utility
export async function testRailwayConnection(): Promise<void> {
  console.log('🧪 Testing Railway ChromaDB connection...');
  
  const result = await railwayChromaDB.testConnection();
  
  if (result.connected) {
    console.log('✅ Railway ChromaDB connection successful!');
    console.log(`   Version: ${result.version}`);
    console.log(`   Latency: ${result.latency}ms`);
  } else {
    console.log('❌ Railway ChromaDB connection failed!');
    console.log(`   Error: ${result.error}`);
    throw new Error(`ChromaDB connection failed: ${result.error}`);
  }
}

export default ChromaDBNetworkHandler; 