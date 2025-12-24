"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/scripts/seed-artisans.ts
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const City_1 = __importDefault(require("../models/City"));
const User_1 = __importDefault(require("../models/User"));
const Artisan_1 = __importDefault(require("../models/Artisan"));
dotenv_1.default.config();
async function seedArtisans() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.error("MONGODB_URI is not defined in .env");
            process.exit(1);
        }
        console.log("Connecting to MongoDB...");
        await mongoose_1.default.connect(MONGODB_URI);
        console.log("Connected to MongoDB");
        // Find required cities
        const cities = await City_1.default.find({
            name: { $in: ["Dhanmondi", "Gulshan", "Mirpur", "Uttara", "Banani"] },
        }).lean();
        const cityMap = cities.reduce((map, city) => {
            map[city.name] = city;
            return map;
        }, {});
        const requiredCities = [
            "Dhanmondi",
            "Gulshan",
            "Mirpur",
            "Uttara",
            "Banani",
        ];
        const missing = requiredCities.filter((name) => !cityMap[name]);
        if (missing.length > 0) {
            console.error(`Missing cities: ${missing.join(", ")}`);
            console.log("Run: npm run seed:cities");
            process.exit(1);
        }
        console.log("All required cities found");
        const hashedPassword = await bcryptjs_1.default.hash("Demo@123", 12);
        // Clear previous demo data
        console.log("Clearing existing demo artisans and users...");
        await User_1.default.deleteMany({ email: { $regex: /@demo\.com$/i } });
        await Artisan_1.default.deleteMany({});
        // Create demo artisan users
        const demoUsers = [
            {
                name: "Karim Ahmed",
                email: "karim.carpenter@demo.com",
                password: hashedPassword,
                phone: "+8801712345671",
                role: "artisan",
                verified: true,
                location: {
                    division: cityMap["Dhanmondi"].division,
                    district: cityMap["Dhanmondi"].district,
                    area: cityMap["Dhanmondi"].area,
                    address: "House 12, Road 5, Dhanmondi R/A",
                    cityId: cityMap["Dhanmondi"]._id,
                },
            },
            {
                name: "Shanta Rahman",
                email: "shanta.tailor@demo.com",
                password: hashedPassword,
                phone: "+8801712345672",
                role: "artisan",
                verified: true,
                location: {
                    division: cityMap["Gulshan"].division,
                    district: cityMap["Gulshan"].district,
                    area: cityMap["Gulshan"].area,
                    address: "Shop 7, Gulshan Avenue, Gulshan 1",
                    cityId: cityMap["Gulshan"]._id,
                },
            },
            {
                name: "Rahman Hossain",
                email: "rahman.electrician@demo.com",
                password: hashedPassword,
                phone: "+8801712345673",
                role: "artisan",
                verified: true,
                location: {
                    division: cityMap["Mirpur"].division,
                    district: cityMap["Mirpur"].district,
                    area: cityMap["Mirpur"].area,
                    address: "Block C, Road 3, Mirpur 10",
                    cityId: cityMap["Mirpur"]._id,
                },
            },
            {
                name: "Alam Sheikh",
                email: "alam.plumber@demo.com",
                password: hashedPassword,
                phone: "+8801712345674",
                role: "artisan",
                verified: true,
                location: {
                    division: cityMap["Uttara"].division,
                    district: cityMap["Uttara"].district,
                    area: cityMap["Uttara"].area,
                    address: "Sector 6, House 45, Uttara",
                    cityId: cityMap["Uttara"]._id,
                },
            },
            {
                name: "Farhan Islam",
                email: "farhan.painter@demo.com",
                password: hashedPassword,
                phone: "+8801712345675",
                role: "artisan",
                verified: true,
                location: {
                    division: cityMap["Banani"].division,
                    district: cityMap["Banani"].district,
                    area: cityMap["Banani"].area,
                    address: "Road 11, House 23, Banani",
                    cityId: cityMap["Banani"]._id,
                },
            },
        ];
        console.log("Creating demo artisan users...");
        const createdUsers = await User_1.default.insertMany(demoUsers);
        console.log(`Created ${createdUsers.length} demo users`);
        // Create artisan profiles
        const artisanProfiles = [
            {
                userId: createdUsers[0]._id,
                businessName: "Karim's Carpentry Works",
                category: "carpenter",
                skills: [
                    "Furniture Making",
                    "Wood Carving",
                    "Cabinet Installation",
                    "Door & Window Fitting",
                    "Custom Woodwork",
                ],
                bio: "With over 15 years of experience in carpentry, I specialize in creating beautiful custom furniture and woodwork. From traditional to modern designs, I take pride in delivering quality craftsmanship.",
                hourlyRate: 450,
                rating: 4.8,
                reviewCount: 87,
                completedJobs: 156,
                verified: true,
                subscriptionTier: "premium",
                location: demoUsers[0].location, // Same as user
                availability: [
                    {
                        dayOfWeek: 1,
                        slots: [
                            { start: "09:00", end: "12:00", booked: false },
                            { start: "14:00", end: "17:00", booked: false },
                        ],
                    },
                    {
                        dayOfWeek: 3,
                        slots: [
                            { start: "09:00", end: "12:00", booked: false },
                            { start: "14:00", end: "17:00", booked: false },
                        ],
                    },
                    {
                        dayOfWeek: 5,
                        slots: [
                            { start: "09:00", end: "12:00", booked: false },
                            { start: "14:00", end: "17:00", booked: false },
                        ],
                    },
                ],
                portfolio: [
                    {
                        title: "Modern Dining Set",
                        description: "Custom 6-seater dining table with matching chairs, made from premium mahogany wood",
                        images: [
                            "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800",
                        ],
                        category: "carpenter",
                    },
                    {
                        title: "Built-in Wardrobe",
                        description: "Floor-to-ceiling wardrobe with sliding doors and internal organization",
                        images: [
                            "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
                        ],
                        category: "carpenter",
                    },
                ],
            },
            {
                userId: createdUsers[1]._id,
                businessName: "Shanta's Tailoring Studio",
                category: "tailor",
                skills: [
                    "Women's Clothing",
                    "Bridal Wear",
                    "Alterations",
                    "Custom Stitching",
                    "Embroidery",
                ],
                bio: "Professional tailor with 12 years of experience specializing in women's clothing and bridal wear. I create stunning custom outfits using the finest materials and attention to detail.",
                hourlyRate: 350,
                rating: 4.9,
                reviewCount: 143,
                completedJobs: 289,
                verified: true,
                subscriptionTier: "premium",
                location: demoUsers[1].location,
                availability: [
                    {
                        dayOfWeek: 0,
                        slots: [
                            { start: "10:00", end: "13:00", booked: false },
                            { start: "15:00", end: "18:00", booked: false },
                        ],
                    },
                    {
                        dayOfWeek: 2,
                        slots: [
                            { start: "10:00", end: "13:00", booked: false },
                            { start: "15:00", end: "18:00", booked: false },
                        ],
                    },
                    {
                        dayOfWeek: 4,
                        slots: [
                            { start: "10:00", end: "13:00", booked: false },
                            { start: "15:00", end: "18:00", booked: false },
                        ],
                    },
                ],
                portfolio: [
                    {
                        title: "Bridal Lehenga",
                        description: "Heavily embroidered bridal lehenga with intricate beadwork",
                        images: [
                            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
                        ],
                        category: "tailor",
                    },
                    {
                        title: "Designer Saree",
                        description: "Custom designer saree with modern blouse",
                        images: [
                            "https://images.unsplash.com/photo-1583391733956-6c78276477e5?w=800",
                        ],
                        category: "tailor",
                    },
                ],
            },
            {
                userId: createdUsers[2]._id,
                businessName: "Rahman Electrical Services",
                category: "electrician",
                skills: [
                    "House Wiring",
                    "Appliance Installation",
                    "Circuit Repairs",
                    "Generator Setup",
                    "Smart Home Systems",
                ],
                bio: "Licensed electrician providing safe and reliable electrical services across Dhaka. Emergency calls welcome.",
                hourlyRate: 400,
                rating: 4.7,
                reviewCount: 94,
                completedJobs: 178,
                verified: true,
                subscriptionTier: "basic",
                location: demoUsers[2].location,
                availability: [
                    {
                        dayOfWeek: 1,
                        slots: [
                            { start: "08:00", end: "11:00", booked: false },
                            { start: "13:00", end: "16:00", booked: false },
                        ],
                    },
                    {
                        dayOfWeek: 2,
                        slots: [
                            { start: "08:00", end: "11:00", booked: false },
                            { start: "13:00", end: "16:00", booked: false },
                        ],
                    },
                    {
                        dayOfWeek: 4,
                        slots: [
                            { start: "08:00", end: "11:00", booked: false },
                            { start: "13:00", end: "16:00", booked: false },
                        ],
                    },
                ],
                portfolio: [
                    {
                        title: "Complete House Rewiring",
                        description: "Full rewiring of 3-bedroom apartment with modern safety features",
                        images: [
                            "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800",
                        ],
                        category: "electrician",
                    },
                ],
            },
            {
                userId: createdUsers[3]._id,
                businessName: "Alam's Plumbing Solutions",
                category: "plumber",
                skills: [
                    "Pipe Installation",
                    "Bathroom Fitting",
                    "Leak Repairs",
                    "Water Tank Setup",
                    "Drain Cleaning",
                ],
                bio: "Expert plumber offering fast, reliable service with warranty on all work.",
                hourlyRate: 380,
                rating: 4.6,
                reviewCount: 76,
                completedJobs: 142,
                verified: true,
                subscriptionTier: "basic",
                location: demoUsers[3].location,
                availability: [
                    {
                        dayOfWeek: 0,
                        slots: [
                            { start: "08:00", end: "12:00", booked: false },
                            { start: "14:00", end: "17:00", booked: false },
                        ],
                    },
                    {
                        dayOfWeek: 3,
                        slots: [
                            { start: "08:00", end: "12:00", booked: false },
                            { start: "14:00", end: "17:00", booked: false },
                        ],
                    },
                    {
                        dayOfWeek: 6,
                        slots: [{ start: "08:00", end: "12:00", booked: false }],
                    },
                ],
                portfolio: [
                    {
                        title: "Modern Bathroom Installation",
                        description: "Complete bathroom renovation with premium fixtures",
                        images: [
                            "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800",
                        ],
                        category: "plumber",
                    },
                ],
            },
            {
                userId: createdUsers[4]._id,
                businessName: "Colors & Walls Painting",
                category: "painter",
                skills: [
                    "Interior Painting",
                    "Exterior Painting",
                    "Wall Texture",
                    "Decorative Finishes",
                    "Color Consultation",
                ],
                bio: "Professional painting services with premium quality and clean work.",
                hourlyRate: 320,
                rating: 4.8,
                reviewCount: 112,
                completedJobs: 203,
                verified: true,
                subscriptionTier: "premium",
                location: demoUsers[4].location,
                availability: [
                    {
                        dayOfWeek: 1,
                        slots: [
                            { start: "09:00", end: "13:00", booked: false },
                            { start: "14:00", end: "17:00", booked: false },
                        ],
                    },
                    {
                        dayOfWeek: 2,
                        slots: [
                            { start: "09:00", end: "13:00", booked: false },
                            { start: "14:00", end: "17:00", booked: false },
                        ],
                    },
                    {
                        dayOfWeek: 5,
                        slots: [
                            { start: "09:00", end: "13:00", booked: false },
                            { start: "14:00", end: "17:00", booked: false },
                        ],
                    },
                ],
                portfolio: [
                    {
                        title: "Living Room Transformation",
                        description: "Modern interior with textured accent wall",
                        images: [
                            "https://images.unsplash.com/photo-1615875605825-5eb9bb5d52ac?w=800",
                        ],
                        category: "painter",
                    },
                    {
                        title: "Office Interior",
                        description: "Professional office painting with quick turnaround",
                        images: [
                            "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800",
                        ],
                        category: "painter",
                    },
                ],
            },
        ];
        console.log("Creating artisan profiles...");
        const createdArtisans = await Artisan_1.default.insertMany(artisanProfiles);
        console.log(`Created ${createdArtisans.length} artisan profiles`);
        console.log("\nDemo Artisans Created Successfully!\n");
        createdArtisans.forEach((artisan, i) => {
            const user = createdUsers[i];
            console.log(`${i + 1}. ${artisan.businessName}`);
            console.log(`   Category: ${artisan.category}`);
            console.log(`   Location: ${artisan.location.area}, ${artisan.location.district}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: Demo@123`);
            console.log(`   Rating: ${artisan.rating} (${artisan.reviewCount} reviews)`);
            console.log("");
        });
        console.log("Login with any demo artisan account using:");
        console.log("   Email: [any above]");
        console.log("   Password: Demo@123\n");
        await mongoose_1.default.connection.close();
        console.log("Database connection closed");
        process.exit(0);
    }
    catch (error) {
        console.error("Error seeding artisans:", error);
        process.exit(1);
    }
}
seedArtisans();
//# sourceMappingURL=seed-artisans.js.map