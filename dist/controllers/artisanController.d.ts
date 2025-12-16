import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
interface CustomRequest extends Request {
    user?: {
        userId: mongoose.Types.ObjectId;
        role: "customer" | "artisan" | "admin";
    };
}
declare const createArtisanProfile: (req: CustomRequest, res: Response, next: NextFunction) => Promise<void>;
declare const getArtisanProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const getMyArtisanProfile: (req: CustomRequest, res: Response, next: NextFunction) => Promise<void>;
declare const updateArtisanProfile: (req: CustomRequest, res: Response, next: NextFunction) => Promise<void>;
declare const searchArtisans: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const addPortfolio: (req: CustomRequest, res: Response, next: NextFunction) => Promise<void>;
declare const deletePortfolio: (req: CustomRequest, res: Response, next: NextFunction) => Promise<void>;
declare const getAvailability: (req: CustomRequest, res: Response, next: NextFunction) => Promise<void>;
declare const updateAvailability: (req: CustomRequest, res: Response, next: NextFunction) => Promise<void>;
export { createArtisanProfile, getArtisanProfile, getMyArtisanProfile, updateArtisanProfile, searchArtisans, addPortfolio, deletePortfolio, updateAvailability, getAvailability, };
//# sourceMappingURL=artisanController.d.ts.map