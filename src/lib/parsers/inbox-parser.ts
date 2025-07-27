import { readFile } from 'fs/promises';

export class InboxParser {
  /**
   * Parse conversations from Inbox folder structure: inbox/ID/message_1.json
   * Each folder contains conversation data for different user IDs
   */
  static async parseInboxFolder(filePaths: string[], originalPaths: string[]): Promise<any[]> {
    const conversations: any[] = [];
    let validJsonCount = 0;
    let invalidFileCount = 0;

    console.log(`📁 Processing ${filePaths.length} files from inbox folder...`);

    // Group files by conversation ID (folder name)
    const conversationGroups: { [id: string]: { filePath: string; originalPath: string }[] } = {};

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const originalPath = originalPaths[i];

      // Skip non-JSON files
      if (!originalPath.toLowerCase().endsWith('.json')) {
        console.log(`⚠️ Skipping non-JSON file: ${originalPath}`);
        invalidFileCount++;
        continue;
      }

      // Extract conversation ID from path: inbox/ID/message_1.json (case insensitive)
      const pathParts = originalPath.split(/[\/\\]/); // Support both / and \ separators
      const inboxIndex = pathParts.findIndex(p => p.toLowerCase() === 'inbox');

      if (inboxIndex >= 0 && pathParts.length > inboxIndex + 2) {
        const conversationId = pathParts[inboxIndex + 1];
        if (!conversationGroups[conversationId]) {
          conversationGroups[conversationId] = [];
        }
        conversationGroups[conversationId].push({ filePath, originalPath });
      } else {
        console.warn(`⚠️ Invalid path structure (expected inbox/ID/file.json): ${originalPath}`);
        invalidFileCount++;
      }
    }

    console.log(`📊 Found ${Object.keys(conversationGroups).length} conversation groups`);

    // Process each conversation group
    for (const [conversationId, files] of Object.entries(conversationGroups)) {
      try {
        const conversationData: any = {
          participants: [],
          messages: [],
          title: `Conversation ${conversationId}`,
          is_still_participant: true,
          thread_type: 'Regular',
          thread_path: `inbox/${conversationId}`,
        };

        const participantSet = new Set<string>();

        console.log(`🔄 Processing conversation ${conversationId} with ${files.length} files`);

        // Read all JSON files for this conversation
        for (const { filePath, originalPath } of files) {
          try {
            // Try multiple encodings for Vietnamese text
            let fileContent: string;
            let data: any;

            try {
              // Try UTF-8 first
              fileContent = await readFile(filePath, 'utf-8');
              data = JSON.parse(fileContent);

              // Check if Vietnamese text is properly decoded
              const testText = JSON.stringify(data).substring(0, 200);
              if (testText.includes('Ã') || testText.includes('Æ')) {
                throw new Error('Encoding issue detected');
              }
            } catch (err) {
              console.log(`⚠️ UTF-8 encoding issue for ${originalPath}, trying latin1...`);
              try {
                const buffer = await readFile(filePath);
                fileContent = buffer.toString('latin1');
                data = JSON.parse(fileContent);
              } catch (err2) {
                console.log(`⚠️ Latin1 failed, trying buffer with encoding detection...`);
                const buffer = await readFile(filePath);
                // Try different encodings
                const encodings = ['utf8', 'ascii', 'utf16le'];
                for (const encoding of encodings) {
                  try {
                    fileContent = buffer.toString(encoding as BufferEncoding);
                    data = JSON.parse(fileContent);
                    break;
                  } catch (e) {
                    continue;
                  }
                }
                if (!data) {
                  throw new Error('Could not decode file with any encoding');
                }
              }
            }

            validJsonCount++;

            // Extract messages from Facebook Messenger format
            if (data.messages && Array.isArray(data.messages)) {
              // Filter and process messages
              const validMessages = data.messages.filter((msg: any) => {
                // Skip messages without content or with only media
                return (
                  msg.content &&
                  msg.content.trim().length > 0 &&
                  msg.content !== '[no content]' &&
                  !msg.content.startsWith('[')
                ); // Skip [Image], [File], etc.
              });

              // Add valid messages to conversation
              conversationData.messages.push(...validMessages);

              // Collect participants from all messages (including media ones)
              data.messages.forEach((msg: any) => {
                if (msg.sender_name) {
                  participantSet.add(msg.sender_name);
                }
              });

              console.log(
                `  📝 ${originalPath}: ${validMessages.length}/${data.messages.length} valid messages`
              );
            }

            // Extract participants if available in file
            if (data.participants && Array.isArray(data.participants)) {
              data.participants.forEach((p: any) => {
                if (p.name) participantSet.add(p.name);
              });
            }

            // Use title from file if available
            if (data.title) {
              conversationData.title = data.title;
            }
          } catch (error) {
            console.error(`❌ Error reading/parsing file ${filePath}:`, error);
            invalidFileCount++;
          }
        }

        // Convert participants set to array format
        conversationData.participants = Array.from(participantSet).map(name => ({ name }));

        if (conversationData.messages.length > 0) {
          // Sort messages by timestamp to ensure proper order across multiple files
          conversationData.messages.sort((a: any, b: any) => {
            const timeA = a.timestamp_ms || 0;
            const timeB = b.timestamp_ms || 0;
            return timeA - timeB;
          });

          // Remove duplicate messages (same timestamp and content)
          const uniqueMessages = conversationData.messages.filter(
            (msg: any, index: number, arr: any[]) => {
              return (
                index === 0 ||
                msg.timestamp_ms !== arr[index - 1].timestamp_ms ||
                msg.content !== arr[index - 1].content ||
                msg.sender_name !== arr[index - 1].sender_name
              );
            }
          );

          conversationData.messages = uniqueMessages;

          // Convert to FacebookParser compatible format
          const normalizedConversation = this.normalizeToFacebookFormat(
            conversationData,
            conversationId
          );
          conversations.push(normalizedConversation);
          console.log(
            `✅ Processed conversation ${conversationId}: ${conversationData.messages.length} messages (${files.length} files merged)`
          );
        } else {
          console.warn(
            `⚠️ No valid messages found for conversation ${conversationId} (${files.length} files checked)`
          );
        }
      } catch (error) {
        console.error(`❌ Error processing conversation ${conversationId}:`, error);
      }
    }

