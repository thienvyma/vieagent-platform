# 🤖 AI API Keys Production Setup Guide

## 📋 **Overview**

This guide covers setting up production-grade AI API keys for VIEAgent's multi-provider AI system, including OpenAI, Anthropic Claude, and Google Gemini.

**Production Requirements:**
- ✅ Production API keys with higher rate limits
- ✅ Proper key rotation and security
- ✅ Failover between providers
- ✅ Usage monitoring and cost control
- ✅ Rate limiting and error handling

---

## 🔑 **OpenAI API Configuration**

### **1.1 Upgrade to Production Plan**
1. Go to [platform.openai.com](https://platform.openai.com)
2. **Billing** → **Upgrade Plan**
3. Choose **Pay-as-you-go** or **Team/Enterprise**
4. Add payment method for higher rate limits

### **1.2 Create Production API Key**
1. **API Keys** → **Create new secret key**
2. Name: `VIEAgent-Production`
3. Permissions: **All** (for full access)
4. Copy key starting with `sk-proj-`

### **1.3 Production Configuration**
```typescript
// src/lib/ai-providers/openai-config.ts
export const openAIConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID, // Optional but recommended
  
  // Production models
  models: {
    chat: 'gpt-4-turbo',  // Latest GPT-4 model
    embedding: 'text-embedding-3-large',
    fallback: 'gpt-3.5-turbo'  // Fallback for cost optimization
  },
  
  // Rate limits (adjust based on your plan)
  rateLimits: {
    requestsPerMinute: 500,
    tokensPerMinute: 160000,
    requestsPerDay: 10000
  },
  
  // Cost optimization
  maxTokens: {
    chat: 4000,
    completion: 2000
  },
  
  timeout: 30000, // 30 seconds
  maxRetries: 3
};
```

### **1.4 Usage Monitoring**
```typescript
// src/lib/ai-providers/openai-monitor.ts
export class OpenAIMonitor {
  private usage = {
    requests: 0,
    tokens: 0,
    cost: 0
  };

  async trackUsage(response: any) {
    const tokens = response.usage?.total_tokens || 0;
    const cost = this.calculateCost(tokens, 'gpt-4-turbo');
    
    this.usage.requests++;
    this.usage.tokens += tokens;
    this.usage.cost += cost;

    // Log to database for analytics
    await this.logToDatabase({
      provider: 'openai',
      model: 'gpt-4-turbo',
      tokens,
      cost,
      timestamp: new Date()
    });
  }

  private calculateCost(tokens: number, model: string): number {
    const pricing = {
      'gpt-4-turbo': 0.01 / 1000, // $0.01 per 1K tokens
      'gpt-3.5-turbo': 0.002 / 1000 // $0.002 per 1K tokens
    };
    
    return tokens * (pricing[model] || 0);
  }
}
```

---

## 🤖 **Anthropic Claude API Configuration**

### **2.1 Upgrade Anthropic Account**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. **Billing** → **Add Payment Method**
3. Purchase credits for production usage
4. Consider **Team** plan for higher limits

### **2.2 Create Production API Key**
1. **Settings** → **API Keys**
2. **Create Key**
3. Name: `VIEAgent-Production`
4. Scope: **Full Access**
5. Copy key starting with `sk-ant-api03-`

### **2.3 Production Configuration**
```typescript
// src/lib/ai-providers/anthropic-config.ts
export const anthropicConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  
  // Production models
  models: {
    chat: 'claude-3-5-sonnet-20241022',  // Latest Claude model
    fallback: 'claude-3-haiku-20240307'  // Faster, cheaper option
  },
  
  // Rate limits
  rateLimits: {
    requestsPerMinute: 50,
    tokensPerMinute: 40000,
    requestsPerDay: 1000
  },
  
  // Message limits
  maxTokens: 4000,
  timeout: 60000, // 60 seconds (Claude can be slower)
  maxRetries: 3,
  
  // Cost optimization
  systemPromptOptimization: true,
  responseStreamOptimization: true
};
```

### **2.4 Claude-Specific Features**
```typescript
// src/lib/ai-providers/claude-service.ts
export class ClaudeService {
  async createMessage(prompt: string, options: ClaudeOptions = {}) {
    try {
      const response = await anthropic.messages.create({
        model: anthropicConfig.models.chat,
        max_tokens: options.maxTokens || anthropicConfig.maxTokens,
        system: options.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        // Claude-specific features
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        stop_sequences: options.stopSequences
      });

      await this.trackUsage(response);
      return response;
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }

  private async handleError(error: any) {
    if (error.status === 429) {
      // Rate limit exceeded - implement backoff
      await this.exponentialBackoff();
    } else if (error.status === 529) {
      // Overloaded - switch to fallback model
      return this.useFallbackModel();
    }
  }
}
```

---

## 🔍 **Google Gemini API Configuration**

### **3.1 Setup Google Cloud Project**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. **Create Project** → `VIEAgent-Production`
3. **Enable APIs** → Search for "Generative AI API"
4. **Enable** the Generative Language API

### **3.2 Create API Key**
1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **API Key**
3. **Restrict Key** → Select "Generative Language API"
4. Copy the API key

### **3.3 Production Configuration**
```typescript
// src/lib/ai-providers/gemini-config.ts
export const geminiConfig = {
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  
  // Production models
  models: {
    chat: 'gemini-1.5-pro',
    embedding: 'text-embedding-004',
    fallback: 'gemini-1.5-flash'  // Faster, cheaper option
  },
  
  // Rate limits (generous for Gemini)
  rateLimits: {
    requestsPerMinute: 1000,
    tokensPerMinute: 32000,
    requestsPerDay: 50000
  },
  
  // Generation config
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
  
  // Safety settings
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
};
```

---

## 🔄 **Multi-Provider Orchestration**

### **4.1 Provider Selection Strategy**
```typescript
// src/lib/ai-providers/provider-orchestrator.ts
export class AIProviderOrchestrator {
  private providers = ['openai', 'anthropic', 'gemini'];
  private fallbackOrder = ['openai', 'anthropic', 'gemini'];
  
  async selectProvider(task: 'chat' | 'embedding' | 'reasoning'): Promise<string> {
    // Task-specific provider selection
    const providerPreferences = {
      chat: ['anthropic', 'openai', 'gemini'],
      embedding: ['openai', 'gemini', 'anthropic'],
      reasoning: ['anthropic', 'gemini', 'openai']
    };
    
    for (const provider of providerPreferences[task]) {
      if (await this.isProviderAvailable(provider)) {
        return provider;
      }
    }
    
    throw new Error('No AI providers available');
  }
  
  private async isProviderAvailable(provider: string): Promise<boolean> {
    // Check rate limits
    const rateLimitOk = await this.checkRateLimit(provider);
    
    // Check provider health
    const healthOk = await this.checkProviderHealth(provider);
    
    // Check cost budget
    const budgetOk = await this.checkBudget(provider);
    
    return rateLimitOk && healthOk && budgetOk;
  }
}
```

### **4.2 Failover Implementation**
```typescript
// src/lib/ai-providers/failover-service.ts
export class AIFailoverService {
  async executeWithFailover(
    task: () => Promise<any>,
    providers: string[] = ['openai', 'anthropic', 'gemini']
  ): Promise<any> {
    let lastError: Error;
    
    for (const provider of providers) {
      try {
        // Switch to provider
        await this.switchProvider(provider);
        
        // Execute task
        const result = await task();
        
        // Log successful execution
        await this.logSuccess(provider);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Log failure
        await this.logFailure(provider, error);
        
        // If this is a rate limit error, mark provider as temporarily unavailable
        if (this.isRateLimitError(error)) {
          await this.markProviderUnavailable(provider, 60000); // 1 minute
        }
        
        // Continue to next provider
        continue;
      }
    }
    
    // All providers failed
    throw new Error(`All AI providers failed. Last error: ${lastError.message}`);
  }
}
```

---

## 💰 **Cost Management & Budgets**

### **5.1 Budget Configuration**
```typescript
// src/lib/ai-providers/budget-manager.ts
export class BudgetManager {
  private budgets = {
    daily: {
      openai: 50,    // $50/day
      anthropic: 30, // $30/day
      gemini: 20     // $20/day
    },
    monthly: {
      openai: 1000,   // $1000/month
      anthropic: 600, // $600/month
      gemini: 400     // $400/month
    }
  };
  
  async checkBudget(provider: string): Promise<boolean> {
    const dailyUsage = await this.getDailyUsage(provider);
    const monthlyUsage = await this.getMonthlyUsage(provider);
    
    const dailyBudget = this.budgets.daily[provider];
    const monthlyBudget = this.budgets.monthly[provider];
    
    if (dailyUsage >= dailyBudget * 0.9) {
      await this.sendBudgetAlert(provider, 'daily', dailyUsage, dailyBudget);
    }
    
    if (monthlyUsage >= monthlyBudget * 0.9) {
      await this.sendBudgetAlert(provider, 'monthly', monthlyUsage, monthlyBudget);
    }
    
    return dailyUsage < dailyBudget && monthlyUsage < monthlyBudget;
  }
}
```

### **5.2 Usage Analytics**
```typescript
// src/lib/ai-providers/analytics-service.ts
export class AIAnalyticsService {
  async generateUsageReport() {
    const report = {
      period: 'last_30_days',
      providers: {},
      totalCost: 0,
      totalRequests: 0,
      averageResponseTime: 0
    };
    
    for (const provider of ['openai', 'anthropic', 'gemini']) {
      const usage = await this.getProviderUsage(provider);
      report.providers[provider] = {
        cost: usage.cost,
        requests: usage.requests,
        tokens: usage.tokens,
        averageResponseTime: usage.averageResponseTime,
        errorRate: usage.errorRate
      };
      
      report.totalCost += usage.cost;
      report.totalRequests += usage.requests;
    }
    
    return report;
  }
}
```

---

## 🔒 **Security Best Practices**

### **6.1 API Key Security**
```typescript
// src/lib/ai-providers/security.ts
export class APIKeySecurity {
  // Encrypt API keys at rest
  encryptApiKey(key: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  // Decrypt API keys for use
  decryptApiKey(encryptedKey: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  
  // Validate API key format
  validateApiKey(provider: string, key: string): boolean {
    const patterns = {
      openai: /^sk-proj-[a-zA-Z0-9]{32,}$/,
      anthropic: /^sk-ant-api03-[a-zA-Z0-9_\-]{95}$/,
      gemini: /^[a-zA-Z0-9_\-]{39}$/
    };
    
    return patterns[provider]?.test(key) || false;
  }
}
```

### **6.2 Rate Limiting**
```typescript
// src/lib/ai-providers/rate-limiter.ts
export class AIRateLimiter {
  private limits = new Map();
  
  async checkRateLimit(provider: string, userId?: string): Promise<boolean> {
    const key = `${provider}:${userId || 'global'}`;
    const now = Date.now();
    
    const limit = this.limits.get(key) || { requests: 0, resetTime: now + 60000 };
    
    if (now > limit.resetTime) {
      // Reset the limit
      limit.requests = 0;
      limit.resetTime = now + 60000;
    }
    
    const maxRequests = this.getMaxRequests(provider);
    
    if (limit.requests >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    limit.requests++;
    this.limits.set(key, limit);
    
    return true;
  }
  
  private getMaxRequests(provider: string): number {
    const limits = {
      openai: 50,    // 50 requests per minute
      anthropic: 20, // 20 requests per minute
      gemini: 100    // 100 requests per minute
    };
    
    return limits[provider] || 10;
  }
}
```

---

## 📊 **Monitoring & Alerts**

### **7.1 Health Checks**
```typescript
// src/lib/ai-providers/health-monitor.ts
export class AIHealthMonitor {
  async checkAllProviders(): Promise<HealthReport> {
    const results = await Promise.allSettled([
      this.checkOpenAI(),
      this.checkAnthropic(),
      this.checkGemini()
    ]);
    
    return {
      timestamp: new Date(),
      providers: {
        openai: results[0].status === 'fulfilled' ? results[0].value : { status: 'error', error: results[0].reason },
        anthropic: results[1].status === 'fulfilled' ? results[1].value : { status: 'error', error: results[1].reason },
        gemini: results[2].status === 'fulfilled' ? results[2].value : { status: 'error', error: results[2].reason }
      }
    };
  }
  
  private async checkOpenAI(): Promise<ProviderHealth> {
    try {
      const start = Date.now();
      // Make a small test request
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });
      
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        lastCheck: new Date()
      };
    }
  }
}
```

---

## 📋 **Production Deployment Checklist**

### **Environment Variables**
```bash
# OpenAI Configuration
OPENAI_API_KEY="sk-proj-[your-production-key]"
OPENAI_ORG_ID="org-[your-org-id]"

# Anthropic Configuration
ANTHROPIC_API_KEY="sk-ant-api03-[your-production-key]"

# Google Gemini Configuration
GOOGLE_GEMINI_API_KEY="[your-gemini-api-key]"

# Security
ENCRYPTION_KEY="[32-char-encryption-key-for-api-keys]"

# Monitoring
AI_USAGE_ALERTS_EMAIL="admin@yourdomain.com"
BUDGET_ALERT_THRESHOLD="0.9"
```

### **Checklist Items**
- [ ] ✅ OpenAI production account upgraded
- [ ] ✅ OpenAI production API key created
- [ ] ✅ Anthropic production account with credits
- [ ] ✅ Anthropic production API key created
- [ ] ✅ Google Cloud project configured
- [ ] ✅ Gemini API enabled and key created
- [ ] ✅ Multi-provider orchestrator implemented
- [ ] ✅ Failover service configured
- [ ] ✅ Budget management setup
- [ ] ✅ Rate limiting implemented
- [ ] ✅ Security measures in place
- [ ] ✅ Health monitoring active
- [ ] ✅ Usage analytics configured
- [ ] ✅ Alert system setup

---

## 🎯 **Next Steps**

After AI API keys setup:
1. ✅ Update deployment plan status
2. 🔐 Configure Google OAuth for production
3. 🌐 Setup custom domain and SSL
4. 🚀 Deploy to Vercel
5. 🧪 Run comprehensive AI integration tests

---

**AI API Keys Production Setup Complete!** 🤖
**Your VIEAgent platform now has enterprise-grade AI provider management.** 