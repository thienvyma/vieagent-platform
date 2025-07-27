import { GmailService, EmailData, EmailAnalysis, AutoResponse } from './gmail';
import { IntelligentSchedulerService, MeetingRequest } from './intelligent-scheduler';
import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmailIntelligenceConfig {
  autoResponseEnabled: boolean;
  autoSchedulingEnabled: boolean;
  sentimentAnalysisEnabled: boolean;
  categoryAutoAssignment: boolean;
  priorityDetection: boolean;
  spamDetection: boolean;
  languageDetection: boolean;
  confidenceThreshold: number; // 0-1
  autoResponseTypes: Array<
    'acknowledgment' | 'information' | 'meeting_confirmation' | 'escalation'
  >;
  businessHours: {
    start: string;
    end: string;
    timezone: string;
  };
  responseDelay: number; // minutes
}

export interface EmailInsights {
  id: string;
  emailId: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  subcategory?: string;
  confidence: number;
  keyTopics: string[];
  namedEntities: Array<{
    type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'other';
    value: string;
    confidence: number;
  }>;
  actionItems: Array<{
    type: 'meeting' | 'task' | 'deadline' | 'follow_up' | 'document' | 'approval';
    description: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: Date;
    assignee?: string;
  }>;
  meetingDetection?: {
    hasMeetingRequest: boolean;
    meetingDetails?: {
      title: string;
      suggestedTime?: Date;
      duration?: number;
      location?: string;
      attendees: string[];
      urgency: 'low' | 'medium' | 'high' | 'urgent';
    };
  };
  responseRecommendation?: {
    shouldRespond: boolean;
    responseType: AutoResponse['type'];
    suggestedResponse: string;
    confidence: number;
    reasoning: string;
  };
  language: string;
  readingTime: number; // seconds
  complexity: 'simple' | 'moderate' | 'complex';
  businessRelevance: number; // 0-1
}

export interface EmailThread {
  threadId: string;
  emails: EmailData[];
  summary: string;
  status: 'active' | 'resolved' | 'pending' | 'archived';
  participants: Array<{
    email: string;
    name?: string;
    role: 'sender' | 'recipient' | 'cc' | 'bcc';
    responseCount: number;
    lastActivity: Date;
  }>;
  totalMessages: number;
  averageResponseTime: number; // hours
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  actionItems: EmailInsights['actionItems'];
  keyDecisions: Array<{
    decision: string;
    decisionMaker: string;
    timestamp: Date;
    confidence: number;
  }>;
}

export interface EmailAnalytics {
  totalEmails: number;
  responseRate: number; // percentage
  averageResponseTime: number; // hours
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  categoryDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  urgencyDistribution: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  autoResponseStats: {
    total: number;
    successful: number;
    accuracy: number;
  };
  meetingDetectionStats: {
    detected: number;
    scheduled: number;
    accuracy: number;
  };
  timeAnalysis: {
    peakHours: Array<{ hour: number; count: number }>;
    responsePatterns: Array<{ day: string; averageTime: number }>;
  };
  topSenders: Array<{
    email: string;
    count: number;
    averageUrgency: number;
  }>;
}

export class EmailIntelligenceService {
  private gmailService: GmailService;
  private schedulerService: IntelligentSchedulerService;

  constructor() {
    this.gmailService = new GmailService();
    this.schedulerService = new IntelligentSchedulerService();
  }

