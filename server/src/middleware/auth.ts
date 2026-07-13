import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/token';
import { ApiError } from '../utils/ApiError';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token =
    header && header.startsWith('Bearer ') ? header.slice(7) : (req.cookies?.accessToken as string | undefined);

  if (!token) {
    throw ApiError.unauthorized('Authentication token missing');
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}
