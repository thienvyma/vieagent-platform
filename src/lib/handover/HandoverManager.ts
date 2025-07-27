import { PrismaClient } from '@prisma/client';
import {
  AgentStatus,
  HandoverRequest,
  HandoverEvent,
  HumanAgent,
  HandoverReason,
  CustomerContext,
  HumanDetectionEvent,
  HandoverConfiguration,
} from './types';

export class HandoverManager {
  private prisma: PrismaClient;
  private config: HandoverConfiguration;
  private activeConversations: Map<string, AgentStatus> = new Map();
  private humanAgents: Map<string, HumanAgent> = new Map();

  constructor(config: HandoverConfiguration) {
    this.prisma = new PrismaClient();
    this.config = config;
    this.initializeHandoverSystem();
  }

  /**
   * Initialize handover system
   */
  private async initializeHandoverSystem() {
    console.log('🤝 Initializing Handover Management System...');

    // Load active conversations
    await this.loadActiveConversations();

    // Load available human agents
    await this.loadHumanAgents();

    // Setup monitoring
    this.setupConversationMonitoring();

    console.log('✅ Handover system initialized');
  }

  /**
   * Check if handover should be triggered based on conversation context
   */
  async shouldTriggerHandover(
    conversationId: string,
    context: any,
    userMessage: string
  ): Promise<{ shouldHandover: boolean; reason?: HandoverReason }> {
    if (!this.config.autoHandoverEnabled) {
      return { shouldHandover: false };
    }

    const triggers = this.config.autoHandoverTriggers;

    // Check sentiment threshold
    if (
      context.sentimentScore !== undefined &&
      context.sentimentScore < triggers.sentimentThreshold
    ) {
      return {
        shouldHandover: true,
        reason: {
          type: 'customer_satisfaction',
          description: `Customer sentiment below threshold (${context.sentimentScore})`,
          confidence: 0.8,
          triggeredBy: 'ai',
          metadata: { sentimentScore: context.sentimentScore },
        },
      };
    }

    // Check escalation keywords
    const lowerMessage = userMessage.toLowerCase();
    const foundKeyword = triggers.escalationKeywords.find(keyword =>
      lowerMessage.includes(keyword.toLowerCase())
    );

    if (foundKeyword) {
      return {
        shouldHandover: true,
        reason: {
          type: 'human_requested',
          description: `Customer used escalation keyword: "${foundKeyword}"`,
          confidence: 0.9,
          triggeredBy: 'customer',
          metadata: { keyword: foundKeyword },
        },
      };
    }

    // Check max AI responses
    const conversationHistory = context.conversationHistory || [];
    const aiResponseCount = conversationHistory.filter(
      (msg: any) => msg.role === 'assistant'
    ).length;

    if (aiResponseCount >= triggers.maxAIResponses) {
      return {
        shouldHandover: true,
        reason: {
          type: 'ai_escalation',
          description: `Reached maximum AI responses limit (${triggers.maxAIResponses})`,
          confidence: 0.7,
          triggeredBy: 'ai',
          metadata: { aiResponseCount },
        },
      };
    }

    // Check conversation duration
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (conversation) {
      const durationMinutes = (Date.now() - conversation.createdAt.getTime()) / (1000 * 60);
      if (durationMinutes >= triggers.conversationDuration) {
        return {
          shouldHandover: true,
          reason: {
            type: 'ai_escalation',
            description: `Conversation duration exceeded limit (${Math.round(durationMinutes)} minutes)`,
            confidence: 0.6,
            triggeredBy: 'ai',
            metadata: { durationMinutes },
          },
        };
      }
    }

    return { shouldHandover: false };
  }

  /**
   * Request handover from AI to human
   */
  async requestHandover(
    conversationId: string,
    reason: HandoverReason,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<HandoverRequest> {
    console.log(`🤝 Requesting handover for conversation: ${conversationId}`);

    // Get conversation context
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 10 },
        user: true,
        agent: true,
      },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Build customer context
    const customerContext = await this.buildCustomerContext(conversation);

    // Generate conversation summary
    const conversationSummary = await this.generateConversationSummary(conversation);