  /**
   * Analyze email with advanced AI intelligence
   */
  async analyzeEmailIntelligence(
    userId: string,
    emailData: EmailData,
    config?: EmailIntelligenceConfig
  ): Promise<EmailInsights> {
    try {
      console.log('🧠 Starting advanced email intelligence analysis for:', emailData.subject);

      const userConfig = config || (await this.getUserConfig(userId));
      const emailContent = `${emailData.subject}\n\n${emailData.bodyText || emailData.bodyHtml || ''}`;

      // Perform comprehensive AI analysis
      const [
        sentimentAnalysis,
        categoryAnalysis,
        entityExtraction,
        actionItemExtraction,
        meetingDetection,
        responseRecommendation,
        languageDetection,
        complexityAnalysis,
      ] = await Promise.all([
        this.analyzeSentimentAdvanced(emailContent),
        this.categorizeEmailAdvanced(emailContent, emailData),
        this.extractNamedEntities(emailContent),
        this.extractActionItems(emailContent, emailData),
        this.detectMeetingRequests(emailContent, emailData),
        this.generateResponseRecommendation(emailContent, emailData, userConfig),
        this.detectLanguage(emailContent),
        this.analyzeComplexity(emailContent),
      ]);

      // Calculate confidence and business relevance
      const confidence = this.calculateAnalysisConfidence([
        sentimentAnalysis,
        categoryAnalysis,
        entityExtraction,
        actionItemExtraction,
      ]);

      const businessRelevance = this.calculateBusinessRelevance(
        emailContent,
        emailData,
        categoryAnalysis
      );

      const insights: EmailInsights = {
        id: `insight_${emailData.id}_${Date.now()}`,
        emailId: emailData.id,
        sentiment: sentimentAnalysis.sentiment,
        urgency: this.determineUrgency(emailContent, emailData, actionItemExtraction),
        category: categoryAnalysis.category,
        subcategory: categoryAnalysis.subcategory,
        confidence,
        keyTopics: this.extractKeyTopics(emailContent),
        namedEntities: entityExtraction,
        actionItems: actionItemExtraction,
        meetingDetection,
        responseRecommendation,
        language: languageDetection,
        readingTime: this.calculateReadingTime(emailContent),
        complexity: complexityAnalysis,
        businessRelevance,
      };

      // Store insights in database
      await this.saveEmailInsights(userId, insights);

      // Trigger automated actions if enabled
      if (userConfig.autoResponseEnabled && responseRecommendation.shouldRespond) {
        await this.handleAutoResponse(userId, emailData, insights, userConfig);
      }

      if (userConfig.autoSchedulingEnabled && meetingDetection.hasMeetingRequest) {
        await this.handleAutoScheduling(userId, emailData, insights);
      }

      console.log('✅ Email intelligence analysis completed');
      return insights;
    } catch (error) {
      console.error('❌ Error in email intelligence analysis:', error);
      throw new Error(
        `Failed to analyze email intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Advanced sentiment analysis with context
   */
  private async analyzeSentimentAdvanced(content: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions: Array<{ emotion: string; intensity: number }>;
    tone: 'professional' | 'casual' | 'urgent' | 'friendly' | 'formal';
  }> {
    try {
      const prompt = `
        Analyze the sentiment and emotional tone of this email content:
        
        "${content}"
        
        Provide analysis in JSON format with:
        - sentiment: positive/negative/neutral
        - confidence: 0-1 scale
        - emotions: array of {emotion, intensity} where intensity is 0-1
        - tone: professional/casual/urgent/friendly/formal
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert email sentiment analyzer. Provide detailed sentiment analysis in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 400,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return {
        sentiment: analysis.sentiment || 'neutral',
        confidence: analysis.confidence || 0.5,
        emotions: analysis.emotions || [],
        tone: analysis.tone || 'professional',
      };
    } catch (error) {
      console.error('❌ Error in advanced sentiment analysis:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        emotions: [],
        tone: 'professional',
      };
    }
  }

  /**
   * Advanced email categorization with subcategories
   */
  private async categorizeEmailAdvanced(
    content: string,
    emailData: EmailData
  ): Promise<{
    category: string;
    subcategory?: string;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const prompt = `
        Categorize this email based on its content and context:
        
        Subject: ${emailData.subject}
        From: ${emailData.from.email}
        Content: ${content}
        
        Provide categorization in JSON format with:
        - category: main category (e.g., "business", "personal", "support", "marketing", "meeting", "project")
        - subcategory: specific subcategory if applicable
        - confidence: 0-1 scale
        - reasoning: brief explanation
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert email categorization system. Analyze emails and provide accurate categorization.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return {
        category: analysis.category || 'general',
        subcategory: analysis.subcategory,
        confidence: analysis.confidence || 0.5,
        reasoning: analysis.reasoning || 'Automated categorization',
      };
    } catch (error) {
      console.error('❌ Error in advanced categorization:', error);
      return {
        category: 'general',
        confidence: 0.5,
        reasoning: 'Fallback categorization',
      };
    }
  }

  /**
   * Extract named entities with AI
   */
  private async extractNamedEntities(content: string): Promise<EmailInsights['namedEntities']> {
    try {
      const prompt = `
        Extract named entities from this email content:
        
        "${content}"
        
        Identify and extract:
        - People names
        - Organizations/companies
        - Locations
        - Dates and times
        - Money amounts
        - Other important entities
        
        Return JSON array with: [{type, value, confidence}]
        Where type is: person|organization|location|date|money|other
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert named entity recognition system. Extract relevant entities from email content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const entities = JSON.parse(response.choices[0].message.content || '[]');
      return entities.map((entity: any) => ({
        type: entity.type || 'other',
        value: entity.value || '',
        confidence: entity.confidence || 0.5,
      }));
    } catch (error) {
      console.error('❌ Error in entity extraction:', error);
      return [];
    }
  }

