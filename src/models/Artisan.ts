import mongoose, { Schema, Document } from "mongoose";

export interface IPortfolio {
  title: string;
  description: string;
  images: string[];
  category: string;
  createdAt: Date;
}

export interface IAvailability {
  dayOfWeek: number;
  slots: {
    start: string;
    end: string;
    booked: boolean;
  }[];
}

export interface IArtisan extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  category: string;
  skills: string[];
  bio: string;
  portfolio: IPortfolio[];
  rating: number;
  reviewCount: number;
  completedJobs: number;
  availability: IAvailability[];
  hourlyRate: number;
  subscriptionTier: "free" | "basic" | "premium";
  subscriptionExpiresAt?: Date;
  verified: boolean;
  verificationDocuments?: string[];
  location: {
    division: string;
    district: string;
    area: string;
    address: string;
    cityId: mongoose.Types.ObjectId;
  };
  subscriptionExpiryNotified: boolean;
  subscriptionExpiredNotified: boolean;
}

const PortfolioSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    validate: {
      validator: function (v: string[]) {
        return v.length > 0 && v.length <= 10;
      },
      message: "Portfolio must have 1-10 images",
    },
  },
  category: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AvailabilitySchema = new Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
  },
  slots: [
    {
      start: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
      end: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
      booked: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

const ArtisanSchema = new Schema<IArtisan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      minlength: [2, "Business name must be at least 2 characters"],
      maxlength: [100, "Business name cannot exceed 100 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "baker",
        "tailor",
        "carpenter",
        "electrician",
        "plumber",
        "painter",
        "mechanic",
        "gardener",
        "cleaner",
        "other",
      ],
    },
    skills: {
      type: [String],
      required: [true, "At least one skill is required"],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0 && v.length <= 20;
        },
        message: "Must have 1-20 skills",
      },
    },
    bio: {
      type: String,
      required: [true, "Bio is required"],
      minlength: [50, "Bio must be at least 50 characters"],
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
    },
    portfolio: {
      type: [PortfolioSchema],
      default: [],
      validate: {
        validator: function (v: IPortfolio[]) {
          return v.length <= 50;
        },
        message: "Cannot have more than 50 portfolio items",
      },
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
      min: 0,
    },
    availability: {
      type: [AvailabilitySchema],
      default: [],
    },
    hourlyRate: {
      type: Number,
      required: [true, "Hourly rate is required"],
      min: [5, "Hourly rate must be at least $5"],
      max: [1000, "Hourly rate cannot exceed $1000"],
    },
    subscriptionTier: {
      type: String,
      enum: ["free", "basic", "premium"],
      default: "free",
    },
    subscriptionExpiresAt: {
      type: Date,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationDocuments: {
      type: [String],
      default: [],
    },
    location: {
      division: {
        type: String,
        required: [true, "Division is required"],
        enum: [
          "Dhaka",
          "Chattogram",
          "Rajshahi",
          "Khulna",
          "Barishal",
          "Sylhet",
          "Rangpur",
          "Mymensingh",
        ],
      },
      district: {
        type: String,
        required: [true, "District is required"],
        trim: true,
      },
      area: {
        type: String,
        required: [true, "Area is required"],
        trim: true,
      },
      address: {
        type: String,
        required: [true, "Address is required"],
      },
      cityId: {
        type: Schema.Types.ObjectId,
        ref: "City",
        required: [true, "City is required"],
      },
    },
    subscriptionExpiryNotified: {
      type: Boolean,
      default: false,
    },
    subscriptionExpiredNotified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for location-based queries
ArtisanSchema.index({
  "location.division": 1,
  "location.district": 1,
  "location.area": 1,
});
ArtisanSchema.index({ "location.cityId": 1 });

// Index for category and rating
ArtisanSchema.index({ category: 1, rating: -1 });

// Index for verified artisans
ArtisanSchema.index({ verified: 1 });

// Compound index for search
ArtisanSchema.index({ category: 1, verified: 1, rating: -1 });

// Virtual for user details
ArtisanSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for city details
ArtisanSchema.virtual("city", {
  ref: "City",
  localField: "location.cityId",
  foreignField: "_id",
  justOne: true,
});

export default mongoose.model<IArtisan>("Artisan", ArtisanSchema);
