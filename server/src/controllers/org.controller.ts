import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as orgService from '../services/org.service';
import { OrgStatus } from '../models/Organization';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as OrgStatus | undefined;
  const organizations = await orgService.listOrganizations(status);
  res.json({ success: true, organizations });
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const org = await orgService.setOrganizationStatus(req.params.id, 'approved', req.userId!);
  res.json({ success: true, organization: org });
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const org = await orgService.setOrganizationStatus(
    req.params.id,
    'rejected',
    req.userId!,
    req.body?.reason
  );
  res.json({ success: true, organization: org });
});
