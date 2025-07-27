import {
  ContextualMessage,
  SentimentAnalysis,
  IntentDetection,
  ExtractedEntity,
  ConversationContext,
  PredictiveInsight,
  ContextBuilderConfig,
} from './types';

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage: {
    total_tokens: number;
  };
}

interface AnalysisResult {
  sentiment: SentimentAnalysis;
  intent: IntentDetection;
  topics: string[];
  entities: ExtractedEntity[];
  qualityScore: number;
}

export class ConversationAnalyzer {
  private config: ContextBuilderConfig;
  private openaiApiKey: string;

  constructor(config: ContextBuilderConfig) {
    this.config = config;
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }

  /**
   * Analyze a single message for sentiment, intent, topics, and entities
   */
  async analyzeMessage(message: string, context?: ConversationContext): Promise<ContextualMessage> {
    try {
      const analysis = await this.performFullAnalysis(message, context);

      return {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
        sentiment: analysis.sentiment,
        intent: analysis.intent,
        topics: analysis.topics,
        entities: analysis.entities,
        qualityScore: analysis.qualityScore,
      };
    } catch (error) {
      console.error('Error analyzing message:', error);

      // Return basic message without analysis if AI fails
      return {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
        qualityScore: 0.5, // Default neutral score
      };
    }
  }

