import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import User from "../models/User";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.token;

    if (!token) {
      token = req.headers.authorization?.replace("Bearer ", "");
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required - no token provided",
      });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Not authorized to access this resource",
      });
      return;
    }
    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.headers.authorization?.replace("Bearer ", "");
    if (!token && req.cookies) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select("role").lean();
        if (user) {
          req.user = {
            userId: decoded.userId,
            role: user.role,
          };
        }
      } catch (error) {
        console.log("Optional auth: Invalid token, proceeding as guest");
      }
    }
    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next();
  }
};
