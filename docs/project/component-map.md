# Component Map

This document maps out the components in the AI Agent Platform, categorizing them as global reusable components or feature-specific components, and provides recommendations for reorganization.

## Global Reusable Components

These components should be moved to `/src/components/ui/` as they are used across multiple features and represent core UI elements.

### UI Components

| Component | Current Location | Recommendation |
|-----------|------------------|----------------|
| Button | `/src/components/ui/Button.tsx` | Keep in `/components/ui/` |
| Input | `/src/components/ui/Input.tsx` | Keep in `/components/ui/` |
| Select | `/src/components/ui/Select.tsx` | Keep in `/components/ui/` |
| Checkbox | `/src/components/ui/Checkbox.tsx` | Keep in `/components/ui/` |
| Switch | `/src/components/ui/Switch.tsx` | Keep in `/components/ui/` |
| Modal | `/src/components/ui/Modal.tsx` | Keep in `/components/ui/` |
| Card | `/src/components/ui/Card.tsx` | Keep in `/components/ui/` |
| Badge | `/src/components/ui/Badge.tsx` | Keep in `/components/ui/` |
| Alert | `/src/components/ui/Alert.tsx` | Keep in `/components/ui/` |
| Tabs | `/src/components/ui/Tabs.tsx` | Keep in `/components/ui/` |
| Tooltip | `/src/components/ui/Tooltip.tsx` | Keep in `/components/ui/` |
| Avatar | `/src/components/ui/Avatar.tsx` | Keep in `/components/ui/` |
| Spinner | `/src/components/ui/Spinner.tsx` | Keep in `/components/ui/` |
| Dropdown | `/src/components/ui/Dropdown.tsx` | Keep in `/components/ui/` |
| OfflineSupport | `/src/components/ui/OfflineSupport.tsx` | Keep in `/components/ui/` |
| MobileOptimizedLayout | `/src/components/ui/MobileOptimizedLayout.tsx` | Keep in `/components/ui/` |

### Layout Components

These components should be moved to `/src/components/layout/` as they define the overall structure of the application.

| Component | Current Location | Recommendation |
|-----------|------------------|----------------|
| PageLayout | `/src/components/PageLayout.tsx` | Move to `/components/layout/` |
| DashboardLayout | `/src/components/dashboard/DashboardLayout.tsx` | Move to `/components/layout/` |
| AdminLayout | `/src/components/admin/AdminLayout.tsx` | Move to `/components/layout/` |
| Sidebar | `/src/components/dashboard/Sidebar.tsx` | Move to `/components/layout/` |
| Header | `/src/components/dashboard/Header.tsx` | Move to `/components/layout/` |
| Footer | `/src/components/Footer.tsx` | Move to `/components/layout/` |

## Feature-Specific Components

These components should be moved to their respective feature folders as they are specific to particular features.

### Authentication Components

| Component | Current Location | Recommendation |
|-----------|------------------|----------------|
| LoginForm | `/src/components/LoginForm.tsx` | Move to `/features/auth/components/` |
| RegisterForm | `/src/components/RegisterForm.tsx` | Move to `/features/auth/components/` |
| ForgotPasswordForm | `/src/components/ForgotPasswordForm.tsx` | Move to `/features/auth/components/` |
| ResetPasswordForm | `/src/components/ResetPasswordForm.tsx` | Move to `/features/auth/components/` |

### Agent Components

| Component | Current Location | Recommendation |
|-----------|------------------|----------------|
| AgentCard | `/src/components/agents/AgentCard.tsx` | Move to `/features/agents/components/` |
| AgentList | `/src/components/agents/AgentList.tsx` | Move to `/features/agents/components/` |
| AgentForm | `/src/components/agents/AgentForm.tsx` | Move to `/features/agents/components/` |
| AgentWizard | `/src/components/agents/AgentWizard.tsx` | Split into smaller components and move to `/features/agents/components/` |
| AgentSettings | `/src/components/agents/AgentSettings.tsx` | Move to `/features/agents/components/` |
| AgentStats | `/src/components/agents/AgentStats.tsx` | Move to `/features/agents/components/` |
| AgentValidation | `/src/components/agents/AgentValidation.tsx` | Move to `/features/agents/components/` |

### Chat Components

