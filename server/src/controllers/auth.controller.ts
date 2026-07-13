import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as authService from '../services/auth.service';
import { env } from '../config/env';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax' as const,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  path: '/api/auth',
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const result = await authService.register(name, email, password);
  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);
  res.status(201).json({
    success: true,
    user: result.user,
    accessToken: result.accessToken,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);
  res.json({
    success: true,
    user: result.user,
    accessToken: result.accessToken,
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const token = await authService.requestPasswordReset(email);
  res.json({
    success: true,
    message: 'If an account exists, a reset link has been generated.',
    // Demo convenience: token is returned directly instead of emailed.
    resetToken: token || undefined,
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  res.json({ success: true, message: 'Password updated successfully' });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ success: true });
});
