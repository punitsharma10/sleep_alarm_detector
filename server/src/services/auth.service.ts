import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { Organization } from '../models/Organization';
import { ApiError } from '../utils/ApiError';
import { fullPermissions, fullModules } from '../utils/permissions';
import { signAccessToken, signRefreshToken } from '../utils/token';

export function toPublicUser(user: IUser) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    organization: user.organization,
    designation: user.designation,
    level: user.level,
    permissions: user.permissions,
    modules: user.modules,
    status: user.status,
    settings: user.settings,
  };
}

function issueTokens(user: IUser) {
  const payload = { sub: user._id.toString(), email: user.email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

/**
 * Registers a new organization plus its owner (Admin). Both start out unable to
 * log in until a Super Admin approves the organization. The owner gets level 10
 * with all permissions.
 */
export async function signupOrganization(
  organizationName: string,
  name: string,
  email: string,
  password: string
) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const organization = await Organization.create({
    name: organizationName,
    email,
    status: 'pending',
  });

  const admin = await User.create({
    name,
    email,
    password,
    role: 'orgUser',
    organization: organization._id,
    designation: 'Admin',
    level: 10,
    permissions: fullPermissions(),
    modules: fullModules(),
    status: 'active',
  });

  return { organization, adminId: admin._id };
}

export interface AuthResult {
  user: ReturnType<typeof toPublicUser>;
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid credentials');
  }
  const valid = await user.comparePassword(password);
  if (!valid) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  if (user.status === 'inactive') {
    throw ApiError.forbidden('Your account has been deactivated. Contact your administrator.');
  }

  // Org users can only log in once their organization is approved.
  if (user.role === 'orgUser') {
    const org = await Organization.findById(user.organization);
    if (!org) {
      throw ApiError.forbidden('Your organization no longer exists');
    }
    if (org.status === 'pending') {
      throw ApiError.forbidden('Your organization is pending approval by the administrator');
    }
    if (org.status === 'rejected') {
      throw ApiError.forbidden('Your organization registration was rejected');
    }
  }

  return { user: toPublicUser(user), ...issueTokens(user) };
}

export async function requestPasswordReset(email: string): Promise<string> {
  const user = await User.findOne({ email });
  if (!user) return '';
  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = crypto.createHash('sha256').update(token).digest('hex');
  user.resetTokenExpires = new Date(Date.now() + 1000 * 60 * 30);
  await user.save();
  return token;
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetToken: hashed,
    resetTokenExpires: { $gt: new Date() },
  }).select('+resetToken +resetTokenExpires');

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }
  user.password = password;
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
}
