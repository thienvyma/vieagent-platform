# Folder Map

This document maps the current folder structure to the new proposed feature-based folder structure. It provides a clear guide for where files should be moved during the refactoring process.

## Current Structure

```
ai-agent-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── login/              # Login page
│   │   ├── register/           # Register page
│   │   ├── admin/              # Admin pages
│   │   └── ...                 # Other pages
│   ├── components/             # React components
│   │   ├── ui/                 # UI components
│   │   ├── admin/              # Admin components
│   │   ├── agents/             # Agent components
│   │   ├── chat/               # Chat components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── knowledge/          # Knowledge components
│   │   ├── monitoring/         # Monitoring components
│   │   ├── google/             # Google integration components
│   │   ├── gmail/              # Gmail components
│   │   ├── calendar/           # Calendar components
│   │   ├── sheets/             # Sheets components
│   │   ├── drive/              # Drive components
│   │   ├── docs/               # Docs components
│   │   └── ...                 # Other components
│   ├── lib/                    # Utility functions
│   ├── hooks/                  # Custom hooks
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Utility functions
│   └── shared/                 # Shared code
```

## Proposed Structure

```
ai-agent-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   └── (routes)/           # App routes
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
│   │   ├── dashboard/          # User dashboard feature
│   │   ├── monitoring/         # System monitoring feature
│   │   └── integrations/       # External integrations
│   │       ├── google/         # Google integration
│   │       │   ├── calendar/   # Calendar integration
│   │       │   ├── gmail/      # Gmail integration
│   │       │   ├── sheets/     # Sheets integration
│   │       │   ├── drive/      # Drive integration
│   │       │   └── docs/       # Docs integration
│   ├── components/             # Shared components
│   │   ├── ui/                 # UI components
│   │   └── layout/             # Layout components
│   ├── hooks/                  # Shared hooks
│   ├── lib/                    # Shared utilities
│   ├── types/                  # Shared types
│   └── store/                  # Global state management
```

## Mapping Table

This table provides a mapping from the current structure to the new structure for key files and directories.

| Current Path | New Path | Notes |
|-------------|----------|-------|
| `/src/components/ui/` | `/src/components/ui/` | No change |
| `/src/components/admin/` | `/src/features/admin/components/` | Move to feature folder |
| `/src/components/agents/` | `/src/features/agents/components/` | Move to feature folder |
| `/src/components/chat/` | `/src/features/chat/components/` | Move to feature folder |
| `/src/components/dashboard/` | `/src/features/dashboard/components/` | Move to feature folder |
| `/src/components/knowledge/` | `/src/features/knowledge/components/` | Move to feature folder |
| `/src/components/monitoring/` | `/src/features/monitoring/components/` | Move to feature folder |
| `/src/components/google/` | `/src/features/integrations/google/components/` | Move to feature folder |
| `/src/components/gmail/` | `/src/features/integrations/google/gmail/components/` | Move to feature folder |
| `/src/components/calendar/` | `/src/features/integrations/google/calendar/components/` | Move to feature folder |
| `/src/components/sheets/` | `/src/features/integrations/google/sheets/components/` | Move to feature folder |
| `/src/components/drive/` | `/src/features/integrations/google/drive/components/` | Move to feature folder |
| `/src/components/docs/` | `/src/features/integrations/google/docs/components/` | Move to feature folder |
| `/src/components/PageLayout.tsx` | `/src/components/layout/PageLayout.tsx` | Move to layout folder |
| `/src/components/Footer.tsx` | `/src/components/layout/Footer.tsx` | Move to layout folder |
| `/src/components/LoginForm.tsx` | `/src/features/auth/components/LoginForm.tsx` | Move to auth feature |
| `/src/components/RegisterForm.tsx` | `/src/features/auth/components/RegisterForm.tsx` | Move to auth feature |
| `/src/app/api/auth/` | `/src/app/api/auth/` | No change |
| `/src/app/api/agents/` | `/src/app/api/agents/` | No change |
| `/src/app/api/chat/` | `/src/app/api/chat/` | No change |
| `/src/app/api/knowledge/` | `/src/app/api/knowledge/` | No change |
| `/src/app/api/admin/` | `/src/app/api/admin/` | No change |
| `/src/app/api/google/` | `/src/app/api/google/` | No change |
| `/src/app/api/deployment/` | `/src/app/api/deployment/` | No change |
| `/src/app/api/monitoring/` | `/src/app/api/monitoring/` | No change |
| `/src/lib/` | `/src/lib/` | No change |
| `/src/hooks/` | `/src/hooks/` | No change |
| `/src/types/` | `/src/types/` | No change |
| `/src/utils/` | `/src/lib/utils/` | Move to lib folder |
| `/src/shared/` | Various feature folders | Distribute to appropriate feature folders |

