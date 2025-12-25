"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    emailFrom: process.env.EMAIL_FROM,
    emailjsPublicKey: process.env.EMAILJS_PUBLIC_KEY,
    emailjsServiceId: process.env.EMAILJS_SERVICE_ID,
    emailjsTemplateId: process.env.EMAILJS_TEMPLATE_ID,
    emailjsPrivateKey: process.env.EMAILJS_PRIVATE_KEY,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
};
// Validate required environment variables
const requiredEnvVars = [
    "MONGODB_URI",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "STRIPE_SECRET_KEY",
];
requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
});
//# sourceMappingURL=env.js.map