import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { requireOrgUser } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  settingsSchema,
  createUserSchema,
  updateUserSchema,
  idParamSchema,
} from '../validation/schemas';

const router = Router();

router.use(authenticate);

// Self
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/settings', validate(settingsSchema), userController.updateSettings);

// User management within the organization (RBAC guarded in the service layer)
router.get('/manage', requireOrgUser, userController.listManagedUsers);
router.post('/manage', requireOrgUser, validate(createUserSchema), userController.createManagedUser);
router.get('/manage/:id', requireOrgUser, validate(idParamSchema, 'params'), userController.getManagedUser);
router.get(
  '/manage/:id/detections',
  requireOrgUser,
  validate(idParamSchema, 'params'),
  userController.getManagedUserDetections
);
router.put(
  '/manage/:id',
  requireOrgUser,
  validate(idParamSchema, 'params'),
  validate(updateUserSchema),
  userController.updateManagedUser
);
router.delete(
  '/manage/:id',
  requireOrgUser,
  validate(idParamSchema, 'params'),
  userController.deactivateManagedUser
);

export default router;
