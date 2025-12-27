"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PlatformFeeConfig_1 = __importDefault(require("../models/PlatformFeeConfig"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const seedPlatformFees = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");
        const fees = [
            {
                tier: "free",
                feePercentage: 10,
                description: "Free tier artisans pay 10% commission on each booking. This is the highest rate to encourage upgrades.",
                isActive: true,
            },
            {
                tier: "basic",
                feePercentage: 7,
                description: "Basic subscribers enjoy a reduced 7% commission rate, saving 3% on every booking compared to free tier.",
                isActive: true,
            },
            {
                tier: "premium",
                feePercentage: 5,
                description: "Premium members get the best rate at only 5% commission, maximizing their earnings from every booking.",
                isActive: true,
            },
        ];
        for (const fee of fees) {
            await PlatformFeeConfig_1.default.findOneAndUpdate({ tier: fee.tier }, fee, {
                upsert: true,
                new: true,
            });
            console.log(`✓ ${fee.tier} tier fee configured: ${fee.feePercentage}%`);
        }
        console.log("\n✅ Platform fees seeded successfully!");
        console.log("\nCommission Structure:");
        console.log("- Free Tier: 10%");
        console.log("- Basic Tier: 7% (save 3%)");
        console.log("- Premium Tier: 5% (save 5%)");
        await mongoose_1.default.connection.close();
        process.exit(0);
    }
    catch (error) {
        console.error("Error seeding platform fees:", error);
        process.exit(1);
    }
};
seedPlatformFees();
//# sourceMappingURL=seed-platform-fees.js.map