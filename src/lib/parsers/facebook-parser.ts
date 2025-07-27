interface FacebookMessage {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  type?: string;
  photos?: Array<{
    uri: string;
    creation_timestamp: number;
  }>;
  files?: Array<{
    uri: string;
    creation_timestamp: number;
  }>;
  sticker?: {
    uri: string;
  };
  reactions?: Array<{
    reaction: string;
    actor: string;
  }>;
}

interface FacebookConversation {
  participants: Array<{
    name: string;
  }>;
  messages: FacebookMessage[];
  title?: string;
  is_still_participant: boolean;
  thread_type: string;
  thread_path: string;
}

interface ParsedConversation {
  originalId: string;
  platform: string;
  title?: string;
  participantCount: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  messageCount: number;
  messages: ParsedMessage[];
}

interface ParsedMessage {
  originalId: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'business' | 'bot';
  content: string;
  messageType: 'text' | 'image' | 'file' | 'sticker';
  attachments?: string;
  timestamp: Date;
}

export class FacebookParser {
  private static readonly SUPPORTED_FORMATS = ['.json', '.zip'];

  static getSupportedFormats(): string[] {
    return this.SUPPORTED_FORMATS;
  }

  /**
   * Parse Facebook Messenger export JSON
   */
  static async parseConversation(data: any): Promise<ParsedConversation[]> {
    try {
      // Handle single conversation or array of conversations
      const conversations = Array.isArray(data) ? data : [data];
      const results: ParsedConversation[] = [];

      for (const conv of conversations) {
        if (!this.isValidFacebookConversation(conv)) {
          console.warn('Invalid Facebook conversation format:', conv);
          continue;
        }

        const parsed = this.parseIndividualConversation(conv);
        if (parsed) {
          results.push(parsed);
        }
      }

      return results;
    } catch (error) {
      console.error('Error parsing Facebook conversation:', error);
      throw new Error('Failed to parse Facebook conversation data');
    }
  }

