import mongoose, { Document } from 'mongoose';
export interface ISubscriptionSettings extends Document {
    tier: 'free' | 'basic' | 'premium';
    name: string;
    price: number;
    duration: number;
    features: string[];
    maxPortfolioItems: number;
    prioritySupport: boolean;
    featuredListing: boolean;
    analyticsAccess: boolean;
    isActive: boolean;
    description: string;
}
declare const _default: mongoose.Model<ISubscriptionSettings, {}, {}, {}, mongoose.Document<unknown, {}, ISubscriptionSettings, {}, mongoose.DefaultSchemaOptions> & ISubscriptionSettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, ISubscriptionSettings>;
export default _default;
//# sourceMappingURL=SubscriptionSettings.d.ts.map