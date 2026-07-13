import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken } from '../utils/token';

export interface AuthResult {
  user: Pick<IUser, '_id' | 'name' | 'email' | 'avatarUrl' | 'settings'>;
  accessToken: string;
  refreshToken: string;
}

function issueTokens(user: IUser) {
  const payload = { sub: user._id.toString(), email: user.email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

function toPublicUser(user: IUser) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    settings: user.settings,
  };
}

export async function register(name: string, email: string, password: string): Promise<AuthResult> {
  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }
  const user = await User.create({ name, email, password });
  return { user: toPublicUser(user), ...issueTokens(user) };
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
  return { user: toPublicUser(user), ...issueTokens(user) };
}

export async function requestPasswordReset(email: string): Promise<string> {
  const user = await User.findOne({ email });
  // Do not reveal whether the email exists — but we still need a token for the demo flow.
  if (!user) {
    return '';
  }
  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = crypto.createHash('sha256').update(token).digest('hex');
  user.resetTokenExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  await user.save();
  // In production this token would be emailed. We return it so the demo flow can proceed.
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
