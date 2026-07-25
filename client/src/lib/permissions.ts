import type { User, PermissionAction } from '@/types';

/**
 * Mirrors the backend RBAC rules so the UI can hide/disable actions the user
 * can't perform. The backend still re-checks everything — this is only for UX.
 */
export function canActOn(
  actor: User,
  target: { _id: string; level: number },
  action: PermissionAction
): boolean {
  if (actor.role !== 'orgUser') return false;
  const isSelf = actor._id === target._id;
  if ((action === 'edit' || action === 'delete') && isSelf) return false;
  if (actor.level <= target.level) return false;
  return actor.permissions[action];
}

/** Does the user have any management permission at all (to show the Users area)? */
export function hasAnyManagePermission(user: User | null): boolean {
  if (!user || user.role !== 'orgUser') return false;
  const p = user.permissions;
  return p.create || p.view || p.edit || p.delete;
}

/** Max level this actor can assign to someone else (strictly below their own). */
export function maxAssignableLevel(actor: User): number {
  return Math.max(1, actor.level - 1);
}
