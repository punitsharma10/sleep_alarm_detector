import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

/** Only allow the platform Super Admin past. */
export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'superadmin') {
    throw ApiError.forbidden('Super admin access required');
  }
  next();
}

/** Only allow regular organization users (blocks the super admin from org routes). */
export function requireOrgUser(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'orgUser' || !req.user.organization) {
    throw ApiError.forbidden('Organization access required');
  }
  next();
}
