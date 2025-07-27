import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { GoogleAuthManager } from './auth';

const prisma = new PrismaClient();

export interface EmailData {
  id: string;
  threadId: string;
  labelIds: string[];
  subject: string;
  from: {
    email: string;
    name?: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  cc?: Array<{
    email: string;
    name?: string;
  }>;
  bcc?: Array<{
    email: string;
    name?: string;
  }>;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  importance: 'high' | 'normal' | 'low';
}

export interface EmailAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'urgent' | 'normal' | 'low';
  category: string;
  keyTopics: string[];
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  meetingDetected?: {
    hasDateTime: boolean;
    suggestedEvent?: {
      title: string;
      startTime?: Date;
      endTime?: Date;
      location?: string;
      attendees: string[];
    };
  };
}

export interface AutoResponse {
  type: 'acknowledgment' | 'information' | 'meeting_confirmation' | 'escalation';
  content: string;
  confidence: number;
  shouldSend: boolean;
  reasoning: string;
}

export class GmailService {
  private authManager: GoogleAuthManager;

  constructor() {
    this.authManager = new GoogleAuthManager();
  }

  /**
   * Get authenticated Gmail API client
   */
  private async getGmailClient(userId: string): Promise<gmail_v1.Gmail | null> {
    try {
      console.log('🔐 Getting Gmail authenticated client for userId:', userId);
      const oauth2Client = await this.authManager.getAuthenticatedClient(userId);
      if (!oauth2Client) {
        console.error('❌ No authenticated OAuth2 client found for Gmail user:', userId);
        return null;
      }

      console.log('✅ OAuth2 client obtained, creating Gmail API client');
      return google.gmail({ version: 'v1', auth: oauth2Client });
    } catch (error) {
      console.error('❌ Error getting Gmail client:', error);
      return null;
    }
  }

  /**
   * List emails with filtering options
   */
  async getEmails(
    userId: string,
    options: {
      query?: string;
      labelIds?: string[];
      maxResults?: number;
      pageToken?: string;
      includeSpamTrash?: boolean;
    } = {}
  ): Promise<{ emails: EmailData[]; nextPageToken?: string }> {
    try {
      console.log('📧 Getting emails for userId:', userId, 'with options:', options);
      const gmail = await this.getGmailClient(userId);
      if (!gmail) {
        console.error('❌ Failed to get Gmail client - no authentication');
        throw new Error('No Gmail authentication found. Please reconnect your Google account.');
      }

      const {
        query = '',
        labelIds = [],
        maxResults = 50,
        pageToken,
        includeSpamTrash = false,
      } = options;

      console.log('📡 Calling Gmail API - users.messages.list() with params:', {
        query,
        labelIds,
        maxResults,
        pageToken,
      });

      // Get message list
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        labelIds: labelIds.length > 0 ? labelIds : undefined,
        maxResults,
        pageToken,
        includeSpamTrash,
      });

      const messages = listResponse.data.messages || [];
      console.log('✅ Gmail list response:', messages.length, 'messages found');
      const emails: EmailData[] = [];

      // Get detailed message data in batches
      for (const message of messages) {
        if (message.id) {
          const emailData = await this.getEmailById(userId, message.id);
          if (emailData) {
            emails.push(emailData);
          }
        }
      }

