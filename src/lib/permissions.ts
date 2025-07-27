// Role hierarchy: OWNER > ADMIN > MANAGER > USER
export const ROLE_HIERARCHY = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  USER: 1,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

// Define all permissions
export type Permission =
  | 'view_dashboard'
  | 'view_users'
  | 'create_users'
  | 'edit_users'
  | 'delete_users'
  | 'change_user_roles'
  | 'change_user_plans'
  | 'reset_user_passwords'
  | 'view_agents'
  | 'create_agents'
  | 'edit_agents'
  | 'delete_agents'
  | 'view_subscriptions'
  | 'create_subscriptions'
  | 'edit_subscriptions'
  | 'delete_subscriptions'
  | 'manage_subscriptions'
  | 'approve_subscriptions'
  | 'cancel_subscriptions'
  | 'refund_subscriptions'
  | 'view_payments'
  | 'manage_payments'
  | 'verify_payments'
  | 'view_plans'
  | 'manage_plans'
  | 'create_plans'
  | 'edit_plans'
  | 'delete_plans'
  | 'view_settings'
  | 'edit_settings'
  | 'manage_system_settings'
  | 'view_announcements'
  | 'create_announcements'
  | 'edit_announcements'
  | 'delete_announcements'
  | 'manage_announcements'
  | 'view_newsletter'
  | 'create_newsletter'
  | 'edit_newsletter'
  | 'delete_newsletter'
  | 'view_contacts'
  | 'respond_contacts'
  | 'delete_contacts'
  | 'view_blog'
  | 'create_blog'
  | 'edit_blog'
  | 'delete_blog'
  | 'manage_blogs'
  | 'view_metrics'
  | 'manage_featured_content'
  | 'view_analytics'
  | 'view_logs'
  | 'view_vps'
  | 'manage_vps'
  | 'create_vps'
  | 'edit_vps'
  | 'delete_vps'
  | 'deploy_agents'
  | 'view_deployments'
  | 'manage_deployments'
  | 'view_monitoring'
  | 'manage_monitoring'
  | 'export_data'
  | 'manage_users'
  | 'manage_agents';

// Permission matrix for each role
// ✅ FIXED in Phase 4D cleanup - Added missing permissions for manage_users and manage_agents
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    'view_dashboard',
    'view_users',
    'create_users',
    'edit_users',
    'delete_users',
    'change_user_roles',
    'change_user_plans',
    'reset_user_passwords',
    'view_agents',
    'create_agents',
    'edit_agents',
    'delete_agents',
    'view_subscriptions',
    'create_subscriptions',
    'edit_subscriptions',
    'delete_subscriptions',
    'manage_subscriptions',
    'approve_subscriptions',
    'cancel_subscriptions',
    'refund_subscriptions',
    'view_payments',
    'manage_payments',
    'verify_payments',
    'view_plans',
    'manage_plans',
    'create_plans',
    'edit_plans',
    'delete_plans',
    'view_settings',
    'edit_settings',
    'manage_system_settings',
    'view_announcements',
    'create_announcements',
    'edit_announcements',
    'delete_announcements',
    'manage_announcements',
    'view_newsletter',
    'create_newsletter',
    'edit_newsletter',
    'delete_newsletter',
    'view_contacts',
    'respond_contacts',
    'delete_contacts',
    'view_blog',
    'create_blog',
    'edit_blog',
    'delete_blog',
    'manage_blogs',
    'view_metrics',
    'manage_featured_content',
    'view_analytics',
    'view_logs',
    'view_vps',
    'manage_vps',
    'create_vps',
    'edit_vps',
    'delete_vps',
    'deploy_agents',
    'view_deployments',
    'manage_deployments',
    'view_monitoring',
    'manage_monitoring',
    'export_data',
    'manage_users',
    'manage_agents',
  ],
  ADMIN: [
    'view_dashboard',
    'view_users',
    'create_users',
    'edit_users',
    'delete_users',
    'change_user_roles',
    'change_user_plans',
    'reset_user_passwords',
    'view_agents',
    'create_agents',
    'edit_agents',
    'delete_agents',
    'view_subscriptions',
    'create_subscriptions',
    'edit_subscriptions',
    'delete_subscriptions',
    'manage_subscriptions',
    'approve_subscriptions',
    'cancel_subscriptions',
    'view_payments',
    'verify_payments',
    'view_plans',
    'manage_plans',
    'create_plans',
    'edit_plans',
    'delete_plans',
    'view_settings',
    'edit_settings',
    'view_announcements',
    'create_announcements',
    'edit_announcements',
    'delete_announcements',
    'manage_announcements',
    'view_newsletter',
    'create_newsletter',
    'edit_newsletter',
    'delete_newsletter',
    'view_contacts',
    'respond_contacts',
    'delete_contacts',
    'view_blog',
    'create_blog',
    'edit_blog',
    'delete_blog',
    'manage_blogs',
    'view_metrics',
    'manage_featured_content',
    'view_analytics',
    'view_logs',
    'view_vps',
    'manage_vps',
    'create_vps',
    'edit_vps',
    'delete_vps',
    'deploy_agents',
    'view_deployments',
    'manage_deployments',
    'view_monitoring',
    'manage_monitoring',
    'export_data',
    'manage_users',
    'manage_agents',
  ],
  MANAGER: [
    'view_dashboard',
    'view_users',
    'view_agents',
    'view_subscriptions',
    'approve_subscriptions',
    'view_plans',
    'view_logs',
    'view_analytics',
    'view_announcements',
    'create_announcements',
    'edit_announcements',
    'view_newsletter',
    'create_newsletter',
    'edit_newsletter',
    'view_contacts',
    'respond_contacts',
    'view_blog',
    'create_blog',
    'edit_blog',
    'manage_blogs',
    'view_metrics',
    'manage_featured_content',
    'view_vps',
    'view_deployments',
    'deploy_agents',
    'view_monitoring',
  ],
  USER: [],
};