    // Create handover request
    const handoverRequest: HandoverRequest = {
      id: `handover-${Date.now()}`,
      conversationId,
      fromAgentId: conversation.agentId,
      fromAgentType: 'ai',
      toAgentType: 'human',

      reason,
      priority,
      status: 'pending',

      conversationSummary,
      customerContext,

      requestedAt: new Date(),
      timeout: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes timeout

      platform: 'internal', // Default, will be updated based on integration
    };

    // Find available human agent
    const availableAgent = await this.findAvailableHumanAgent(reason, priority);

    if (availableAgent) {
      handoverRequest.toAgentId = availableAgent.id;
      console.log(`📞 Assigned to human agent: ${availableAgent.name}`);

      // Notify human agent
      await this.notifyHumanAgent(availableAgent, handoverRequest);

      // Update conversation status
      await this.updateAgentStatus(conversationId, {
        status: 'handover_pending',
        handoverTriggered: true,
        handoverReason: reason,
        handoverTimestamp: new Date(),
      });
    } else {
      console.log('⚠️ No available human agents, queuing request...');
      // Queue the request or escalate to manager
    }

    // Log handover event
    await this.logHandoverEvent({
      id: `event-${Date.now()}`,
      conversationId,
      eventType: 'handover_requested',
      fromAgent: {
        id: conversation.agentId,
        type: 'ai',
        name: conversation.agent.name,
      },
      eventData: { reason, priority },
      platform: 'internal',
      timestamp: new Date(),
      customerNotified: false,
      contextTransferred: false,
    });

