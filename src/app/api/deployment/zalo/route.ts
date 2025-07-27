import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Add GET method handler for consistency
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Zalo deployment configuration endpoint',
    availableAgents: [],
    platforms: ['zalo'],
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId, config } = await req.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
    }

    // Get agent data
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: session.user.id,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Ensure quickReplies is typed as string[]
    const quickReplies: string[] = config.quickReplies || [];

    // Generate Zalo Integration Code
    const integrationCode = generateZaloIntegration(agent, config);

    return NextResponse.json({
      success: true,
      integration: integrationCode,
      agent: {
        id: agent.id,
        name: agent.name,
      },
    });
  } catch (error) {
    console.error('Zalo integration error:', error);
    return NextResponse.json({ error: 'Failed to generate Zalo integration' }, { status: 500 });
  }
}

function generateZaloIntegration(agent: any, config: any) {
  const {
    oaId = 'YOUR_OA_ID',
    accessToken = 'YOUR_ACCESS_TOKEN',
    appId = 'YOUR_APP_ID',
    secretKey = 'YOUR_SECRET_KEY',
    greeting = `Xin chào! Tôi là ${agent.name}, trợ lý AI của bạn. Tôi có thể giúp gì cho bạn?`,
    quickReplies = ['Tôi cần hỗ trợ', 'Thông tin sản phẩm', 'Liên hệ tư vấn'],
    webhookUrl = 'https://your-domain.com/webhook/zalo',
    enableTemplateMessage = true,
    enableQuickReply = true,
    autoResponse = true,
  } = config || {};

  // Generate webhook secret
  const webhookSecret = `zalo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Zalo OA Bot Configuration
  const zaloConfig = `# Zalo Official Account Bot Configuration

## Bot Setup Information
- **Agent Name**: ${agent.name}
- **OA ID**: ${oaId}
- **Webhook URL**: ${webhookUrl}
- **App ID**: ${appId}

## Required Environment Variables
Add these to your .env file:

\`\`\`env
# Zalo OA Configuration
ZALO_OA_ID=${oaId}
ZALO_ACCESS_TOKEN=${accessToken}
ZALO_APP_ID=${appId}
ZALO_SECRET_KEY=${secretKey}
ZALO_WEBHOOK_SECRET=${webhookSecret}
\`\`\`

## Webhook Implementation (Node.js/Express)

\`\`\`javascript
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const app = express();

// Middleware
app.use(express.json());

// Webhook verification
app.get('/webhook/zalo', (req, res) => {
  console.log('Zalo webhook verification');
  res.status(200).send('OK');
});

// Webhook event handling
app.post('/webhook/zalo', async (req, res) => {
  try {
    const body = req.body;
    
    // Verify webhook signature
    const signature = req.get('x-zalo-signature');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.ZALO_SECRET_KEY)
      .update(JSON.stringify(body))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.sendStatus(403);
    }
    
    // Process events
    if (body.events && Array.isArray(body.events)) {
      for (const event of body.events) {
        await handleZaloEvent(event);
      }
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Zalo webhook error:', error);
    res.status(500).send('Error');
  }
});

// Handle Zalo events
async function handleZaloEvent(event) {
  const { event_name, sender, recipient, timestamp, message } = event;
  
  switch (event_name) {
    case 'user_send_text':
      await handleTextMessage(sender.id, message.text);
      break;
    case 'user_send_image':
      await handleImageMessage(sender.id, message);
      break;
    case 'user_send_file':
      await handleFileMessage(sender.id, message);
      break;
    case 'user_received_message':
      console.log('Message delivered to user');
      break;
    case 'user_seen_message':
      console.log('Message seen by user');
      break;
    default:
      console.log('Unknown event:', event_name);
  }
}

// Handle text messages
async function handleTextMessage(userId, messageText) {
  try {
    // Get user info
    const userInfo = await getUserInfo(userId);
    
    // Send to AI Agent
    const response = await fetch('${config.apiUrl || 'https://your-domain.com'}/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({
        message: messageText,
        agentId: '${agent.id}',
        platform: 'zalo',
        userId: userId,
        userInfo: userInfo
      })
    });
    
    const data = await response.json();
    
    // Send response to user
    ${
      enableQuickReply
        ? `
    await sendQuickReplyMessage(userId, data.response || 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn.', [
      ${quickReplies.map((reply: string) => `'${reply}'`).join(',\n      ')}
    ]);`
        : `
    await sendTextMessage(userId, data.response || 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn.');`
    }
    
  } catch (error) {
    console.error('Error handling text message:', error);
    await sendTextMessage(userId, 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.');
  }
}

