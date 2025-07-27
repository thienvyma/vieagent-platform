import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { HandoverManager } from '@/lib/handover/HandoverManager';
import { CalendarAgentIntegration } from '@/lib/calendar-agent-integration';
import { agentRAGService } from '@/lib/agent-rag-service';
import { SmartKnowledgeStrategy } from '@/lib/smart-knowledge-strategy';

const prisma = new PrismaClient();
const smartKnowledgeStrategy = SmartKnowledgeStrategy.getInstance();

// Initialize HandoverManager with config
const handoverManager = new HandoverManager({
  autoHandoverEnabled: true,
  autoHandoverTriggers: {
    sentimentThreshold: -0.5,
    escalationKeywords: [
      'cần người hỗ trợ',
      'nói chuyện với người thật',
      'human',
      'support',
      'help',
      'urgent',
      'khẩn cấp',
    ],
    maxAIResponses: 10,
    conversationDuration: 30, // minutes
    customerRequestsHuman: true,
  },
  humanDetection: {
    enabled: true,
    detectionMethods: ['message_pattern' as const],
    autoDetectionKeywords: ['human', 'agent', 'support'],
    responsePatterns: [],
  },
  notifications: {
    customerNotification: true,
    agentNotification: true,
    managerNotification: false,
    notificationTemplates: {},
  },
  platformSettings: {
    defaultPlatform: 'internal',
    supportedPlatforms: ['internal', 'facebook', 'website'],
    platformSpecificSettings: {},
  },
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Legacy Context Builder for backward compatibility
class ContextBuilder {
  static async buildContext(documentIds: string[], userQuery: string) {
    if (!documentIds || documentIds.length === 0) {
      return '';
    }

    try {
      const documents = await prisma.document.findMany({
        where: {
          id: { in: documentIds },
          status: 'PROCESSED',
        },
      });

      let context = '';

      for (const doc of documents) {
        if (doc.extractedText || doc.content) {
          const text = doc.extractedText || doc.content || '';

          // Parse CSV files for FAQ, Company, Products
          if (doc.type === 'csv' || doc.mimeType === 'text/csv') {
            const csvContext = this.parseCSVContent(text, doc.title);
            if (csvContext) {
              context += `\n\n=== ${doc.title} ===\n${csvContext}`;
            }
          } else {
            // For other file types, include relevant sections
            const relevantText = this.extractRelevantText(text, userQuery);
            if (relevantText) {
              context += `\n\n=== ${doc.title} ===\n${relevantText}`;
            }
          }
        }
      }

      return context.trim();
    } catch (error) {
      console.error('Error building context:', error);
      return '';
    }
  }

  static parseCSVContent(csvText: string, filename: string): string {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) return '';

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        return headers.reduce(
          (obj, header, index) => {
            obj[header] = values[index] || '';
            return obj;
          },
          {} as Record<string, string>
        );
      });

      // Format based on common CSV structures
      const lowerFilename = filename.toLowerCase();

      if (lowerFilename.includes('faq')) {
        return this.formatFAQData(rows);
      } else if (lowerFilename.includes('company') || lowerFilename.includes('about')) {
        return this.formatCompanyData(rows);
      } else if (lowerFilename.includes('product')) {
        return this.formatProductData(rows);
      } else {
        return this.formatGenericData(rows, headers);
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      return '';
    }
  }

  static formatFAQData(rows: Record<string, string>[]): string {
    return rows
      .map(row => {
        const question = row.question || row.Question || row.q || row.Q || '';
        const answer = row.answer || row.Answer || row.a || row.A || '';
        if (question && answer) {
          return `Q: ${question}\nA: ${answer}`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }

  static formatCompanyData(rows: Record<string, string>[]): string {
    return rows
      .map(row => {
        const entries = Object.entries(row).filter(([key, value]) => value);
        return entries.map(([key, value]) => `${key}: ${value}`).join('\n');
      })
      .join('\n\n');
  }

  static formatProductData(rows: Record<string, string>[]): string {
    return rows
      .map(row => {
        const name = row.name || row.Name || row.product || row.Product || '';
        const description = row.description || row.Description || row.desc || '';
        const price = row.price || row.Price || row.cost || '';

        let formatted = '';
        if (name) formatted += `Product: ${name}\n`;
        if (description) formatted += `Description: ${description}\n`;
        if (price) formatted += `Price: ${price}\n`;

        return formatted;
      })
      .filter(Boolean)
      .join('\n\n');
  }

  static formatGenericData(rows: Record<string, string>[], headers: string[]): string {
    return rows
      .map(row => {
        return headers
          .map(header => {
            const value = row[header];
            return value ? `${header}: ${value}` : '';
          })
          .filter(Boolean)
          .join('\n');
      })
      .join('\n\n');
  }

  static extractRelevantText(text: string, query: string, maxLength: number = 2000): string {
    if (!text || !query) return text.substring(0, maxLength);

    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());

    // Score sentences based on query word matches
    const scoredSentences = sentences.map(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const score = queryWords.reduce((acc, word) => {
        return acc + (lowerSentence.includes(word) ? 1 : 0);
      }, 0);
      return { sentence: sentence.trim(), score };
    });

    // Sort by relevance and take top sentences
    const relevantSentences = scoredSentences
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(s => s.sentence);

    const result = relevantSentences.join('. ');
    return result.length > maxLength ? result.substring(0, maxLength) + '...' : result;
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const { message, conversationId, stream = false } = body;
    let useAdvancedRAG = body.useAdvancedRAG !== false; // Default to true

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get agent
    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          agentId: agent.id,
          userId: user.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          title: message.substring(0, 100),
          agentId: agent.id,
          userId: user.id,
        },
        include: {
          messages: true,
        },
      });
    }

    // Check if AI should respond (handover logic)
    const shouldRespond = handoverManager.shouldAIRespond(conversation.id);

    if (!shouldRespond) {
      // Human agent is handling this conversation
      return NextResponse.json({
        message: {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Một nhân viên hỗ trợ đang xử lý yêu cầu của bạn. Vui lòng đợi phản hồi từ họ.',
          createdAt: new Date().toISOString(),
        },
        conversation: {
          id: conversation.id,
          title: conversation.title,
        },
        handoverStatus: 'human_handling',
      });
    }

    // Build conversation context
    const conversationContext = {
      conversationHistory: conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      sentimentScore: 0, // Will be calculated by AI
    };

    // Check if handover should be triggered
    const handoverCheck = await handoverManager.shouldTriggerHandover(
      conversation.id,
      conversationContext,
      message
    );

    if (handoverCheck.shouldHandover) {
      // Trigger handover to human
      await handoverManager.requestHandover(conversation.id, handoverCheck.reason!, 'medium');

      return NextResponse.json({
        message: {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content:
            'Tôi đang chuyển yêu cầu của bạn đến nhân viên hỗ trợ để được tư vấn tốt hơn. Vui lòng đợi trong giây lát.',
          createdAt: new Date().toISOString(),
        },
        conversation: {
          id: conversation.id,
          title: conversation.title,
        },
        handoverStatus: 'escalating',
        handoverReason: handoverCheck.reason,
      });
    }

    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // **🧠 SMART KNOWLEDGE STRATEGY - DAY 23**
    let knowledgeContext = '';
    let ragResult = null;
    let ragMetadata = {};
    let strategyResult = null;

    // Try advanced RAG first if enabled
    if (useAdvancedRAG) {
      try {
        console.log(`🧠 Performing advanced RAG for agent ${agent.id}`);

        // Perform advanced RAG operation
        ragResult = await agentRAGService.performRAGOperation(agent.id, user.id, message);

        if (ragResult.success && ragResult.hasContext && ragResult.contextAssembly) {
          // Use the enhanced RAG context
          knowledgeContext = ragResult.contextAssembly.systemPromptContext;

          ragMetadata = {
            sources: ragResult.contextAssembly.totalSources,
            tokens: ragResult.contextAssembly.totalTokens,
            searchTime: ragResult.searchTime,
            contextBuildTime: ragResult.contextBuildTime,
            averageRelevance: ragResult.contextAssembly.stats.averageRelevance,
            usedFallback: ragResult.usedFallback,
          };

          console.log(
            `✅ RAG context built: ${ragResult.contextAssembly.totalSources} sources, ${ragResult.contextAssembly.totalTokens} tokens`
          );
        } else {
          // Handle RAG failure or no context
          if (ragResult.usedFallback) {
            console.log(`🔄 RAG fallback used: ${ragResult.fallbackReason}`);
          } else {
            console.log(`⚠️ No RAG context available`);
          }
        }
      } catch (ragError) {
        console.error('❌ Advanced RAG failed, falling back to smart strategy:', ragError);
        useAdvancedRAG = false; // Fall back to smart strategy
      }
    }

    // **🧠 SMART KNOWLEDGE STRATEGY FALLBACK - DAY 23**
    if (!useAdvancedRAG || !knowledgeContext) {
      try {
        console.log('🧠 Using Smart Knowledge Strategy');

        // Parse agent's knowledge strategy configuration
        const strategyConfig = SmartKnowledgeStrategy.parseStrategyConfig(agent);

        // Execute the configured strategy
        strategyResult = await smartKnowledgeStrategy.executeStrategy(
          agent.id,
          user.id,
          message,
          strategyConfig
        );

        if (strategyResult.selectedDocuments.length > 0) {
          // Build context from selected documents
          knowledgeContext = smartKnowledgeStrategy.buildContextFromDocuments(
            strategyResult.selectedDocuments
          );

          ragMetadata = {
            strategy: strategyResult.strategy,
            sources: strategyResult.selectedDocuments.length,
            totalCandidates: strategyResult.totalCandidates,
            executionTime: strategyResult.executionTime,
            averageRelevance: strategyResult.metadata.averageRelevance,
            appliedFilters: strategyResult.metadata.appliedFilters,
            fallbackUsed: strategyResult.metadata.fallbackUsed,
          };

          console.log(
            `✅ Smart Strategy (${strategyResult.strategy}) selected ${strategyResult.selectedDocuments.length}/${strategyResult.totalCandidates} documents`
          );
        } else {
          console.log(`⚠️ No documents selected by Smart Strategy (${strategyConfig.strategy})`);
        }
      } catch (strategyError) {
        console.error('❌ Smart Knowledge Strategy failed, falling back to legacy:', strategyError);

        // **🔄 LEGACY FALLBACK - if all else fails**
        console.log('🔄 Using legacy knowledge base integration');

        // Load knowledge base documents if configured (legacy)
        if (agent.knowledgeFiles) {
          const knowledgeFileIds = JSON.parse(agent.knowledgeFiles) as string[];
          if (knowledgeFileIds.length > 0) {
            const documents = await prisma.document.findMany({
              where: {
                id: { in: knowledgeFileIds },
                status: 'PROCESSED',
              },
              select: {
                content: true,
                type: true,
              },
            });

            // Build knowledge context from documents
            for (const doc of documents) {
              if (doc.content) {
                try {
                  const parsedContent = JSON.parse(doc.content);

                  // Extract relevant information based on document format
                  if (parsedContent.format === 'faq') {
                    knowledgeContext += '\n\nFAQ Knowledge:\n';
                    // ✅ FIXED IN Phase 4A.2 - Replace any type with more specific type
                    parsedContent.data.forEach((faq: { question: string; answer: string }) => {
                      knowledgeContext += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
                    });
                  } else if (parsedContent.format === 'product_catalog') {
                    knowledgeContext += '\n\nProduct Catalog:\n';
                    // ✅ FIXED IN Phase 4A.2 - Replace any type with more specific type
                    parsedContent.data.forEach(
                      (product: { productName: string; price: string; description: string }) => {
                        knowledgeContext += `Product: ${product.productName}\nPrice: ${product.price}\nDescription: ${product.description}\n\n`;
                      }
                    );
                  } else if (parsedContent.format === 'business_info') {
                    knowledgeContext += '\n\nBusiness Information:\n';
                    const info = parsedContent.data;
                    knowledgeContext += `${info.businessName}\n${info.description}\n`;
                    if (info.email) knowledgeContext += `Email: ${info.email}\n`;
                    if (info.phone) knowledgeContext += `Phone: ${info.phone}\n`;
                  } else if (parsedContent.format === 'text_knowledge') {
                    knowledgeContext +=
                      '\n\nKnowledge Base:\n' + parsedContent.data.content.slice(0, 1000) + '...\n';
                  }
                } catch (e) {
                  console.error('Error parsing document content:', e);
                }
              }
            }
          }
        }
      }
    }

    // Get user's API key for the model
    const userApiKeys = await prisma.userApiKey.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    let apiKey = null;
    let provider = null;

    for (const key of userApiKeys) {
      const models = JSON.parse(key.models || '[]');
      if (models.includes(agent.model)) {
        apiKey = key.keyHash; // TODO: Decrypt this in production
        provider = key.provider;
        break;
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'No API key found for the selected model',
        },
        { status: 400 }
      );
    }

    // **📝 BUILD ENHANCED SYSTEM PROMPT WITH RAG CONTEXT**
    let systemPrompt = agent.prompt;

    if (knowledgeContext) {
      if (useAdvancedRAG && ragResult?.hasContext) {
        // Use advanced RAG context format
        systemPrompt = knowledgeContext; // Already formatted by RAG context builder
      } else {
        // Use legacy format
        systemPrompt =
          agent.prompt +
          '\n\nUse the following knowledge base to answer questions:\n' +
          knowledgeContext;
      }
    }

    // 🗓️ CALENDAR INTEGRATION: Check for scheduling intent first
    const schedulingIntent = CalendarAgentIntegration.detectSchedulingIntent(message);

    if (schedulingIntent) {
      console.log('📅 Detected scheduling intent:', schedulingIntent);

      try {
        const schedulingResponse = await CalendarAgentIntegration.processSchedulingIntent(
          user.id,
          agent.id,
          schedulingIntent,
          message
        );

        const calendarMessage = CalendarAgentIntegration.generateCalendarResponse(
          message,
          schedulingResponse
        );

        // Create assistant message with calendar response
        const assistantMessage = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: calendarMessage,
            tokens: 0, // Calendar responses don't use AI tokens
            cost: 0,
          },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            updatedAt: new Date(),
          },
        });

        return NextResponse.json({
          message: {
            id: assistantMessage.id,
            role: 'assistant',
            content: calendarMessage,
            createdAt: assistantMessage.createdAt,
          },
          conversation: {
            id: conversation.id,
            title: conversation.title,
          },
          usage: { tokens: 0, cost: 0 },
          calendarAction: schedulingResponse.success,
          calendarEvent: schedulingResponse.event,
          // Include RAG metadata even for calendar responses
          rag: ragMetadata,
        });
      } catch (calendarError) {
        console.error('Calendar integration error:', calendarError);
        // Fall through to normal AI response if calendar fails
      }
    }

    // **🤖 GENERATE AI RESPONSE WITH ENHANCED CONTEXT**
    let aiResponse = '';
    const usage = { tokens: 0, cost: 0 };

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: agent.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversation.messages.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: 'user', content: message },
          ],
          temperature: agent.temperature || 0.7,
          max_tokens: agent.maxTokens || 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.choices[0].message.content;
        usage.tokens = data.usage?.total_tokens || 0;

        // Calculate cost based on model
        const costPerToken = agent.model.includes('gpt-4') ? 0.00003 : 0.000002;
        usage.cost = usage.tokens * costPerToken;
      } else {
        const error = await response.json();
        throw new Error(error.error?.message || 'AI response failed');
      }
    }

    // Apply message delay if configured
    if (agent.enableSmartDelay) {
      const delayMs = agent.messageDelayMs || 2000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // Create assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse,
        tokens: usage.tokens,
        cost: usage.cost,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        updatedAt: new Date(),
      },
    });

    // **📊 ENHANCED RESPONSE WITH RAG METADATA**
    const response = {
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: aiResponse,
        createdAt: assistantMessage.createdAt,
      },
      conversation: {
        id: conversation.id,
        title: conversation.title,
      },
      usage,
      // Enhanced RAG information
      rag: {
        enabled: useAdvancedRAG,
        hasContext: !!knowledgeContext,
        ...ragMetadata,
      },
    };

    // Add RAG context sources for debugging if in development
    if (process.env.NODE_ENV === 'development' && ragResult?.contextAssembly) {
      (response as any).debug = {
        ragSources: ragResult.contextAssembly.chunks.map((chunk: any) => ({
          source: chunk.source.title,
          relevance: chunk.metadata.relevanceScore,
          preview: chunk.content.substring(0, 100) + '...',
        })),
        ragStats: ragResult.contextAssembly.stats,
      };
    }

    console.log(`✅ Chat response generated with ${useAdvancedRAG ? 'advanced' : 'legacy'} RAG`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in chat:', error);

    // Enhanced error handling with fallbacks and recovery
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('API key')) {
        return NextResponse.json(
          {
            error: 'API key error',
            fallback: 'Please check your API key configuration',
            recovery: {
              suggestions: [
                'Verify your API key is valid',
                'Check if the API key has sufficient credits',
                'Try using a different model',
              ],
              retryAfter: 0,
            },
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        );
      }

      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'Request timeout',
            fallback: 'The AI model took too long to respond',
            recovery: {
              suggestions: [
                'Try again with a shorter message',
                'Check your internet connection',
                'Switch to a faster model',
              ],
              retryAfter: 3000,
            },
            timestamp: new Date().toISOString(),
          },
          { status: 408 }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            fallback: 'Too many requests in a short time',
            recovery: {
              suggestions: [
                'Wait a moment before trying again',
                'Reduce the frequency of requests',
                'Upgrade your API plan',
              ],
              retryAfter: 60000, // 1 minute
            },
            timestamp: new Date().toISOString(),
          },
          { status: 429 }
        );
      }
    }

    // Generic error with recovery suggestions
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        fallback: 'Something went wrong while processing your message',
        recovery: {
          suggestions: [
            'Check your internet connection',
            'Try rephrasing your message',
            'Contact support if the problem persists',
          ],
          retryAfter: 5000,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
