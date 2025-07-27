# Project Context

## Tech Stack

The AI Agent Platform is built with the following technologies:

- **Frontend**: 
  - Next.js 15.3.4 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS

- **State Management**:
  - React's built-in state management (useState, useContext)
  - No Redux implementation currently, but will be added during refactoring

- **Backend**:
  - Next.js API Routes
  - NextAuth.js for authentication
  - Prisma ORM with SQLite (production: PostgreSQL)

- **Database**:
  - SQLite (development)
  - PostgreSQL (production)
  - ChromaDB (vector database)

- **Authentication**:
  - NextAuth.js with JWT

- **API Integration**:
  - OpenAI, Anthropic, Google Gemini
  - Google Services (Calendar, Gmail, Sheets, Drive, Docs, Forms)

- **Deployment**:
  - Vercel

## Current Pain Points

### Folder Structure Chaos

The current folder structure has several issues:

1. **Inconsistent Organization**: Files are organized in a mix of feature-based and type-based structures, making it difficult to locate related code.

2. **Component Sprawl**: Components are scattered across different directories without clear organization principles.

3. **Lack of Clear Boundaries**: There's no clear separation between features, making it difficult to understand which components belong to which feature.

4. **Import Complexity**: Deep nesting and inconsistent organization lead to complex import paths.

5. **No Clear Pattern**: The codebase lacks a consistent pattern for organizing files, making it difficult for new developers to understand the structure.

### Code Quality Issues

1. **Large Components**: Some components are excessively large (e.g., wizard component with 2,185 lines).

2. **Inconsistent API Responses**: API responses lack standardization.

3. **Insufficient Error Handling**: Error handling is inconsistent across the codebase.

4. **Type Safety Gaps**: Some areas lack proper TypeScript typing.

## Target Folder Structure

We aim to implement a feature-based folder structure that organizes code by domain rather than by technical type. This approach improves maintainability, scalability, and developer experience.

### Proposed Structure

```
ai-agent-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   ├── (routes)/           # App routes
│   ├── features/               # Feature-based organization
│   │   ├── auth/               # Authentication feature
│   │   │   ├── components/     # Auth-specific components
│   │   │   ├── hooks/          # Auth-specific hooks
│   │   │   ├── types/          # Auth-specific types
│   │   │   ├── utils/          # Auth-specific utilities
│   │   │   └── store/          # Auth-specific state management
│   │   ├── agents/             # Agents feature
│   │   ├── chat/               # Chat feature
│   │   ├── knowledge/          # Knowledge management feature
│   │   ├── admin/              # Admin dashboard feature
│   │   └── ...                 # Other features
│   ├── components/             # Shared components
│   │   ├── ui/                 # UI components
│   │   └── layout/             # Layout components
│   ├── hooks/                  # Shared hooks
│   ├── lib/                    # Shared utilities
│   ├── types/                  # Shared types
│   └── store/                  # Global state management
├── prisma/                     # Database schema
├── public/                     # Static assets
└── scripts/                    # Utility scripts
```

## Refactoring Principles

1. **Do Not Delete Without Confirmation**: Never delete any file without confirming it has zero usage.

2. **Feature-First Organization**: Organize code by feature rather than by technical type.

3. **Shared vs. Feature-Specific**: Clearly separate shared code from feature-specific code.

4. **Consistent Naming**: Use consistent naming conventions for files and folders.

5. **Proper Typing**: Ensure all code is properly typed with TypeScript.

6. **Test Before Commit**: Test all changes before committing to ensure functionality is preserved.

7. **Documentation**: Document all changes and update documentation to reflect the new structure.

8. **Incremental Approach**: Refactor in small, incremental steps to minimize disruption. 