    console.log(`📊 Import Summary:`);
    console.log(`- Valid JSON files processed: ${validJsonCount}`);
    console.log(`- Invalid/skipped files: ${invalidFileCount}`);
    console.log(`- Total conversations extracted: ${conversations.length}`);
    console.log(
      `- Total messages: ${conversations.reduce((sum, c) => sum + c.messages.length, 0)}`
    );

    return conversations;
  }

  /**
   * Convert inbox conversation data to FacebookParser compatible format
   */
  private static normalizeToFacebookFormat(conversationData: any, conversationId: string): any {
    const messages = conversationData.messages.map((msg: any, index: number) => {
      // Determine sender type based on patterns
      const senderType = this.determineSenderType(msg.sender_name, msg.content || '');

      return {
        originalId: `${conversationId}_${index}`,
        senderId: this.generateSenderId(msg.sender_name),
        senderName: msg.sender_name,
        senderType,
        content: msg.content || '[No content]',
        messageType: msg.content ? 'text' : 'media',
        attachments: msg.photos || msg.files ? JSON.stringify(msg.photos || msg.files) : undefined,
        timestamp: new Date(msg.timestamp_ms || Date.now()),
      };
    });

    // Calculate conversation metadata
    const startTime = messages.length > 0 ? messages[0].timestamp : new Date();
    const endTime = messages.length > 0 ? messages[messages.length - 1].timestamp : new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes

    return {
      originalId: conversationId,
      platform: 'facebook',
      title: conversationData.title || `Conversation ${conversationId}`,
      participantCount: conversationData.participants.length,
      startTime,
      endTime,
      duration,
      messageCount: messages.length,
      messages,
    };
  }

  /**
   * Determine sender type based on name and content patterns
   */
  private static determineSenderType(
    senderName: string,
    content: string
  ): 'user' | 'business' | 'bot' {
    // Business/bot indicators
    const businessIndicators = [
      'shop',
      'store',
      'admin',
      'support',
      'service',
      'bot',
      'assistant',
      'cửa hàng',
      'hỗ trợ',
      'tư vấn',
      'bán hàng',
    ];

    const lowerName = senderName.toLowerCase();
    const lowerContent = content.toLowerCase();

    // Check if sender name indicates business
    if (businessIndicators.some(indicator => lowerName.includes(indicator))) {
      return 'business';
    }

    // Check if content indicates automated responses
    const autoResponseIndicators = [
      'cảm ơn bạn đã liên hệ',
      'chúng tôi sẽ phản hồi',
      'tin nhắn tự động',
      'thank you for contacting',
      'we will respond',
      'automated message',
    ];

    if (autoResponseIndicators.some(indicator => lowerContent.includes(indicator))) {
      return 'bot';
    }

    return 'user';
  }

  /**
   * Generate consistent sender ID from sender name
   */
  private static generateSenderId(senderName: string): string {
    return senderName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
}
