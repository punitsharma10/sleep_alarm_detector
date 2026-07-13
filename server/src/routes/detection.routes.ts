import { Router } from 'express';
import * as detectionController from '../controllers/detection.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  saveDetectionSchema,
  historyQuerySchema,
  statsQuerySchema,
  deleteHistorySchema,
} from '../validation/schemas';

const router = Router();

router.use(authenticate);

router.post('/save', validate(saveDetectionSchema), detectionController.save);
router.get('/history', validate(historyQuerySchema, 'query'), detectionController.history);
router.delete('/history', validate(deleteHistorySchema), detectionController.clear);
router.get('/stats', validate(statsQuerySchema, 'query'), detectionController.stats);

export default router;