// Handle image messages
async function handleImageMessage(userId, message) {
  const imageUrl = message.attachments[0].payload.url;
  
  // Process image if needed
  await sendTextMessage(userId, 'Cảm ơn bạn đã gửi hình ảnh. Tôi đã nhận được và sẽ xử lý.');
}

// Handle file messages
async function handleFileMessage(userId, message) {
  const fileUrl = message.attachments[0].payload.url;
  
  // Process file if needed
  await sendTextMessage(userId, 'Cảm ơn bạn đã gửi file. Tôi đã nhận được và sẽ xử lý.');
}

// Send text message
async function sendTextMessage(userId, text) {
  try {
    const response = await axios.post('https://openapi.zalo.me/v2.0/oa/message', {
      recipient: { user_id: userId },
      message: { text: text }
    }, {
      headers: {
        'access_token': process.env.ZALO_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending text message:', error);
    throw error;
  }
}

// Send quick reply message
async function sendQuickReplyMessage(userId, text, quickReplies) {
  try {
    const response = await axios.post('https://openapi.zalo.me/v2.0/oa/message', {
      recipient: { user_id: userId },
      message: {
        text: text,
        quick_replies: quickReplies.map((reply: string) => ({
          content_type: 'text',
          title: reply,
          payload: reply
        }))
      }
    }, {
      headers: {
        'access_token': process.env.ZALO_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending quick reply message:', error);
    throw error;
  }
}

// Send template message
async function sendTemplateMessage(userId, templateData) {
  try {
    const response = await axios.post('https://openapi.zalo.me/v2.0/oa/message', {
      recipient: { user_id: userId },
      message: {
        attachment: {
          type: 'template',
          payload: templateData
        }
      }
    }, {
      headers: {
        'access_token': process.env.ZALO_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending template message:', error);
    throw error;
  }
}

// Get user information
async function getUserInfo(userId) {
  try {
    const response = await axios.get(\`https://openapi.zalo.me/v2.0/oa/getprofile?data={\"user_id\":\"\${userId}\"}\`, {
      headers: {
        'access_token': process.env.ZALO_ACCESS_TOKEN
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

// Broadcast message to all followers
async function broadcastMessage(message) {
  try {
    const response = await axios.post('https://openapi.zalo.me/v2.0/oa/message/cs', {
      message: { text: message }
    }, {
      headers: {
        'access_token': process.env.ZALO_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error broadcasting message:', error);
    throw error;
  }
}

app.listen(3000, () => {
  console.log('Zalo OA Bot is running on port 3000');
});
\`\`\`
`;

  // Zalo OA Setup Commands
  const setupCommands = `# Zalo Official Account Setup Commands

## 1. Register Zalo OA
\`\`\`bash
# Visit: https://oa.zalo.me/
# Create Official Account
# Get OA ID and Access Token
\`\`\`

## 2. Set Webhook URL
\`\`\`bash
curl -X POST "https://openapi.zalo.me/v2.0/oa/updatewebhook" \\
  -H "access_token: ${accessToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "webhook": "${webhookUrl}"
  }'
\`\`\`

## 3. Set Greeting Message
\`\`\`bash
curl -X POST "https://openapi.zalo.me/v2.0/oa/message" \\
  -H "access_token: ${accessToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": {
      "text": "${greeting}"
    }
  }'
\`\`\`

## 4. Configure Auto Response${autoResponse ? '' : ' (Disabled)'}
${
  autoResponse
    ? `\`\`\`bash
curl -X POST "https://openapi.zalo.me/v2.0/oa/settings" \\
  -H "access_token: ${accessToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "auto_response": true,
    "greeting_text": "${greeting}",
    "quick_replies": [
      ${quickReplies.map((reply: string) => `"${reply}"`).join(',\n      ')}
    ]
  }'
\`\`\``
    : ''
}

## 5. Test Webhook Connection
\`\`\`bash
curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-zalo-signature: test" \\
  -d '{
    "events": [{
      "event_name": "user_send_text",
      "sender": {"id": "test_user"},
      "message": {"text": "Hello"}
    }]
  }'
\`\`\`

## 6. Set Menu Commands (Optional)
\`\`\`bash
curl -X POST "https://openapi.zalo.me/v2.0/oa/menu" \\
  -H "access_token: ${accessToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "menu": [
      {
        "type": "text",
        "title": "Hỗ trợ",
        "payload": "SUPPORT"
      },
      {
        "type": "text", 
        "title": "Sản phẩm",
        "payload": "PRODUCTS"
      },
      {
        "type": "url",
        "title": "Website", 
        "url": "https://your-website.com"
      }
    ]
  }'
\`\`\`
`;

  // Deployment Guide
  const deploymentGuide = `# Zalo OA Bot Deployment Guide

## Prerequisites
1. Zalo Official Account (verified)
2. Zalo Developer Account
3. App registered on Zalo Developer Console
4. SSL Certificate (HTTPS required for webhook)
5. Server with Node.js runtime

## Step-by-Step Setup

### 1. Create Zalo Official Account
1. Visit [Zalo OA](https://oa.zalo.me/)
2. Register business account
3. Complete verification process
4. Get OA ID from dashboard

### 2. Create Zalo App
1. Go to [Zalo Developers](https://developers.zalo.me/)
2. Create new app
3. Add Official Account API permission
4. Generate Access Token
5. Configure webhook URL

### 3. Deploy Bot Server
1. Set up Node.js server (Express recommended)
2. Install required dependencies:
   \`npm install express axios crypto\`
3. Configure environment variables
4. Deploy webhook endpoint
5. Test webhook connectivity

### 4. Configure OA Settings
1. Set greeting message
2. Configure auto-response
3. Set up quick replies
4. Create menu structure (optional)
5. Test bot interactions

### 5. Advanced Features

#### Template Messages
\`\`\`javascript
const template = {
  template_type: "generic",
  elements: [
    {
      title: "Sản phẩm ABC",
      subtitle: "Mô tả sản phẩm...",
      image_url: "https://example.com/image.jpg",
      buttons: [
        {
          type: "web_url",
          url: "https://example.com/product",
          title: "Xem chi tiết"
        }
      ]
    }
  ]
};

await sendTemplateMessage(userId, template);
\`\`\`

#### File Upload Support
\`\`\`javascript
async function handleFileUpload(userId, fileUrl) {
  // Download and process file
  const response = await axios.get(fileUrl);
  
  // Process based on file type
  // Send confirmation to user
  await sendTextMessage(userId, "File đã được xử lý thành công!");
}
\`\`\`

#### Broadcast Messaging
\`\`\`javascript
// Send message to all followers
await broadcastMessage("Thông báo quan trọng từ ${agent.name}!");

// Send to specific user segments
await sendToSegment("vip_customers", "Ưu đãi đặc biệt cho khách hàng VIP!");
\`\`\`

## Security Best Practices
- Always verify webhook signatures
- Use HTTPS for all endpoints
- Implement rate limiting
- Log all interactions for audit
- Regularly rotate access tokens
- Follow Zalo API guidelines

## Monitoring & Analytics
- Track message volumes and response times
- Monitor user engagement metrics
- Set up error alerting
- Analyze conversation flows
- Regular performance reviews

## Troubleshooting
- Check webhook URL accessibility
- Verify access token validity
- Review Zalo OA dashboard for errors
- Test with Zalo API testing tools
- Monitor server logs for issues

## Compliance
- Follow Vietnamese data protection laws
- Adhere to Zalo platform policies
- Respect user privacy settings
- Implement opt-out mechanisms
- Regular compliance audits
`;

  return {
    zaloConfig,
    setupCommands,
    deploymentGuide,
    config: {
      agentId: agent.id,
      agentName: agent.name,
      oaId,
      webhookUrl,
      webhookSecret,
      ...config,
    },
  };
}