// Check if user has required role level
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 1;
  return userLevel >= requiredLevel;
}

// Check if user has specific permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

// Check if user can modify another user
export function canModifyUser(
  currentUserRole: UserRole,
  currentUserId: string,
  targetUserRole: UserRole,
  targetUserId: string
): boolean {
  // Cannot modify yourself
  if (currentUserId === targetUserId) {
    return false;
  }

  // OWNER can modify anyone
  if (currentUserRole === 'OWNER') {
    return true;
  }

  // ADMIN cannot modify OWNER or other ADMINs
  if (currentUserRole === 'ADMIN') {
    if (targetUserRole === 'OWNER' || targetUserRole === 'ADMIN') {
      return false;
    }
    return true;
  }

  // MANAGER can only view
  if (currentUserRole === 'MANAGER') {
    return false;
  }

  return false;
}

// Check if user can delete another user
export function canDeleteUser(
  currentUserRole: UserRole,
  currentUserId: string,
  targetUserRole: UserRole,
  targetUserId: string
): boolean {
  // Cannot delete yourself
  if (currentUserId === targetUserId) {
    return false;
  }

  // OWNER can delete anyone except themselves
  if (currentUserRole === 'OWNER') {
    return true;
  }

  // ADMIN cannot delete OWNER or other ADMINs
  if (currentUserRole === 'ADMIN') {
    if (targetUserRole === 'OWNER' || targetUserRole === 'ADMIN') {
      return false;
    }
    return true;
  }

  // MANAGER cannot delete anyone
  return false;
}

// Check if user can change role
export function canChangeRole(
  currentUserRole: UserRole,
  currentUserId: string,
  targetUserRole: UserRole,
  targetUserId: string,
  newRole: UserRole
): boolean {
  // Cannot change your own role
  if (currentUserId === targetUserId) {
    return false;
  }

  // Cannot assign role higher than your own
  if (!hasRoleLevel(currentUserRole, newRole)) {
    return false;
  }

  // OWNER can change anyone's role
  if (currentUserRole === 'OWNER') {
    return true;
  }

  // ADMIN cannot change OWNER or other ADMINs
  if (currentUserRole === 'ADMIN') {
    if (targetUserRole === 'OWNER' || targetUserRole === 'ADMIN') {
      return false;
    }
    return true;
  }

  // MANAGER cannot change roles
  return false;
}

// Check if user can access admin dashboard
export function canAccessAdmin(userRole: UserRole): boolean {
  return ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);
}

// Get available actions for user management based on role
export function getAvailableUserActions(
  currentUserRole: UserRole,
  currentUserId: string,
  targetUserRole: UserRole,
  targetUserId: string
): string[] {
  const actions: string[] = ['view'];

  if (canModifyUser(currentUserRole, currentUserId, targetUserRole, targetUserId)) {
    actions.push('edit');
  }

  if (hasPermission(currentUserRole, 'reset_user_passwords')) {
    actions.push('reset_password');
  }

  if (canChangeRole(currentUserRole, currentUserId, targetUserRole, targetUserId, targetUserRole)) {
    actions.push('change_role');
  }

  if (hasPermission(currentUserRole, 'change_user_plans')) {
    actions.push('change_plan');
  }

  if (canDeleteUser(currentUserRole, currentUserId, targetUserRole, targetUserId)) {
    actions.push('delete');
  }

  return actions;
}

// Get role display name
export function getRoleDisplayName(role: UserRole): string {
  const displayNames = {
    OWNER: 'Chủ sở hữu',
    ADMIN: 'Quản trị viên',
    MANAGER: 'Quản lý',
    USER: 'Người dùng',
  };
  return displayNames[role] || role;
}

// Get role color for UI
export function getRoleColor(role: UserRole): string {
  const colors = {
    OWNER: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    ADMIN: 'bg-red-500/20 text-red-300 border-red-500/30',
    MANAGER: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    USER: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return colors[role] || colors.USER;
}
