import mongoose, { Document } from "mongoose";
export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    role: "customer" | "artisan" | "admin";
    avatar?: string;
    phone?: string;
    location: {
        division: string;
        district: string;
        area: string;
        address: string;
        cityId: mongoose.Types.ObjectId;
    };
    verified: boolean;
    verificationToken?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    refreshToken?: string;
    lastLogin?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IUser>;
export default _default;
//# sourceMappingURL=User.d.ts.map