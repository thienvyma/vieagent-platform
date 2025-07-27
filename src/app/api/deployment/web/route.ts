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
    message: 'Web deployment configuration endpoint',
    availableAgents: [],
    platforms: ['web'],
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

    // Generate Web Integration Code
    const integrationCode = generateWebIntegration(agent, config);

    return NextResponse.json({
      success: true,
      integration: integrationCode,
      agent: {
        id: agent.id,
        name: agent.name,
      },
    });
  } catch (error) {
    console.error('Web integration error:', error);
    return NextResponse.json({ error: 'Failed to generate web integration' }, { status: 500 });
  }
}

function generateWebIntegration(agent: any, config: any) {
  const {
    widgetPosition = 'bottom-right',
    widgetColor = '#3B82F6',
    widgetSize = 'medium',
    greeting = `Hello! I'm ${agent.name}, how can I help you?`,
    placeholder = 'Type your message...',
    apiUrl = 'https://your-domain.com',
    customCss = '',
  } = config || {};

  // Generate unique widget ID
  const widgetId = `ai-widget-${agent.id}`;
  const apiKey = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Widget HTML Code
  const widgetHtml = `<!-- AI Agent Widget - ${agent.name} -->
<div id="${widgetId}"></div>

<script>
(function() {
  // Widget Configuration
  const config = {
    agentId: '${agent.id}',
    agentName: '${agent.name}',
    apiUrl: '${apiUrl}',
    apiKey: '${apiKey}',
    position: '${widgetPosition}',
    color: '${widgetColor}',
    size: '${widgetSize}',
    greeting: \`${greeting}\`,
    placeholder: '${placeholder}'
  };

  // Create widget styles
  const styles = \`
    .ai-widget-container {
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .ai-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: \${config.color};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      transition: all 0.3s ease;
    }
    
    .ai-widget-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    }
    
    .ai-widget-chat {
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 5px 40px rgba(0,0,0,0.16);
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    
    .ai-widget-header {
      background: \${config.color};
      color: white;
      padding: 16px;
      font-weight: 600;
    }
    
    .ai-widget-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .ai-widget-message {
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 18px;
      word-wrap: break-word;
    }
    
    .ai-widget-message.user {
      background: \${config.color};
      color: white;
      align-self: flex-end;
    }
    
    .ai-widget-message.bot {
      background: #f1f5f9;
      color: #334155;
      align-self: flex-start;
    }
    
    .ai-widget-input {
      border: none;
      border-top: 1px solid #e2e8f0;
      padding: 16px;
      outline: none;
      font-size: 14px;
    }
    
    /* Position classes */
    .ai-widget-bottom-right {
      bottom: 20px;
      right: 20px;
    }
    
    .ai-widget-bottom-left {
      bottom: 20px;
      left: 20px;
    }
    
    .ai-widget-top-right {
      top: 20px;
      right: 20px;
    }
    
    .ai-widget-top-left {
      top: 20px;
      left: 20px;
    }
    
    /* Custom CSS */
    \${customCss}
  \`;

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Create widget container
  const container = document.createElement('div');
  container.className = \`ai-widget-container ai-widget-\${config.position}\`;
  
  // Create widget button
  const button = document.createElement('button');
  button.className = 'ai-widget-button';
  button.innerHTML = '💬';
  
  // Create chat interface
  const chat = document.createElement('div');
  chat.className = 'ai-widget-chat';
  
  const header = document.createElement('div');
  header.className = 'ai-widget-header';
  header.textContent = config.agentName;
  
  const messages = document.createElement('div');
  messages.className = 'ai-widget-messages';
  
  const input = document.createElement('input');
  input.className = 'ai-widget-input';
  input.placeholder = config.placeholder;
  
  chat.appendChild(header);
  chat.appendChild(messages);
  chat.appendChild(input);
  
  container.appendChild(button);
  container.appendChild(chat);
  
  // Position chat relative to button
  if (config.position.includes('bottom')) {
    chat.style.bottom = '70px';
  } else {
    chat.style.top = '70px';
  }
  
  if (config.position.includes('right')) {
    chat.style.right = '0';
  } else {
    chat.style.left = '0';
  }

  // Widget functionality
  let isOpen = false;
  
  button.addEventListener('click', () => {
    isOpen = !isOpen;
    chat.style.display = isOpen ? 'flex' : 'none';
    
    if (isOpen && messages.children.length === 0) {
      addMessage(config.greeting, 'bot');
    }
  });
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      sendMessage(input.value);
      input.value = '';
    }
  });
  
  function addMessage(text, sender) {
    const message = document.createElement('div');
    message.className = \`ai-widget-message \${sender}\`;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }
  
  async function sendMessage(text) {
    addMessage(text, 'user');
    
    try {
      const response = await fetch(\`\${config.apiUrl}/api/chat\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${config.apiKey}\`
        },
        body: JSON.stringify({
          message: text,
          agentId: config.agentId
        })
      });
      
      const data = await response.json();
      addMessage(data.response || 'Sorry, I could not process your request.', 'bot');
    } catch (error) {
      addMessage('Sorry, there was an error. Please try again.', 'bot');
    }
  }
  
  // Add to page
  document.body.appendChild(container);
})();
</script>`;

  // REST API Documentation
  const apiDocs = `# AI Agent REST API Documentation

## Base URL
\`${apiUrl}/api\`

## Authentication
All requests require an API key in the Authorization header:
\`Authorization: Bearer ${apiKey}\`

## Endpoints

### POST /chat
Send a message to the AI agent.

**Request Body:**
\`\`\`json
{
  "message": "Hello, how can you help me?",
  "agentId": "${agent.id}",
  "conversationId": "optional-conversation-id"
}
\`\`\`

**Response:**
\`\`\`json
{
  "response": "Hello! I'm ${agent.name}, how can I help you today?",
  "conversationId": "conv_123456789",
  "agentId": "${agent.id}",
  "timestamp": "2024-01-01T12:00:00Z"
}
\`\`\`

### GET /agent/${agent.id}
Get agent information.

**Response:**
\`\`\`json
{
  "id": "${agent.id}",
  "name": "${agent.name}",
  "description": "${agent.description || 'AI Assistant'}",
  "status": "active",
  "capabilities": {
    "vietnamese": ${agent.enableVietnameseMode || false},
    "smartDelay": ${agent.enableSmartDelay || false}
  }
}
\`\`\`

## Example Usage

### JavaScript/Node.js
\`\`\`javascript
const response = await fetch('${apiUrl}/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${apiKey}'
  },
  body: JSON.stringify({
    message: 'Hello!',
    agentId: '${agent.id}'
  })
});

const data = await response.json();
console.log(data.response);
\`\`\`

### cURL
\`\`\`bash
curl -X POST '${apiUrl}/api/chat' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer ${apiKey}' \\
  -d '{
    "message": "Hello!",
    "agentId": "${agent.id}"
  }'
\`\`\`

### Python
\`\`\`python
import requests

response = requests.post('${apiUrl}/api/chat', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${apiKey}'
  },
  json: {
    'message': 'Hello!',
    'agentId': '${agent.id}'
  }
})

data = response.json()
print(data['response'])
\`\`\`
`;

  // Iframe Embed Code
  const iframeCode = `<!-- AI Agent Iframe Embed - ${agent.name} -->
<iframe 
  src="${apiUrl}/widget/${agent.id}?color=${encodeURIComponent(widgetColor)}&position=${widgetPosition}"
  width="350" 
  height="500"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 5px 40px rgba(0,0,0,0.16);">
</iframe>`;

  // Setup Instructions
  const setupInstructions = `# Web Integration Setup Instructions

## 1. Copy Widget Code
Copy the widget code above and paste it before the closing </body> tag of your website.

## 2. Customize Appearance
You can customize the widget by modifying the config object:
- position: 'bottom-right', 'bottom-left', 'top-right', 'top-left'
- color: Any valid CSS color (hex, rgb, etc.)
- size: 'small', 'medium', 'large'

## 3. API Integration
Use the provided API key and endpoints to integrate with your backend systems.

## 4. Testing
1. Save your HTML file and open it in a browser
2. You should see the chat widget appear
3. Click the widget to start a conversation
4. Test the agent responses

## 5. Production Deployment
- Replace 'https://your-domain.com' with your actual domain
- Update the API key with your production key
- Configure CORS settings on your server
- Set up proper SSL/HTTPS for security

For more help, visit: https://docs.aiplatform.com/web-integration
`;

  return {
    widgetHtml,
    apiDocs,
    iframeCode,
    setupInstructions,
    config: {
      agentId: agent.id,
      agentName: agent.name,
      apiKey,
      widgetId,
      ...config,
    },
  };
}
