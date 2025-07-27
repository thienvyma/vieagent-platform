import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ExportFormat {
  type: 'json' | 'api' | 'docker' | 'sdk';
  includeKnowledgeBase: boolean;
  includeConversations: boolean;
  compression: boolean;
}

export interface AgentExportData {
  agent: any;
  knowledgeBase?: any;
  sampleConversations?: any[];
  exportMetadata: {
    exportedAt: string;
    exportedBy: string;
    format: string;
    version: string;
    platform: string;
  };
}

export class AgentExportService {
  static async exportAgent(
    agentId: string,
    userId: string,
    format: ExportFormat
  ): Promise<AgentExportData> {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: userId },
      include: {
        conversations: {
          include: { messages: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!agent) {
      throw new Error('Agent not found or access denied');
    }

    const exportData: AgentExportData = {
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        prompt: agent.prompt,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        status: agent.status,
        isPublic: agent.isPublic,
        messageDelayMs: agent.messageDelayMs,
        enableSmartDelay: agent.enableSmartDelay,
        maxDelayMs: agent.maxDelayMs,
        minDelayMs: agent.minDelayMs,
        enableVietnameseMode: agent.enableVietnameseMode,
        createdAt: agent.createdAt.toISOString(),
        updatedAt: agent.updatedAt.toISOString(),
      },
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        format: format.type,
        version: '1.0.0',
        platform: 'AI Agent Platform',
      },
    };

    if (format.includeKnowledgeBase) {
      exportData.knowledgeBase = await this.exportKnowledgeBase(agent.knowledgeFiles);
    }

    if (format.includeConversations && agent.conversations.length > 0) {
      exportData.sampleConversations = agent.conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: conv.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
        })),
      }));
    }

    return exportData;
  }

  private static async exportKnowledgeBase(knowledgeFilesJson?: string | null) {
    if (!knowledgeFilesJson) return { documents: [] };

    try {
      const documentIds = JSON.parse(knowledgeFilesJson) as string[];

      const documents = await prisma.document.findMany({
        where: { id: { in: documentIds } },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          filename: true,
        },
      });

      return {
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          content: doc.content || '',
          type: doc.type,
          filename: doc.filename,
        })),
      };
    } catch (error) {
      console.error('Error exporting knowledge base:', error);
      return { documents: [] };
    }
  }

  static async generateExportFile(
    exportData: AgentExportData,
    format: ExportFormat
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    const timestamp = new Date().toISOString().split('T')[0];
    const agentName = exportData.agent.name.toLowerCase().replace(/\s+/g, '-');

    switch (format.type) {
      case 'json':
        return {
          content: JSON.stringify(exportData, null, 2),
          filename: `${agentName}-export-${timestamp}.json`,
          mimeType: 'application/json',
        };

      case 'api':
        const apiConfig = this.generateAPIConfig(exportData);
        return {
          content: JSON.stringify(apiConfig, null, 2),
          filename: `${agentName}-api-config-${timestamp}.json`,
          mimeType: 'application/json',
        };

      case 'docker':
        const dockerConfig = this.generateDockerConfig(exportData);
        return {
          content: dockerConfig,
          filename: `${agentName}-Dockerfile-${timestamp}`,
          mimeType: 'text/plain',
        };

      case 'sdk':
        const sdkCode = this.generateSDKCode(exportData);
        return {
          content: sdkCode,
          filename: `${agentName}-sdk-${timestamp}.js`,
          mimeType: 'text/javascript',
        };

      default:
        throw new Error(`Unsupported export format: ${format.type}`);
    }
  }

  static generateAPIConfig(exportData: AgentExportData): object {
    return {
      apiVersion: 'v1',
      kind: 'AgentDeployment',
      metadata: {
        name: exportData.agent.name.toLowerCase().replace(/\s+/g, '-'),
        labels: {
          app: 'ai-agent',
          version: exportData.exportMetadata.version,
        },
      },
      spec: {
        agent: {
          name: exportData.agent.name,
          model: exportData.agent.model,
          temperature: exportData.agent.temperature,
          maxTokens: exportData.agent.maxTokens,
          prompt: exportData.agent.prompt,
        },
        endpoints: [
          { path: '/chat', method: 'POST' },
          { path: '/health', method: 'GET' },
        ],
      },
    };
  }

  static generateDockerConfig(exportData: AgentExportData): string {
    return `# AI Agent Docker Configuration
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV AGENT_NAME="${exportData.agent.name}"
ENV AGENT_MODEL="${exportData.agent.model}"
ENV AGENT_TEMPERATURE="${exportData.agent.temperature}"

EXPOSE 3000
CMD ["npm", "start"]
`;
  }

  static generateSDKCode(exportData: AgentExportData): string {
    return `// AI Agent SDK
class AIAgentClient {
  constructor(config) {
    this.config = {
      apiUrl: config.apiUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://vieagent.com',
      apiKey: config.apiKey,
      agentId: '${exportData.agent.id}',
      ...config
    };
  }

  async sendMessage(message, options = {}) {
    const response = await fetch(\`\${this.config.apiUrl}/api/chat\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${this.config.apiKey}\`
      },
      body: JSON.stringify({
        message,
        agentId: this.config.agentId,
        temperature: ${exportData.agent.temperature},
        maxTokens: ${exportData.agent.maxTokens},
        ...options
      })
    });

    return await response.json();
  }
}

export default AIAgentClient;
`;
  }
}
