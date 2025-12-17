// src/scripts/seed-artisans.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define schemas inline to avoid import issues
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: String,
  verified: Boolean,
});

const CitySchema = new mongoose.Schema({
  name: String,
  division: String,
  district: String,
  area: String,
  coordinates: {
    type: { type: String },
    coordinates: [Number],
  },
  isActive: Boolean,
});

const ArtisanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  businessName: String,
  category: String,
  skills: [String],
  bio: String,
  hourlyRate: Number,
  rating: Number,
  reviewCount: Number,
  completedJobs: Number,
  verified: Boolean,
  location: {
    division: String,
    district: String,
    area: String,
    address: String,
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  },
  availability: [{
    dayOfWeek: Number,
    slots: [{
      start: String,
      end: String,
      booked: Boolean,
    }]
  }],
  portfolio: [{
    title: String,
    description: String,
    images: [String],
    category: String,
  }]
});

const User = mongoose.model('User', UserSchema);
const City = mongoose.model('City', CitySchema);
const Artisan = mongoose.model('Artisan', ArtisanSchema);

async function seedArtisans() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fetch cities
    const dhanmondi = await City.findOne({ name: 'Dhanmondi' });
    const gulshan = await City.findOne({ name: 'Gulshan' });
    const mirpur = await City.findOne({ name: 'Mirpur' });
    const uttara = await City.findOne({ name: 'Uttara' });
    const banani = await City.findOne({ name: 'Banani' });

    if (!dhanmondi || !gulshan || !mirpur || !uttara || !banani) {
      console.error('❌ Cities not found. Please run seed-cities.ts first!');
      console.log('💡 Run: npm run seed:cities');
      process.exit(1);
    }

    console.log('✅ Cities found');

    // Import bcrypt dynamically
    const bcrypt = require('bcryptjs');
    
    // Create demo users for artisans
    const hashedPassword = await bcrypt.hash('Demo@123', 10);

    const demoUsers = [
      {
        name: 'Karim Ahmed',
        email: 'karim.carpenter@demo.com',
        password: hashedPassword,
        phone: '+8801712345671',
        role: 'artisan',
        verified: true,
      },
      {
        name: 'Shanta Rahman',
        email: 'shanta.tailor@demo.com',
        password: hashedPassword,
        phone: '+8801712345672',
        role: 'artisan',
        verified: true,
      },
      {
        name: 'Rahman Hossain',
        email: 'rahman.electrician@demo.com',
        password: hashedPassword,
        phone: '+8801712345673',
        role: 'artisan',
        verified: true,
      },
      {
        name: 'Alam Sheikh',
        email: 'alam.plumber@demo.com',
        password: hashedPassword,
        phone: '+8801712345674',
        role: 'artisan',
        verified: true,
      },
      {
        name: 'Farhan Islam',
        email: 'farhan.painter@demo.com',
        password: hashedPassword,
        phone: '+8801712345675',
        role: 'artisan',
        verified: true,
      },
    ];

    // Clear existing demo users and artisans
    console.log('🗑️  Clearing existing demo data...');
    await User.deleteMany({ email: { $regex: '@demo.com$' } });
    
    // Clear all artisans for clean slate
    const artisanCount = await Artisan.countDocuments();
    if (artisanCount > 0) {
      console.log(`   Found ${artisanCount} existing artisans, clearing...`);
      await Artisan.deleteMany({});
    }

    // Create users
    console.log('👤 Creating demo users...');
    const createdUsers = await User.insertMany(demoUsers);
    console.log(`✅ Created ${createdUsers.length} demo users`);

    // Create artisan profiles
    const artisanProfiles = [
      {
        userId: createdUsers[0]._id,
        businessName: "Karim's Carpentry Works",
        category: "carpenter",
        skills: ["Furniture Making", "Wood Carving", "Cabinet Installation", "Door & Window Fitting", "Custom Woodwork"],
        bio: "With over 15 years of experience in carpentry, I specialize in creating beautiful custom furniture and woodwork. From traditional to modern designs, I take pride in delivering quality craftsmanship. I've completed over 200 projects across Dhaka and have a proven track record of satisfied customers. My work includes everything from bedroom sets to kitchen cabinets, all made with precision and care.",
        hourlyRate: 450,
        rating: 4.8,
        reviewCount: 87,
        completedJobs: 156,
        verified: true,
        location: {
          division: dhanmondi.division,
          district: dhanmondi.district,
          area: dhanmondi.area,
          address: "House 12, Road 5, Dhanmondi",
          cityId: dhanmondi._id,
        },
        availability: [
          {
            dayOfWeek: 1,
            slots: [
              { start: "09:00", end: "12:00", booked: false },
              { start: "14:00", end: "17:00", booked: false }
            ]
          },
          {
            dayOfWeek: 3,
            slots: [
              { start: "09:00", end: "12:00", booked: false },
              { start: "14:00", end: "17:00", booked: false }
            ]
          },
          {
            dayOfWeek: 5,
            slots: [
              { start: "09:00", end: "12:00", booked: false },
              { start: "14:00", end: "17:00", booked: false }
            ]
          }
        ],
        portfolio: [
          {
            title: "Modern Dining Set",
            description: "Custom 6-seater dining table with matching chairs, made from premium mahogany wood",
            images: ["https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800"],
            category: "carpenter"
          },
          {
            title: "Built-in Wardrobe",
            description: "Floor-to-ceiling wardrobe with sliding doors and internal organization system",
            images: ["https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800"],
            category: "carpenter"
          }
        ]
      },
      {
        userId: createdUsers[1]._id,
        businessName: "Shanta's Tailoring Studio",
        category: "tailor",
        skills: ["Women's Clothing", "Bridal Wear", "Alterations", "Custom Stitching", "Embroidery"],
        bio: "Professional tailor with 12 years of experience specializing in women's clothing and bridal wear. I create stunning custom outfits for weddings, parties, and everyday wear. My studio uses the latest techniques combined with traditional craftsmanship. I work closely with each client to understand their vision and bring it to life with perfect fitting and beautiful finishes.",
        hourlyRate: 350,
        rating: 4.9,
        reviewCount: 143,
        completedJobs: 289,
        verified: true,
        location: {
          division: gulshan.division,
          district: gulshan.district,
          area: gulshan.area,
          address: "Shop 7, Gulshan Avenue, Gulshan 1",
          cityId: gulshan._id,
        },
        availability: [
          {
            dayOfWeek: 0,
            slots: [
              { start: "10:00", end: "13:00", booked: false },
              { start: "15:00", end: "18:00", booked: false }
            ]
          },
          {
            dayOfWeek: 2,
            slots: [
              { start: "10:00", end: "13:00", booked: false },
              { start: "15:00", end: "18:00", booked: false }
            ]
          },
          {
            dayOfWeek: 4,
            slots: [
              { start: "10:00", end: "13:00", booked: false },
              { start: "15:00", end: "18:00", booked: false }
            ]
          }
        ],
        portfolio: [
          {
            title: "Bridal Lehenga",
            description: "Heavily embroidered bridal lehenga with intricate beadwork and traditional motifs",
            images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"],
            category: "tailor"
          },
          {
            title: "Party Saree",
            description: "Designer saree with custom blouse and modern draping style",
            images: ["https://images.unsplash.com/photo-1583391733956-6c78276477e5?w=800"],
            category: "tailor"
          }
        ]
      },
      {
        userId: createdUsers[2]._id,
        businessName: "Rahman Electrical Services",
        category: "electrician",
        skills: ["House Wiring", "Appliance Installation", "Circuit Repairs", "Generator Setup", "Smart Home Systems"],
        bio: "Licensed electrician with 10 years of professional experience in residential and commercial electrical work. I provide safe, reliable, and code-compliant electrical solutions. From simple repairs to complete rewiring projects, I ensure quality workmanship and customer satisfaction. I'm available for emergency calls and offer free estimates for all projects.",
        hourlyRate: 400,
        rating: 4.7,
        reviewCount: 94,
        completedJobs: 178,
        verified: true,
        location: {
          division: mirpur.division,
          district: mirpur.district,
          area: mirpur.area,
          address: "Block C, Road 3, Mirpur 10",
          cityId: mirpur._id,
        },
        availability: [
          {
            dayOfWeek: 1,
            slots: [
              { start: "08:00", end: "11:00", booked: false },
              { start: "13:00", end: "16:00", booked: false }
            ]
          },
          {
            dayOfWeek: 2,
            slots: [
              { start: "08:00", end: "11:00", booked: false },
              { start: "13:00", end: "16:00", booked: false }
            ]
          },
          {
            dayOfWeek: 4,
            slots: [
              { start: "08:00", end: "11:00", booked: false },
              { start: "13:00", end: "16:00", booked: false }
            ]
          }
        ],
        portfolio: [
          {
            title: "Complete House Rewiring",
            description: "Full electrical rewiring of 3-bedroom apartment with modern fixtures and safety features",
            images: ["https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800"],
            category: "electrician"
          }
        ]
      },
      {
        userId: createdUsers[3]._id,
        businessName: "Alam's Plumbing Solutions",
        category: "plumber",
        skills: ["Pipe Installation", "Bathroom Fitting", "Leak Repairs", "Water Tank Setup", "Drain Cleaning"],
        bio: "Expert plumber serving Dhaka for over 8 years with a focus on quality and reliability. I handle all types of plumbing work from minor repairs to major installations. My services include bathroom renovations, water heater installations, and emergency leak repairs. I use high-quality materials and provide warranty on all work. Quick response time and transparent pricing are my priorities.",
        hourlyRate: 380,
        rating: 4.6,
        reviewCount: 76,
        completedJobs: 142,
        verified: true,
        location: {
          division: uttara.division,
          district: uttara.district,
          area: uttara.area,
          address: "Sector 6, House 45, Uttara",
          cityId: uttara._id,
        },
        availability: [
          {
            dayOfWeek: 0,
            slots: [
              { start: "08:00", end: "12:00", booked: false },
              { start: "14:00", end: "17:00", booked: false }
            ]
          },
          {
            dayOfWeek: 3,
            slots: [
              { start: "08:00", end: "12:00", booked: false },
              { start: "14:00", end: "17:00", booked: false }
            ]
          },
          {
            dayOfWeek: 6,
            slots: [
              { start: "08:00", end: "12:00", booked: false }
            ]
          }
        ],
        portfolio: [
          {
            title: "Modern Bathroom Installation",
            description: "Complete bathroom renovation with new fixtures, tiles, and plumbing system",
            images: ["https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800"],
            category: "plumber"
          }
        ]
      },
      {
        userId: createdUsers[4]._id,
        businessName: "Colors & Walls Painting",
        category: "painter",
        skills: ["Interior Painting", "Exterior Painting", "Wall Texture", "Decorative Finishes", "Color Consultation"],
        bio: "Professional painter with 13 years of experience transforming homes and offices. I specialize in both interior and exterior painting with attention to detail and clean work. I offer color consultation to help you choose the perfect palette for your space. Using premium quality paints and modern techniques, I ensure long-lasting, beautiful results. My team is punctual, professional, and respectful of your property.",
        hourlyRate: 320,
        rating: 4.8,
        reviewCount: 112,
        completedJobs: 203,
        verified: true,
        location: {
          division: banani.division,
          district: banani.district,
          area: banani.area,
          address: "Road 11, House 23, Banani",
          cityId: banani._id,
        },
        availability: [
          {
            dayOfWeek: 1,
            slots: [
              { start: "09:00", end: "13:00", booked: false },
              { start: "14:00", end: "17:00", booked: false }
            ]
          },
          {
            dayOfWeek: 2,
            slots: [
              { start: "09:00", end: "13:00", booked: false },
              { start: "14:00", end: "17:00", booked: false }
            ]
          },
          {
            dayOfWeek: 5,
            slots: [
              { start: "09:00", end: "13:00", booked: false },
              { start: "14:00", end: "17:00", booked: false }
            ]
          }
        ],
        portfolio: [
          {
            title: "Living Room Transformation",
            description: "Modern living room with textured accent wall and soothing color palette",
            images: ["https://images.unsplash.com/photo-1615875605825-5eb9bb5d52ac?w=800"],
            category: "painter"
          },
          {
            title: "Office Interior Painting",
            description: "Complete office space painting with professional finish and quick turnaround",
            images: ["https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800"],
            category: "painter"
          }
        ]
      }
    ];

    console.log('🔨 Creating artisan profiles...');
    const createdArtisans = await Artisan.insertMany(artisanProfiles);
    console.log(`✅ Created ${createdArtisans.length} artisan profiles`);

    console.log('\n📋 Demo Artisans Created:\n');
    createdArtisans.forEach((artisan: any, index: number) => {
      console.log(`${index + 1}. ${artisan.businessName}`);
      console.log(`   Category: ${artisan.category}`);
      console.log(`   Location: ${artisan.location.area}, ${artisan.location.district}`);
      console.log(`   Email: ${demoUsers[index].email}`);
      console.log(`   Password: Demo@123`);
      console.log(`   Rating: ${artisan.rating} ⭐ (${artisan.reviewCount} reviews)`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('\n🎉 Demo artisans seeded successfully!');
    console.log('\n📝 Login credentials for all demo artisans:');
    console.log('   Password: Demo@123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding artisans:', error);
    process.exit(1);
  }
}

seedArtisans();