import mongoose, { Schema, Document } from 'mongoose';

export interface IPortfolioItem extends Document {
  artisanId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  images: string[];
  category: string;
  tags: string[];
  featured: boolean;
  views: number;
  likes: number;
}

const PortfolioSchema = new Schema<IPortfolioItem>(
  {
    artisanId: {
      type: Schema.Types.ObjectId,
      ref: 'Artisan',
      required: [true, 'Artisan ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: function (v: string[]) {
          return v.length >= 1 && v.length <= 10;
        },
        message: 'Portfolio must have 1-10 images',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
PortfolioSchema.index({ artisanId: 1, createdAt: -1 });
PortfolioSchema.index({ category: 1, featured: -1 });
PortfolioSchema.index({ tags: 1 });

// Virtual for artisan details
PortfolioSchema.virtual('artisan', {
  ref: 'Artisan',
  localField: 'artisanId',
  foreignField: '_id',
  justOne: true,
});

export default mongoose.model<IPortfolioItem>('Portfolio', PortfolioSchema);