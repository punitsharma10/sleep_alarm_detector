import type { PermissionAction, ModuleKey } from '@/types';

export const PERMISSION_LABELS: Record<PermissionAction, string> = {
  create: 'Create',
  view: 'View',
  edit: 'Edit',
  delete: 'Delete',
};

export const PERMISSION_ORDER: PermissionAction[] = ['create', 'view', 'edit', 'delete'];

/** The pages a user can be granted access to. `path` maps to the router route. */
export interface ModuleDef {
  key: ModuleKey;
  label: string;
  path: string;
}

export const MODULES: ModuleDef[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/app' },
  { key: 'liveDetection', label: 'Live Detection', path: '/app/detection' },
  { key: 'history', label: 'History', path: '/app/history' },
  { key: 'analytics', label: 'Analytics', path: '/app/analytics' },
  { key: 'users', label: 'Users', path: '/app/users' },
  { key: 'settings', label: 'Settings', path: '/app/settings' },
  { key: 'profile', label: 'Profile', path: '/app/profile' },
];

export const MODULE_ORDER: ModuleKey[] = MODULES.map((m) => m.key);
