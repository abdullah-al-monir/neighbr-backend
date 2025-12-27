import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
export declare const getHomePageData: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAboutPageData: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
interface IContactMessage extends mongoose.Document {
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
    status: "new" | "in-progress" | "resolved";
    createdAt: Date;
}
declare const ContactMessage: mongoose.Model<IContactMessage, {}, {}, {}, mongoose.Document<unknown, {}, IContactMessage, {}, mongoose.DefaultSchemaOptions> & IContactMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IContactMessage>;
export declare const submitContactForm: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getContactMessages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateContactMessageStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export { ContactMessage };
//# sourceMappingURL=publicController.d.ts.map