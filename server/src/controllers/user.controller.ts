import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { toPublicUser } from '../services/auth.service';
import * as userService from '../services/user.service';

// ---- Self (the logged-in user) ----

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  res.json({ success: true, user: { ...toPublicUser(user), createdAt: user.createdAt } });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  user.settings = { ...user.settings, ...req.body };
  await user.save();
  res.json({ success: true, settings: user.settings });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (typeof req.body.name === 'string') user.name = req.body.name;
  if (typeof req.body.avatarUrl === 'string') user.avatarUrl = req.body.avatarUrl;
  await user.save();
  res.json({
    success: true,
    user: { _id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
  });
});

// ---- Managing other org users (RBAC guarded) ----

export const listManagedUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.listUsers(req.user!);
  res.json({ success: true, users });
});

export const createManagedUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.user!, req.body);
  res.status(201).json({ success: true, user });
});

export const getManagedUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUser(req.user!, req.params.id);
  res.json({ success: true, user });
});

export const getManagedUserDetections = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await userService.getUserDetections(req.user!, req.params.id, page, limit);
  res.json({ success: true, ...result });
});

export const getManagedUserSessions = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await userService.getUserSessions(req.user!, req.params.id, page, limit);
  res.json({ success: true, ...result });
});

export const getManagedUserSession = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.getUserSession(req.user!, req.params.id, req.params.sessionId);
  res.json({ success: true, ...result });
});

export const updateManagedUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.user!, req.params.id, req.body);
  res.json({ success: true, user });
});

export const deactivateManagedUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.deactivateUser(req.user!, req.params.id);
  res.json({ success: true, ...result });
});
