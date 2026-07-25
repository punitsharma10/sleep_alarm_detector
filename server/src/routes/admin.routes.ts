import { Router } from 'express';
import * as orgController from '../controllers/org.controller';
import { authenticate } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParamSchema } from '../validation/schemas';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/organizations', orgController.list);
router.patch('/organizations/:id/approve', validate(idParamSchema, 'params'), orgController.approve);
router.patch('/organizations/:id/reject', validate(idParamSchema, 'params'), orgController.reject);

export default router;
