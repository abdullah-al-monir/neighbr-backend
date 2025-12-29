import { Request, Response, NextFunction } from "express";
export declare const getDashboardStats: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getRevenueAnalytics: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllUsers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateUserVerification: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllArtisans: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateArtisanVerification: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteArtisan: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllBookings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getBookingById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getTransactionById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllTransactions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getCategoryStats: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getContactMessages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateContactMessageStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map