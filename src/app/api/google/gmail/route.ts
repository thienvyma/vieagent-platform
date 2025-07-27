import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GmailService } from '@/lib/google/gmail';

const gmailService = new GmailService();

// GET /api/google/gmail - Get emails with various actions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    switch (action) {
      case 'list':
        const query = searchParams.get('query') || '';
        const labelIds = searchParams.get('labelIds')?.split(',').filter(Boolean) || [];
        const maxResults = parseInt(searchParams.get('maxResults') || '20');
        const pageToken = searchParams.get('pageToken') || undefined;

        const { emails, nextPageToken } = await gmailService.getEmails(userId, {
          query,
          labelIds,
          maxResults,
          pageToken,
        });

        return NextResponse.json({
          success: true,
          data: {
            emails,
            nextPageToken,
          },
        });

      case 'get':
        const messageId = searchParams.get('messageId');
        if (!messageId) {
          return NextResponse.json(
            { success: false, error: 'Message ID required' },
            { status: 400 }
          );
        }

        const email = await gmailService.getEmailById(userId, messageId);
        if (!email) {
          return NextResponse.json({ success: false, error: 'Email not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: email,
        });

      case 'analyze':
        const analyzeMessageId = searchParams.get('messageId');
        if (!analyzeMessageId) {
          return NextResponse.json(
            { success: false, error: 'Message ID required' },
            { status: 400 }
          );
        }

        const emailToAnalyze = await gmailService.getEmailById(userId, analyzeMessageId);
        if (!emailToAnalyze) {
          return NextResponse.json({ success: false, error: 'Email not found' }, { status: 404 });
        }

        const analysis = await gmailService.analyzeEmail(emailToAnalyze);

        // Save analysis to database
        await gmailService.saveEmailToDatabase(userId, emailToAnalyze, analysis);

        return NextResponse.json({
          success: true,
          data: {
            email: emailToAnalyze,
            analysis,
          },
        });

      case 'auto-response':
        const responseMessageId = searchParams.get('messageId');
        if (!responseMessageId) {
          return NextResponse.json(
            { success: false, error: 'Message ID required' },
            { status: 400 }
          );
        }

        const emailForResponse = await gmailService.getEmailById(userId, responseMessageId);
        if (!emailForResponse) {
          return NextResponse.json({ success: false, error: 'Email not found' }, { status: 404 });
        }

        const emailAnalysis = await gmailService.analyzeEmail(emailForResponse);
        const autoResponse = await gmailService.generateAutoResponse(
          emailForResponse,
          emailAnalysis
        );

        return NextResponse.json({
          success: true,
          data: {
            email: emailForResponse,
            analysis: emailAnalysis,
            autoResponse,
          },
        });

      case 'labels':
        // This would get Gmail labels, for now return common ones
        const commonLabels = [
          { id: 'INBOX', name: 'Inbox' },
          { id: 'SENT', name: 'Sent' },
          { id: 'DRAFT', name: 'Drafts' },
          { id: 'SPAM', name: 'Spam' },
          { id: 'TRASH', name: 'Trash' },
          { id: 'IMPORTANT', name: 'Important' },
          { id: 'STARRED', name: 'Starred' },
          { id: 'UNREAD', name: 'Unread' },
        ];

        return NextResponse.json({
          success: true,
          data: commonLabels,
        });

      case 'stats':
        // Get email statistics
        const unreadEmails = await gmailService.getEmails(userId, {
          query: 'is:unread',
          maxResults: 1,
        });

        const importantEmails = await gmailService.getEmails(userId, {
          labelIds: ['IMPORTANT'],
          maxResults: 1,
        });

        const todayEmails = await gmailService.getEmails(userId, {
          query: 'newer_than:1d',
          maxResults: 100,
        });

        return NextResponse.json({
          success: true,
          data: {
            unreadCount: unreadEmails.emails.length,
            importantCount: importantEmails.emails.length,
            todayCount: todayEmails.emails.length,
            totalProcessed: 0, // Would track from database
          },
        });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in Gmail API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/google/gmail - Send emails and perform actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'send-reply':
        const { originalEmailId, replyContent, subject } = body;

        if (!originalEmailId || !replyContent) {
          return NextResponse.json(
            { success: false, error: 'Original email ID and reply content required' },
            { status: 400 }
          );
        }

        const sent = await gmailService.sendReply(userId, originalEmailId, replyContent, subject);

        if (!sent) {
          return NextResponse.json(
            { success: false, error: 'Failed to send reply' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Reply sent successfully',
        });

      case 'batch-analyze':
        const { messageIds } = body;

        if (!messageIds || !Array.isArray(messageIds)) {
          return NextResponse.json(
            { success: false, error: 'Message IDs array required' },
            { status: 400 }
          );
        }

        const batchResults = [];

        for (const messageId of messageIds.slice(0, 10)) {
          // Limit to 10 emails
          try {
            const email = await gmailService.getEmailById(userId, messageId);
            if (email) {
              const analysis = await gmailService.analyzeEmail(email);
              await gmailService.saveEmailToDatabase(userId, email, analysis);

              batchResults.push({
                messageId,
                success: true,
                analysis,
              });
            } else {
              batchResults.push({
                messageId,
                success: false,
                error: 'Email not found',
              });
            }
          } catch (error) {
            batchResults.push({
              messageId,
              success: false,
              error: error instanceof Error ? error.message : 'Analysis failed',
            });
          }
        }

        return NextResponse.json({
          success: true,
          data: batchResults,
        });

      case 'generate-responses':
        const { emailIds } = body;

        if (!emailIds || !Array.isArray(emailIds)) {
          return NextResponse.json(
            { success: false, error: 'Email IDs array required' },
            { status: 400 }
          );
        }

        const responseResults = [];

        for (const emailId of emailIds.slice(0, 5)) {
          // Limit to 5 emails
          try {
            const email = await gmailService.getEmailById(userId, emailId);
            if (email) {
              const analysis = await gmailService.analyzeEmail(email);
              const autoResponse = await gmailService.generateAutoResponse(email, analysis);

              responseResults.push({
                emailId,
                success: true,
                email,
                analysis,
                autoResponse,
              });
            } else {
              responseResults.push({
                emailId,
                success: false,
                error: 'Email not found',
              });
            }
          } catch (error) {
            responseResults.push({
              emailId,
              success: false,
              error: error instanceof Error ? error.message : 'Response generation failed',
            });
          }
        }

        return NextResponse.json({
          success: true,
          data: responseResults,
        });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in Gmail POST API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
