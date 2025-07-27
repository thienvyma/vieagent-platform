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
    message: 'Facebook deployment configuration endpoint',
    availableAgents: [],
    platforms: ['facebook'],
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

    // Generate Facebook Integration Code
    const integrationCode = generateFacebookIntegration(agent, config);

    return NextResponse.json({
      success: true,
      integration: integrationCode,
      agent: {
        id: agent.id,
        name: agent.name,
      },
    });
  } catch (error) {
    console.error('Facebook integration error:', error);
    return NextResponse.json({ error: 'Failed to generate Facebook integration' }, { status: 500 });
  }
}

function generateFacebookIntegration(agent: any, config: any) {
  const {
    pageId = 'YOUR_PAGE_ID',
    pageAccessToken = 'YOUR_PAGE_ACCESS_TOKEN',
    appSecret = 'YOUR_APP_SECRET',
    verifyToken = 'YOUR_VERIFY_TOKEN',
    greeting = `Hi! I'm ${agent.name}, your AI assistant. How can I help you today?`,
    persistentMenu = true,
    getStartedButton = true,
    iceBreakers = ['What can you help me with?', 'Show me your services', 'Contact information'],
    webhookUrl = 'https://your-domain.com/webhook/facebook',
    enableTypingIndicator = true,
    enableSeenReceipt = true,
  } = config || {};

  // Generate webhook secret
  const webhookSecret = `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Messenger Bot Configuration
  const messengerConfig = `# Facebook Messenger Bot Configuration

## Bot Setup Information
- **Agent Name**: ${agent.name}
- **Page ID**: ${pageId}
- **Webhook URL**: ${webhookUrl}
- **Verify Token**: ${verifyToken}

## Required Environment Variables
Add these to your .env file:

\`\`\`env
# Facebook Messenger Configuration
FACEBOOK_PAGE_ID=${pageId}
FACEBOOK_PAGE_ACCESS_TOKEN=${pageAccessToken}
FACEBOOK_APP_SECRET=${appSecret}
FACEBOOK_VERIFY_TOKEN=${verifyToken}
FACEBOOK_WEBHOOK_SECRET=${webhookSecret}
\`\`\`

## Webhook Verification Code (Node.js/Express)

\`\`\`javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

// Webhook verification
app.get('/webhook/facebook', (req, res) => {
  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Webhook event handling
app.post('/webhook/facebook', (req, res) => {
  const body = req.body;
  
  // Verify webhook signature
  const signature = req.get('x-hub-signature-256');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FACEBOOK_APP_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
    
  if (signature !== \`sha256=\${expectedSignature}\`) {
    return res.sendStatus(403);
  }
  
  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      
      if (webhookEvent.message) {
        handleMessage(webhookEvent);
      } else if (webhookEvent.postback) {
        handlePostback(webhookEvent);
      }
    });
    
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Handle incoming messages
async function handleMessage(event) {
  const senderId = event.sender.id;
  const message = event.message;
  
  // Mark as seen
  if (${enableSeenReceipt}) {
    await markSeen(senderId);
  }
  
  // Show typing indicator
  if (${enableTypingIndicator}) {
    await typingOn(senderId);
  }
  
  try {
    // Send message to AI Agent
    const response = await fetch('${config.apiUrl || 'https://your-domain.com'}/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({
        message: message.text,
        agentId: '${agent.id}',
        platform: 'facebook',
        userId: senderId
      })
    });
    
    const data = await response.json();
    
    // Send response back to user
    await sendMessage(senderId, data.response || 'Sorry, I could not process your request.');
    
  } catch (error) {
    console.error('Error processing message:', error);
    await sendMessage(senderId, 'Sorry, there was an error. Please try again.');
  } finally {
    if (${enableTypingIndicator}) {
      await typingOff(senderId);
    }
  }
}

// Handle postback events (button clicks)
async function handlePostback(event) {
  const senderId = event.sender.id;
  const postback = event.postback;
  
  let responseText = '';
  
  switch (postback.payload) {
    case 'GET_STARTED':
      responseText = '${greeting}';
      break;
    case 'HELP':
      responseText = 'I can help you with various questions. Just ask me anything!';
      break;
    default:
      responseText = 'Thanks for your message!';
  }
  
  await sendMessage(senderId, responseText);
}

// Send message to user
async function sendMessage(recipientId, messageText) {
  const requestBody = {
    recipient: { id: recipientId },
    message: { text: messageText }
  };
  
  try {
    await fetch(\`https://graph.facebook.com/v18.0/me/messages?access_token=\${process.env.FACEBOOK_PAGE_ACCESS_TOKEN}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Utility functions
async function markSeen(recipientId) {
  await fetch(\`https://graph.facebook.com/v18.0/me/messages?access_token=\${process.env.FACEBOOK_PAGE_ACCESS_TOKEN}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      sender_action: 'mark_seen'
    })
  });
}

async function typingOn(recipientId) {
  await fetch(\`https://graph.facebook.com/v18.0/me/messages?access_token=\${process.env.FACEBOOK_PAGE_ACCESS_TOKEN}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      sender_action: 'typing_on'
    })
  });
}

async function typingOff(recipientId) {
  await fetch(\`https://graph.facebook.com/v18.0/me/messages?access_token=\${process.env.FACEBOOK_PAGE_ACCESS_TOKEN}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      sender_action: 'typing_off'
    })
  });
}

app.listen(3000, () => {
  console.log('Facebook Messenger Bot is running on port 3000');
});
\`\`\`
`;

  // Messenger Platform Setup Commands
  const setupCommands = `# Facebook Messenger Platform Setup Commands

## 1. Set Webhook URL
\`\`\`bash
curl -X POST "https://graph.facebook.com/v18.0/me/subscribed_apps" \\
  -H "Content-Type: application/json" \\
  -d '{
    "subscribed_fields": ["messages", "messaging_postbacks", "messaging_optins"]
  }' \\
  "https://graph.facebook.com/v18.0/me/subscribed_apps?access_token=${pageAccessToken}"
\`\`\`

## 2. Set Get Started Button${getStartedButton ? '' : ' (Disabled)'}
${
  getStartedButton
    ? `\`\`\`bash
curl -X POST "https://graph.facebook.com/v18.0/me/messenger_profile" \\
  -H "Content-Type: application/json" \\
  -d '{
    "get_started": {
      "payload": "GET_STARTED"
    }
  }' \\
  "https://graph.facebook.com/v18.0/me/messenger_profile?access_token=${pageAccessToken}"
\`\`\``
    : ''
}

