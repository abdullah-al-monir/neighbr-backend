import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformFeeConfig extends Document {
  tier: 'free' | 'basic' | 'premium';
  feePercentage: number;
  description: string;
  isActive: boolean;
}

const PlatformFeeConfigSchema = new Schema<IPlatformFeeConfig>(
  {
    tier: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      required: true,
      unique: true,
    },
    feePercentage: {
      type: Number,
      required: [true, 'Fee percentage is required'],
      min: [0, 'Fee percentage cannot be negative'],
      max: [100, 'Fee percentage cannot exceed 100%'],
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for active fees
PlatformFeeConfigSchema.index({ tier: 1, isActive: 1 });

export default mongoose.model<IPlatformFeeConfig>(
  'PlatformFeeConfig',
  PlatformFeeConfigSchema
);