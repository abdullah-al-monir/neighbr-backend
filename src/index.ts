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

// ------------------------------------------------------------------------
// ✅ CRITICAL: CORS MUST BE FIRST - Before any other middleware
// ------------------------------------------------------------------------
const corsOptions = {
  origin: config.frontendUrl || "https://neighbr-six.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly for all routes
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header(
      "Access-Control-Allow-Origin",
      config.frontendUrl || "https://neighbr-six.vercel.app"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200);
  }
  next();
});

// ------------------------------------------------------------------------
// ✅ Security middleware (Configure Helmet to not block CORS)
// ------------------------------------------------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

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
// @ts-ignore
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
// @ts-ignore
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server (only in non-serverless environment)
if (config.nodeEnv !== "production" || !process.env.VERCEL) {
  const PORT = config.port;
  app.listen(PORT, () => {
    logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  });
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  logger.error("Unhandled Rejection:", err);
  if (config.nodeEnv !== "production") {
    process.exit(1);
  }
});

export default app;
