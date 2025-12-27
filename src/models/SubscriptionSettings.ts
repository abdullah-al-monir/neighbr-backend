import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionSettings extends Document {
  tier: 'free' | 'basic' | 'premium';
  name: string;
  price: number;
  duration: number; 
  features: string[];
  maxPortfolioItems: number;
  prioritySupport: boolean;
  featuredListing: boolean;
  analyticsAccess: boolean;
  isActive: boolean;
  description: string;
}

const SubscriptionSettingsSchema = new Schema<ISubscriptionSettings>(
  {
    tier: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Subscription name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 day'],
      default: 30,
    },
    features: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one feature is required',
      },
    },
    maxPortfolioItems: {
      type: Number,
      default: 10,
      min: [1, 'Must allow at least 1 portfolio item'],
    },
    prioritySupport: {
      type: Boolean,
      default: false,
    },
    featuredListing: {
      type: Boolean,
      default: false,
    },
    analyticsAccess: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for active subscriptions
SubscriptionSettingsSchema.index({ isActive: 1, tier: 1 });

export default mongoose.model<ISubscriptionSettings>(
  'SubscriptionSettings',
  SubscriptionSettingsSchema
);