  /**
   * Perform comprehensive AI analysis using OpenAI
   */
  private async performFullAnalysis(
    message: string,
    context?: ConversationContext
  ): Promise<AnalysisResult> {
    if (!this.config.enableAIAnalysis || !this.openaiApiKey) {
      return this.getMockAnalysis(message);
    }

    const analysisPrompt = this.buildAnalysisPrompt(message, context);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.analysisModel || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert conversation analyst. Analyze the given message and return structured JSON analysis.',
            },
            {
              role: 'user',
              content: analysisPrompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data: OpenAIResponse = await response.json();
      const analysisText = data.choices[0]?.message?.content;

      if (!analysisText) {
        throw new Error('No analysis content returned');
      }

      return this.parseAnalysisResponse(analysisText, message);
    } catch (error) {
      console.error('AI analysis failed, using fallback:', error);
      return this.getMockAnalysis(message);
    }
  }

  /**
   * Build comprehensive analysis prompt
   */
  private buildAnalysisPrompt(message: string, context?: ConversationContext): string {
    let prompt = `Analyze this conversation message:

MESSAGE: "${message}"

Please provide analysis in the following JSON format:
{
  "sentiment": {
    "overall": "positive|negative|neutral",
    "score": <number between -1 and 1>,
    "emotions": {
      "joy": <0-1>,
      "anger": <0-1>,
      "sadness": <0-1>,
      "fear": <0-1>,
      "surprise": <0-1>
    }
  },
  "intent": {
    "primary": "<main intent>",
    "secondary": ["<secondary intents>"],
    "confidence": <0-1>,
    "category": "question|request|complaint|compliment|other"
  },
  "topics": ["<extracted topics>"],
  "entities": [
    {
      "type": "person|organization|location|product|concept|other",
      "value": "<entity value>",
      "confidence": <0-1>,
      "context": "<context where found>"
    }
  ],
  "qualityScore": <0-1>
}`;

    // Add context if available
    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      const recentHistory = context.conversationHistory.slice(-3);
      prompt += `\n\nCONVERSATION CONTEXT:\n`;
      recentHistory.forEach((msg, i) => {
        prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      });
    }

    if (context?.currentTopic) {
      prompt += `\nCURRENT TOPIC: ${context.currentTopic}`;
    }

    prompt += `\n\nReturn only valid JSON, no explanations.`;

    return prompt;
  }

  /**
   * Parse AI response and extract analysis
   */
  private parseAnalysisResponse(analysisText: string, originalMessage: string): AnalysisResult {
    try {
      // Extract JSON from response (handle cases where AI adds explanations)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate and sanitize the response
      return {
        sentiment: this.validateSentiment(analysis.sentiment),
        intent: this.validateIntent(analysis.intent),
        topics: this.validateTopics(analysis.topics),
        entities: this.validateEntities(analysis.entities),
        qualityScore: this.validateQualityScore(analysis.qualityScore),
      };
    } catch (error) {
      console.error('Error parsing analysis response:', error);
      return this.getMockAnalysis(originalMessage);
    }
  }

  /**
   * Generate mock analysis for fallback or testing
   */
  private getMockAnalysis(message: string): AnalysisResult {
    const sentimentScore = this.calculateBasicSentiment(message);
    const topics = this.extractBasicTopics(message);
    const intent = this.detectBasicIntent(message);

    return {
      sentiment: {
        overall: sentimentScore > 0.1 ? 'positive' : sentimentScore < -0.1 ? 'negative' : 'neutral',
        score: sentimentScore,
        emotions: {
          joy: sentimentScore > 0 ? sentimentScore : 0,
          anger: sentimentScore < -0.5 ? Math.abs(sentimentScore) : 0,
          sadness: sentimentScore < -0.2 && sentimentScore > -0.5 ? Math.abs(sentimentScore) : 0,
          fear: 0,
          surprise: 0,
        },
      },
      intent: {
        primary: intent,
        secondary: [],
        confidence: 0.6,
        category: this.categorizeIntent(intent),
      },
      topics,
      entities: this.extractBasicEntities(message),
      qualityScore: 0.7,
    };
  }

  /**
   * Generate predictive insights based on conversation context
   */
  async generatePredictiveInsights(context: ConversationContext): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Analyze conversation flow
    if (
      context.conversationFlow.currentStage === 'inquiry' &&
      context.sentimentScore &&
      context.sentimentScore < -0.3
    ) {
      insights.push({
        type: 'escalation_risk',
        prediction: 'User showing signs of frustration, potential escalation risk',
        confidence: 0.75,
        suggestedActions: [
          'Acknowledge user concerns empathetically',
          'Offer direct assistance or escalation to human agent',
          'Provide clear next steps',
        ],
      });
    }

    // Pattern-based predictions
    if (context.userBehaviorPatterns.length > 0) {
      const commonPattern = context.userBehaviorPatterns[0];
      if (commonPattern.pattern.includes('product_question')) {
        insights.push({
          type: 'next_question',
          prediction: 'User likely to ask about pricing or availability next',
          confidence: 0.8,
          suggestedActions: [
            'Proactively mention pricing information',
            'Include availability details',
            'Offer product demonstration',
          ],
        });
      }
    }

    // Topic-based insights
    if (context.extractedTopics.includes('technical_issue')) {
      insights.push({
        type: 'resolution_path',
        prediction: 'Technical troubleshooting conversation - step-by-step resolution needed',
        confidence: 0.85,
        suggestedActions: [
          'Ask clarifying questions about the technical setup',
          'Provide systematic troubleshooting steps',
          'Offer screen sharing or remote assistance if available',
        ],
      });
    }

    return insights;
  }

  // Validation methods
  private validateSentiment(sentiment: any): SentimentAnalysis {
    return {
      overall: ['positive', 'negative', 'neutral'].includes(sentiment?.overall)
        ? sentiment.overall
        : 'neutral',
      score: typeof sentiment?.score === 'number' ? Math.max(-1, Math.min(1, sentiment.score)) : 0,
      emotions: {
        joy: Math.max(0, Math.min(1, sentiment?.emotions?.joy || 0)),
        anger: Math.max(0, Math.min(1, sentiment?.emotions?.anger || 0)),
        sadness: Math.max(0, Math.min(1, sentiment?.emotions?.sadness || 0)),
        fear: Math.max(0, Math.min(1, sentiment?.emotions?.fear || 0)),
        surprise: Math.max(0, Math.min(1, sentiment?.emotions?.surprise || 0)),
      },
    };
  }

  private validateIntent(intent: any): IntentDetection {
    return {
      primary: intent?.primary || 'unknown',
      secondary: Array.isArray(intent?.secondary) ? intent.secondary : [],
      confidence: Math.max(0, Math.min(1, intent?.confidence || 0.5)),
      category: ['question', 'request', 'complaint', 'compliment', 'other'].includes(
        intent?.category
      )
        ? intent.category
        : 'other',
    };
  }

  private validateTopics(topics: any): string[] {
    return Array.isArray(topics) ? topics.filter(t => typeof t === 'string') : [];
  }

  private validateEntities(entities: any): ExtractedEntity[] {
    if (!Array.isArray(entities)) return [];

    return entities
      .filter(e => e && typeof e === 'object')
      .map(e => ({
        type: ['person', 'organization', 'location', 'product', 'concept', 'other'].includes(e.type)
          ? e.type
          : 'other',
        value: e.value || '',
        confidence: Math.max(0, Math.min(1, e.confidence || 0.5)),
        context: e.context || '',
      }));
  }

  private validateQualityScore(score: any): number {
    return Math.max(0, Math.min(1, typeof score === 'number' ? score : 0.5));
  }

  // Basic analysis fallback methods
  private calculateBasicSentiment(message: string): number {
    const positiveWords = [
      'good',
      'great',
      'excellent',
      'amazing',
      'perfect',
      'love',
      'like',
      'happy',
      'thank',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'hate',
      'angry',
      'frustrated',
      'problem',
      'issue',
      'wrong',
    ];

    const words = message.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) score += 0.1;
      if (negativeWords.some(nw => word.includes(nw))) score -= 0.1;
    });

    return Math.max(-1, Math.min(1, score));
  }

  private extractBasicTopics(message: string): string[] {
    const topicKeywords = {
      product_inquiry: ['product', 'item', 'buy', 'purchase', 'price', 'cost'],
      technical_support: ['issue', 'problem', 'error', 'bug', 'not working', 'broken'],
      account_help: ['account', 'login', 'password', 'profile', 'settings'],
      billing: ['payment', 'bill', 'charge', 'invoice', 'refund', 'subscription'],
    };

    const topics: string[] = [];
    const lowerMessage = message.toLowerCase();

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  private detectBasicIntent(message: string): string {
    const questionWords = ['what', 'how', 'when', 'where', 'why', 'which', 'who'];
    const requestWords = ['please', 'can you', 'could you', 'would you', 'help me'];
    const complaintWords = ['problem', 'issue', 'not working', 'broken', 'frustrated'];

    const lowerMessage = message.toLowerCase();

    if (questionWords.some(w => lowerMessage.includes(w))) return 'inquiry';
    if (requestWords.some(w => lowerMessage.includes(w))) return 'assistance_request';
    if (complaintWords.some(w => lowerMessage.includes(w))) return 'issue_report';
    if (message.includes('?')) return 'question';

    return 'general_message';
  }

  private categorizeIntent(
    intent: string
  ): 'question' | 'request' | 'complaint' | 'compliment' | 'other' {
    if (intent.includes('question') || intent.includes('inquiry')) return 'question';
    if (intent.includes('request') || intent.includes('assistance')) return 'request';
    if (intent.includes('issue') || intent.includes('problem')) return 'complaint';
    if (intent.includes('thank') || intent.includes('great')) return 'compliment';
    return 'other';
  }

  private extractBasicEntities(message: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Simple entity extraction patterns
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s*\d{3}-\d{4}\b/g;

    // Extract emails
    const emails = message.match(emailPattern);
    if (emails) {
      emails.forEach(email => {
        entities.push({
          type: 'other',
          value: email,
          confidence: 0.9,
          context: 'email_address',
        });
      });
    }

    // Extract phone numbers
    const phones = message.match(phonePattern);
    if (phones) {
      phones.forEach(phone => {
        entities.push({
          type: 'other',
          value: phone,
          confidence: 0.9,
          context: 'phone_number',
        });
      });
    }

    return entities;
  }
}
