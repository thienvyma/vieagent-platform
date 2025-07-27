'use client';

import { createContext, useContext, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  hasPermission,
  hasRoleLevel,
  type UserRole,
  type Permission,
  ROLE_PERMISSIONS,
} from '@/lib/permissions';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface RoleContextValue {
  user: {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    plan?: string;
  } | null;
  role: UserRole;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasRoleLevel: (requiredRole: UserRole) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isOwner: boolean;
  canAccess: (resource: string, action?: string) => boolean;
  canModify: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canCreate: (resource: string) => boolean;
  canView: (resource: string) => boolean;
  loading: boolean;
}

export interface RoleGuardProps {
  children: React.ReactNode;
  roles?: UserRole[];
  permissions?: Permission[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
  inverse?: boolean;
}

export interface ConditionalRenderProps {
  children: React.ReactNode;
  condition: boolean;
  fallback?: React.ReactNode;
}

// =============================================================================
// ROLE CONTEXT
// =============================================================================

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const contextValue = useMemo(() => {
    // ✅ FIXED Phase 4D True Fix - Replace any type with proper session user interface
    const sessionUser = session?.user as {
      id?: string;
      email?: string | null;
      name?: string | null;
      role?: UserRole;
      plan?: string;
    };

    const user = sessionUser
      ? {
          id: sessionUser.id || '',
          email: sessionUser.email || '',
          name: sessionUser.name || undefined,
          role: (sessionUser.role || 'USER') as UserRole,
          plan: sessionUser.plan || undefined,
        }
      : null;

    const role = user?.role || 'USER';

    // Get all permissions for the user's role
    const permissions = user ? getUserPermissions(role) : [];

    return {
      user,
      role,
      permissions,
      hasPermission: (permission: Permission) => hasPermission(role, permission),
      hasRole: (requiredRole: UserRole) => role === requiredRole,
      hasAnyRole: (roles: UserRole[]) => roles.includes(role),
      hasRoleLevel: (requiredRole: UserRole) => hasRoleLevel(role, requiredRole),
      isAdmin: role === 'ADMIN',
      isManager: role === 'MANAGER',
      isOwner: role === 'OWNER',
      canAccess: (resource: string, action?: string) => {
        if (action) {
          return hasPermission(role, `${action}_${resource}` as Permission);
        }
        return hasPermission(role, `view_${resource}` as Permission);
      },
      canModify: (resource: string) => hasPermission(role, `edit_${resource}` as Permission),
      canDelete: (resource: string) => hasPermission(role, `delete_${resource}` as Permission),
      canCreate: (resource: string) => hasPermission(role, `create_${resource}` as Permission),
      canView: (resource: string) => hasPermission(role, `view_${resource}` as Permission),
      loading,
    };
  }, [session, status]);

  return <RoleContext.Provider value={contextValue}>{children}</RoleContext.Provider>;
}

// =============================================================================
// HOOKS
// =============================================================================

export function useRoleContext(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRoleContext must be used within a RoleProvider');
  }
  return context;
}

export function usePermissions() {
  const { permissions, hasPermission } = useRoleContext();
  return { permissions, hasPermission };
}

export function useRole() {
  const { role, hasRole, hasAnyRole, hasRoleLevel, isAdmin, isManager, isOwner } = useRoleContext();
  return { role, hasRole, hasAnyRole, hasRoleLevel, isAdmin, isManager, isOwner };
}

export function useResourceAccess(resource: string) {
  const { canAccess, canModify, canDelete, canCreate, canView } = useRoleContext();

  return useMemo(
    () => ({
      canAccess: (action?: string) => canAccess(resource, action),
      canModify: () => canModify(resource),
      canDelete: () => canDelete(resource),
      canCreate: () => canCreate(resource),
      canView: () => canView(resource),
      access: {
        view: canView(resource),
        create: canCreate(resource),
        edit: canModify(resource),
        delete: canDelete(resource),
      },
    }),
    [resource, canAccess, canModify, canDelete, canCreate, canView]
  );
}

// =============================================================================
// COMPONENTS
// =============================================================================

