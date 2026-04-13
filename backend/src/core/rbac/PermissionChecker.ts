import { ProjectRole } from '@prisma/client';

type Permission =
  | 'task:create'
  | 'task:delete'
  | 'task:assign'
  | 'sprint:create'
  | 'sprint:start'
  | 'sprint:complete'
  | 'project:settings'
  | 'user:manage';

const rolePermissions: Record<ProjectRole, Permission[]> = {
  ADMIN: [
    'task:create',
    'task:delete',
    'task:assign',
    'sprint:create',
    'sprint:start',
    'sprint:complete',
    'project:settings',
    'user:manage',
  ],
  PM: ['task:create', 'task:assign', 'sprint:create', 'sprint:start', 'sprint:complete'],
  DEVELOPER: ['task:create'],
  QA: ['task:create'],
  VIEWER: [],
};

class PermissionChecker {
  hasPermission(role: ProjectRole, permission: Permission): boolean {
    return rolePermissions[role]?.includes(permission) ?? false;
  }

  getPermissions(role: ProjectRole): Permission[] {
    return rolePermissions[role] ?? [];
  }
}

const permissionChecker = new PermissionChecker();

export { Permission, PermissionChecker, rolePermissions };
export default permissionChecker;