// import winston from 'winston';
// import { config } from '../config/env';

// export const logger = winston.createLogger({
//   level: config.nodeEnv === 'production' ? 'info' : 'debug',
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.errors({ stack: true }),
//     winston.format.json()
//   ),
//   transports: [
//     new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
//     new winston.transports.File({ filename: 'logs/combined.log' }),
//   ],
// });

// if (config.nodeEnv !== 'production') {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.colorize(),
//         winston.format.simple()
//       ),
//     })
//   );
// }

import winston from "winston";
import { config } from "../config/env";

const isVercel = process.env.VERCEL === "1";

// Create transports array
const transports = [];

// Only add file transports if NOT on Vercel
if (!isVercel) {
  transports.push(
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" })
  );
}

// Always add console transport (Vercel captures console logs)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: config.nodeEnv !== "production" }),
      config.nodeEnv === "production"
        ? winston.format.json()
        : winston.format.simple()
    ),
  })
);

export const logger = winston.createLogger({
  level: config.nodeEnv === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
});