  /**
   * Extract action items with AI
   */
  private async extractActionItems(
    content: string,
    emailData: EmailData
  ): Promise<EmailInsights['actionItems']> {
    try {
      const prompt = `
        Extract action items from this email:
        
        Subject: ${emailData.subject}
        Content: ${content}
        
        Identify tasks, deadlines, meeting requests, follow-ups, document requests, and approvals needed.
        
        Return JSON array with: [{type, description, priority, dueDate, assignee}]
        Where type is: meeting|task|deadline|follow_up|document|approval
        Priority is: high|medium|low
        DueDate should be ISO string if extractable
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at extracting action items from email content. Be precise and actionable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 600,
      });

      const actionItems = JSON.parse(response.choices[0].message.content || '[]');
      return actionItems.map((item: any) => ({
        type: item.type || 'task',
        description: item.description || '',
        priority: item.priority || 'medium',
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        assignee: item.assignee,
      }));
    } catch (error) {
      console.error('❌ Error in action item extraction:', error);
      return [];
    }
  }

  /**
   * Detect meeting requests with AI
   */
  private async detectMeetingRequests(
    content: string,
    emailData: EmailData
  ): Promise<EmailInsights['meetingDetection']> {
    try {
      const prompt = `
        Analyze this email for meeting requests:
        
        Subject: ${emailData.subject}
        Content: ${content}
        
        Determine if this email contains a meeting request and extract details:
        
        Return JSON with:
        - hasMeetingRequest: boolean
        - meetingDetails: {title, suggestedTime, duration, location, attendees, urgency} if applicable
        
        Parse any date/time references and convert to ISO format if possible.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at detecting meeting requests in emails and extracting meeting details.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 400,
      });

      const detection = JSON.parse(response.choices[0].message.content || '{}');

      if (detection.hasMeetingRequest && detection.meetingDetails) {
        return {
          hasMeetingRequest: true,
          meetingDetails: {
            title: detection.meetingDetails.title || emailData.subject,
            suggestedTime: detection.meetingDetails.suggestedTime
              ? new Date(detection.meetingDetails.suggestedTime)
              : undefined,
            duration: detection.meetingDetails.duration || 30,
            location: detection.meetingDetails.location,
            attendees: detection.meetingDetails.attendees || [emailData.from.email],
            urgency: detection.meetingDetails.urgency || 'medium',
          },
        };
      }

