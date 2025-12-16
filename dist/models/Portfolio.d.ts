import mongoose, { Document } from 'mongoose';
export interface IPortfolioItem extends Document {
    artisanId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    images: string[];
    category: string;
    tags: string[];
    featured: boolean;
    views: number;
    likes: number;
}
declare const _default: mongoose.Model<IPortfolioItem, {}, {}, {}, mongoose.Document<unknown, {}, IPortfolioItem, {}, mongoose.DefaultSchemaOptions> & IPortfolioItem & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IPortfolioItem>;
export default _default;
//# sourceMappingURL=Portfolio.d.ts.map