export function RoleGuard({
  children,
  roles,
  permissions,
  fallback = null,
  requireAll = false,
  inverse = false,
}: RoleGuardProps) {
  const { role, hasPermission, hasAnyRole, loading } = useRoleContext();

  if (loading) {
    return <div className='animate-pulse bg-gray-800 rounded h-8 w-full' />;
  }

  let hasAccess = true;

  // Check roles
  if (roles && roles.length > 0) {
    hasAccess = hasAnyRole(roles);
  }

  // Check permissions
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAccess && permissions.every(permission => hasPermission(permission));
    } else {
      hasAccess = hasAccess && permissions.some(permission => hasPermission(permission));
    }
  }

  // Apply inverse logic if specified
  if (inverse) {
    hasAccess = !hasAccess;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

export function ConditionalRender({
  children,
  condition,
  fallback = null,
}: ConditionalRenderProps) {
  return condition ? <>{children}</> : <>{fallback}</>;
}

export function AdminOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard roles={['ADMIN', 'OWNER']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ManagerOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard roles={['MANAGER', 'ADMIN', 'OWNER']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function OwnerOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard roles={['OWNER']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard permissions={[permission]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getUserPermissions(role: UserRole): Permission[] {
  // Get permissions from the existing permissions system
  return ROLE_PERMISSIONS[role] || [];
}

// =============================================================================
// HIGHER-ORDER COMPONENTS
// =============================================================================

export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    roles?: UserRole[];
    permissions?: Permission[];
    fallback?: React.ComponentType<any>;
    requireAll?: boolean;
  }
) {
  const WrappedComponent = (props: P) => {
    const FallbackComponent = options.fallback || (() => null);

    return (
      <RoleGuard
        roles={options.roles}
        permissions={options.permissions}
        requireAll={options.requireAll}
        fallback={<FallbackComponent />}
      >
        <Component {...props} />
      </RoleGuard>
    );
  };

  WrappedComponent.displayName = `withRoleGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  fallback?: React.ComponentType<any>
) {
  return withRoleGuard(Component, { permissions: [permission], fallback });
}

export function withAdminAccess<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<any>
) {
  return withRoleGuard(Component, { roles: ['ADMIN', 'OWNER'], fallback });
}

// =============================================================================
// ROLE-BASED UI UTILITIES
// =============================================================================

export class RoleBasedUI {
  static filterMenuItems<T extends { requiredRole?: UserRole; requiredPermission?: Permission }>(
    items: T[],
    userRole: UserRole
  ): T[] {
    return items.filter(item => {
      if (item.requiredRole && !hasRoleLevel(userRole, item.requiredRole)) {
        return false;
      }
      if (item.requiredPermission && !hasPermission(userRole, item.requiredPermission)) {
        return false;
      }
      return true;
    });
  }

  static getAvailableActions(
    resource: string,
    userRole: UserRole
  ): { action: string; permission: Permission; available: boolean }[] {
    const actions = [
      { action: 'view', permission: `view_${resource}` as Permission },
      { action: 'create', permission: `create_${resource}` as Permission },
      { action: 'edit', permission: `edit_${resource}` as Permission },
      { action: 'delete', permission: `delete_${resource}` as Permission },
      { action: 'manage', permission: `manage_${resource}` as Permission },
    ];

    return actions.map(({ action, permission }) => ({
      action,
      permission,
      available: hasPermission(userRole, permission),
    }));
  }

  static canAccessRoute(route: string, userRole: UserRole): boolean {
    // Define route permissions
    const routePermissions: Record<string, Permission[]> = {
      '/admin': ['view_dashboard'],
      '/admin/users': ['view_users'],
      '/admin/agents': ['view_agents'],
      '/admin/subscriptions': ['view_subscriptions'],
      '/admin/plans': ['view_plans'],
      '/admin/payments': ['view_payments'],
      '/admin/blog': ['view_blog'],
      '/admin/newsletter': ['view_newsletter'],
      '/admin/contact': ['view_contacts'],
      '/admin/announcements': ['view_announcements'],
      '/admin/vps': ['view_vps'],
      '/admin/settings': ['view_settings'],
    };

    const requiredPermissions = routePermissions[route];
    if (!requiredPermissions) return true; // No restrictions

    return requiredPermissions.some(permission => hasPermission(userRole, permission));
  }

  static getRoleColor(role: UserRole): string {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'ADMIN':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'MANAGER':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'USER':
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }

  static getRoleIcon(role: UserRole): string {
    switch (role) {
      case 'OWNER':
        return '👑';
      case 'ADMIN':
        return '🛡️';
      case 'MANAGER':
        return '👨‍💼';
      case 'USER':
      default:
        return '👤';
    }
  }

  static formatRoleName(role: UserRole): string {
    switch (role) {
      case 'OWNER':
        return 'Owner';
      case 'ADMIN':
        return 'Administrator';
      case 'MANAGER':
        return 'Manager';
      case 'USER':
        return 'User';
      default:
        return role;
    }
  }
}

// =============================================================================
// CUSTOM HOOKS FOR SPECIFIC USE CASES
// =============================================================================

export function useAdminAccess() {
  const { hasRoleLevel } = useRoleContext();
  return hasRoleLevel('ADMIN');
}

export function useManagerAccess() {
  const { hasRoleLevel } = useRoleContext();
  return hasRoleLevel('MANAGER');
}

export function useOwnerAccess() {
  const { hasRole } = useRoleContext();
  return hasRole('OWNER');
}

export function useCanManageUsers() {
  const { hasPermission } = useRoleContext();
  return hasPermission('manage_users');
}

export function useCanManageAgents() {
  const { hasPermission } = useRoleContext();
  return hasPermission('manage_agents');
}

export function useCanAccessSettings() {
  const { hasPermission } = useRoleContext();
  return hasPermission('manage_system_settings');
}

export function useFilteredNavigation<
  T extends { requiredRole?: UserRole; requiredPermission?: Permission },
>(navigationItems: T[]) {
  const { role } = useRoleContext();

  return useMemo(() => RoleBasedUI.filterMenuItems(navigationItems, role), [navigationItems, role]);
}

export function useResourcePermissions(resource: string) {
  const { role } = useRoleContext();

  return useMemo(() => RoleBasedUI.getAvailableActions(resource, role), [resource, role]);
}

// =============================================================================
// DEBUGGING UTILITIES
// =============================================================================

export function useRoleDebug() {
  const context = useRoleContext();

  if (process.env.NODE_ENV === 'development') {
    console.log('Role Context:', {
      user: context.user,
      role: context.role,
      permissions: context.permissions,
      loading: context.loading,
    });
  }

  return context;
}
