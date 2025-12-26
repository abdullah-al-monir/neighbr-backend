import mongoose, { Schema, Document } from "mongoose";

export interface ICity extends Document {
  name: string;
  division: string;
  district: string;
  area: string;
  coordinates: {
    type: "Point";
    coordinates: [number, number];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CitySchema = new Schema<ICity>(
  {
    name: {
      type: String,
      required: [true, "City name is required"],
      trim: true,
      unique: true,
    },
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
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: [true, "Coordinates are required"],
        validate: {
          validator: function (v: number[]) {
            return (
              v.length === 2 &&
              v[0] >= -180 &&
              v[0] <= 180 &&
              v[1] >= -90 &&
              v[1] <= 90
            );
          },
          message: "Invalid coordinates",
        },
      },
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

// Geospatial index for coordinates
CitySchema.index({ "coordinates.coordinates": "2dsphere" });

// Index for division, district, area lookups
CitySchema.index({ division: 1, district: 1, area: 1 });
CitySchema.index({ isActive: 1 });

export default mongoose.model<ICity>("City", CitySchema);
