"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const logger_1 = require("./utils/logger");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const cityRoutes_1 = __importDefault(require("./routes/cityRoutes"));
const artisanRoutes_1 = __importDefault(require("./routes/artisanRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const publicController_1 = require("./controllers/publicController");
const app = (0, express_1.default)();
// ========================================
// ✅ TRUST PROXY - Must be FIRST!
// ========================================
// This tells Express to trust the X-Forwarded-* headers from Render's proxy
// Place this BEFORE any middleware that uses req.ip (like rate limiting)
app.set("trust proxy", 1);
// Connect to database
(0, database_1.connectDatabase)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        env_1.config.frontendUrl,
        "http://localhost:3000",
        "https://neighbr-six.vercel.app",
        "https://neighbr-v4f7.onrender.com",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use((0, cookie_parser_1.default)());
// Compression middleware
app.use((0, compression_1.default)());
// ------------------------------------------------------------------------
// ✅ STATIC FILE SERVING FIX (Place this before rate limiting and routes)
// ------------------------------------------------------------------------
const imagesDir = path_1.default.join(__dirname, "..", "public", "uploads", "images");
app.use("/api/images", express_1.default.static(imagesDir, {
    setHeaders: (res, _filePath) => {
        res.setHeader("Access-Control-Allow-Origin", env_1.config.frontendUrl || "*");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
}));
logger_1.logger.info(`Serving static images from: ${imagesDir} at path: /api/images`);
// ------------------------------------------------------------------------
// Logging middleware
if (env_1.config.nodeEnv === "development") {
    app.use((0, morgan_1.default)("dev"));
}
else {
    app.use((0, morgan_1.default)("combined", {
        stream: { write: (message) => logger_1.logger.info(message.trim()) },
    }));
}
// Rate limiting (now works correctly with trust proxy enabled)
if (env_1.config.nodeEnv === "production") {
    app.use("/api", rateLimiter_1.apiLimiter);
}
// Health check
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
// Routes
app.use("/api/home", publicController_1.getHomePageData);
app.use("/api/about", publicController_1.getAboutPageData);
app.use("/api/auth", authRoutes_1.default);
app.use("/api/cities", cityRoutes_1.default);
app.use("/api/artisans", artisanRoutes_1.default);
app.use("/api/bookings", bookingRoutes_1.default);
app.use("/api/payments", paymentRoutes_1.default);
app.use("/api/reviews", reviewRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = env_1.config.port;
app.listen(PORT, () => {
    logger_1.logger.info(`Server running in ${env_1.config.nodeEnv} mode on port ${PORT}`);
});
// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    logger_1.logger.error("Unhandled Rejection:", err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map