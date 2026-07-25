import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/token';
import { ApiError } from '../utils/ApiError';
import { User, IUser } from '../models/User';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      user?: IUser;
    }
  }
}

/** Verifies the JWT, loads the current user, and blocks inactive accounts. */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    const token =
      header && header.startsWith('Bearer ')
        ? header.slice(7)
        : (req.cookies?.accessToken as string | undefined);

    if (!token) {
      return next(ApiError.unauthorized('Authentication token missing'));
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(ApiError.unauthorized('Invalid or expired token'));
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return next(ApiError.unauthorized('Account not found'));
    }
    if (user.status === 'inactive') {
      return next(ApiError.forbidden('Your account has been deactivated'));
    }

    req.user = user;
    req.userId = user._id.toString();
    req.userEmail = user.email;
    next();
  } catch (err) {
    next(err);
  }
}