## Feature-Specific File Mapping

### Authentication Feature

| Current Path | New Path |
|-------------|----------|
| `/src/components/LoginForm.tsx` | `/src/features/auth/components/LoginForm.tsx` |
| `/src/components/RegisterForm.tsx` | `/src/features/auth/components/RegisterForm.tsx` |
| `/src/components/ForgotPasswordForm.tsx` | `/src/features/auth/components/ForgotPasswordForm.tsx` |
| `/src/components/ResetPasswordForm.tsx` | `/src/features/auth/components/ResetPasswordForm.tsx` |
| `/src/hooks/useAuth.ts` | `/src/features/auth/hooks/useAuth.ts` |
| `/src/lib/auth.ts` | `/src/features/auth/utils/auth.ts` |

### Agents Feature

| Current Path | New Path |
|-------------|----------|
| `/src/components/agents/AgentCard.tsx` | `/src/features/agents/components/AgentCard.tsx` |
| `/src/components/agents/AgentList.tsx` | `/src/features/agents/components/AgentList.tsx` |
| `/src/components/agents/AgentForm.tsx` | `/src/features/agents/components/AgentForm.tsx` |
| `/src/components/agents/AgentWizard.tsx` | `/src/features/agents/components/wizard/` (split into multiple files) |
| `/src/components/agents/AgentSettings.tsx` | `/src/features/agents/components/AgentSettings.tsx` |
| `/src/hooks/useAgent.ts` | `/src/features/agents/hooks/useAgent.ts` |

### Chat Feature

| Current Path | New Path |
|-------------|----------|
| `/src/components/chat/ChatInterface.tsx` | `/src/features/chat/components/ChatInterface.tsx` |
| `/src/components/chat/ChatMessage.tsx` | `/src/features/chat/components/ChatMessage.tsx` |
| `/src/components/chat/ChatInput.tsx` | `/src/features/chat/components/ChatInput.tsx` |
| `/src/components/chat/AdvancedChatInput.tsx` | `/src/features/chat/components/AdvancedChatInput.tsx` |
| `/src/components/chat/ChatHistory.tsx` | `/src/features/chat/components/ChatHistory.tsx` |
| `/src/hooks/useChat.ts` | `/src/features/chat/hooks/useChat.ts` |

### Knowledge Feature

| Current Path | New Path |
|-------------|----------|
| `/src/components/knowledge/UploadZone.tsx` | `/src/features/knowledge/components/UploadZone.tsx` |
| `/src/components/knowledge/SmartUploadZone.tsx` | `/src/features/knowledge/components/SmartUploadZone.tsx` |
| `/src/components/knowledge/DocumentPreview.tsx` | `/src/features/knowledge/components/DocumentPreview.tsx` |
| `/src/components/knowledge/UsageAnalytics.tsx` | `/src/features/knowledge/components/UsageAnalytics.tsx` |
| `/src/lib/chromadb-integration.ts` | `/src/features/knowledge/utils/chromadb-integration.ts` |
| `/src/hooks/useKnowledge.ts` | `/src/features/knowledge/hooks/useKnowledge.ts` |

## Implementation Strategy

1. Create the new folder structure
2. Move files one feature at a time
3. Update imports
4. Test after each feature is moved
5. Commit changes for each feature
6. Update documentation 