import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface UserSettings {
  earThreshold: number;
  alarmDelay: number; // seconds eyes must stay closed before alarm
  alarmVolume: number; // 0..1
  alarmSound: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  cameraId?: string;
  frameRate: number;
}

export const defaultSettings: UserSettings = {
  earThreshold: 0.23,
  alarmDelay: 2.5,
  alarmVolume: 0.8,
  alarmSound: 'classic',
  theme: 'dark',
  language: 'en',
  notifications: true,
  frameRate: 30,
};

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  settings: UserSettings;
  resetToken?: string;
  resetTokenExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const settingsSchema = new Schema<UserSettings>(
  {
    earThreshold: { type: Number, default: defaultSettings.earThreshold, min: 0.1, max: 0.4 },
    alarmDelay: { type: Number, default: defaultSettings.alarmDelay, min: 0.5, max: 10 },
    alarmVolume: { type: Number, default: defaultSettings.alarmVolume, min: 0, max: 1 },
    alarmSound: { type: String, default: defaultSettings.alarmSound },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: defaultSettings.theme },
    language: { type: String, default: defaultSettings.language },
    notifications: { type: Boolean, default: defaultSettings.notifications },
    cameraId: { type: String },
    frameRate: { type: Number, default: defaultSettings.frameRate, min: 10, max: 60 },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    avatarUrl: { type: String },
    settings: { type: settingsSchema, default: () => ({ ...defaultSettings }) },
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>('User', userSchema);
