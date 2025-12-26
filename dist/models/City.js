"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const CitySchema = new mongoose_1.Schema({
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
                validator: function (v) {
                    return (v.length === 2 &&
                        v[0] >= -180 &&
                        v[0] <= 180 &&
                        v[1] >= -90 &&
                        v[1] <= 90);
                },
                message: "Invalid coordinates",
            },
        },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Geospatial index for coordinates
CitySchema.index({ "coordinates.coordinates": "2dsphere" });
// Index for division, district, area lookups
CitySchema.index({ division: 1, district: 1, area: 1 });
CitySchema.index({ isActive: 1 });
exports.default = mongoose_1.default.model("City", CitySchema);
//# sourceMappingURL=City.js.map