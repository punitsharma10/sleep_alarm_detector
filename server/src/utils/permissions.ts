/**
 * Hierarchical RBAC helpers.
 *
 * Rules:
 *  - Every org user has a level 1..10. Higher = more authority.
 *  - A user can only act on users STRICTLY below their own level.
 *  - Each action (create/view/edit/delete) also needs the matching permission.
 *  - No one can act on themselves for edit/delete.
 *  - When creating/editing, you can only assign a level below your own and grant
 *    permissions you yourself hold (no privilege escalation).
 *  - Super Admin (role 'superadmin') is a platform role outside the 1..10 scale.
 */

export type PermissionAction = 'create' | 'view' | 'edit' | 'delete';

export const PERMISSION_ACTIONS: PermissionAction[] = ['create', 'view', 'edit', 'delete'];

export interface Permissions {
  create: boolean;
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export function emptyPermissions(): Permissions {
  return { create: false, view: false, edit: false, delete: false };
}

export function fullPermissions(): Permissions {
  return { create: true, view: true, edit: true, delete: true };
}

/** Page/module access — controls which sidebar pages a user can reach. */
export type ModuleKey =
  | 'dashboard'
  | 'liveDetection'
  | 'history'
  | 'analytics'
  | 'users'
  | 'settings'
  | 'profile';

export const MODULE_KEYS: ModuleKey[] = [
  'dashboard',
  'liveDetection',
  'history',
  'analytics',
  'users',
  'settings',
  'profile',
];

export type ModuleAccess = Record<ModuleKey, boolean>;

export function fullModules(): ModuleAccess {
  return {
    dashboard: true,
    liveDetection: true,
    history: true,
    analytics: true,
    users: true,
    settings: true,
    profile: true,
  };
}

/** Sensible default for a brand-new user (own screens, no user management). */
export function defaultModules(): ModuleAccess {
  return {
    dashboard: true,
    liveDetection: true,
    history: true,
    analytics: false,
    users: false,
    settings: false,
    profile: true,
  };
}

export interface ActorLike {
  _id: { toString(): string };
  role: 'superadmin' | 'orgUser';
  level: number;
  permissions: Permissions;
  organization?: { toString(): string } | null;
}

export interface TargetLike {
  _id: { toString(): string };
  level: number;
  organization?: { toString(): string } | null;
}

function sameOrg(actor: ActorLike, target: TargetLike): boolean {
  const a = actor.organization?.toString();
  const t = target.organization?.toString();
  return !!a && !!t && a === t;
}

/** Can `actor` perform `action` on `target`? */
export function canActOn(actor: ActorLike, target: TargetLike, action: PermissionAction): boolean {
  if (actor.role === 'superadmin') return false; // super admin manages orgs, not org users
  if (!sameOrg(actor, target)) return false;
  const isSelf = actor._id.toString() === target._id.toString();
  if ((action === 'edit' || action === 'delete') && isSelf) return false; // no self edit/delete
  if (actor.level <= target.level) return false; // must be strictly higher
  return !!actor.permissions[action];
}

/** Validate a level the actor wants to assign to a new/edited user. */
export function canAssignLevel(actor: ActorLike, level: number): boolean {
  return level >= 1 && level < actor.level;
}

/** Ensure the actor is not granting permissions they don't have themselves. */
export function canGrantPermissions(actor: ActorLike, requested: Permissions): boolean {
  return PERMISSION_ACTIONS.every((a) => !requested[a] || actor.permissions[a]);
}
