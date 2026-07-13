import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound('User not found');
  res.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      settings: user.settings,
      createdAt: user.createdAt,
    },
  });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound('User not found');

  user.settings = { ...user.settings, ...req.body };
  await user.save();

  res.json({ success: true, settings: user.settings });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound('User not found');

  if (typeof req.body.name === 'string') user.name = req.body.name;
  if (typeof req.body.avatarUrl === 'string') user.avatarUrl = req.body.avatarUrl;
  await user.save();

  res.json({
    success: true,
    user: { _id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
  });
});
