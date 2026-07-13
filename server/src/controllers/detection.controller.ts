import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as detectionService from '../services/detection.service';

export const save = asyncHandler(async (req: Request, res: Response) => {
  const event = await detectionService.saveDetection(req.userId!, req.body);
  res.status(201).json({ success: true, event });
});

export const history = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, type } = req.query as unknown as {
    page: number;
    limit: number;
    type?: 'blink' | 'drowsy' | 'sleep';
  };
  const result = await detectionService.getHistory(req.userId!, page, limit, type);
  res.json({ success: true, ...result });
});

export const clear = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids?: string[] };
  const deleted = await detectionService.clearHistory(req.userId!, ids);
  res.json({ success: true, deleted });
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const { range } = req.query as unknown as { range: 'day' | 'week' | 'month' };
  const result = await detectionService.getStats(req.userId!, range);
  res.json({ success: true, stats: result });
});
