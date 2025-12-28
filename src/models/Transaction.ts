import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  bookingId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "booking" | "subscription" | "refund";
  amount: number;
  platformFee: number;
  netAmount: number;
  stripePaymentIntentId: string;
  status: "pending" | "completed" | "failed";
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      sparse: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    type: {
      type: String,
      enum: ["booking", "subscription", "refund"],
      required: [true, "Transaction type is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    platformFee: {
      type: Number,
      required: [true, "Platform fee is required"],
      min: [0, "Platform fee cannot be negative"],
      default: 0,
    },
    netAmount: {
      type: Number,
      required: [true, "Net amount is required"],
      min: [0, "Net amount cannot be negative"],
    },
    stripePaymentIntentId: {
      type: String,
      required: [true, "Stripe payment intent ID is required"],
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for queries
TransactionSchema.index({ userId: 1, status: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1, createdAt: -1 });

// Virtual for user details
TransactionSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for booking details
TransactionSchema.virtual("booking", {
  ref: "Booking",
  localField: "bookingId",
  foreignField: "_id",
  justOne: true,
});

// Pre-save hook to calculate net amount
TransactionSchema.pre("save", async function () {
  if (this.isModified("amount") || this.isModified("platformFee")) {
    this.netAmount = this.amount - this.platformFee;
  }

  if (this.netAmount < 0) {
    throw new Error("Net amount cannot be negative");
  }
});

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
