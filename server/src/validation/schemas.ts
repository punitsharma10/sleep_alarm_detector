import { z } from 'zod';

// Strong password: 8+ chars with lowercase, uppercase, number and a special char.
const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
    'Password must include uppercase, lowercase, number and a special character'
  );

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Invalid email'),
  password: strongPassword,
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: strongPassword,
});

export const orgSignupSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is too short').max(120),
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Invalid email'),
  password: strongPassword,
});

const permissionsShape = z.object({
  create: z.boolean(),
  view: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean(),
});

const modulesShape = z.object({
  dashboard: z.boolean(),
  liveDetection: z.boolean(),
  history: z.boolean(),
  analytics: z.boolean(),
  users: z.boolean(),
  settings: z.boolean(),
  profile: z.boolean(),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email('Invalid email'),
  password: strongPassword,
  designation: z.string().min(1, 'Please select a designation').max(60),
  level: z.number().int().min(1).max(10),
  permissions: permissionsShape,
  modules: modulesShape,
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  password: strongPassword.optional(),
  designation: z.string().min(1).max(60).optional(),
  level: z.number().int().min(1).max(10).optional(),
  permissions: permissionsShape.optional(),
  modules: modulesShape.optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().length(24, 'Invalid id'),
});

export const userSessionParamsSchema = z.object({
  id: z.string().length(24, 'Invalid id'),
  sessionId: z.string().length(24, 'Invalid session id'),
});

export const settingsSchema = z.object({
  earThreshold: z.number().min(0.1).max(0.4).optional(),
  alarmDelay: z.number().min(0.5).max(10).optional(),
  alarmVolume: z.number().min(0).max(1).optional(),
  alarmSound: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  notifications: z.boolean().optional(),
  cameraId: z.string().optional(),
  frameRate: z.number().min(10).max(60).optional(),
});

export const saveDetectionSchema = z.object({
  session: z.string().length(24, 'Invalid session id'),
  type: z.enum(['blink', 'drowsy', 'sleep']),
  durationMs: z.number().min(0),
  averageEar: z.number(),
  minEar: z.number().optional().default(0),
  blinkCount: z.number().min(0).optional().default(0),
  alarmTriggered: z.boolean().optional().default(false),
  screenshot: z.string().optional(),
  startedAt: z.coerce.date(),
});

export const startSessionSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  activity: z.enum(['driving', 'studying', 'working', 'operating', 'other']).optional(),
  notes: z.string().max(500).optional(),
  alertnessBefore: z.number().int().min(1).max(5).optional(),
});

export const endSessionSchema = z.object({
  blinkCount: z.number().min(0).optional(),
});

export const sessionsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const deleteHistorySchema = z.object({
  // When ids are provided, only those events are deleted; otherwise all are cleared.
  ids: z.array(z.string().min(1)).optional(),
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  type: z.enum(['blink', 'drowsy', 'sleep']).optional(),
});

export const statsQuerySchema = z.object({
  range: z.enum(['day', 'week', 'month']).optional().default('week'),
});
