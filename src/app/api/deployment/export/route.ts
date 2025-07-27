import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Add GET method handler for consistency
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Agent export configuration endpoint',
    availableFormats: ['json', 'api', 'docker', 'sdk'],
    exportTypes: ['full', 'agent-only', 'with-conversations', 'with-knowledge'],
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId, format } = await req.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    // Fetch agent with related data
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: session.user.id,
      },
      include: {
        conversations: format?.includeConversations
          ? {
              take: 100,
              orderBy: { createdAt: 'desc' },
              include: {
                messages: true,
              },
            }
          : false,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Fetch user's documents (knowledge base)
    const userDocuments = format?.includeKnowledgeBase
      ? await prisma.document.findMany({
          where: { userId: session.user.id },
          take: 50,
        })
      : [];

    // Generate export content based on format
    let exportContent: string;
    let mimeType: string;
    let filename: string;

    switch (format?.type || 'json') {
      case 'json':
        exportContent = generateJSONExport(agent, format, userDocuments);
        mimeType = 'application/json';
        filename = `agent-${agent.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
        break;

      case 'api':
        exportContent = generateAPIConfig(agent, format);
        mimeType = 'application/yaml';
        filename = `agent-${agent.name.replace(/\s+/g, '-')}-api-config.yml`;
        break;

      case 'docker':
        exportContent = generateDockerConfig(agent, format);
        mimeType = 'text/plain';
        filename = `agent-${agent.name.replace(/\s+/g, '-')}-Dockerfile`;
        break;

      case 'sdk':
        exportContent = generateSDKConfig(agent, format);
        mimeType = 'application/javascript';
        filename = `agent-${agent.name.replace(/\s+/g, '-')}-sdk.js`;
        break;

      default:
        exportContent = generateJSONExport(agent, format, userDocuments);
        mimeType = 'application/json';
        filename = `agent-${agent.name.replace(/\s+/g, '-')}-export.json`;
    }

    return NextResponse.json({
      success: true,
      export: {
        content: exportContent,
        mimeType,
        filename,
        size: new Blob([exportContent]).size,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export agent' }, { status: 500 });
  }
}

function generateJSONExport(agent: any, format: any, documents: any[]) {
  const exportData = {
    metadata: {
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      agentId: agent.id,
      agentName: agent.name,
      platform: 'AI Agent Platform',
    },
    agent: {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      model: agent.model,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      status: agent.status,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    },
    knowledgeBase: format?.includeKnowledgeBase
      ? {
          documents: documents.map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            filename: doc.filename,
            type: doc.type,
            content: doc.content,
            metadata: doc.metadata,
          })),
        }
      : null,
    conversations: format?.includeConversations
      ? agent.conversations?.map((conv: any) => ({
          id: conv.id,
          title: conv.title,
          createdAt: conv.createdAt,
          messages: conv.messages?.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt,
          })),
        }))
      : null,
    deployment: {
      platforms: ['web', 'facebook', 'zalo', 'api'],
      webhookUrls: {
        web: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/web/${agent.id}`,
        facebook: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/facebook/${agent.id}`,
        zalo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/zalo/${agent.id}`,
        api: `${process.env.NEXT_PUBLIC_BASE_URL}/api/agents/${agent.id}/chat`,
      },
    },
  };

  return JSON.stringify(exportData, null, 2);
}

function generateAPIConfig(agent: any, format: any) {
  return `# API Configuration for ${agent.name}
# Generated by AI Agent Platform

apiVersion: v1
kind: AgentDeployment
metadata:
  name: ${agent.name.toLowerCase().replace(/\s+/g, '-')}
  labels:
    agent-id: "${agent.id}"
    platform: "ai-agent-platform"

spec:
  agent:
    name: "${agent.name}"
    model: "${agent.model}"
    temperature: ${agent.temperature || 0.7}
    maxTokens: ${agent.maxTokens || 1000}
    prompt: |
      ${agent.prompt?.replace(/\n/g, '\n      ') || 'Default AI assistant prompt'}
  
  endpoints:
    chat:
      url: "/api/agents/${agent.id}/chat"
      methods: ["POST"]
      rateLimit: 100
    
    webhook:
      url: "/webhook/${agent.id}"
      methods: ["POST"]
      authentication: required
  
  environment:
    AGENT_ID: "${agent.id}"
    AGENT_NAME: "${agent.name}"
    MODEL: "${agent.model}"
    STATUS: "${agent.status}"
    
  deployment:
    replicas: 1
    resources:
      requests:
        memory: "256Mi"
        cpu: "100m"
      limits:
        memory: "512Mi"
        cpu: "500m"
        
  integrations:
    platforms:
      - name: "web"
        enabled: true
        config:
          widget: true
          iframe: true
      - name: "facebook"
        enabled: false
        config:
          pageId: ""
          accessToken: ""
      - name: "zalo"
        enabled: false
        config:
          oaId: ""
          secretKey: ""
`;
}