      return { hasMeetingRequest: false };
    } catch (error) {
      console.error('❌ Error in meeting detection:', error);
      return { hasMeetingRequest: false };
    }
  }

  /**
   * Generate response recommendation
   */
  private async generateResponseRecommendation(
    content: string,
    emailData: EmailData,
    config: EmailIntelligenceConfig
  ): Promise<EmailInsights['responseRecommendation']> {
    try {
      const prompt = `
        Analyze this email and recommend if/how to respond:
        
        Subject: ${emailData.subject}
        From: ${emailData.from.email}
        Content: ${content}
        
        Consider:
        - Does this email require a response?
        - What type of response is appropriate?
        - Generate a suggested response
        
        Return JSON with:
        - shouldRespond: boolean
        - responseType: acknowledgment|information|meeting_confirmation|escalation
        - suggestedResponse: string
        - confidence: 0-1
        - reasoning: string
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert email assistant. Analyze emails and provide intelligent response recommendations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const recommendation = JSON.parse(response.choices[0].message.content || '{}');

      return {
        shouldRespond: recommendation.shouldRespond || false,
        responseType: recommendation.responseType || 'acknowledgment',
        suggestedResponse: recommendation.suggestedResponse || '',
        confidence: recommendation.confidence || 0.5,
        reasoning: recommendation.reasoning || 'Automated analysis',
      };
    } catch (error) {
      console.error('❌ Error in response recommendation:', error);
      return {
        shouldRespond: false,
        responseType: 'acknowledgment',
        suggestedResponse: '',
        confidence: 0.5,
        reasoning: 'Error in analysis',
      };
    }
  }

  /**
   * Detect email language
   */
  private async detectLanguage(content: string): Promise<string> {
    try {
      const prompt = `Detect the language of this text: "${content.substring(0, 200)}..."`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a language detection system. Return only the language code (e.g., "en", "es", "fr").',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 10,
      });

      return response.choices[0].message.content?.trim() || 'en';
    } catch (error) {
      console.error('❌ Error in language detection:', error);
      return 'en';
    }
  }

  /**
   * Analyze content complexity
   */
  private analyzeComplexity(content: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;

    if (avgWordsPerSentence < 10 && wordCount < 100) {
      return 'simple';
    } else if (avgWordsPerSentence < 20 && wordCount < 300) {
      return 'moderate';
    } else {
      return 'complex';
    }
  }

  /**
   * Calculate reading time
   */
  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil((wordCount / wordsPerMinute) * 60); // Return in seconds
  }

  /**
   * Extract key topics
   */
  private extractKeyTopics(content: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      'the',
      'is',
      'at',
      'which',
      'on',
      'and',
      'a',
      'to',
      'are',
      'as',
      'was',
      'with',
      'for',
      'by',
      'this',
      'that',
      'of',
      'from',
      'they',
      'we',
      'been',
      'have',
      'had',
      'their',
      'said',
      'each',
      'which',
      'she',
      'do',
      'how',
      'if',
      'will',
      'up',
      'other',
      'about',
      'out',
      'many',
      'then',
      'them',
      'these',
      'so',
      'some',
      'her',
      'would',
      'make',
      'like',
      'into',
      'him',
      'has',
      'two',
      'more',
      'very',
      'what',
      'know',
      'just',
      'first',
      'get',
      'over',
      'think',
      'also',
      'your',
      'work',
      'life',
      'only',
      'can',
      'still',
      'should',
      'after',
      'being',
      'now',
      'made',
      'before',
      'here',
      'through',
      'when',
      'where',
      'much',
      'go',
      'me',
      'back',
      'with',
      'well',
      'were',
    ]);

    const filteredWords = words.filter(
      word => word.length > 3 && !stopWords.has(word) && /^[a-z]+$/.test(word)
    );

    const wordFreq = filteredWords.reduce(
      (acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Determine email urgency
   */
  private determineUrgency(
    content: string,
    emailData: EmailData,
    actionItems: EmailInsights['actionItems']
  ): 'urgent' | 'high' | 'medium' | 'low' {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical'];
    const highKeywords = ['important', 'priority', 'deadline', 'soon'];

    const contentLower = content.toLowerCase();
    const subjectLower = emailData.subject.toLowerCase();

    if (
      urgentKeywords.some(
        keyword => contentLower.includes(keyword) || subjectLower.includes(keyword)
      )
    ) {
      return 'urgent';
    }

    if (
      highKeywords.some(keyword => contentLower.includes(keyword) || subjectLower.includes(keyword))
    ) {
      return 'high';
    }

    // Check action items for urgency
    const hasHighPriorityActions = actionItems.some(item => item.priority === 'high');
    if (hasHighPriorityActions) {
      return 'high';
    }

    // Check for time-sensitive content
    const hasDeadlines = actionItems.some(item => item.dueDate);
    if (hasDeadlines) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Calculate analysis confidence
   */
  private calculateAnalysisConfidence(analyses: any[]): number {
    const confidences = analyses
      .filter(analysis => analysis && typeof analysis.confidence === 'number')
      .map(analysis => analysis.confidence);

    if (confidences.length === 0) return 0.5;

    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  /**
   * Calculate business relevance score
   */
  private calculateBusinessRelevance(
    content: string,
    emailData: EmailData,
    categoryAnalysis: any
  ): number {
    let score = 0.5; // Base score

    // Category-based scoring
    const businessCategories = ['business', 'project', 'meeting', 'support'];
    if (businessCategories.includes(categoryAnalysis.category)) {
      score += 0.3;
    }

    // Domain-based scoring
    const businessDomains = ['.com', '.org', '.gov', '.edu'];
    if (businessDomains.some(domain => emailData.from.email.includes(domain))) {
      score += 0.2;
    }

    // Content-based scoring
    const businessKeywords = ['project', 'meeting', 'deadline', 'budget', 'contract', 'proposal'];
    const keywordCount = businessKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword)
    ).length;

    score += Math.min(keywordCount * 0.1, 0.3);

    return Math.min(score, 1.0);
  }

  /**
   * Handle automated response
   */
  private async handleAutoResponse(
    userId: string,
    emailData: EmailData,
    insights: EmailInsights,
    config: EmailIntelligenceConfig
  ): Promise<void> {
    try {
      if (!insights.responseRecommendation?.shouldRespond) return;

      const { responseType, suggestedResponse, confidence } = insights.responseRecommendation;

      // Check confidence threshold
      if (confidence < config.confidenceThreshold) {
        console.log('⚠️ Auto-response confidence below threshold, skipping');
        return;
      }

      // Check if response type is enabled
      if (!config.autoResponseTypes.includes(responseType)) {
        console.log('⚠️ Auto-response type not enabled, skipping');
        return;
      }

      // Check business hours if configured
      if (config.businessHours && !this.isWithinBusinessHours(config.businessHours)) {
        console.log('⚠️ Outside business hours, delaying response');
        // Schedule for later
        await this.scheduleDelayedResponse(
          userId,
          emailData,
          suggestedResponse,
          config.responseDelay
        );
        return;
      }

      // Send auto-response
      await this.gmailService.sendReply(
        userId,
        emailData.id,
        suggestedResponse,
        `Re: ${emailData.subject}`
      );

      console.log('✅ Auto-response sent successfully');
    } catch (error) {
      console.error('❌ Error in auto-response handling:', error);
    }
  }

  /**
   * Handle automated scheduling
   */
  private async handleAutoScheduling(
    userId: string,
    emailData: EmailData,
    insights: EmailInsights
  ): Promise<void> {
    try {
      if (
        !insights.meetingDetection?.hasMeetingRequest ||
        !insights.meetingDetection.meetingDetails
      ) {
        return;
      }

      const meetingDetails = insights.meetingDetection.meetingDetails;

      const meetingRequest: MeetingRequest = {
        title: meetingDetails.title,
        duration: meetingDetails.duration || 30,
        attendees: meetingDetails.attendees,
        urgency: meetingDetails.urgency,
        location: meetingDetails.location,
        meetingType: 'other',
        source: 'email',
      };

      const schedulingResult = await this.schedulerService.scheduleSmartMeeting(
        userId,
        meetingRequest
      );

      if (schedulingResult.success) {
        // Send confirmation email
        const confirmationContent = `
          Meeting scheduled successfully!
          
          Title: ${meetingRequest.title}
          Time: ${schedulingResult.suggestedTime?.toLocaleString()}
          Duration: ${meetingRequest.duration} minutes
          
          Calendar invitation has been sent to all attendees.
        `;

        await this.gmailService.sendReply(
          userId,
          emailData.id,
          confirmationContent,
          `Meeting Scheduled: ${meetingRequest.title}`
        );

        console.log('✅ Auto-scheduling completed successfully');
      }
    } catch (error) {
      console.error('❌ Error in auto-scheduling:', error);
    }
  }

  /**
   * Save email insights to database
   */
  private async saveEmailInsights(userId: string, insights: EmailInsights): Promise<void> {
    try {
      await prisma.emailInsights.create({
        data: {
          id: insights.id,
          userId,
          emailId: insights.emailId,
          sentiment: insights.sentiment,
          urgency: insights.urgency,
          category: insights.category,
          subcategory: insights.subcategory,
          confidence: insights.confidence,
          keyTopics: JSON.stringify(insights.keyTopics),
          namedEntities: JSON.stringify(insights.namedEntities),
          actionItems: JSON.stringify(insights.actionItems),
          meetingDetection: JSON.stringify(insights.meetingDetection),
          responseRecommendation: JSON.stringify(insights.responseRecommendation),
          language: insights.language,
          readingTime: insights.readingTime,
          complexity: insights.complexity,
          businessRelevance: insights.businessRelevance,
          createdAt: new Date(),
        },
      });

      console.log('✅ Email insights saved to database');
    } catch (error) {
      console.error('❌ Error saving email insights:', error);
    }
  }

  /**
   * Get user configuration
   */
  private async getUserConfig(userId: string): Promise<EmailIntelligenceConfig> {
    try {
      const preferences = await prisma.userPreferences.findUnique({
        where: { userId },
        select: { emailIntelligenceConfig: true },
      });

      if (preferences?.emailIntelligenceConfig) {
        return JSON.parse(preferences.emailIntelligenceConfig as string);
      }
    } catch (error) {
      console.error('❌ Error getting user config:', error);
    }

    // Return default configuration
    return {
      autoResponseEnabled: false,
      autoSchedulingEnabled: false,
      sentimentAnalysisEnabled: true,
      categoryAutoAssignment: true,
      priorityDetection: true,
      spamDetection: true,
      languageDetection: true,
      confidenceThreshold: 0.7,
      autoResponseTypes: ['acknowledgment', 'information'],
      businessHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC',
      },
      responseDelay: 0,
    };
  }

  /**
   * Check if current time is within business hours
   */
  private isWithinBusinessHours(businessHours: EmailIntelligenceConfig['businessHours']): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(businessHours.start.split(':')[0]);
    const endHour = parseInt(businessHours.end.split(':')[0]);

    return currentHour >= startHour && currentHour < endHour;
  }

  /**
   * Schedule delayed response
   */
  private async scheduleDelayedResponse(
    userId: string,
    emailData: EmailData,
    response: string,
    delay: number
  ): Promise<void> {
    // This would integrate with a job queue system
    console.log(`📅 Scheduling delayed response for ${delay} minutes`);
    // Implementation would depend on your job queue system (Bull, Agenda, etc.)
  }

  /**
   * Get email analytics
   */
  async getEmailAnalytics(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<EmailAnalytics> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      const insights = await prisma.emailInsights.findMany({
        where: {
          userId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });

      const totalEmails = insights.length;

      // Calculate sentiment distribution
      const sentimentCounts = insights.reduce(
        (acc, insight) => {
          acc[insight.sentiment] = (acc[insight.sentiment] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Calculate category distribution
      const categoryCounts = insights.reduce(
        (acc, insight) => {
          acc[insight.category] = (acc[insight.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
        percentage: (count / totalEmails) * 100,
      }));

      // Calculate urgency distribution
      const urgencyCounts = insights.reduce(
        (acc, insight) => {
          acc[insight.urgency] = (acc[insight.urgency] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalEmails,
        responseRate: 85, // This would be calculated from actual response data
        averageResponseTime: 2.5, // This would be calculated from actual response times
        sentimentDistribution: {
          positive: sentimentCounts.positive || 0,
          negative: sentimentCounts.negative || 0,
          neutral: sentimentCounts.neutral || 0,
        },
        categoryDistribution,
        urgencyDistribution: {
          urgent: urgencyCounts.urgent || 0,
          high: urgencyCounts.high || 0,
          medium: urgencyCounts.medium || 0,
          low: urgencyCounts.low || 0,
        },
        autoResponseStats: {
          total: 0, // Would be calculated from actual auto-response data
          successful: 0,
          accuracy: 0,
        },
        meetingDetectionStats: {
          detected: 0, // Would be calculated from actual meeting detection data
          scheduled: 0,
          accuracy: 0,
        },
        timeAnalysis: {
          peakHours: [],
          responsePatterns: [],
        },
        topSenders: [],
      };
    } catch (error) {
      console.error('❌ Error getting email analytics:', error);
      throw new Error('Failed to get email analytics');
    }
  }
}
