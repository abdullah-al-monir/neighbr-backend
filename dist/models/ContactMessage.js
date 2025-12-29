"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ContactMessageSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: [2, "First name must be at least 2 characters"],
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: [2, "Last name must be at least 2 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please provide a valid email address",
        ],
    },
    subject: {
        type: String,
        required: [true, "Subject is required"],
        trim: true,
        minlength: [5, "Subject must be at least 5 characters"],
        maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    message: {
        type: String,
        required: [true, "Message is required"],
        trim: true,
        minlength: [10, "Message must be at least 10 characters"],
        maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    status: {
        type: String,
        enum: ["new", "in-progress", "resolved"],
        default: "new",
    },
}, {
    timestamps: true,
});
// Index for admin queries
ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ email: 1 });
exports.default = mongoose_1.default.model("ContactMessage", ContactMessageSchema);
//# sourceMappingURL=ContactMessage.js.map