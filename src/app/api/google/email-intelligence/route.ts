import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmailIntelligenceService } from '@/lib/google/email-intelligence';
import { GmailService } from '@/lib/google/gmail';

const emailIntelligenceService = new EmailIntelligenceService();
const gmailService = new GmailService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'analyze_email':
        return await handleAnalyzeEmail(session.user.id, data);
      case 'analyze_batch':
        return await handleAnalyzeBatch(session.user.id, data);
      case 'get_insights':
        return await handleGetInsights(session.user.id, data);
      case 'get_analytics':
        return await handleGetAnalytics(session.user.id, data);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Error in email intelligence API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleAnalyzeEmail(userId: string, data: any) {
  try {
    const { emailId, config } = data;

    // Get email data first
    const emailData = await gmailService.getEmailById(userId, emailId);
    if (!emailData) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Analyze email with AI
    const insights = await emailIntelligenceService.analyzeEmailIntelligence(
      userId,
      emailData,
      config
    );

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('❌ Error analyzing email:', error);
    return NextResponse.json({ error: 'Failed to analyze email' }, { status: 500 });
  }
}

async function handleAnalyzeBatch(userId: string, data: any) {
  try {
    const { emailIds, config } = data;

    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json({ error: 'Email IDs array is required' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const emailId of emailIds) {
      try {
        const emailData = await gmailService.getEmailById(userId, emailId);
        if (emailData) {
          const insights = await emailIntelligenceService.analyzeEmailIntelligence(
            userId,
            emailData,
            config
          );
          results.push(insights);
        } else {
          errors.push({ emailId, error: 'Email not found' });
        }
      } catch (error) {
        errors.push({ emailId, error: 'Analysis failed' });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        errors,
        processed: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error('❌ Error in batch analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze emails' }, { status: 500 });
  }
}

async function handleGetInsights(userId: string, data: any) {
  try {
    const { emailId, startDate, endDate, category, sentiment } = data;

    // This would query the database for stored insights
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      data: {
        message: 'Email insights retrieval not yet implemented',
        filters: { emailId, startDate, endDate, category, sentiment },
      },
    });
  } catch (error) {
    console.error('❌ Error getting insights:', error);
    return NextResponse.json({ error: 'Failed to get insights' }, { status: 500 });
  }
}

async function handleGetAnalytics(userId: string, data: any) {
  try {
    const analytics = await emailIntelligenceService.getEmailAnalytics(
      userId,
      data.startDate ? new Date(data.startDate) : undefined,
      data.endDate ? new Date(data.endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('❌ Error getting email analytics:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'analytics':
        return await handleGetAnalytics(session.user.id, {
          startDate: url.searchParams.get('startDate'),
          endDate: url.searchParams.get('endDate'),
        });
      case 'insights':
        return await handleGetInsights(session.user.id, {
          emailId: url.searchParams.get('emailId'),
          startDate: url.searchParams.get('startDate'),
          endDate: url.searchParams.get('endDate'),
          category: url.searchParams.get('category'),
          sentiment: url.searchParams.get('sentiment'),
        });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Error in email intelligence GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
