import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

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
    // ⚠️ FIX: Check BOTH Authorization header AND cookies
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    // If no token in header, check cookies
    if (!token && req.cookies) {
      token = req.cookies.token;
    }

    console.log('🔍 Token from header:', req.headers.authorization ? 'exists' : 'missing');
    console.log('🍪 Token from cookies:', req.cookies?.token ? 'exists' : 'missing');
    console.log('✅ Using token:', token ? 'found' : 'NOT FOUND');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required - no token provided',
      });
      return;
    }

    const decoded = verifyToken(token);
    console.log('✅ Token verified for user:', decoded);
    req.user = decoded;
    next();
  } catch (error: any) {
    console.log('❌ Token verification failed:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource',
      });
      return;
    }

    next();
  };
};