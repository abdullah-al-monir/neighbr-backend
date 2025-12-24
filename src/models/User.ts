import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: "customer" | "artisan" | "admin";
  avatar?: string;
  phone?: string;
  location: {
    division: string;
    district: string;
    area: string;
    address: string;
    cityId: mongoose.Types.ObjectId;
  };
  verified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  refreshToken?: string;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    role: {
      type: String,
      enum: ["customer", "artisan", "admin"],
      default: "customer",
    },
    avatar: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      match: [
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
        "Please provide a valid phone number",
      ],
    },
    location: {
      division: {
        type: String,
        required: [true, 'Division is required'],
      },
      district: {
        type: String,
        required: [true, 'District is required'],
        trim: true,
      },
      area: {
        type: String,
        required: [true, 'Area is required'],
        trim: true,
      },
      address: {
        type: String,
        required: [true, 'Address is required'],
      },
      cityId: {
        type: Schema.Types.ObjectId,
        ref: 'City',
        required: [true, 'City is required'],
      },
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for location-based queries
UserSchema.index({ 'location.division': 1, 'location.district': 1, 'location.area': 1 });
UserSchema.index({ 'location.cityId': 1 });

// Index for email lookups
UserSchema.index({ email: 1 });

// Virtual for city details
UserSchema.virtual('city', {
  ref: 'City',
  localField: 'location.cityId',
  foreignField: '_id',
  justOne: true,
});

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Remove sensitive data from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

export default mongoose.model<IUser>("User", UserSchema);