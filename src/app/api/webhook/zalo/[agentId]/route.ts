import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/webhook/zalo/[agentId]
 * Zalo webhook verification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { agentId } = params;
    
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

    // Find Zalo connection for this agent
    const connection = await prisma.platformConnection.findFirst({
      where: {
        platform: 'ZALO',
        agentId: agentId,
        isActive: true
      }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Zalo connection not found' }, { status: 404 });
    }

    console.log(`✅ Zalo webhook verification for agent ${agentId}`);
    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error('Zalo webhook verification error:', error);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 500 });
  }
}

/**
 * POST /api/webhook/zalo/[agentId]
 * Handle incoming Zalo OA messages
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { agentId } = params;
    const body = await request.text();
    const signature = request.headers.get('x-zalo-signature');

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

    // Find Zalo connection
    const connection = await prisma.platformConnection.findFirst({
      where: {
        platform: 'ZALO',
        agentId: agentId,
        isActive: true
      }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Zalo connection not found' }, { status: 404 });
    }

    // Verify webhook signature if secret is configured
    const secretKey = process.env.ZALO_SECRET_KEY;
    if (secretKey && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid Zalo webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    // Parse webhook data
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON in Zalo webhook body:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Process webhook events
    if (webhookData.events && Array.isArray(webhookData.events)) {
      for (const event of webhookData.events) {
        await handleZaloEvent(event, agent, connection);
      }

      // Update last sync time
      await prisma.platformConnection.update({
        where: { id: connection.id },
        data: { lastSync: new Date() }
      });

      return NextResponse.json({ status: 'OK' });
    }

    return NextResponse.json({ status: 'IGNORED' });
  } catch (error) {
    console.error('Zalo webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Handle Zalo events and send to AI agent
 */
async function handleZaloEvent(event: any, agent: any, connection: any) {
  const { event_name, sender, recipient, timestamp, message } = event;
  
  console.log(`📱 Processing Zalo event: ${event_name} for agent ${agent.id}`);

  switch (event_name) {
    case 'user_send_text':
      await handleTextMessage(sender.id, message.text, agent, connection);
      break;
    case 'user_send_image':
      await handleImageMessage(sender.id, message, agent, connection);
      break;
    case 'user_send_file':
      await handleFileMessage(sender.id, message, agent, connection);
      break;
    case 'user_received_message':
      console.log('Message delivered to user');
      break;
    case 'user_seen_message':
      console.log('Message seen by user');
      break;
    default:
      console.log('Unknown Zalo event:', event_name);
  }
}

/**
 * Handle text messages from Zalo users
 */
async function handleTextMessage(userId: string, messageText: string, agent: any, connection: any) {
  try {
    // Get user info
    const userInfo = await getUserInfo(userId, connection.accessToken);
    
    // Send message to AI Agent
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/agents/${agent.id}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: messageText,
        platform: 'zalo',
        userId: userId,
        userInfo: userInfo,
        conversationId: `zalo_${userId}_${agent.id}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Agent response failed: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    
    // Send response back to user via Zalo
    if (aiResponse.message) {
      await sendZaloMessage(userId, aiResponse.message, connection.accessToken);
    }

    console.log(`✅ Processed Zalo message for user ${userId}`);
  } catch (error) {
    console.error('Error handling Zalo text message:', error);
    
    // Send error message to user
    await sendZaloMessage(
      userId, 
      'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau.',
      connection.accessToken
    );
  }
}

/**
 * Handle image messages from Zalo users
 */
async function handleImageMessage(userId: string, message: any, agent: any, connection: any) {
  try {
    // Download image and process
    const imageUrl = message.attachment?.payload?.url;
    if (imageUrl) {
      // Send image URL to AI agent for processing
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/agents/${agent.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'User sent an image',
          imageUrl: imageUrl,
          platform: 'zalo',
          userId: userId,
          conversationId: `zalo_${userId}_${agent.id}`,
        }),
      });

      const aiResponse = await response.json();
      
      if (aiResponse.message) {
        await sendZaloMessage(userId, aiResponse.message, connection.accessToken);
      }
    } else {
      await sendZaloMessage(userId, 'Tôi đã nhận được hình ảnh của bạn.', connection.accessToken);
    }
  } catch (error) {
    console.error('Error handling Zalo image message:', error);
    await sendZaloMessage(userId, 'Không thể xử lý hình ảnh. Vui lòng thử lại.', connection.accessToken);
  }
}

/**
 * Handle file messages from Zalo users
 */
async function handleFileMessage(userId: string, message: any, agent: any, connection: any) {
  try {
    const fileName = message.attachment?.payload?.name || 'file';
    await sendZaloMessage(
      userId, 
      `Tôi đã nhận được file "${fileName}". Hiện tại tôi chưa thể xử lý file, vui lòng gửi tin nhắn văn bản.`,
      connection.accessToken
    );
  } catch (error) {
    console.error('Error handling Zalo file message:', error);
  }
}

/**
 * Get Zalo user info
 */
async function getUserInfo(userId: string, accessToken: string) {
  try {
    const response = await fetch(
      `https://openapi.zalo.me/v2.0/oa/getprofile?access_token=${accessToken}&user_id=${userId}`
    );
    const data = await response.json();
    
    if (data.error === 0) {
      return {
        id: userId,
        name: data.data?.display_name || 'Zalo User',
        avatar: data.data?.avatar,
        platform: 'zalo'
      };
    }
  } catch (error) {
    console.error('Error getting Zalo user info:', error);
  }
  
  return {
    id: userId,
    name: 'Zalo User',
    platform: 'zalo'
  };
}

/**
 * Send message to Zalo user
 */
async function sendZaloMessage(userId: string, messageText: string, accessToken: string) {
  try {
    const response = await fetch(
      `https://openapi.zalo.me/v2.0/oa/message?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: {
            user_id: userId,
          },
          message: {
            text: messageText,
          },
        }),
      }
    );

    const result = await response.json();
    
    if (result.error !== 0) {
      console.error('Failed to send Zalo message:', result);
    }
  } catch (error) {
    console.error('Error sending Zalo message:', error);
  }
} 