import mongoose, { Document } from "mongoose";
export interface ICity extends Document {
    name: string;
    division: string;
    district: string;
    area: string;
    coordinates: {
        type: "Point";
        coordinates: [number, number];
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICity, {}, {}, {}, mongoose.Document<unknown, {}, ICity, {}, mongoose.DefaultSchemaOptions> & ICity & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, ICity>;
export default _default;
//# sourceMappingURL=City.d.ts.map