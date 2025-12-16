// app.ts or index.ts (Backend Server)

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
import artisanRoutes from "./routes/artisanRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import adminRoutes from "./routes/adminRoutes";

const app = express();

// Connect to database
connectDatabase();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://neighbr-v4f7.onrender.com",
      "https://neighbr-six.vercel.app",
      config.frontendUrl,
    ],
    credentials: true,
  })
);

// Security middleware
app.use(helmet());
// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// ------------------------------------------------------------------------
// ✅ STATIC FILE SERVING
// ------------------------------------------------------------------------
const imagesDir = path.join(__dirname, "..", "public", "uploads", "images");
app.use(
  "/api/images",
  express.static(imagesDir, {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", config.frontendUrl || "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

logger.info(`Serving static images from: ${imagesDir} at path: /api/images`);

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

// Rate limiting (consider disabling for OPTIONS)
app.use("/api", (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  return apiLimiter(req, res, next);
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/artisans", artisanRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  logger.error("Unhandled Rejection:", err);
  if (config.nodeEnv !== "production") {
    process.exit(1);
  }
});

export default app;
