import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  artisanId: mongoose.Types.ObjectId;
  serviceType: string;
  description: string;
  scheduledDate: Date;
  timeSlot: {
    start: string;
    end: string;
  };
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  amount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentIntentId?: string;
  escrowReleased: boolean;
  cancellationReason?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  notes?: string;
}

const BookingSchema = new Schema<IBooking>(
  {
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
    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      validate: {
        validator: function (v: Date) {
          return v > new Date();
        },
        message: 'Scheduled date must be in the future',
      },
    },
    timeSlot: {
      start: {
        type: String,
        required: [true, 'Start time is required'],
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
      end: {
        type: String,
        required: [true, 'End time is required'],
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [5, 'Amount must be at least $5'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentIntentId: {
      type: String,
      sparse: true,
    },
    escrowReleased: {
      type: Boolean,
      default: false,
    },
    cancellationReason: {
      type: String,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: [true, 'Coordinates are required'],
      },
      address: {
        type: String,
        required: [true, 'Address is required'],
      },
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for queries
BookingSchema.index({ customerId: 1, status: 1, createdAt: -1 });
BookingSchema.index({ artisanId: 1, status: 1, scheduledDate: 1 });
BookingSchema.index({ status: 1, scheduledDate: 1 });

// Geospatial index
BookingSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for customer details
BookingSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for artisan details
BookingSchema.virtual('artisan', {
  ref: 'Artisan',
  localField: 'artisanId',
  foreignField: '_id',
  justOne: true,
});

// Pre-save hook to validate time slot
BookingSchema.pre('save', function (next) {
  const start = this.timeSlot.start.split(':').map(Number);
  const end = this.timeSlot.end.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];

  if (startMinutes >= endMinutes) {
    next(new Error('End time must be after start time'));
  } else {
    next();
  }
});

export default mongoose.model<IBooking>('Booking', BookingSchema);