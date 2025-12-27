import { Request, Response, NextFunction } from 'express';
export declare const getPlatformFeeByTier: (tier: "free" | "basic" | "premium") => Promise<number>;
export declare const getAllPlatformFees: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllFeeConfigs: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getFeeConfigByTier: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updatePlatformFee: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deletePlatformFee: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const toggleFeeStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const bulkUpdateFees: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPlatformFeeStats: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=platformFeeController.d.ts.map