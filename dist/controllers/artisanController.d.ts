import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
declare const createArtisanProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare const getArtisanProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const getMyArtisanProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare const updateArtisanProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare const searchArtisans: (req: AuthRequest, res: Response, _next: NextFunction) => Promise<void>;
declare const addPortfolio: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare const deletePortfolio: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare const getAvailability: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare const updateAvailability: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export { createArtisanProfile, getArtisanProfile, getMyArtisanProfile, updateArtisanProfile, searchArtisans, addPortfolio, deletePortfolio, updateAvailability, getAvailability, };
//# sourceMappingURL=artisanController.d.ts.map