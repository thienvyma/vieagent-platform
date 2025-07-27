import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { FacebookIntegration } from '@/lib/platforms/FacebookIntegration';

/**
 * GET /api/webhook/facebook/[agentId]
 * Facebook webhook verification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { agentId } = params;
    const searchParams = request.nextUrl.searchParams;
    
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Find agent and connection
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        user: true
      }
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Find Facebook connection for this agent
    const connection = await prisma.platformConnection.findFirst({
      where: {
        platform: 'FACEBOOK',
        agentId: agentId,
        isActive: true
      }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Facebook connection not found' }, { status: 404 });
    }

    // Get verify token from metadata
    let metadata;
    try {
      metadata = connection.metadata ? JSON.parse(connection.metadata) : {};
    } catch (error) {
      console.error('Error parsing connection metadata:', error);
      return NextResponse.json({ error: 'Invalid connection metadata' }, { status: 500 });
    }

    const verifyToken = metadata.verifyToken || process.env.FACEBOOK_VERIFY_TOKEN;

    if (mode && token) {
      if (mode === 'subscribe' && token === verifyToken) {
        console.log(`✅ Facebook webhook verified for agent ${agentId}`);
        return new NextResponse(challenge, { status: 200 });
      } else {
        console.error(`❌ Facebook webhook verification failed for agent ${agentId}`);
        return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Missing verification parameters' }, { status: 400 });
  } catch (error) {
    console.error('Facebook webhook verification error:', error);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 500 });
  }
}

/**
 * POST /api/webhook/facebook/[agentId]
 * Handle incoming Facebook messages
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { agentId } = params;
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Find agent and connection
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        user: true
      }
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Find Facebook connection
    const connection = await prisma.platformConnection.findFirst({
      where: {
        platform: 'FACEBOOK',
        agentId: agentId,
        isActive: true
      }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Facebook connection not found' }, { status: 404 });
    }

    // Verify webhook signature
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appSecret) {
      console.error('Facebook App Secret not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(body)
      .digest('hex');

    if (signature !== `sha256=${expectedSignature}`) {
      console.error('Invalid Facebook webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Parse webhook data
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON in webhook body:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Process webhook events
    if (webhookData.object === 'page') {
      const facebookIntegration = new FacebookIntegration(agent, connection);
      
      for (const entry of webhookData.entry) {
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            await facebookIntegration.handleMessage(messagingEvent);
          }
        }
      }

      // Update last sync time
      await prisma.platformConnection.update({
        where: { id: connection.id },
        data: { lastSync: new Date() }
      });

      return NextResponse.json({ status: 'EVENT_RECEIVED' });
    }

    return NextResponse.json({ status: 'IGNORED' });
  } catch (error) {
    console.error('Facebook webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 