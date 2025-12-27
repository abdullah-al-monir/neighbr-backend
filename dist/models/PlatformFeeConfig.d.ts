import mongoose, { Document } from 'mongoose';
export interface IPlatformFeeConfig extends Document {
    tier: 'free' | 'basic' | 'premium';
    feePercentage: number;
    description: string;
    isActive: boolean;
}
declare const _default: mongoose.Model<IPlatformFeeConfig, {}, {}, {}, mongoose.Document<unknown, {}, IPlatformFeeConfig, {}, mongoose.DefaultSchemaOptions> & IPlatformFeeConfig & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IPlatformFeeConfig>;
export default _default;
//# sourceMappingURL=PlatformFeeConfig.d.ts.map