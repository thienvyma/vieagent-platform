# API Map

This document provides an overview of all major API endpoints in the AI Agent Platform, mapping API routes to their corresponding files, and highlighting inconsistent error handling or logic that should be refactored.

## API Structure Overview

The API routes are currently organized in the Next.js App Router structure under `/src/app/api/`. The main API categories include:

1. Authentication
2. Agents
3. Chat
4. Knowledge
5. Admin
6. Google Integration
7. Deployment
8. Monitoring

## API Routes Mapping

### Authentication API

| API Route | File Path | Description | Issues to Address |
|-----------|-----------|-------------|------------------|
| `/api/auth/[...nextauth]` | `/src/app/api/auth/[...nextauth]/route.ts` | NextAuth.js authentication routes | None |
| `/api/auth/register` | `/src/app/api/auth/register/route.ts` | User registration | Inconsistent error handling |
| `/api/auth/verify` | `/src/app/api/auth/verify/route.ts` | Email verification | None |
| `/api/auth/reset-password` | `/src/app/api/auth/reset-password/route.ts` | Password reset | None |

### Agents API

| API Route | File Path | Description | Issues to Address |
|-----------|-----------|-------------|------------------|
| `/api/agents` | `/src/app/api/agents/route.ts` | CRUD operations for agents | Inconsistent response format |
| `/api/agents/[id]` | `/src/app/api/agents/[id]/route.ts` | Single agent operations | None |
| `/api/agents/[id]/settings` | `/src/app/api/agents/[id]/settings/route.ts` | Agent settings | None |
| `/api/agents/[id]/chat` | `/src/app/api/agents/[id]/chat/route.ts` | Agent chat | Lacks proper error handling |
| `/api/agents/[id]/smart-chat` | `/src/app/api/agents/[id]/smart-chat/route.ts` | Enhanced agent chat | Complex logic, needs refactoring |
| `/api/agents/[id]/validate` | `/src/app/api/agents/[id]/validate/route.ts` | Agent validation | None |
| `/api/agents/templates` | `/src/app/api/agents/templates/route.ts` | Agent templates | None |

### Chat API

| API Route | File Path | Description | Issues to Address |
|-----------|-----------|-------------|------------------|
| `/api/chat/history` | `/src/app/api/chat/history/route.ts` | Chat history | None |
| `/api/chat/history/[id]` | `/src/app/api/chat/history/[id]/route.ts` | Single conversation | None |
| `/api/chat/stream` | `/src/app/api/chat/stream/route.ts` | Streaming chat | Complex implementation |
| `/api/chat/feedback` | `/src/app/api/chat/feedback/route.ts` | Chat feedback | None |

### Knowledge API

| API Route | File Path | Description | Issues to Address |
|-----------|-----------|-------------|------------------|
| `/api/knowledge` | `/src/app/api/knowledge/route.ts` | Knowledge base operations | None |
| `/api/knowledge/upload` | `/src/app/api/knowledge/upload/route.ts` | File upload | Large file handling issues |
| `/api/knowledge/[id]` | `/src/app/api/knowledge/[id]/route.ts` | Single knowledge item | None |
| `/api/knowledge/search` | `/src/app/api/knowledge/search/route.ts` | Knowledge search | Performance issues with large datasets |
| `/api/knowledge/analyze` | `/src/app/api/knowledge/analyze/route.ts` | Knowledge analysis | Complex implementation |
| `/api/knowledge/bulk` | `/src/app/api/knowledge/bulk/route.ts` | Bulk operations | Error handling inconsistencies |

### Admin API

| API Route | File Path | Description | Issues to Address |
|-----------|-----------|-------------|------------------|
| `/api/admin/users` | `/src/app/api/admin/users/route.ts` | User management | None |
| `/api/admin/metrics` | `/src/app/api/admin/metrics/route.ts` | System metrics | None |
| `/api/admin/settings` | `/src/app/api/admin/settings/route.ts` | System settings | None |
| `/api/admin/logs` | `/src/app/api/admin/logs/route.ts` | System logs | Performance issues with large logs |

### Google Integration API

| API Route | File Path | Description | Issues to Address |
|-----------|-----------|-------------|------------------|
| `/api/google/auth` | `/src/app/api/google/auth/route.ts` | Google authentication | None |
| `/api/google/calendar` | `/src/app/api/google/calendar/route.ts` | Calendar integration | None |
| `/api/google/gmail` | `/src/app/api/google/gmail/route.ts` | Gmail integration | None |
| `/api/google/sheets` | `/src/app/api/google/sheets/route.ts` | Sheets integration | None |
| `/api/google/drive` | `/src/app/api/google/drive/route.ts` | Drive integration | None |
| `/api/google/docs` | `/src/app/api/google/docs/route.ts` | Docs integration | None |

### Deployment API

| API Route | File Path | Description | Issues to Address |
|-----------|-----------|-------------|------------------|
| `/api/deployment` | `/src/app/api/deployment/route.ts` | Deployment operations | None |
| `/api/deployment/[id]` | `/src/app/api/deployment/[id]/route.ts` | Single deployment | None |
| `/api/deployment/[id]/status` | `/src/app/api/deployment/[id]/status/route.ts` | Deployment status | None |

### Monitoring API

| API Route | File Path | Description | Issues to Address |
|-----------|-----------|-------------|------------------|
| `/api/monitoring/health` | `/src/app/api/monitoring/health/route.ts` | Health check | None |
| `/api/monitoring/logs` | `/src/app/api/monitoring/logs/route.ts` | System logs | None |
| `/api/monitoring/alerts` | `/src/app/api/monitoring/alerts/route.ts` | System alerts | None |

## Common API Issues to Address

1. **Inconsistent Response Format**: API responses should follow a consistent format across all endpoints. Currently, some endpoints return data directly, while others wrap it in a `data` property.

2. **Error Handling**: Error handling is inconsistent across endpoints. Some use try-catch blocks with proper error messages, while others don't handle errors properly.

3. **Validation**: Input validation varies across endpoints. Some use Zod for validation, while others use manual validation or none at all.

4. **Authentication**: Some endpoints don't properly check authentication or permissions.

5. **Documentation**: API documentation is missing or incomplete for many endpoints.

## Recommended API Structure

The recommended API structure follows a feature-based organization:

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── agents/
│   │   ├── chat/
│   │   ├── knowledge/
│   │   ├── admin/
│   │   ├── google/
│   │   ├── deployment/
│   │   └── monitoring/
```

Each API route should:

1. Use consistent response formatting
2. Implement proper error handling
3. Validate inputs
4. Check authentication and permissions
5. Include proper documentation

## API Standardization Plan

1. Create a standard API response format
2. Implement a central error handling utility
3. Use Zod for consistent validation
4. Create middleware for authentication and permissions
5. Document all API endpoints 