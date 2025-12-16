import { Request, Response, NextFunction } from "express";
export declare const createBooking: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getBooking: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getMyBookings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getArtisanBookings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateBookingStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const cancelBooking: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=bookingController.d.ts.map