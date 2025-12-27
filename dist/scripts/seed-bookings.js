"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const Review_1 = __importDefault(require("../models/Review"));
const User_1 = __importDefault(require("../models/User"));
const Artisan_1 = __importDefault(require("../models/Artisan"));
dotenv_1.default.config();
const SERVICE_DESCRIPTIONS = {
    baker: ["Custom wedding cake design", "Birthday party catering", "Pastry assortment for event"],
    tailor: ["Formal suit stitching", "Traditional dress alteration", "Bridal wear design"],
    carpenter: ["Kitchen cabinet repair", "Wooden door installation", "Custom bookshelf building"],
    electrician: ["Full house rewiring", "AC circuit installation", "Generator maintenance"],
    plumber: ["Bathroom pipe leakage fix", "Water pump installation", "Kitchen sink repair"],
    painter: ["Living room wall painting", "Exterior house coating", "Decorative texture painting"],
};
async function seedBookings() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI)
            throw new Error("MONGODB_URI missing");
        await mongoose_1.default.connect(MONGODB_URI);
        console.log("🚀 Connected to MongoDB for Booking Seeding");
        // 1. Clear old demo data
        await Booking_1.default.deleteMany({});
        await Transaction_1.default.deleteMany({});
        await Review_1.default.deleteMany({});
        console.log("🗑️  Cleared old bookings, transactions, and reviews");
        // 2. Get real IDs from your DB
        const customers = await User_1.default.find({ role: "customer" }).limit(20).lean();
        const artisans = await Artisan_1.default.find({}).populate("userId").limit(20).lean();
        if (customers.length === 0 || artisans.length === 0) {
            throw new Error("❌ Seed Artisans and Customers first!");
        }
        console.log(`🔗 Using ${customers.length} customers and ${artisans.length} artisans...`);
        for (let i = 0; i < 50; i++) {
            const session = await mongoose_1.default.startSession();
            session.startTransaction();
            try {
                // Random Selection
                const customer = customers[Math.floor(Math.random() * customers.length)];
                const artisan = artisans[Math.floor(Math.random() * artisans.length)];
                const category = artisan.category || "other";
                const descriptions = SERVICE_DESCRIPTIONS[category] || ["General maintenance service"];
                const description = descriptions[Math.floor(Math.random() * descriptions.length)];
                const amount = Math.floor(Math.random() * 2000) + 500; // 500 to 2500 BDT
                const platformFee = Math.round(amount * 0.10);
                // 3. Create Booking
                const [booking] = await Booking_1.default.create([{
                        customerId: customer._id,
                        artisanId: artisan._id,
                        serviceType: category,
                        description: description,
                        scheduledDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
                        timeSlot: { start: "10:00", end: "12:00" },
                        status: "completed",
                        amount: amount,
                        paymentStatus: "paid",
                        location: {
                            type: "Point",
                            coordinates: [90.4125, 23.8103],
                            address: `House ${i + 1}, Road ${Math.floor(i / 5) + 1}, ${artisan.location?.area || 'Dhaka'}`
                        },
                        escrowReleased: true
                    }], { session });
                // 4. Create Transaction
                await Transaction_1.default.create([{
                        bookingId: booking._id,
                        userId: customer._id,
                        type: "booking",
                        amount: amount,
                        platformFee: platformFee,
                        netAmount: amount - platformFee,
                        stripePaymentIntentId: `pi_demo_${Math.random().toString(36).substring(7)}_${i}`,
                        status: "completed"
                    }], { session });
                // 5. Create Review
                await Review_1.default.create([{
                        bookingId: booking._id,
                        customerId: customer._id,
                        artisanId: artisan._id,
                        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
                        comment: `Great experience! The ${category} was very professional and finished on time.`,
                    }], { session });
                await session.commitTransaction();
                session.endSession();
                if ((i + 1) % 10 === 0)
                    console.log(`✅ Seeded ${i + 1}/50 bookings...`);
            }
            catch (err) {
                await session.abortTransaction();
                session.endSession();
                console.error(`❌ Error seeding record ${i}:`, err);
            }
        }
        console.log("\n✨ SUCCESS: 50 Bookings, Transactions, and Reviews created!");
        await mongoose_1.default.connection.close();
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}
seedBookings();
//# sourceMappingURL=seed-bookings.js.map