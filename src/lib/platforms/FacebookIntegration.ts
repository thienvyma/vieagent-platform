import { HandoverManager } from '../handover/HandoverManager';
import { HumanDetectionEvent, PlatformConfig } from '../handover/types';

interface FacebookMessage {
  id: string;
  time: number;
  messaging: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text: string;
      attachments?: any[];
    };
    postback?: {
      title: string;
      payload: string;
    };
    // Facebook Page Inbox integration
    handover?: {
      control: 'pass_thread_control' | 'take_thread_control' | 'request_thread_control';
      target_app_id: string;
      metadata?: string;
    };
  }>;
}

interface FacebookAPIResponse {
  success: boolean;
  message_id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export class FacebookIntegration {
  private handoverManager: HandoverManager;
  private config: PlatformConfig['facebook'];
  private pageAccessToken: string;
  private pageId: string;

  // Facebook App IDs for handover protocol
  private readonly PRIMARY_RECEIVER_APP_ID = process.env.FACEBOOK_APP_ID || '';
  private readonly SECONDARY_RECEIVER_APP_ID = '263902037430900'; // Facebook Page Inbox

  constructor(handoverManager: HandoverManager, config: PlatformConfig['facebook']) {
    this.handoverManager = handoverManager;
    this.config = config!;
    this.pageAccessToken = config!.pageAccessToken;
    this.pageId = config!.pageId;
  }

  /**
   * Handle incoming Facebook webhook
   */
  async handleWebhook(body: FacebookMessage): Promise<void> {
    console.log('📱 Processing Facebook webhook...');

    for (const entry of body.messaging) {
      const senderId = entry.sender.id;
      const recipientId = entry.recipient.id;
      const conversationId = this.generateConversationId(senderId, recipientId);

      // Handle handover protocol events
      if (entry.handover) {
        await this.handleHandoverProtocol(entry.handover, conversationId, senderId);
        continue;
      }

      // Handle regular messages
      if (entry.message) {
        await this.handleMessage(entry, conversationId);
      }

      // Handle postbacks (button clicks)
      if (entry.postback) {
        await this.handlePostback(entry, conversationId);
      }
    }
  }

  /**
   * Handle Facebook Handover Protocol
   */
  private async handleHandoverProtocol(
    handover: any,
    conversationId: string,
    senderId: string
  ): Promise<void> {
    console.log(`🔄 Facebook handover event: ${handover.control}`);

    switch (handover.control) {
      case 'take_thread_control':
        // Human agent (Page Inbox) is taking control
        await this.handleHumanTakeover(conversationId, senderId, handover);
        break;

      case 'pass_thread_control':
        // Passing control back to AI (our app)
        await this.handleControlPassback(conversationId, senderId, handover);
        break;

      case 'request_thread_control':
        // Someone is requesting control
        await this.handleControlRequest(conversationId, senderId, handover);
        break;
    }
  }

  /**
   * Handle human agent taking control via Facebook Page Inbox
   */
  private async handleHumanTakeover(
    conversationId: string,
    senderId: string,
    handover: any
  ): Promise<void> {
    console.log(`👤 Human agent taking control of Facebook conversation: ${conversationId}`);

    // Create human detection event
    const detectionEvent: HumanDetectionEvent = {
      type: 'takeover_signal',
      conversationId,
      platform: 'facebook',
      detectionMethod: 'api_signal',
      confidence: 1.0, // Facebook handover protocol is 100% reliable
      metadata: {
        humanAgentId: 'facebook-page-inbox',
        detectionSignals: ['facebook_handover_protocol'],
        timestamp: new Date(),
      },
    };

    // Notify handover manager
    const handoverDetected = await this.handoverManager.detectHumanIntervention(
      conversationId,
      detectionEvent
    );

    if (handoverDetected) {
      // Send context to human agent via Facebook
      await this.sendContextToHuman(conversationId, senderId);

      // Send acknowledgment message
      await this.sendMessage(senderId, {
        text: '🤝 A human agent has joined the conversation and will assist you from now on.',
      });

      console.log('✅ Facebook handover completed successfully');
    }
  }

  /**
   * Handle control being passed back to AI
   */
  private async handleControlPassback(
    conversationId: string,
    senderId: string,
    handover: any
  ): Promise<void> {
    console.log(`🤖 Control passed back to AI for conversation: ${conversationId}`);

    // Resume AI agent
    await this.handoverManager.resumeAIAgent(conversationId);

    // Send welcome back message
    await this.sendMessage(senderId, {
      text: "🤖 Hi! I'm back to assist you. How can I help you today?",
    });

    console.log('✅ AI agent resumed for Facebook conversation');
  }

  /**
   * Handle regular message from Facebook
   */
  private async handleMessage(entry: any, conversationId: string): Promise<void> {
    const senderId = entry.sender.id;
    const messageText = entry.message.text;

    // Check if AI should respond
    const shouldRespond = this.handoverManager.shouldAIRespond(conversationId);

    if (!shouldRespond) {
      console.log(`🔇 AI agent is paused for conversation ${conversationId}, skipping response`);
      return;
    }

    console.log(`📱 Processing Facebook message: "${messageText}"`);

    try {
      // Call our enhanced chat API
      const response = await this.callEnhancedChatAPI(conversationId, messageText, senderId);

      // Check if handover should be triggered
      if (response.insights) {
        const handoverInsight = response.insights.find(
          (insight: any) => insight.type === 'escalation_risk'
        );

        if (handoverInsight && handoverInsight.confidence > 0.8) {
          console.log('🚨 High escalation risk detected, requesting human agent...');
          await this.requestHumanAgent(conversationId, senderId, handoverInsight);
          return;
        }
      }

      // Send AI response via Facebook
      await this.sendMessage(senderId, {
        text: response.message.content,
      });

      // Check for handover triggers in response
      await this.checkHandoverTriggers(conversationId, response);
    } catch (error) {
      console.error('Error processing Facebook message:', error);

      // Send error message and request human agent
      await this.sendMessage(senderId, {
        text: "I'm sorry, I'm having technical difficulties. Let me connect you with a human agent.",
      });

      await this.requestHumanAgent(conversationId, senderId, {
        type: 'ai_escalation',
        prediction: 'Technical error occurred',
        confidence: 1.0,
        suggestedActions: ['Connect to human agent immediately'],
      });
    }
  }

  /**
   * Request human agent via Facebook Handover Protocol
   */
  private async requestHumanAgent(
    conversationId: string,
    senderId: string,
    reason: any
  ): Promise<void> {
    console.log(`📞 Requesting human agent for Facebook conversation: ${conversationId}`);

    try {
      // Request thread control from Facebook Page Inbox
      const handoverResponse = await this.requestThreadControl(senderId, reason);

      if (handoverResponse.success) {
        // Pause AI agent
        await this.handoverManager.pauseAIAgent(conversationId, 'facebook_handover_requested');

        // Notify customer
        await this.sendMessage(senderId, {
          text: "🤝 I'm connecting you with a human agent who will be able to better assist you. Please wait a moment...",
        });

        console.log('✅ Facebook handover request sent successfully');
      } else {
        throw new Error(`Handover request failed: ${handoverResponse.error?.message}`);
      }
    } catch (error) {
      console.error('Failed to request human agent:', error);

      // Fallback: send message but continue with AI
      await this.sendMessage(senderId, {
        text: "I'll do my best to help you. If you need additional assistance, please let me know and I'll find other ways to connect you with our support team.",
      });
    }
  }

  /**
   * Detect human intervention from message patterns
   */
  private async detectHumanFromMessage(
    messageText: string,
    conversationId: string
  ): Promise<boolean> {
    // Human agent signature patterns
    const humanPatterns = [
      /^hi,?\s*this is \w+/i, // "Hi, this is John"
      /^hello,?\s*my name is \w+/i, // "Hello, my name is Sarah"
      /^i'm \w+.*human\s*agent/i, // "I'm Mike, your human agent"
      /^thanks?.*ai.*i'll take over/i, // "Thanks AI, I'll take over"
      /^\w+\s*here.*from.*support/i, // "Sarah here from support"
    ];

    const foundPattern = humanPatterns.some(pattern => pattern.test(messageText));

    if (foundPattern) {
      console.log(`👤 Human intervention detected from message pattern: "${messageText}"`);

      const detectionEvent: HumanDetectionEvent = {
        type: 'human_message_detected',
        conversationId,
        platform: 'facebook',
        detectionMethod: 'message_pattern',
        confidence: 0.85,
        metadata: {
          detectionSignals: ['human_introduction_pattern'],
          timestamp: new Date(),
        },
      };

      return await this.handoverManager.detectHumanIntervention(conversationId, detectionEvent);
    }

    return false;
  }

  /**
   * Send message via Facebook Messenger API
   */
  private async sendMessage(
    recipientId: string,
    message: { text: string }
  ): Promise<FacebookAPIResponse> {
    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${this.pageAccessToken}`;

    const payload = {
      recipient: { id: recipientId },
      message: message,
      messaging_type: 'RESPONSE',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, message_id: result.message_id };
      } else {
        return {
          success: false,
          error: {
            message: result.error?.message || 'Unknown error',
            type: result.error?.type || 'api_error',
            code: result.error?.code || 0,
          },
        };
      }
    } catch (error) {
      console.error('Facebook API error:', error);
      return {
        success: false,
        error: {
          message: 'Network error',
          type: 'network_error',
          code: 0,
        },
      };
    }
  }

  /**
   * Request thread control via Facebook Handover Protocol
   */
  private async requestThreadControl(senderId: string, reason: any): Promise<FacebookAPIResponse> {
    const url = `https://graph.facebook.com/v18.0/me/request_thread_control?access_token=${this.pageAccessToken}`;

    const payload = {
      recipient: { id: senderId },
      target_app_id: this.SECONDARY_RECEIVER_APP_ID, // Facebook Page Inbox
      metadata: JSON.stringify({
        reason: reason.type,
        description: reason.prediction,
        timestamp: new Date().toISOString(),
      }),
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      return response.ok ? { success: true } : { success: false, error: result.error };
    } catch (error) {
      console.error('Facebook handover request error:', error);
      return {
        success: false,
        error: { message: 'Network error', type: 'network_error', code: 0 },
      };
    }
  }

  /**
   * Send conversation context to human agent
   */
  private async sendContextToHuman(conversationId: string, senderId: string): Promise<void> {
    // This would typically be sent via Facebook's private reply or internal tools
    console.log(`📋 Sending context summary to human agent for conversation: ${conversationId}`);

    // In a real implementation, this could:
    // 1. Send summary via Facebook's Send API to the Page Inbox
    // 2. Update internal CRM/ticketing system
    // 3. Send email to support team
    // 4. Post to Slack channel
  }

  /**
   * Call our enhanced chat API
   */
  private async callEnhancedChatAPI(
    conversationId: string,
    message: string,
    facebookUserId: string
  ): Promise<any> {
    // This would call our internal enhanced chat API
    // For now, return a mock response
    return {
      message: {
        content: 'I understand your concern. Let me help you with that.',
      },
      insights: [],
      qualityMetrics: {
        responseRelevance: 0.8,
        contextUtilization: 0.7,
        userSatisfactionPrediction: 0.75,
      },
    };
  }

  private async checkHandoverTriggers(conversationId: string, response: any): Promise<void> {
    // Check various triggers for handover
    // This is handled by the main enhanced chat system
  }

  private generateConversationId(senderId: string, recipientId: string): string {
    return `fb-${senderId}-${recipientId}`;
  }

  private async handlePostback(entry: any, conversationId: string): Promise<void> {
    // Handle Facebook postback events (button clicks, etc.)
    console.log(`🔘 Facebook postback: ${entry.postback.title}`);
  }

  private async handleControlRequest(
    conversationId: string,
    senderId: string,
    handover: any
  ): Promise<void> {
    // Handle thread control requests
    console.log(`📋 Thread control request received for conversation: ${conversationId}`);
  }
}
