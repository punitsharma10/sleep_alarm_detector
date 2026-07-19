import { Schema, model, Document, Types } from 'mongoose';

export type DetectionType = 'blink' | 'drowsy' | 'sleep';

export interface IDetection extends Document {
  user: Types.ObjectId;
  session?: Types.ObjectId;
  type: DetectionType;
  durationMs: number; // how long eyes were closed
  averageEar: number;
  minEar: number;
  blinkCount: number;
  alarmTriggered: boolean;
  screenshot?: string; // base64 data URL, optional
  startedAt: Date;
  createdAt: Date;
}

const detectionSchema = new Schema<IDetection>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    session: { type: Schema.Types.ObjectId, ref: 'DetectionSession', index: true },
    type: { type: String, enum: ['blink', 'drowsy', 'sleep'], required: true },
    durationMs: { type: Number, required: true, min: 0 },
    averageEar: { type: Number, required: true },
    minEar: { type: Number, default: 0 },
    blinkCount: { type: Number, default: 0 },
    alarmTriggered: { type: Boolean, default: false },
    screenshot: { type: String },
    startedAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

detectionSchema.index({ user: 1, createdAt: -1 });

export const DetectionHistory = model<IDetection>('DetectionHistory', detectionSchema);
