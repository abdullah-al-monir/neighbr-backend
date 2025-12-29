import { Request, Response, NextFunction } from "express";
export declare const createPaymentIntent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const confirmPayment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createSubscription: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const confirmSubscription: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const webhookHandler: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=paymentController.d.ts.map