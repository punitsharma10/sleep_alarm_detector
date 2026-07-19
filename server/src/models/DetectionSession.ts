import { Schema, model, Document, Types } from 'mongoose';

export type SessionActivity = 'driving' | 'studying' | 'working' | 'operating' | 'other';
export type SessionStatus = 'active' | 'completed';

export interface IDetectionSession extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  label: string;
  activity: SessionActivity;
  notes?: string;
  alertnessBefore?: number; // 1..5 self-rating
  status: SessionStatus;
  startedAt: Date;
  endedAt?: Date;
  // Rolled-up stats (computed when the session ends)
  durationMs: number;
  totalEvents: number;
  blinkCount: number;
  drowsyCount: number;
  sleepCount: number;
  alarmCount: number;
  averageEar: number;
  minEar: number;
  totalClosedMs: number;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<IDetectionSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    activity: {
      type: String,
      enum: ['driving', 'studying', 'working', 'operating', 'other'],
      default: 'other',
    },
    notes: { type: String, maxlength: 500 },
    alertnessBefore: { type: Number, min: 1, max: 5 },
    status: { type: String, enum: ['active', 'completed'], default: 'active', index: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    durationMs: { type: Number, default: 0 },
    totalEvents: { type: Number, default: 0 },
    blinkCount: { type: Number, default: 0 },
    drowsyCount: { type: Number, default: 0 },
    sleepCount: { type: Number, default: 0 },
    alarmCount: { type: Number, default: 0 },
    averageEar: { type: Number, default: 0 },
    minEar: { type: Number, default: 0 },
    totalClosedMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, createdAt: -1 });

export const DetectionSession = model<IDetectionSession>('DetectionSession', sessionSchema);
