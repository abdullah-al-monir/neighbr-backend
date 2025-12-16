import mongoose, { Document } from "mongoose";
export interface IBooking extends Document {
    customerId: mongoose.Types.ObjectId;
    artisanId: mongoose.Types.ObjectId;
    serviceType: string;
    description: string;
    scheduledDate: Date;
    timeSlot: {
        start: string;
        end: string;
    };
    status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
    amount: number;
    paymentStatus: "pending" | "paid" | "refunded" | "failed";
    paymentIntentId?: string;
    escrowReleased: boolean;
    cancellationReason?: string;
    location: {
        type: "Point";
        coordinates: [number, number];
        address: string;
    };
    notes?: string;
}
declare const _default: mongoose.Model<IBooking, {}, {}, {}, mongoose.Document<unknown, {}, IBooking, {}, mongoose.DefaultSchemaOptions> & IBooking & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IBooking>;
export default _default;
//# sourceMappingURL=Booking.d.ts.map