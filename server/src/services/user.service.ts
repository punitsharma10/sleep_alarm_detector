import { User, IUser } from '../models/User';
import { DetectionHistory } from '../models/DetectionHistory';
import { DetectionSession } from '../models/DetectionSession';
import { ApiError } from '../utils/ApiError';
import {
  Permissions,
  ModuleAccess,
  canActOn,
  canAssignLevel,
  canGrantPermissions,
} from '../utils/permissions';
import { toPublicUser } from './auth.service';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  designation: string;
  level: number;
  permissions: Permissions;
  modules: ModuleAccess;
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
  designation?: string;
  level?: number;
  permissions?: Permissions;
  modules?: ModuleAccess;
  status?: 'active' | 'inactive';
}

/** List org users the actor is allowed to see (strictly below their level). */
export async function listUsers(actor: IUser) {
  const users = await User.find({
    organization: actor.organization,
    level: { $lt: actor.level },
    _id: { $ne: actor._id },
  })
    .sort({ level: -1, createdAt: -1 })
    .lean();

  return users.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    designation: u.designation,
    level: u.level,
    permissions: u.permissions,
    modules: u.modules,
    status: u.status,
    createdAt: u.createdAt,
  }));
}

async function loadTarget(actor: IUser, targetId: string): Promise<IUser> {
  const target = await User.findById(targetId);
  if (!target || target.organization?.toString() !== actor.organization?.toString()) {
    throw ApiError.notFound('User not found');
  }
  return target;
}

export async function createUser(actor: IUser, input: CreateUserInput) {
  if (!actor.permissions.create) {
    throw ApiError.forbidden('You do not have permission to create users');
  }
  if (!canAssignLevel(actor, input.level)) {
    throw ApiError.forbidden('You can only assign a level below your own');
  }
  if (!canGrantPermissions(actor, input.permissions)) {
    throw ApiError.forbidden('You cannot grant permissions you do not have yourself');
  }

  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    designation: input.designation,
    level: input.level,
    permissions: input.permissions,
    modules: input.modules,
    role: 'orgUser',
    organization: actor.organization,
    status: 'active',
    createdBy: actor._id,
  });

  return toPublicUser(user);
}

export async function getUser(actor: IUser, targetId: string) {
  const target = await loadTarget(actor, targetId);
  if (!canActOn(actor, target, 'view')) {
    throw ApiError.forbidden('You do not have permission to view this user');
  }
  return toPublicUser(target);
}

export async function getUserDetections(actor: IUser, targetId: string, page: number, limit: number) {
  const target = await loadTarget(actor, targetId);
  if (!canActOn(actor, target, 'view')) {
    throw ApiError.forbidden('You do not have permission to view this user');
  }
  const [items, total] = await Promise.all([
    DetectionHistory.find({ user: target._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    DetectionHistory.countDocuments({ user: target._id }),
  ]);
  return {
    user: { _id: target._id, name: target.name, email: target.email, designation: target.designation, level: target.level },
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/** Sessions of a managed user (admin read-only, permission-gated). */
export async function getUserSessions(actor: IUser, targetId: string, page: number, limit: number) {
  const target = await loadTarget(actor, targetId);
  if (!canActOn(actor, target, 'view')) {
    throw ApiError.forbidden('You do not have permission to view this user');
  }
  const filter = { user: target._id };
  const [items, total] = await Promise.all([
    DetectionSession.find(filter).sort({ startedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    DetectionSession.countDocuments(filter),
  ]);
  return {
    user: { _id: target._id, name: target.name, email: target.email, designation: target.designation, level: target.level, permissions: target.permissions, modules: target.modules, status: target.status },
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getUserSession(actor: IUser, targetId: string, sessionId: string) {
  const target = await loadTarget(actor, targetId);
  if (!canActOn(actor, target, 'view')) {
    throw ApiError.forbidden('You do not have permission to view this user');
  }
  if (!/^[a-f0-9]{24}$/i.test(sessionId)) throw ApiError.notFound('Session not found');
  const session = await DetectionSession.findOne({ _id: sessionId, user: target._id }).lean();
  if (!session) throw ApiError.notFound('Session not found');
  const events = await DetectionHistory.find({ session: session._id }).sort({ createdAt: 1 }).lean();
  return { session, events };
}

export async function updateUser(actor: IUser, targetId: string, input: UpdateUserInput) {
  const target = await loadTarget(actor, targetId);
  if (!canActOn(actor, target, 'edit')) {
    throw ApiError.forbidden('You do not have permission to edit this user');
  }

  if (input.level !== undefined && !canAssignLevel(actor, input.level)) {
    throw ApiError.forbidden('You can only assign a level below your own');
  }
  if (input.permissions && !canGrantPermissions(actor, input.permissions)) {
    throw ApiError.forbidden('You cannot grant permissions you do not have yourself');
  }

  if (input.name !== undefined) target.name = input.name;
  if (input.password) target.password = input.password;
  if (input.designation !== undefined) target.designation = input.designation;
  if (input.level !== undefined) target.level = input.level;
  if (input.permissions) target.permissions = input.permissions;
  if (input.modules) target.modules = input.modules;
  if (input.status !== undefined) target.status = input.status;

  await target.save();
  return toPublicUser(target);
}

/** Soft delete: mark the user inactive so they can no longer log in. */
export async function deactivateUser(actor: IUser, targetId: string) {
  const target = await loadTarget(actor, targetId);
  if (!canActOn(actor, target, 'delete')) {
    throw ApiError.forbidden('You do not have permission to remove this user');
  }
  target.status = 'inactive';
  await target.save();
  return { _id: target._id, status: target.status };
}
