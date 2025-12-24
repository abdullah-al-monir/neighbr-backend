import jwt from "jsonwebtoken";
import { config } from "../config/env";

export const generateToken = (
  userId: string,
  role: string,
  email: string,
  name: string,
  avatar: string | null
): string => {
  return jwt.sign({ userId, role, email, name, avatar }, config.jwtSecret, {
    expiresIn: "5h",
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtRefreshSecret, {
    expiresIn: "7d",
  });
};

export const verifyToken = (
  token: string
): { userId: string; role: string } => {
  return jwt.verify(token, config.jwtSecret) as {
    userId: string;
    role: string;
  };
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, config.jwtRefreshSecret) as { userId: string };
};
