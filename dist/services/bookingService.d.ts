export declare const createBookingWithValidation: (bookingData: any) => Promise<(import("mongoose").Document<unknown, {}, import("../models/Booking").IBooking, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Booking").IBooking & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare const getUpcomingBookings: (userId: string, role: string) => Promise<(import("mongoose").Document<unknown, {}, import("../models/Booking").IBooking, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Booking").IBooking & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
//# sourceMappingURL=bookingService.d.ts.map