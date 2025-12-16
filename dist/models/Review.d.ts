import mongoose, { Document } from 'mongoose';
export interface IReview extends Document {
    bookingId: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    artisanId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    images?: string[];
    response?: {
        text: string;
        createdAt: Date;
    };
}
declare const _default: mongoose.Model<IReview, {}, {}, {}, mongoose.Document<unknown, {}, IReview, {}, mongoose.DefaultSchemaOptions> & IReview & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IReview>;
export default _default;
//# sourceMappingURL=Review.d.ts.map