| Component | Current Location | Recommendation |
|-----------|------------------|----------------|
| ChatInterface | `/src/components/chat/ChatInterface.tsx` | Move to `/features/chat/components/` |
| ChatMessage | `/src/components/chat/ChatMessage.tsx` | Move to `/features/chat/components/` |
| ChatInput | `/src/components/chat/ChatInput.tsx` | Move to `/features/chat/components/` |
| AdvancedChatInput | `/src/components/chat/AdvancedChatInput.tsx` | Move to `/features/chat/components/` |
| ChatHistory | `/src/components/chat/ChatHistory.tsx` | Move to `/features/chat/components/` |
| ChatSettings | `/src/components/chat/ChatSettings.tsx` | Move to `/features/chat/components/` |

### Knowledge Components

| Component | Current Location | Recommendation |
|-----------|------------------|----------------|
| UploadZone | `/src/components/knowledge/UploadZone.tsx` | Move to `/features/knowledge/components/` |
| SmartUploadZone | `/src/components/knowledge/SmartUploadZone.tsx` | Move to `/features/knowledge/components/` |
| DocumentPreview | `/src/components/knowledge/DocumentPreview.tsx` | Move to `/features/knowledge/components/` |
| UsageAnalytics | `/src/components/knowledge/UsageAnalytics.tsx` | Move to `/features/knowledge/components/` |
| OrphanCleanupPanel | `/src/components/knowledge/OrphanCleanupPanel.tsx` | Move to `/features/knowledge/components/` |
| BulkOperationsToolbar | `/src/components/knowledge/BulkOperationsToolbar.tsx` | Move to `/features/knowledge/components/` |

### Admin Components

| Component | Current Location | Recommendation |
|-----------|------------------|----------------|
| AdminDashboard | `/src/components/admin/AdminDashboard.tsx` | Move to `/features/admin/components/` |
| UserManagement | `/src/components/admin/UserManagement.tsx` | Move to `/features/admin/components/` |
| SystemStats | `/src/components/admin/SystemStats.tsx` | Move to `/features/admin/components/` |
| DiskMonitoringWidget | `/src/components/admin/DiskMonitoringWidget.tsx` | Move to `/features/admin/components/` |

### Google Integration Components

| Component | Current Location | Recommendation |
|-----------|------------------|----------------|
| GoogleAuth | `/src/components/google/GoogleAuth.tsx` | Move to `/features/integrations/google/components/` |
| CalendarIntegration | `/src/components/calendar/CalendarIntegration.tsx` | Move to `/features/integrations/google/components/` |
| GmailIntegration | `/src/components/gmail/GmailIntegration.tsx` | Move to `/features/integrations/google/components/` |
| SheetsIntegration | `/src/components/sheets/SheetsIntegration.tsx` | Move to `/features/integrations/google/components/` |
| DriveIntegration | `/src/components/drive/DriveIntegration.tsx` | Move to `/features/integrations/google/components/` |
| DocsIntegration | `/src/components/docs/DocsIntegration.tsx` | Move to `/features/integrations/google/components/` |

### Dashboard Components

| Component | Current Location | Recommendation |
|-----------|------------------|----------------|
| UserDashboard | `/src/components/dashboard/UserDashboard.tsx` | Move to `/features/dashboard/components/` |
| UpgradeButton | `/src/components/dashboard/UpgradeButton.tsx` | Move to `/features/dashboard/components/` |
| PlanUpgradeModal | `/src/components/dashboard/PlanUpgradeModal.tsx` | Move to `/features/dashboard/components/` |

### Monitoring Components

| Component | Current Location | Recommendation |
|-----------|------------------|----------------|
| SystemMonitor | `/src/components/monitoring/SystemMonitor.tsx` | Move to `/features/monitoring/components/` |

## Components to Merge or Remove

| Component | Current Location | Recommendation |
|-----------|------------------|----------------|
| SimpleButton | `/src/components/SimpleButton.tsx` | Merge with Button component |
| BasicInput | `/src/components/BasicInput.tsx` | Merge with Input component |
| LegacyForm | `/src/components/LegacyForm.tsx` | Remove (deprecated) |
| OldDashboard | `/src/components/OldDashboard.tsx` | Remove (deprecated) |

## Components to Split

| Component | Current Location | Recommendation |
|-----------|------------------|----------------|
| AgentWizard | `/src/components/agents/AgentWizard.tsx` | Split into multiple smaller components (2,185 lines) | 