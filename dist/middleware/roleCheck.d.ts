import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireArtisan: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireCustomer: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAnyRole: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=roleCheck.d.ts.map