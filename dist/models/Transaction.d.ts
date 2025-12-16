import mongoose, { Document } from "mongoose";
export interface ITransaction extends Document {
    bookingId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: "booking" | "subscription" | "refund";
    amount: number;
    platformFee: number;
    netAmount: number;
    stripePaymentIntentId: string;
    status: "pending" | "completed" | "failed";
    metadata?: Record<string, any>;
}
declare const _default: mongoose.Model<ITransaction, {}, {}, {}, mongoose.Document<unknown, {}, ITransaction, {}, mongoose.DefaultSchemaOptions> & ITransaction & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, ITransaction>;
export default _default;
//# sourceMappingURL=Transaction.d.ts.map