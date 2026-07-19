import { Schema, model, Document, Types } from 'mongoose';

export type OrgStatus = 'pending' | 'approved' | 'rejected';

export interface IOrganization extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string; // primary contact / admin email
  status: OrgStatus;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedReason: { type: String },
  },
  { timestamps: true }
);

export const Organization = model<IOrganization>('Organization', organizationSchema);