## 3. Set Greeting Text
\`\`\`bash
curl -X POST "https://graph.facebook.com/v18.0/me/messenger_profile" \\
  -H "Content-Type: application/json" \\
  -d '{
    "greeting": [
      {
        "locale": "default",
        "text": "${greeting}"
      }
    ]
  }' \\
  "https://graph.facebook.com/v18.0/me/messenger_profile?access_token=${pageAccessToken}"
\`\`\`

## 4. Set Persistent Menu${persistentMenu ? '' : ' (Disabled)'}
${
  persistentMenu
    ? `\`\`\`bash
curl -X POST "https://graph.facebook.com/v18.0/me/messenger_profile" \\
  -H "Content-Type: application/json" \\
  -d '{
    "persistent_menu": [
      {
        "locale": "default",
        "composer_input_disabled": false,
        "call_to_actions": [
          {
            "type": "postback",
            "title": "Help",
            "payload": "HELP"
          },
          {
            "type": "web_url",
            "title": "Visit Website",
            "url": "https://your-website.com"
          }
        ]
      }
    ]
  }' \\
  "https://graph.facebook.com/v18.0/me/messenger_profile?access_token=${pageAccessToken}"
\`\`\``
    : ''
}

## 5. Set Ice Breaker Questions
\`\`\`bash
curl -X POST "https://graph.facebook.com/v18.0/me/messenger_profile" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ice_breakers": [
      ${iceBreakers
        .map(
          (q: string) => `{
        "question": "${q}",
        "payload": "ICE_BREAKER_${q.replace(/\s+/g, '_').toUpperCase()}"
      }`
        )
        .join(',\n      ')}
    ]
  }' \\
  "https://graph.facebook.com/v18.0/me/messenger_profile?access_token=${pageAccessToken}"
\`\`\`
`;

  // Deployment Guide
  const deploymentGuide = `# Facebook Messenger Bot Deployment Guide

## Prerequisites
1. Facebook Page
2. Facebook App with Messenger product added
3. Page Access Token with required permissions
4. Webhook endpoint (HTTPS required)

## Step-by-Step Setup

### 1. Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create new app → Business → Continue
3. Add Messenger product to your app
4. Generate Page Access Token

### 2. Configure Webhook
1. Set Webhook URL: \`${webhookUrl}\`
2. Set Verify Token: \`${verifyToken}\`
3. Subscribe to webhook fields:
   - messages
   - messaging_postbacks
   - messaging_optins

### 3. Deploy Bot Code
1. Deploy webhook code to your server
2. Ensure HTTPS is enabled
3. Test webhook verification
4. Subscribe your app to page events

### 4. Test Your Bot
1. Send message to your page
2. Check webhook receives events
3. Verify bot responds correctly
4. Test all interactive features

## Security Considerations
- Always verify webhook signatures
- Use environment variables for secrets
- Implement rate limiting
- Log and monitor all interactions
- Follow Facebook Platform Policies

## Monitoring & Analytics
- Track message volumes
- Monitor response times
- Analyze user engagement
- Set up error alerting
- Regular performance reviews

## Troubleshooting
- Check webhook verification
- Verify access token permissions
- Review Facebook App settings
- Check server logs for errors
- Test with Graph API Explorer
`;

  return {
    messengerConfig,
    setupCommands,
    deploymentGuide,
    config: {
      agentId: agent.id,
      agentName: agent.name,
      pageId,
      webhookUrl,
      verifyToken,
      webhookSecret,
      ...config,
    },
  };
}
