import mongoose, { Document } from 'mongoose';
export interface IPortfolio {
    title: string;
    description: string;
    images: string[];
    category: string;
    createdAt: Date;
}
export interface IAvailability {
    dayOfWeek: number;
    slots: {
        start: string;
        end: string;
        booked: boolean;
    }[];
}
export interface IArtisan extends Document {
    userId: mongoose.Types.ObjectId;
    businessName: string;
    category: string;
    skills: string[];
    bio: string;
    portfolio: IPortfolio[];
    rating: number;
    reviewCount: number;
    completedJobs: number;
    availability: IAvailability[];
    hourlyRate: number;
    subscriptionTier: 'free' | 'basic' | 'premium';
    subscriptionExpiresAt?: Date;
    verified: boolean;
    verificationDocuments?: string[];
    location: {
        type: 'Point';
        coordinates: [number, number];
        address: string;
        serviceRadius: number;
    };
}
declare const _default: mongoose.Model<IArtisan, {}, {}, {}, mongoose.Document<unknown, {}, IArtisan, {}, mongoose.DefaultSchemaOptions> & IArtisan & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IArtisan>;
export default _default;
//# sourceMappingURL=Artisan.d.ts.map