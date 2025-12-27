import { Request, Response, NextFunction } from 'express';
export declare const getSubscriptionPlans: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getSubscriptionPlanByTier: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllPlans: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const upsertSubscriptionPlan: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteSubscriptionPlan: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const togglePlanStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getSubscriptionStats: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=subscriptionSettingsController.d.ts.map