"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const City_1 = __importDefault(require("../models/City"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const DIVISIONS = [
    "Dhaka",
    "Chattogram",
    "Rajshahi",
    "Khulna",
    "Barishal",
    "Sylhet",
    "Rangpur",
    "Mymensingh",
];
async function seedCustomers() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI)
            throw new Error("MONGODB_URI missing");
        await mongoose_1.default.connect(MONGODB_URI);
        console.log("🚀 Connected to MongoDB");
        // 1. Clear old demo customers (only those with @demo.com to avoid deleting real users)
        await User_1.default.deleteMany({
            email: { $regex: /@customer\.demo\.com$/i },
            role: "customer",
        });
        console.log("🗑️  Cleared old demo customers");
        const hashedPassword = await bcryptjs_1.default.hash("Demo@123", 12);
        let totalCustomers = 0;
        for (const division of DIVISIONS) {
            // Find 3 cities per division to spread customers out
            const cities = await City_1.default.find({ division }).limit(3).lean();
            if (cities.length === 0)
                continue;
            const customerData = [];
            // Create 5 customers per division
            for (let i = 1; i <= 5; i++) {
                const city = cities[i % cities.length];
                const firstName = [
                    "Tanvir",
                    "Nusrat",
                    "Sajid",
                    "Mim",
                    "Fahim",
                    "Ayesha",
                    "Zubair",
                    "Tasnim",
                    "Kamrul",
                    "Ishrat",
                ][(totalCustomers + i) % 10];
                const lastName = ["Ahmed", "Khan", "Chowdhury", "Sarker", "Patwary"][(totalCustomers + i) % 5];
                customerData.push({
                    name: `${firstName} ${lastName}`,
                    email: `${firstName.toLowerCase()}.${totalCustomers + i}@customer.demo.com`,
                    password: hashedPassword,
                    phone: `+8801${Math.floor(500000000 + Math.random() * 200000000)}`,
                    role: "customer",
                    verified: true,
                    location: {
                        division: division,
                        district: city.district,
                        area: city.area,
                        address: `House ${i * 3}, Flat 4B, ${city.area}`,
                        cityId: city._id,
                    },
                });
            }
            await User_1.default.insertMany(customerData);
            totalCustomers += customerData.length;
            console.log(`📍 Seeded ${customerData.length} customers in ${division}`);
        }
        console.log(`\n✨ SUCCESS: Seeded ${totalCustomers} customers across Bangladesh!`);
        await mongoose_1.default.connection.close();
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Error seeding customers:", error);
        process.exit(1);
    }
}
seedCustomers();
//# sourceMappingURL=seed-customers.js.map