import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import City from "../models/City";
import User from "../models/User";
import Artisan from "../models/Artisan";

dotenv.config();

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

const CATEGORIES = [
  "baker",
  "tailor",
  "carpenter",
  "electrician",
  "plumber",
  "painter",
  "mechanic",
  "gardener",
  "cleaner",
  "other",
];

async function seedAllArtisans() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error("MONGODB_URI missing");

    await mongoose.connect(MONGODB_URI);
    console.log("🚀 Connected to MongoDB");

    await User.deleteMany({ email: { $regex: /@demo\.com$/i } });
    await Artisan.deleteMany({});
    console.log("🗑️  Cleared old demo artisans");

    const hashedPassword = await bcrypt.hash("Demo@123", 12);
    let totalArtisans = 0;

    for (const division of DIVISIONS) {
      console.log(`\n📍 Seeding 10 artisans for ${division}...`);

      const cities = await City.find({ division }).limit(5).lean();
      if (cities.length === 0) continue;

      const artisanData: Array<{
        name: string;
        email: string;
        password: string;
        phone: string;
        role: "artisan";
        verified: boolean;
        location: {
          division: string;
          district: string;
          area: string;
          address: string;
          cityId: any;
        };
        category: string;
      }> = [];

      for (let i = 1; i <= 10; i++) {
        const category = CATEGORIES[i % 5];
        const city = cities[i % cities.length];
        const shortDiv = division.toLowerCase().substring(0, 3);

        const firstName = [
          "Arif",
          "Sumi",
          "Kabir",
          "Liza",
          "Rana",
          "Hasan",
          "Mitu",
          "Rakib",
          "Anwar",
          "Banu",
        ][i - 1];
        const lastName = ["Hossain", "Akter", "Islam", "Rahman", "Ali"][i % 5];

        artisanData.push({
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${category}.${shortDiv}${i}@demo.com`,
          password: hashedPassword,
          phone: `+8801${Math.floor(700000000 + Math.random() * 200000000)}`,
          role: "artisan",
          verified: true,
          location: {
            division: division,
            district: city.district as string,
            area: city.area as string,
            address: `St ${i}, ${city.area}, ${city.district}`,
            cityId: city._id,
          },
          category: category,
        });
      }

      const createdUsers = await User.insertMany(artisanData);

      const artisanProfiles = createdUsers.map((user, i) => {
        const base = artisanData[i];
        const cat = base.category;

        const configMap: Record<string, any> = {
          carpenter: {
            biz: "Wood Crafts",
            skills: ["Furniture", "Doors"],
            rate: 450,
            img: "1617806118233-18e1de247200",
          },
          tailor: {
            biz: "Fashion House",
            skills: ["Stitching", "Bridal"],
            rate: 350,
            img: "1610030469983-98e550d6193c",
          },
          electrician: {
            biz: "Electric Works",
            skills: ["Wiring", "Repair"],
            rate: 400,
            img: "1621905251918-48416bd8575a",
          },
          plumber: {
            biz: "Plumbing Service",
            skills: ["Pipes", "Taps"],
            rate: 380,
            img: "1620626011761-996317b8d101",
          },
          painter: {
            biz: "Colors",
            skills: ["Interior", "Wall Art"],
            rate: 300,
            img: "1615875605825-5eb9bb5d52ac",
          },
        };

        const config = configMap[cat];

        return {
          userId: user._id,
          businessName: `${base.name.split(" ")[0]} ${config.biz}`,
          category: cat,
          skills: config.skills,
          bio: `Professional ${cat} based in ${
            base.location.area
          }. Expert in ${config.skills.join(", ")}.`,
          hourlyRate: config.rate + Math.floor(Math.random() * 50),
          rating: 4.2 + Math.random() * 0.7,
          reviewCount: Math.floor(10 + Math.random() * 100),
          completedJobs: Math.floor(20 + Math.random() * 150),
          verified: true,
          subscriptionTier: "basic",
          location: user.location,
          availability: [
            {
              dayOfWeek: 1,
              slots: [{ start: "09:00", end: "18:00", booked: false }],
            },
          ],
          portfolio: [
            {
              title: "Recent Work",
              description: "Completed project for client",
              images: [`https://images.unsplash.com/photo-${config.img}?w=800`],
              category: cat,
            },
          ],
        };
      });

      await Artisan.insertMany(artisanProfiles);
      totalArtisans += createdUsers.length;
    }

    console.log(
      `\n✨ SUCCESS: Seeded ${totalArtisans} artisans across Bangladesh!`
    );
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding artisans:", error);
    process.exit(1);
  }
}

seedAllArtisans();
