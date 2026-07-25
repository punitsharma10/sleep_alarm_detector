import { Router } from 'express';
import * as detectionController from '../controllers/detection.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  saveDetectionSchema,
  historyQuerySchema,
  statsQuerySchema,
  startSessionSchema,
  endSessionSchema,
  sessionsQuerySchema,
  idParamSchema,
} from '../validation/schemas';

const router = Router();

router.use(authenticate);

// Events
router.post('/save', validate(saveDetectionSchema), detectionController.save);
router.get('/history', validate(historyQuerySchema, 'query'), detectionController.history);
router.delete('/history', detectionController.clear);
router.get('/stats', validate(statsQuerySchema, 'query'), detectionController.stats);

// Sessions
router.post('/sessions', validate(startSessionSchema), detectionController.startSession);
router.get('/sessions', validate(sessionsQuerySchema, 'query'), detectionController.listSessions);
router.delete('/sessions', detectionController.deleteSessions);
router.get('/sessions/:id', validate(idParamSchema, 'params'), detectionController.getSession);
router.patch(
  '/sessions/:id/end',
  validate(idParamSchema, 'params'),
  validate(endSessionSchema),
  detectionController.endSession
);

export default router;