function generateDockerConfig(agent: any, format: any) {
  return `# Dockerfile for ${agent.name}
# Generated by AI Agent Platform

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Environment variables
ENV AGENT_ID="${agent.id}"
ENV AGENT_NAME="${agent.name}"
ENV MODEL="${agent.model}"
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start command
CMD ["npm", "start"]

# Agent Configuration
LABEL agent.id="${agent.id}"
LABEL agent.name="${agent.name}"
LABEL agent.model="${agent.model}"
LABEL platform="ai-agent-platform"
LABEL version="1.0"

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Copy agent-specific configuration
COPY --chown=nextjs:nodejs agent-config.json ./config/
`;
}

function generateSDKConfig(agent: any, format: any) {
  return `/**
 * AI Agent SDK for ${agent.name}
 * Generated by AI Agent Platform
 */

class ${agent.name.replace(/\s+/g, '')}AgentSDK {
  constructor(options = {}) {
    this.agentId = "${agent.id}";
    this.agentName = "${agent.name}";
    this.model = "${agent.model}";
    this.baseUrl = options.baseUrl || "${process.env.NEXT_PUBLIC_BASE_URL || 'https://vieagent.com'}";
    this.apiKey = options.apiKey || null;
    this.sessionId = options.sessionId || this.generateSessionId();
  }

  /**
   * Send message to AI agent
   */
  async chat(message, options = {}) {
    try {
      const response = await fetch(\`\${this.baseUrl}/api/agents/\${this.agentId}/chat\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey ? \`Bearer \${this.apiKey}\` : '',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({
          message,
          sessionId: this.sessionId,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  /**
   * Get agent information
   */
  async getAgentInfo() {
    try {
      const response = await fetch(\`\${this.baseUrl}/api/agents/\${this.agentId}\`, {
        headers: {
          'Authorization': this.apiKey ? \`Bearer \${this.apiKey}\` : ''
        }
      });

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      return await response.json();
    } catch (error) {
      console.error('Agent info error:', error);
      throw error;
    }
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 16);
  }

  /**
   * Set API key for authentication
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Create widget for web integration
   */
  createWidget(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(\`Container with ID '\${containerId}' not found\`);
    }

    const widget = document.createElement('div');
    widget.id = 'ai-agent-widget';
    widget.style.cssText = \`
      width: \${options.width || '400px'};
      height: \${options.height || '600px'};
      border: 1px solid #ccc;
      border-radius: 8px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    \`;

    const iframe = document.createElement('iframe');
    iframe.src = \`\${this.baseUrl}/widget/\${this.agentId}?session=\${this.sessionId}\`;
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    
    widget.appendChild(iframe);
    container.appendChild(widget);

    return widget;
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${agent.name.replace(/\s+/g, '')}AgentSDK;
} else if (typeof define === 'function' && define.amd) {
  define([], function() {
    return ${agent.name.replace(/\s+/g, '')}AgentSDK;
  });
} else {
  window.${agent.name.replace(/\s+/g, '')}AgentSDK = ${agent.name.replace(/\s+/g, '')}AgentSDK;
}

// Usage examples:
/*
// Initialize SDK
const agent = new ${agent.name.replace(/\s+/g, '')}AgentSDK({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-domain.com'
});

// Send message
agent.chat('Hello, how can you help me?')
  .then(response => console.log(response))
  .catch(error => console.error(error));

// Create widget
agent.createWidget('chat-container', {
  width: '400px',
  height: '600px'
});
*/
`;
}