      console.log('✅ Processed', emails.length, 'emails successfully');
      return {
        emails,
        nextPageToken: listResponse.data.nextPageToken || undefined,
      };
    } catch (error) {
      console.error('❌ Error getting emails:', error);
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          throw new Error('Gmail authentication failed. Please reconnect your account.');
        }
        if (error.message.includes('insufficient')) {
          throw new Error(
            'Insufficient permissions for Gmail. Please reconnect with Gmail access.'
          );
        }
        throw new Error(`Gmail API error: ${error.message}`);
      }
      throw new Error('Failed to get emails');
    }
  }

  /**
   * Get specific email by ID
   */
  async getEmailById(userId: string, messageId: string): Promise<EmailData | null> {
    try {
      const gmail = await this.getGmailClient(userId);
      if (!gmail) {
        return null;
      }

      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;
      if (!message) return null;

      return this.parseGmailMessage(message);
    } catch (error) {
      console.error('Error getting email by ID:', error);
      return null;
    }
  }

  /**
   * Parse Gmail message format into EmailData
   */
  private parseGmailMessage(message: gmail_v1.Schema$Message): EmailData | null {
    try {
      const headers = message.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      // Parse email addresses
      const parseEmailString = (emailStr: string) => {
        const matches = emailStr.match(/(.+?)?\s*<(.+?)>|(.+)/);
        if (matches) {
          return {
            email: matches[2] || matches[3] || emailStr,
            name: matches[1]?.trim() || undefined,
          };
        }
        return { email: emailStr };
      };

      const parseEmailList = (emailStr: string) => {
        return emailStr.split(',').map(email => parseEmailString(email.trim()));
      };

      // Extract body content
      const extractBody = (
        payload: gmail_v1.Schema$MessagePart
      ): { text?: string; html?: string } => {
        const body = { text: '', html: '' };

        const extractFromPart = (part: gmail_v1.Schema$MessagePart) => {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body.text += Buffer.from(part.body.data, 'base64').toString();
          } else if (part.mimeType === 'text/html' && part.body?.data) {
            body.html += Buffer.from(part.body.data, 'base64').toString();
          } else if (part.parts) {
            part.parts.forEach(extractFromPart);
          }
        };

        if (payload.parts) {
          payload.parts.forEach(extractFromPart);
        } else if (payload.body?.data) {
          if (payload.mimeType === 'text/plain') {
            body.text = Buffer.from(payload.body.data, 'base64').toString();
          } else if (payload.mimeType === 'text/html') {
            body.html = Buffer.from(payload.body.data, 'base64').toString();
          }
        }

        return {
          text: body.text || undefined,
          html: body.html || undefined,
        };
      };

      // Extract attachments
      const extractAttachments = (payload: gmail_v1.Schema$MessagePart): any[] => {
        const attachments: any[] = [];

        const extractFromPart = (part: gmail_v1.Schema$MessagePart) => {
          if (part.filename && part.body?.attachmentId) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType || 'application/octet-stream',
              size: part.body.size || 0,
              attachmentId: part.body.attachmentId,
            });
          }
          if (part.parts) {
            part.parts.forEach(extractFromPart);
          }
        };

        extractFromPart(payload);
        return attachments;
      };

      const body = extractBody(message.payload!);
      const attachments = extractAttachments(message.payload!);

      const emailData: EmailData = {
        id: message.id!,
        threadId: message.threadId!,
        labelIds: message.labelIds || [],
        subject: getHeader('Subject'),
        from: parseEmailString(getHeader('From')),
        to: parseEmailList(getHeader('To')),
        cc: getHeader('Cc') ? parseEmailList(getHeader('Cc')) : undefined,
        bcc: getHeader('Bcc') ? parseEmailList(getHeader('Bcc')) : undefined,
        bodyText: body.text,
        bodyHtml: body.html,
        attachments: attachments.length > 0 ? attachments : undefined,
        date: new Date(parseInt(message.internalDate!) || Date.now()),
        isRead: !message.labelIds?.includes('UNREAD'),
        isStarred: message.labelIds?.includes('STARRED') || false,
        importance: this.detectImportance(getHeader('Subject'), body.text || ''),
      };

      return emailData;
    } catch (error) {
      console.error('Error parsing Gmail message:', error);
      return null;
    }
  }

  /**
   * Detect email importance based on content
   */
  private detectImportance(subject: string, body: string): 'high' | 'normal' | 'low' {
    const urgentKeywords = [
      'urgent',
      'asap',
      'emergency',
      'critical',
      'immediate',
      'deadline',
      'important',
      'priority',
      'rush',
      'escalate',
    ];

    const lowKeywords = [
      'newsletter',
      'unsubscribe',
      'promotion',
      'marketing',
      'notification',
      'automated',
      'no-reply',
      'noreply',
    ];

    const text = (subject + ' ' + body).toLowerCase();

    for (const keyword of urgentKeywords) {
      if (text.includes(keyword)) {
        return 'high';
      }
    }

    for (const keyword of lowKeywords) {
      if (text.includes(keyword)) {
        return 'low';
      }
    }

    return 'normal';
  }

  /**
   * Analyze email content using AI
   */
  async analyzeEmail(emailData: EmailData): Promise<EmailAnalysis> {
    try {
      const content = emailData.bodyText || emailData.bodyHtml || '';
      const subject = emailData.subject;
      const fullText = `${subject}\n\n${content}`;

      // Sentiment analysis (simplified - in production, use ML API)
      const sentiment = this.analyzeSentiment(fullText);

      // Urgency detection
      const urgency = this.analyzeUrgency(fullText);

      // Category detection
      const category = this.categorizeEmail(subject, content);

      // Key topics extraction
      const keyTopics = this.extractKeyTopics(fullText);

      // Entity extraction
      const entities = this.extractEntities(fullText);

      // Meeting detection
      const meetingDetected = this.detectMeeting(fullText);

      return {
        sentiment,
        urgency,
        category,
        keyTopics,
        entities,
        meetingDetected,
      };
    } catch (error) {
      console.error('Error analyzing email:', error);
      // Return default analysis
      return {
        sentiment: 'neutral',
        urgency: 'normal',
        category: 'general',
        keyTopics: [],
        entities: [],
      };
    }
  }

  /**
   * Sentiment analysis (simplified implementation)
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = [
      'great',
      'excellent',
      'wonderful',
      'amazing',
      'fantastic',
      'good',
      'perfect',
      'love',
      'best',
      'awesome',
      'brilliant',
    ];

    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'horrible',
      'hate',
      'worst',
      'problem',
      'issue',
      'wrong',
      'error',
      'failed',
    ];

    const lowerText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of positiveWords) {
      const matches = lowerText.match(new RegExp(word, 'g'));
      if (matches) positiveScore += matches.length;
    }

    for (const word of negativeWords) {
      const matches = lowerText.match(new RegExp(word, 'g'));
      if (matches) negativeScore += matches.length;
    }

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * Urgency analysis
   */
  private analyzeUrgency(text: string): 'urgent' | 'normal' | 'low' {
    const urgentPatterns = [
      /urgent/i,
      /asap/i,
      /immediate/i,
      /emergency/i,
      /critical/i,
      /deadline.*today/i,
      /need.*now/i,
      /by end of day/i,
    ];

    const lowPatterns = [
      /newsletter/i,
      /unsubscribe/i,
      /promotion/i,
      /marketing/i,
      /automated/i,
      /no.?reply/i,
      /when you have time/i,
    ];

    for (const pattern of urgentPatterns) {
      if (pattern.test(text)) return 'urgent';
    }

    for (const pattern of lowPatterns) {
      if (pattern.test(text)) return 'low';
    }

    return 'normal';
  }

  /**
   * Email categorization
   */
  private categorizeEmail(subject: string, body: string): string {
    const categories = {
      meeting: ['meeting', 'call', 'conference', 'appointment', 'schedule'],
      support: ['support', 'help', 'issue', 'problem', 'bug', 'error'],
      business: ['proposal', 'contract', 'invoice', 'payment', 'business'],
      personal: ['personal', 'family', 'friend', 'vacation', 'holiday'],
      newsletter: ['newsletter', 'news', 'update', 'announcement', 'digest'],
      marketing: ['offer', 'sale', 'discount', 'promotion', 'deal'],
      notification: ['notification', 'alert', 'reminder', 'automated'],
    };

    const text = (subject + ' ' + body).toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return category;
        }
      }
    }

    return 'general';
  }

  /**
   * Extract key topics from email
   */
  private extractKeyTopics(text: string): string[] {
    // Simplified topic extraction
    const topicKeywords = [
      'project',
      'meeting',
      'deadline',
      'budget',
      'report',
      'client',
      'customer',
      'product',
      'service',
      'team',
      'schedule',
      'presentation',
      'document',
      'contract',
    ];

    const lowerText = text.toLowerCase();
    const foundTopics: string[] = [];

    for (const topic of topicKeywords) {
      if (lowerText.includes(topic)) {
        foundTopics.push(topic);
      }
    }

    return foundTopics.slice(0, 5); // Limit to top 5 topics
  }

  /**
   * Extract entities (simplified)
   */
  private extractEntities(
    text: string
  ): Array<{ type: string; value: string; confidence: number }> {
    const entities: Array<{ type: string; value: string; confidence: number }> = [];

    // Email pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (emails) {
      emails.forEach(email => {
        entities.push({ type: 'email', value: email, confidence: 0.9 });
      });
    }

    // Phone pattern
    const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phonePattern);
    if (phones) {
      phones.forEach(phone => {
        entities.push({ type: 'phone', value: phone, confidence: 0.8 });
      });
    }

    // Date pattern
    const datePattern = /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g;
    const dates = text.match(datePattern);
    if (dates) {
      dates.forEach(date => {
        entities.push({ type: 'date', value: date, confidence: 0.7 });
      });
    }

    return entities;
  }

  /**
   * Detect meeting information in email
   */
  private detectMeeting(text: string): EmailAnalysis['meetingDetected'] {
    const meetingKeywords = ['meeting', 'call', 'conference', 'appointment', 'schedule'];
    const hasDateTime =
      /\b\d{1,2}:\d{2}\s?(am|pm|AM|PM)\b/.test(text) ||
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(text);

    const hasMeetingKeyword = meetingKeywords.some(keyword => text.toLowerCase().includes(keyword));

    if (!hasMeetingKeyword) {
      return undefined;
    }

    // Extract potential meeting details
    const timeMatch = text.match(/\b(\d{1,2}):(\d{2})\s?(am|pm|AM|PM)\b/);
    const dateMatch = text.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    const locationMatch = text.match(/(?:at|in|location:?)\s+([^\n\r.]{1,50})/i);

    return {
      hasDateTime,
      suggestedEvent: hasMeetingKeyword
        ? {
            title: this.extractMeetingTitle(text),
            startTime: timeMatch ? this.parseMeetingTime(timeMatch[0], dateMatch?.[0]) : undefined,
            location: locationMatch?.[1]?.trim(),
            attendees: this.extractAttendees(text),
          }
        : undefined,
    };
  }

  /**
   * Extract meeting title from email
   */
  private extractMeetingTitle(text: string): string {
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim();

    if (firstLine && firstLine.length < 100) {
      return firstLine;
    }

    return 'Meeting from Email';
  }

  /**
   * Parse meeting time
   */
  private parseMeetingTime(timeStr: string, dayStr?: string): Date | undefined {
    try {
      const now = new Date();
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s?(am|pm|AM|PM)/);

      if (!timeMatch) return undefined;

      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const isPM = timeMatch[3].toLowerCase() === 'pm';

      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;

      const meetingDate = new Date(now);
      meetingDate.setHours(hours, minutes, 0, 0);

      // If time has passed today, assume it's for tomorrow
      if (meetingDate < now) {
        meetingDate.setDate(meetingDate.getDate() + 1);
      }

      return meetingDate;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Extract attendees from email
   */
  private extractAttendees(text: string): string[] {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern) || [];
    return emails.slice(0, 10); // Limit to 10 attendees
  }

  /**
   * Generate automated response
   */
  async generateAutoResponse(emailData: EmailData, analysis: EmailAnalysis): Promise<AutoResponse> {
    try {
      // Determine response type based on analysis
      let responseType: AutoResponse['type'] = 'acknowledgment';
      let shouldSend = false;
      let confidence = 0.7;

      if (analysis.meetingDetected?.hasDateTime) {
        responseType = 'meeting_confirmation';
        shouldSend = true;
        confidence = 0.8;
      } else if (analysis.urgency === 'urgent') {
        responseType = 'escalation';
        shouldSend = true;
        confidence = 0.9;
      } else if (analysis.category === 'support') {
        responseType = 'information';
        shouldSend = false; // Require manual review
        confidence = 0.6;
      }

      const content = this.generateResponseContent(emailData, analysis, responseType);
      const reasoning = this.generateResponseReasoning(analysis, responseType);

      return {
        type: responseType,
        content,
        confidence,
        shouldSend,
        reasoning,
      };
    } catch (error) {
      console.error('Error generating auto response:', error);
      return {
        type: 'acknowledgment',
        content: 'Thank you for your email. I will review it and get back to you soon.',
        confidence: 0.5,
        shouldSend: false,
        reasoning: 'Default response due to processing error',
      };
    }
  }

  /**
   * Generate response content based on type
   */
  private generateResponseContent(
    emailData: EmailData,
    analysis: EmailAnalysis,
    type: AutoResponse['type']
  ): string {
    const senderName = emailData.from.name || emailData.from.email.split('@')[0];

    switch (type) {
      case 'acknowledgment':
        return `Hi ${senderName},\n\nThank you for your email. I have received it and will review it shortly.\n\nBest regards,\nAI Assistant`;

      case 'meeting_confirmation':
        const meeting = analysis.meetingDetected?.suggestedEvent;
        return `Hi ${senderName},\n\nThank you for the meeting request. I've noted the following details:\n${meeting?.title ? `- Topic: ${meeting.title}\n` : ''}${meeting?.startTime ? `- Time: ${meeting.startTime.toLocaleString()}\n` : ''}${meeting?.location ? `- Location: ${meeting.location}\n` : ''}\nI'll send a calendar invitation shortly.\n\nBest regards,\nAI Assistant`;

      case 'information':
        return `Hi ${senderName},\n\nThank you for contacting us regarding ${analysis.keyTopics.join(', ')}. We will review your request and provide detailed information soon.\n\nBest regards,\nAI Assistant`;

      case 'escalation':
        return `Hi ${senderName},\n\nI've received your urgent message and have escalated it to the appropriate team. You can expect a response within 2 hours.\n\nBest regards,\nAI Assistant`;

      default:
        return `Hi ${senderName},\n\nThank you for your email. I will get back to you soon.\n\nBest regards,\nAI Assistant`;
    }
  }

  /**
   * Generate reasoning for response decision
   */
  private generateResponseReasoning(analysis: EmailAnalysis, type: AutoResponse['type']): string {
    const reasons = [];

    if (analysis.urgency === 'urgent') {
      reasons.push('Urgent priority detected');
    }

    if (analysis.meetingDetected?.hasDateTime) {
      reasons.push('Meeting request with time information');
    }

    if (analysis.sentiment === 'negative') {
      reasons.push('Negative sentiment requiring attention');
    }

    if (analysis.category === 'support') {
      reasons.push('Support request category');
    }

    return reasons.length > 0
      ? `Response type '${type}' selected because: ${reasons.join(', ')}`
      : `Standard ${type} response`;
  }

  /**
   * Send email reply
   */
  async sendReply(
    userId: string,
    originalEmailId: string,
    replyContent: string,
    subject?: string
  ): Promise<boolean> {
    try {
      const gmail = await this.getGmailClient(userId);
      if (!gmail) {
        throw new Error('Failed to authenticate with Gmail');
      }

      // Get original email for reply context
      const originalEmail = await this.getEmailById(userId, originalEmailId);
      if (!originalEmail) {
        throw new Error('Original email not found');
      }

      // Prepare reply
      const replySubject = subject || `Re: ${originalEmail.subject}`;
      const replyTo = originalEmail.from.email;

      const emailContent = [
        `To: ${replyTo}`,
        `Subject: ${replySubject}`,
        `In-Reply-To: ${originalEmailId}`,
        `References: ${originalEmailId}`,
        '',
        replyContent,
      ].join('\n');

      const encodedEmail = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
          threadId: originalEmail.threadId,
        },
      });

      return !!response.data.id;
    } catch (error) {
      console.error('Error sending reply:', error);
      return false;
    }
  }

  /**
   * Save email to database
   */
  async saveEmailToDatabase(
    userId: string,
    emailData: EmailData,
    analysis?: EmailAnalysis
  ): Promise<void> {
    try {
      const googleAccount = await prisma.googleAccount.findFirst({
        where: { userId, isActive: true },
      });

      if (!googleAccount) return;

      await prisma.googleEmail.upsert({
        where: { googleMessageId: emailData.id },
        create: {
          userId,
          googleAccountId: googleAccount.id,
          googleMessageId: emailData.id,
          threadId: emailData.threadId,
          labelIds: JSON.stringify(emailData.labelIds),
          subject: emailData.subject,
          fromEmail: emailData.from.email,
          fromName: emailData.from.name,
          toEmails: JSON.stringify(emailData.to),
          ccEmails: emailData.cc ? JSON.stringify(emailData.cc) : null,
          bccEmails: emailData.bcc ? JSON.stringify(emailData.bcc) : null,
          bodyText: emailData.bodyText,
          bodyHtml: emailData.bodyHtml,
          attachments: emailData.attachments ? JSON.stringify(emailData.attachments) : null,
          isRead: emailData.isRead,
          isStarred: emailData.isStarred,
          importance: emailData.importance,
          googleDate: emailData.date,
          aiProcessed: !!analysis,
          aiSentiment: analysis?.sentiment,
          aiUrgency: analysis?.urgency,
        },
        update: {
          subject: emailData.subject,
          isRead: emailData.isRead,
          isStarred: emailData.isStarred,
          importance: emailData.importance,
          lastSync: new Date(),
          aiProcessed: !!analysis,
          aiSentiment: analysis?.sentiment,
          aiUrgency: analysis?.urgency,
        },
      });
    } catch (error) {
      console.error('Error saving email to database:', error);
    }
  }
}
