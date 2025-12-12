import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  artisanId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  images?: string[];
  response?: {
    text: string;
    createdAt: Date;
  };
}

const ReviewSchema = new Schema<IReview>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true, // One review per booking
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    artisanId: {
      type: Schema.Types.ObjectId,
      ref: 'Artisan',
      required: [true, 'Artisan ID is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim: true,
    },
    images: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          return !v || v.length <= 5;
        },
        message: 'Cannot upload more than 5 images',
      },
    },
    response: {
      text: {
        type: String,
        maxlength: [500, 'Response cannot exceed 500 characters'],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for artisan reviews
ReviewSchema.index({ artisanId: 1, rating: -1, createdAt: -1 });

// Index for customer reviews
ReviewSchema.index({ customerId: 1, createdAt: -1 });

// Virtual for customer details
ReviewSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for booking details
ReviewSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

// Post-save hook to update artisan rating
ReviewSchema.post('save', async function () {
  const Artisan = mongoose.model('Artisan');
  
  const stats = await mongoose.model('Review').aggregate([
    { $match: { artisanId: this.artisanId } },
    {
      $group: {
        _id: '$artisanId',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Artisan.findByIdAndUpdate(this.artisanId, {
      rating: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal
      reviewCount: stats[0].reviewCount,
    });
  }
});

// Post-remove hook to update artisan rating
ReviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Artisan = mongoose.model('Artisan');
    
    const stats = await mongoose.model('Review').aggregate([
      { $match: { artisanId: doc.artisanId } },
      {
        $group: {
          _id: '$artisanId',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Artisan.findByIdAndUpdate(doc.artisanId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        reviewCount: stats[0].reviewCount,
      });
    } else {
      await Artisan.findByIdAndUpdate(doc.artisanId, {
        rating: 0,
        reviewCount: 0,
      });
    }
  }
});

export default mongoose.model<IReview>('Review', ReviewSchema);