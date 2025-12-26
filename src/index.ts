import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";
import path from "path";

import { connectDatabase } from "./config/database";
import { config } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";

import authRoutes from "./routes/authRoutes";
import cityRoutes from "./routes/cityRoutes";
import artisanRoutes from "./routes/artisanRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import adminRoutes from "./routes/adminRoutes";
import {
  getAboutPageData,
  getHomePageData,
} from "./controllers/publicController";

const app = express();

// ========================================
// ✅ TRUST PROXY - Must be FIRST!
// ========================================
// This tells Express to trust the X-Forwarded-* headers from Render's proxy
// Place this BEFORE any middleware that uses req.ip (like rate limiting)
app.set("trust proxy", 1);

// Connect to database
connectDatabase();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      config.frontendUrl,
      "http://localhost:3000",
      "https://neighbr-six.vercel.app",
      "https://neighbr-v4f7.onrender.com",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// ------------------------------------------------------------------------
// ✅ STATIC FILE SERVING FIX (Place this before rate limiting and routes)
// ------------------------------------------------------------------------

const imagesDir = path.join(__dirname, "..", "public", "uploads", "images");
app.use(
  "/api/images",
  express.static(imagesDir, {
    setHeaders: (res, _filePath) => {
      res.setHeader("Access-Control-Allow-Origin", config.frontendUrl || "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

logger.info(`Serving static images from: ${imagesDir} at path: /api/images`);
// ------------------------------------------------------------------------

// Logging middleware
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// Rate limiting (now works correctly with trust proxy enabled)
if (config.nodeEnv === "production") {
  app.use("/api", apiLimiter);
}

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/home", getHomePageData);
app.use("/api/about", getAboutPageData);
app.use("/api/auth", authRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/artisans", artisanRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  logger.error("Unhandled Rejection:", err);
  process.exit(1);
});

export default app;
