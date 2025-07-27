# 📚 AI Agent Platform - Complete Developer Documentation
**Version**: 2.0 Production Ready  
**Date**: January 24, 2025  
**Status**: Phase 5 Completed - Production Ready  

---

## 🎯 Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start Guide](#quick-start-guide)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Core Features Guide](#core-features-guide)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Security Implementation](#security-implementation)
9. [Deployment Guide](#deployment-guide)
10. [Testing Guide](#testing-guide)
11. [Environment Configuration](#environment-configuration)
12. [Performance Optimization](#performance-optimization)
13. [Troubleshooting](#troubleshooting)
14. [Contributing Guidelines](#contributing-guidelines)

---

## 🚀 Project Overview

The AI Agent Platform is a comprehensive, production-ready system for creating, managing, and deploying AI agents with advanced features including:

### 🌟 Key Features
- **Multi-Model Support**: OpenAI, Anthropic, Google Gemini
- **RAG (Retrieval Augmented Generation)**: ChromaDB vector database
- **Google Integration**: Calendar, Gmail, Sheets, Drive, Docs, Forms
- **Real-time Communication**: WebSocket support
- **Admin Dashboard**: Comprehensive management interface
- **Security**: Rate limiting, device fingerprinting, RBAC
- **Performance**: Lazy loading, caching, optimization
- **Knowledge Management**: Document processing, vector storage
- **Auto-Learning**: Feedback-based improvement
- **Deployment**: VPS, cloud, API endpoints

### 🛠️ Technology Stack
- **Frontend**: Next.js 15.3.4 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: Prisma ORM with SQLite (production: PostgreSQL)
- **Vector Database**: ChromaDB
- **Authentication**: NextAuth.js with JWT
- **Styling**: Tailwind CSS
- **Real-time**: WebSocket, Server-Sent Events
- **File Processing**: PDF, DOCX, XLSX, HTML, RTF support
- **Payment**: Stripe integration
- **Email**: Nodemailer with SMTP

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js 18+ 
- npm or yarn
- SQLite (development) or PostgreSQL (production)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd ai-agent-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up database
npm run db:generate
npm run db:push

# Create admin user
npm run create-owner

# Start development server
npm run dev
```

### Access Points
- **Application**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API Health**: http://localhost:3000/api/health
- **Database Studio**: `npm run db:studio`

---

## 📁 Project Structure

```
ai-agent-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── agents/        # Agent management
│   │   │   ├── admin/         # Admin endpoints
│   │   │   ├── auth/          # Authentication
│   │   │   ├── google/        # Google integration
│   │   │   ├── knowledge/     # Knowledge management
│   │   │   ├── deployment/    # Deployment services
│   │   │   ├── realtime/      # Real-time features
│   │   │   └── health/        # Health checks
│   │   ├── admin/             # Admin dashboard
│   │   ├── dashboard/         # User dashboard
│   │   ├── login/             # Authentication pages
│   │   ├── blog/              # Blog system
│   │   ├── pricing/           # Pricing pages
│   │   └── contact/           # Contact forms
│   ├── components/            # React components
│   │   ├── admin/            # Admin components
│   │   ├── agents/           # Agent components
│   │   ├── knowledge/        # Knowledge components
│   │   ├── deployment/       # Deployment components
│   │   ├── ui/               # UI components
│   │   └── providers/        # Context providers
│   ├── lib/                   # Utility libraries
│   │   ├── providers/        # AI model providers
│   │   ├── google/           # Google services
│   │   ├── auth-security.ts  # Security utilities
│   │   ├── permissions.ts    # RBAC system
│   │   └── prisma.ts         # Database client
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript definitions
│   └── middleware.ts         # Next.js middleware
├── prisma/                   # Database schema & migrations
├── public/                   # Static assets
├── scripts/                  # Utility scripts
├── test-reports/            # Test results
├── uploads/                 # File uploads
└── chromadb_data/           # Vector database
```

### Key Directories Explained

#### `/src/app/api/`
- **agents/**: CRUD operations for AI agents, chat endpoints
- **admin/**: Administrative functions (users, metrics, settings)
- **auth/**: Authentication endpoints, session management
- **google/**: Google services integration (Calendar, Gmail, etc.)
- **knowledge/**: Document and knowledge management
- **deployment/**: Agent deployment to various platforms
- **realtime/**: WebSocket and real-time features

#### `/src/components/`
- **admin/**: Admin dashboard components
- **agents/**: Agent creation and management
- **knowledge/**: Knowledge base interface
- **deployment/**: Deployment configuration
- **ui/**: Reusable UI components

#### `/src/lib/`
- **providers/**: AI model provider abstractions
- **google/**: Google API service classes
- **auth-security.ts**: Security utilities and middleware
- **permissions.ts**: Role-based access control

---

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI AGENT PLATFORM                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer (Next.js App Router)                       │
│  ├── User Dashboard                                         │
│  ├── Admin Panel                                            │
│  ├── Agent Management                                       │
│  └── Knowledge Center                                       │
│                         ↓                                  │
│  API Layer (Next.js API Routes)                           │
│  ├── Authentication & Authorization                        │
│  ├── Agent Operations                                      │
│  ├── Knowledge Processing                                  │
│  └── Google Integration                                    │
│                         ↓                                  │
│  Business Logic Layer                                      │
│  ├── AI Model Providers (OpenAI, Anthropic, Google)      │
│  ├── RAG System (ChromaDB)                                │
│  ├── Document Processing                                   │
│  └── Real-time Services                                    │
│                         ↓                                  │
│  Data Layer                                                │
│  ├── Prisma ORM                                            │
│  ├── SQLite/PostgreSQL                                     │
│  ├── ChromaDB (Vector Storage)                             │
│  └── File System                                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Authentication**: NextAuth.js handles authentication with JWT tokens
2. **Agent Management**: CRUD operations through API routes
3. **Knowledge Processing**: Documents → Chunking → Embedding → Vector Storage
4. **Chat Processing**: Message → RAG Retrieval → AI Provider → Response
5. **Google Integration**: OAuth → API calls → Data sync
6. **Real-time Updates**: WebSocket connections for live updates

---

## 🎯 Core Features Guide

### 1. Agent Management

#### Creating an Agent
```typescript
// Frontend: Agent creation form
const createAgent = async (agentData: AgentData) => {
  const response = await fetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agentData)
  });
  return response.json();
};

// Backend: Agent creation API
// File: src/app/api/agents/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // Validation and creation logic
}
```

#### Agent Configuration Options
```typescript
interface AgentConfig {
  // Basic settings
  name: string;
  description: string;
  prompt: string;
  
  // AI model settings
  model: string;
  modelProvider: 'openai' | 'anthropic' | 'google';
  temperature: number;
  maxTokens: number;
  
  // RAG settings
  enableRAG: boolean;
  ragThreshold: number;
  ragMaxDocuments: number;
  
  // Google integration
  enableGoogleIntegration: boolean;
  googleServices: {
    calendar: boolean;
    gmail: boolean;
    sheets: boolean;
    drive: boolean;
    docs: boolean;
    forms: boolean;
  };
  
  // Auto-learning
  enableAutoLearning: boolean;
  learningMode: 'PASSIVE' | 'ACTIVE' | 'HYBRID';
  learningThreshold: number;
}
```

### 2. Knowledge Management

#### Upload and Process Documents
```typescript
// Frontend: Knowledge upload
const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/knowledge/upload', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

// Backend: Document processing
// File: src/app/api/knowledge/route.ts
export async function POST(request: NextRequest) {
  // Document processing pipeline
  // 1. Upload → 2. Parse → 3. Chunk → 4. Vectorize → 5. Store
}
```

#### Supported File Types
- **Documents**: PDF, DOCX, RTF, HTML, TXT
- **Spreadsheets**: XLSX, CSV
- **Conversations**: JSON (Facebook, WhatsApp, Telegram)
- **Archives**: ZIP folders with nested structures

### 3. Google Integration

#### Setting Up Google Services
```typescript
// Google Calendar Integration
const calendarService = new GoogleCalendarService();
await calendarService.listEvents(userId, {
  timeMin: new Date().toISOString(),
  maxResults: 10
});

// Gmail Integration
const gmailService = new GmailService();
await gmailService.listMessages(userId, {
  query: 'is:unread',
  maxResults: 50
});
```

#### Available Google Services
- **Calendar**: Event management, scheduling
- **Gmail**: Email reading, sending, searching
- **Sheets**: Spreadsheet operations
- **Drive**: File management
- **Docs**: Document operations
- **Forms**: Form responses

### 4. Admin Dashboard

#### Admin Features
- **User Management**: CRUD operations, role assignment
- **Agent Oversight**: Monitor all agents, usage statistics
- **Subscription Management**: Plans, payments, billing
- **System Settings**: Configuration, API keys
- **Analytics**: Usage metrics, performance data
- **Content Management**: Blog, newsletters, announcements

#### Role-Based Access Control
```typescript
// Permission system
const roles = {
  'OWNER': ['all_permissions'],
  'ADMIN': ['manage_users', 'manage_agents', 'view_analytics'],
  'MANAGER': ['view_users', 'view_agents', 'manage_content'],
  'USER': ['own_agents', 'own_data']
};

// Usage in components
const canManageUsers = hasPermission(userRole, 'manage_users');
```

---

## 📡 API Documentation

### Authentication
All API routes require authentication except public endpoints.

```typescript
// Headers
Authorization: Bearer <session-token>
Content-Type: application/json
```

### Agent Endpoints

#### GET /api/agents
List user's agents
```typescript
// Response
{
  "agents": [
    {
      "id": "agent_123",
      "name": "Customer Support Bot",
      "description": "AI assistant for customer support",
      "model": "gpt-4",
      "status": "ACTIVE",
      "createdAt": "2025-01-24T10:00:00Z"
    }
  ]
}
```

#### POST /api/agents
Create new agent
```typescript
// Request
{
  "name": "Sales Assistant",
  "description": "AI assistant for sales inquiries",
  "prompt": "You are a helpful sales assistant...",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 1000,
  "enableRAG": true
}

// Response
{
  "success": true,
  "agent": {
    "id": "agent_456",
    "name": "Sales Assistant",
    // ... other fields
  }
}
```

#### POST /api/agents/[id]/chat
Chat with agent
```typescript
// Request
{
  "message": "Hello, how can you help me?",
  "conversationId": "conv_123" // optional
}

// Response
{
  "response": "Hello! I'm here to help with your sales inquiries.",
  "conversationId": "conv_123",
  "usage": {
    "tokens": 45,
    "cost": 0.0012
  }
}
```

### Knowledge Endpoints

#### POST /api/knowledge/upload
Upload document
```typescript
// Request (multipart/form-data)
file: <File>
type: "document" | "conversation" | "folder"

// Response
{
  "success": true,
  "knowledge": {
    "id": "know_789",
    "title": "User Manual",
    "status": "PROCESSING",
    "filename": "manual.pdf"
  }
}
```

#### GET /api/knowledge/search
Search knowledge base
```typescript
// Request
{
  "query": "How to reset password?",
  "limit": 10,
  "threshold": 0.7
}

// Response
{
  "success": true,
  "results": [
    {
      "id": "know_789",
      "title": "User Manual",
      "content": "To reset your password...",
      "score": 0.85
    }
  ]
}
```

### Admin Endpoints

#### GET /api/admin/metrics
System metrics (Admin only)
```typescript
// Response
{
  "overview": {
    "totalUsers": 1250,
    "activeUsers": 890,
    "totalAgents": 3400,
    "monthlyRevenue": 45000
  },
  "userMetrics": {
    "newThisMonth": 120,
    "growthRate": 15.2
  }
}
```

### Google Integration Endpoints

#### GET /api/google/calendar
Calendar operations
```typescript
// Query parameters
?action=list&maxResults=10

// Response
{
  "success": true,
  "events": [
    {
      "id": "event_123",
      "summary": "Team Meeting",
      "start": "2025-01-24T14:00:00Z",
      "end": "2025-01-24T15:00:00Z"
    }
  ]
}
```

---

## 🗄️ Database Schema

### Core Models

#### User
```prisma
model User {
  id       String  @id @default(cuid())
  email    String  @unique
  name     String?
  password String?
  role     String  @default("USER")
  plan     String  @default("TRIAL")
  isActive Boolean @default(true)
  
  agents               Agent[]
  conversations        Conversation[]
  knowledge           Knowledge[]
  googleAccounts      GoogleAccount[]
  subscriptions       Subscription[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Agent
```prisma
model Agent {
  id                      String  @id @default(cuid())
  name                    String
  description             String?
  prompt                  String
  model                   String  @default("gpt-3.5-turbo")
  temperature             Float   @default(0.7)
  maxTokens               Int     @default(1000)
  status                  String  @default("ACTIVE")
  
  // RAG Settings
  enableRAG               Boolean @default(false)
  ragThreshold            Float   @default(0.7)
  ragMaxDocuments         Int     @default(5)
  
  // Auto-Learning
  enableAutoLearning      Boolean @default(false)
  learningMode            String  @default("PASSIVE")
  learningThreshold       Float   @default(0.8)
  
  // Google Integration
  enableGoogleIntegration Boolean @default(false)
  googleServices          String? @default("{}")
  
  userId                  String
  user                    User    @relation(fields: [userId], references: [id])
  conversations           Conversation[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Knowledge
```prisma
model Knowledge {
  id               String    @id @default(cuid())
  title            String
  description      String?
  filename         String
  type             String    // "document", "conversation", "folder"
  subtype          String?   // "pdf", "json", "csv", etc.
  source           String?   // "upload", "facebook", "whatsapp"
  status           String    @default("PENDING")
  
  // Content
  content          String?   // Parsed content (JSON)
  extractedText    String?   // Raw text
  
  // Processing
  processedAt      DateTime?
  errorMessage     String?
  
  userId           String
  user             User      @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Relationships
- **User → Agent**: One-to-many
- **User → Knowledge**: One-to-many
- **Agent → Conversation**: One-to-many
- **User → GoogleAccount**: One-to-many
- **User → Subscription**: One-to-many

---

## 🔐 Security Implementation

### Authentication & Authorization

#### NextAuth.js Configuration
```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Validation logic
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.plan = user.plan;
      }
      return token;
    }
  }
};
```

#### Role-Based Access Control
```typescript
// src/lib/permissions.ts
export const ROLE_PERMISSIONS = {
  'OWNER': ['all_permissions'],
  'ADMIN': ['manage_users', 'manage_agents', 'view_analytics'],
  'MANAGER': ['view_users', 'view_agents', 'manage_content'],
  'USER': ['own_agents', 'own_data']
};

export function hasPermission(userRole: string, permission: string): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}
```

### Security Features

#### Rate Limiting
```typescript
// src/lib/auth-security.ts
export class AuthSecurityService {
  async checkRateLimit(identifier: string, config: RateLimitConfig) {
    const key = `rate_limit:${identifier}`;
    const requests = await this.getRequestCount(key);
    
    if (requests >= config.maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    
    await this.incrementRequestCount(key, config.windowMs);
    return { allowed: true, remaining: config.maxRequests - requests - 1 };
  }
}
```

#### Device Fingerprinting
```typescript
generateDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const ip = this.getClientIP(request);
  
  const fingerprint = `${userAgent}:${acceptLanguage}:${ip}`;
  return Buffer.from(fingerprint).toString('base64');
}
```

#### Security Headers
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}
```

---

## 🚀 Deployment Guide

### Environment Setup

#### Development
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Database setup
npm run db:generate
npm run db:push

# Create admin user
npm run create-owner

# Start development server
npm run dev
```

#### Production

##### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

##### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/aiagent
      - NEXTAUTH_SECRET=your-secret-key
    depends_on:
      - db
      - chromadb

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=aiagent
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma

volumes:
  postgres_data:
  chroma_data:
```

##### VPS Deployment
```bash
# Server setup
sudo apt update
sudo apt install nodejs npm postgresql

# Clone and setup
git clone <repository>
cd ai-agent-platform
npm install
npm run build

# Database setup
sudo -u postgres createdb aiagent
npm run db:push

# Process manager
npm install -g pm2
pm2 start npm --name "ai-agent-platform" -- start
pm2 save
pm2 startup
```

### Environment Variables

#### Required Variables
```env
# Database
DATABASE_URL="sqlite:./dev.db"  # or PostgreSQL URL

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI Providers
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# ChromaDB
CHROMA_HOST="localhost"
CHROMA_PORT="8000"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Stripe (optional)
STRIPE_PUBLIC_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
```

---

## 🧪 Testing Guide

### Running Tests

#### System Testing
```bash
# Health check
npm run test:health

# Database validation
npm run test:db

# Agent functionality
npm run test:agents

# Knowledge system
npm run test:knowledge

# Google integration
npm run test:google

# Complete system test
npm run test:system
```

#### Test Scripts
The platform includes comprehensive test scripts:

- **Day 21 System Testing**: `scripts/day21-comprehensive-system-test.js`
- **Knowledge API Testing**: `scripts/test-knowledge-api.js`
- **Agent Validation**: `scripts/test-agent-config.js`
- **ChromaDB Testing**: `scripts/test-chromadb-integration.js`

#### Test Categories

##### 1. Agent Workflow Tests
```javascript
// Test agent creation, knowledge upload, chat functionality
await testAgentCreation();
await testKnowledgeUpload();
await testChatFunctionality();
```

##### 2. Admin Panel Tests
```javascript
// Test admin features
await testUserManagement();
await testSystemMetrics();
await testDataExport();
```

##### 3. Security Tests
```javascript
// Test security features
await testAuthentication();
await testRateLimit();
await testDeviceFingerprint();
```

##### 4. Integration Tests
```javascript
// Test Google services
await testGoogleCalendar();
await testGoogleGmail();
await testGoogleSheets();
```

### Test Results
Test results are saved to `test-reports/` directory with detailed JSON reports.

---

## ⚙️ Environment Configuration

### Development Environment
```env
NODE_ENV=development
DATABASE_URL="sqlite:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
```

### Production Environment
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_URL="https://your-domain.com"
```

### Feature Flags
```env
# Enable/disable features
ENABLE_GOOGLE_INTEGRATION=true
ENABLE_STRIPE_PAYMENTS=true
ENABLE_CHROMADB=true
ENABLE_RATE_LIMITING=true
```

---

## ⚡ Performance Optimization

### Frontend Optimization

#### Next.js Configuration
```javascript
// next.config.js
module.exports = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'your-domain.com'],
  },
  webpack: (config) => {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
};
```

#### Component Optimization
```typescript
// Lazy loading
const AdminPanel = dynamic(() => import('./AdminPanel'), {
  loading: () => <div>Loading...</div>,
});

// Memoization
const AgentCard = memo(({ agent }: { agent: Agent }) => {
  return <div>{agent.name}</div>;
});
```

### Backend Optimization

#### Database Optimization
```prisma
// Indexes for better performance
model Agent {
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model Knowledge {
  @@index([userId, type])
  @@index([status])
}
```

#### Caching Strategy
```typescript
// API response caching
export async function GET(request: NextRequest) {
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }
  
  const data = await fetchData();
  await redis.setex(cacheKey, 3600, JSON.stringify(data));
  return NextResponse.json(data);
}
```

### Vector Database Optimization

#### ChromaDB Configuration
```python
# scripts/start-chromadb-server.py
import chromadb
from chromadb.config import Settings

client = chromadb.Client(Settings(
    chroma_db_impl="duckdb+parquet",
    persist_directory="./chromadb_data",
    chroma_server_host="localhost",
    chroma_server_http_port=8000
))
```

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connection
npm run db:studio

# Reset database
npm run db:reset

# Generate Prisma client
npm run db:generate
```

#### ChromaDB Issues
```bash
# Start ChromaDB server
npm run chromadb:start

# Check ChromaDB health
curl http://localhost:8000/api/v1/heartbeat
```

#### Authentication Issues
```bash
# Check session configuration
console.log(process.env.NEXTAUTH_SECRET);

# Verify JWT token
# Check browser cookies for next-auth.session-token
```

#### Google Integration Issues
```bash
# Verify OAuth configuration
console.log(process.env.GOOGLE_CLIENT_ID);
console.log(process.env.GOOGLE_CLIENT_SECRET);

# Check redirect URI in Google Console
```

### Debug Mode
```env
# Enable debug logging
DEBUG=true
NODE_ENV=development
NEXTAUTH_DEBUG=true
```

### Log Files
- **Application logs**: Console output
- **Database logs**: Prisma query logs
- **ChromaDB logs**: `chromadb_data/server.log`
- **Test reports**: `test-reports/`

---

## 📊 Monitoring & Analytics

### Health Monitoring
```typescript
// GET /api/health
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "latency": "15ms"
  },
  "services": {
    "api": "operational",
    "database": "operational",
    "chromadb": "operational"
  }
}
```

### Performance Metrics
```typescript
// GET /api/admin/metrics
{
  "overview": {
    "totalUsers": 1250,
    "activeUsers": 890,
    "totalAgents": 3400,
    "monthlyRevenue": 45000
  },
  "performance": {
    "avgResponseTime": "120ms",
    "uptime": "99.9%",
    "errorRate": "0.1%"
  }
}
```

### Analytics Dashboard
- **User Analytics**: Registration, engagement, retention
- **Agent Analytics**: Usage, performance, costs
- **System Analytics**: Response times, error rates, uptime
- **Revenue Analytics**: Subscriptions, payments, churn

---

## 🤝 Contributing Guidelines

### Development Workflow

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Make changes** following code standards
4. **Run tests**: `npm run test`
5. **Commit changes**: `git commit -m "Add new feature"`
6. **Push to branch**: `git push origin feature/new-feature`
7. **Create Pull Request**

### Code Standards

#### TypeScript
```typescript
// Use strict typing
interface AgentConfig {
  name: string;
  description?: string;
  settings: AgentSettings;
}

// Use proper error handling
try {
  const result = await processAgent(config);
  return { success: true, data: result };
} catch (error) {
  console.error('Agent processing failed:', error);
  return { success: false, error: error.message };
}
```

#### React Components
```typescript
// Use TypeScript props
interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (id: string) => void;
}

// Use proper naming
const AgentCard: React.FC<AgentCardProps> = ({ agent, onEdit, onDelete }) => {
  return (
    <div className="agent-card">
      <h3>{agent.name}</h3>
      <p>{agent.description}</p>
    </div>
  );
};
```

### Testing Requirements
- **Unit tests** for utility functions
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows
- **Performance tests** for optimization

### Documentation
- **Code comments** for complex logic
- **API documentation** for new endpoints
- **README updates** for new features
- **Migration guides** for breaking changes

---

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [ChromaDB Documentation](https://docs.trychroma.com)

### Tools
- **Database Studio**: `npm run db:studio`
- **Type Generation**: `npm run db:generate`
- **Development Server**: `npm run dev`
- **Production Build**: `npm run build`

### Support
- **GitHub Issues**: Report bugs and request features
- **Documentation**: This guide and inline code comments
- **Test Scripts**: Comprehensive validation scripts
- **Health Checks**: Built-in monitoring endpoints

---

## 🎯 Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] SSL certificates installed
- [ ] Backup systems tested

### Post-Deployment
- [ ] Health checks passing
- [ ] Performance metrics normal
- [ ] Error monitoring active
- [ ] User authentication working
- [ ] All integrations functional
- [ ] Admin panel accessible

### Monitoring
- [ ] Uptime monitoring
- [ ] Error rate tracking
- [ ] Performance metrics
- [ ] Security event logging
- [ ] Backup verification
- [ ] User feedback collection

---

**🚀 The AI Agent Platform is now production-ready with comprehensive documentation, robust testing, and enterprise-grade security. This documentation serves as your complete guide to understanding, deploying, and maintaining the platform.**

**For questions or support, refer to the troubleshooting section or create an issue in the repository.** 