    return handoverRequest;
  }

  /**
   * Detect human agent intervention
   */
  async detectHumanIntervention(
    conversationId: string,
    detectionEvent: HumanDetectionEvent
  ): Promise<boolean> {
    console.log(`👤 Human intervention detected for conversation: ${conversationId}`);
    console.log(
      `Detection method: ${detectionEvent.detectionMethod}, Confidence: ${detectionEvent.confidence}`
    );

    if (detectionEvent.confidence < 0.7) {
      console.log('⚠️ Low confidence detection, ignoring...');
      return false;
    }

    // Get current agent status
    const currentStatus = this.activeConversations.get(conversationId);

    if (!currentStatus || currentStatus.agentType === 'human') {
      console.log('💬 Already handled by human or no active conversation');
      return false;
    }

    // Pause AI agent
    await this.pauseAIAgent(conversationId, 'human_intervention_detected');

    // Create handover event
    await this.logHandoverEvent({
      id: `event-${Date.now()}`,
      conversationId,
      eventType: 'agent_joined',
      toAgent: {
        id: detectionEvent.metadata.humanAgentId || 'unknown',
        type: 'human',
        name: 'Human Agent',
      },
      eventData: { detectionEvent },
      platform: currentStatus.platform,
      timestamp: new Date(),
      customerNotified: false,
      contextTransferred: false,
    });

    // Transfer context to human agent
    await this.transferContextToHuman(conversationId, detectionEvent.metadata.humanAgentId);

    // Notify customer about handover
    if (this.config.notifications.customerNotification) {
      await this.notifyCustomerHandover(conversationId, 'human_agent_joined');
    }

    console.log('✅ AI agent paused, human agent taking over');
    return true;
  }

  /**
   * Pause AI agent responses
   */
  async pauseAIAgent(conversationId: string, reason: string): Promise<void> {
    const status = this.activeConversations.get(conversationId);

    if (status) {
      status.status = 'paused';
      status.lastAIResponse = new Date();
      status.updatedAt = new Date();

      this.activeConversations.set(conversationId, status);

      console.log(`⏸️ AI agent paused for conversation ${conversationId}. Reason: ${reason}`);
    }
  }

  /**
   * Resume AI agent (when human leaves)
   */
  async resumeAIAgent(conversationId: string): Promise<void> {
    const status = this.activeConversations.get(conversationId);

    if (status && status.status === 'paused') {
      status.status = 'active';
      status.agentType = 'ai';
      status.humanAgentId = undefined;
      status.humanAgentName = undefined;
      status.updatedAt = new Date();

      this.activeConversations.set(conversationId, status);

      // Notify customer
      if (this.config.notifications.customerNotification) {
        await this.notifyCustomerHandover(conversationId, 'ai_agent_resumed');
      }

      console.log(`▶️ AI agent resumed for conversation ${conversationId}`);
    }
  }

  /**
   * Check if AI should respond to message
   */
  shouldAIRespond(conversationId: string): boolean {
    const status = this.activeConversations.get(conversationId);

    if (!status) {
      // New conversation, AI should respond
      return true;
    }

    // AI should respond only if it's active and not paused
    return status.agentType === 'ai' && status.status === 'active';
  }

  /**
   * Handle human agent takeover
   */
  async humanTakeover(
    conversationId: string,
    humanAgentId: string,
    humanAgentName: string
  ): Promise<void> {
    console.log(`👤 Human takeover: ${humanAgentName} taking over conversation ${conversationId}`);

    // Update agent status
    await this.updateAgentStatus(conversationId, {
      agentType: 'human',
      status: 'active',
      humanAgentId,
      humanAgentName,
      handoverTimestamp: new Date(),
      contextTransferred: true,
    });

    // Transfer conversation context
    await this.transferContextToHuman(conversationId, humanAgentId);

    // Log event
    await this.logHandoverEvent({
      id: `event-${Date.now()}`,
      conversationId,
      eventType: 'handover_completed',
      fromAgent: {
        id: 'ai-agent',
        type: 'ai',
        name: 'AI Assistant',
      },
      toAgent: {
        id: humanAgentId,
        type: 'human',
        name: humanAgentName,
      },
      eventData: { takeoverMethod: 'manual' },
      platform: 'internal',
      timestamp: new Date(),
      customerNotified: true,
      contextTransferred: true,
    });

    console.log('✅ Human takeover completed');
  }

  // Private helper methods

  private async loadActiveConversations(): Promise<void> {
    // Load from database or cache
    console.log('📁 Loading active conversations...');
  }

  private async loadHumanAgents(): Promise<void> {
    // Load available human agents
    console.log('👥 Loading human agents...');
  }

  private setupConversationMonitoring(): void {
    // Setup real-time monitoring
    console.log('📊 Setting up conversation monitoring...');
  }

  private async buildCustomerContext(conversation: any): Promise<CustomerContext> {
    return {
      userId: conversation.userId,
      customerName: conversation.user.name,
      customerEmail: conversation.user.email,

      currentTopic: 'general_inquiry',
      urgencyLevel: 'medium',
      sentimentScore: 0,
      conversationStage: 'ongoing',

      previousInteractions: 0,
      preferredLanguage: 'en',
      timezone: 'UTC',

      currentIssues: [],
      resolvedIssues: [],
      escalationHistory: 0,
    };
  }

  private async generateConversationSummary(conversation: any): Promise<string> {
    const messageCount = conversation.messages.length;
    const duration = Date.now() - conversation.createdAt.getTime();
    const durationMinutes = Math.round(duration / (1000 * 60));

    return `Conversation with ${conversation.user.name || 'Customer'} - ${messageCount} messages over ${durationMinutes} minutes. Latest topic: General inquiry.`;
  }

  private async findAvailableHumanAgent(
    reason: HandoverReason,
    priority: string
  ): Promise<HumanAgent | null> {
    // Logic to find best available human agent
    // Based on skills, availability, workload, etc.
    return null; // Placeholder
  }

  private async notifyHumanAgent(agent: HumanAgent, request: HandoverRequest): Promise<void> {
    console.log(`📞 Notifying ${agent.name} about handover request`);
    // Implementation for notifications (email, slack, push, etc.)
  }

  private async updateAgentStatus(
    conversationId: string,
    updates: Partial<AgentStatus>
  ): Promise<void> {
    const current = this.activeConversations.get(conversationId);
    if (current) {
      const updated = { ...current, ...updates, updatedAt: new Date() };
      this.activeConversations.set(conversationId, updated);
    }
  }

  private async logHandoverEvent(event: HandoverEvent): Promise<void> {
    console.log(
      `📝 Logging handover event: ${event.eventType} for conversation ${event.conversationId}`
    );
    // Save to database for analytics
  }

  private async transferContextToHuman(
    conversationId: string,
    humanAgentId?: string
  ): Promise<void> {
    console.log(`📋 Transferring context for conversation ${conversationId} to human agent`);
    // Implementation for context transfer
  }

  private async notifyCustomerHandover(conversationId: string, type: string): Promise<void> {
    console.log(`📢 Notifying customer about handover: ${type}`);
    // Send notification to customer about agent change
  }
}
