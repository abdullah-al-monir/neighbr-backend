"use strict";
// import winston from 'winston';
// import { config } from '../config/env';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
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
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../config/env");
const isVercel = process.env.VERCEL === "1";
// Create transports array
const transports = [];
// Only add file transports if NOT on Vercel
if (!isVercel) {
    transports.push(new winston_1.default.transports.File({ filename: "logs/error.log", level: "error" }), new winston_1.default.transports.File({ filename: "logs/combined.log" }));
}
// Always add console transport (Vercel captures console logs)
transports.push(new winston_1.default.transports.Console({
    format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: env_1.config.nodeEnv !== "production" }), env_1.config.nodeEnv === "production"
        ? winston_1.default.format.json()
        : winston_1.default.format.simple()),
}));
exports.logger = winston_1.default.createLogger({
    level: env_1.config.nodeEnv === "production" ? "info" : "debug",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports,
});
//# sourceMappingURL=logger.js.map