  private static isValidFacebookConversation(data: any): data is FacebookConversation {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.participants) &&
      Array.isArray(data.messages) &&
      data.participants.length > 0
    );
  }

  private static parseIndividualConversation(
    conv: FacebookConversation
  ): ParsedConversation | null {
    try {
      const messages = this.parseMessages(conv.messages);

      if (messages.length === 0) {
        return null;
      }

      // Sort messages by timestamp
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const startTime = messages[0]?.timestamp;
      const endTime = messages[messages.length - 1]?.timestamp;
      const duration =
        startTime && endTime
          ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) // minutes
          : undefined;

      // Generate conversation ID from thread path or participants
      const originalId = conv.thread_path || this.generateConversationId(conv.participants);

      return {
        originalId,
        platform: 'facebook',
        title: conv.title || this.generateConversationTitle(conv.participants),
        participantCount: conv.participants.length,
        startTime,
        endTime,
        duration,
        messageCount: messages.length,
        messages,
      };
    } catch (error) {
      console.error('Error parsing individual conversation:', error);
      return null;
    }
  }

  private static parseMessages(messages: FacebookMessage[]): ParsedMessage[] {
    const parsed: ParsedMessage[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      try {
        const parsedMessage = this.parseIndividualMessage(msg, i);
        if (parsedMessage) {
          parsed.push(parsedMessage);
        }
      } catch (error) {
        console.error('Error parsing message:', error, msg);
        // Continue with other messages
      }
    }

    return parsed;
  }

  private static parseIndividualMessage(msg: FacebookMessage, index: number): ParsedMessage | null {
    if (!msg.sender_name || !msg.timestamp_ms) {
      return null;
    }

    // Determine message type and content
    let content = '';
    let messageType: 'text' | 'image' | 'file' | 'sticker' = 'text';
    let attachments: any[] = [];

    if (msg.content) {
      content = this.decodeFacebookText(msg.content);
      messageType = 'text';
    } else if (msg.photos && msg.photos.length > 0) {
      content = '[Image]';
      messageType = 'image';
      attachments = msg.photos.map(photo => ({
        type: 'image',
        uri: photo.uri,
        timestamp: photo.creation_timestamp,
      }));
    } else if (msg.files && msg.files.length > 0) {
      content = '[File]';
      messageType = 'file';
      attachments = msg.files.map(file => ({
        type: 'file',
        uri: file.uri,
        timestamp: file.creation_timestamp,
      }));
    } else if (msg.sticker) {
      content = '[Sticker]';
      messageType = 'sticker';
      attachments = [
        {
          type: 'sticker',
          uri: msg.sticker.uri,
        },
      ];
    } else {
      // Skip messages without content
      return null;
    }

    // Determine sender type (basic heuristics)
    const senderType = this.determineSenderType(msg.sender_name, content);

    return {
      originalId: `msg_${index}_${msg.timestamp_ms}`,
      senderId: this.generateSenderId(msg.sender_name),
      senderName: this.decodeFacebookText(msg.sender_name),
      senderType,
      content,
      messageType,
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : undefined,
      timestamp: new Date(msg.timestamp_ms),
    };
  }

  /**
   * Decode Facebook's UTF-8 encoding issues
   */
  private static decodeFacebookText(text: string): string {
    try {
      // Facebook exports often have encoding issues
      // This attempts to fix common problems
      return text
        .replace(/\\u00([0-9a-f]{2})/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/â€™/g, "'")
        .replace(/â€œ/g, '"')
        .replace(/â€/g, '"')
        .replace(/Ã¡/g, 'á')
        .replace(/Ã©/g, 'é')
        .replace(/Ã­/g, 'í')
        .replace(/Ã³/g, 'ó')
        .replace(/Ãº/g, 'ú')
        .replace(/Ä'/, 'đ')
        .trim();
    } catch (error) {
      console.warn('Error decoding Facebook text:', error);
      return text;
    }
  }

  /**
   * Determine if sender is user, business, or bot
   */
  private static determineSenderType(
    senderName: string,
    content: string
  ): 'user' | 'business' | 'bot' {
    const name = senderName.toLowerCase();
    const text = content.toLowerCase();

    // Business patterns
    if (
      name.includes('support') ||
      name.includes('customer') ||
      name.includes('agent') ||
      name.includes('team') ||
      text.includes('thank you for contacting') ||
      text.includes('how can we help') ||
      text.match(/ticket #\d+/) ||
      text.includes('business hours')
    ) {
      return 'business';
    }

    // Bot patterns
    if (
      name.includes('bot') ||
      name.includes('auto') ||
      text.includes('automated') ||
      text.includes('this is an automated') ||
      text.match(/option \d+/) ||
      text.includes('press 1 for')
    ) {
      return 'bot';
    }

    return 'user';
  }

  private static generateConversationId(participants: Array<{ name: string }>): string {
    const names = participants
      .map(p => p.name)
      .sort()
      .join('_');
    return `conv_${Buffer.from(names).toString('base64').slice(0, 16)}`;
  }

  private static generateConversationTitle(participants: Array<{ name: string }>): string {
    if (participants.length <= 2) {
      return participants.map(p => this.decodeFacebookText(p.name)).join(' & ');
    }

    return `Group conversation (${participants.length} participants)`;
  }

  private static generateSenderId(senderName: string): string {
    return `sender_${Buffer.from(senderName).toString('base64').slice(0, 12)}`;
  }

  /**
   * Extract conversation context and summary
   */
  static extractContext(conversation: ParsedConversation): {
    summary: string;
    topics: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    category: string;
  } {
    const messages = conversation.messages;
    const allText = messages.map(m => m.content).join(' ');

    // Basic sentiment analysis (simple keyword-based)
    const sentiment = this.analyzeSentiment(allText);

    // Extract topics (simple keyword extraction)
    const topics = this.extractTopics(allText);

    // Categorize conversation
    const category = this.categorizeConversation(allText, topics);

    // Generate summary
    const summary = this.generateSummary(messages);

    return {
      summary,
      topics,
      sentiment,
      category,
    };
  }

  private static analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();

    const positiveWords = [
      'good',
      'great',
      'excellent',
      'amazing',
      'love',
      'perfect',
      'satisfied',
      'happy',
      'thank',
      'awesome',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'hate',
      'disappointed',
      'angry',
      'frustrated',
      'problem',
      'issue',
      'complaint',
    ];

    const positiveCount = positiveWords.reduce(
      (count, word) => count + (lowerText.match(new RegExp(word, 'g')) || []).length,
      0
    );

    const negativeCount = negativeWords.reduce(
      (count, word) => count + (lowerText.match(new RegExp(word, 'g')) || []).length,
      0
    );

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static extractTopics(text: string): string[] {
    const topicKeywords = {
      product: ['product', 'item', 'buy', 'purchase', 'price', 'cost'],
      support: ['help', 'support', 'problem', 'issue', 'question'],
      shipping: ['delivery', 'shipping', 'ship', 'arrive', 'tracking'],
      payment: ['payment', 'pay', 'credit', 'charge', 'refund', 'money'],
      account: ['account', 'login', 'password', 'profile', 'setting'],
      service: ['service', 'experience', 'staff', 'team', 'representative'],
    };

    const lowerText = text.toLowerCase();
    const topics: string[] = [];

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const mentions = keywords.reduce(
        (count, keyword) => count + (lowerText.match(new RegExp(keyword, 'g')) || []).length,
        0
      );

      if (mentions >= 2) {
        topics.push(topic);
      }
    }

    return topics.length > 0 ? topics : ['general'];
  }

  private static categorizeConversation(text: string, topics: string[]): string {
    if (topics.includes('support') || topics.includes('problem')) {
      return 'Customer Support';
    }

    if (topics.includes('product') || topics.includes('payment')) {
      return 'Sales Inquiry';
    }

    if (topics.includes('shipping')) {
      return 'Order Support';
    }

    return 'General Inquiry';
  }

  private static generateSummary(messages: ParsedMessage[]): string {
    if (messages.length === 0) return 'Empty conversation';

    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const duration = Math.round(
      (lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime()) / (1000 * 60)
    );

    const senders = [...new Set(messages.map(m => m.senderName))];
    const businessMessages = messages.filter(m => m.senderType === 'business').length;
    const userMessages = messages.filter(m => m.senderType === 'user').length;

    return (
      `Conversation between ${senders.join(', ')} lasting ${duration} minutes. ` +
      `${messages.length} total messages (${userMessages} from users, ${businessMessages} from business).`
    );
  }
}
