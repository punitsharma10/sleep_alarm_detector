import type { PermissionAction } from '@/types';

export const PERMISSION_LABELS: Record<PermissionAction, string> = {
  create: 'Create',
  view: 'View',
  edit: 'Edit',
  delete: 'Delete',
};

export const PERMISSION_ORDER: PermissionAction[] = ['create', 'view', 'edit', 'delete'];
