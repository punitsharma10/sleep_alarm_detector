import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import detectionRoutes from './detection.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/detection', detectionRoutes);

export default router;
