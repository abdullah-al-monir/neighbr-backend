import mongoose from "mongoose";
interface IContactMessage extends mongoose.Document {
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
    status: "new" | "in-progress" | "resolved";
    createdAt: Date;
}
declare const _default: mongoose.Model<IContactMessage, {}, {}, {}, mongoose.Document<unknown, {}, IContactMessage, {}, mongoose.DefaultSchemaOptions> & IContactMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IContactMessage>;
export default _default;
//# sourceMappingURL=ContactMessage.d.ts.map