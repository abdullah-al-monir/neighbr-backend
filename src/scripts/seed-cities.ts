// src/scripts/seed-cities.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Define the City schema inline to avoid import issues
const CitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  division: {
    type: String,
    required: true,
    enum: ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'],
  },
  district: {
    type: String,
    required: true,
    trim: true,
  },
  area: {
    type: String,
    required: true,
    trim: true,
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

CitySchema.index({ 'coordinates.coordinates': '2dsphere' });
CitySchema.index({ division: 1, district: 1, area: 1 });
CitySchema.index({ isActive: 1 });

const City = mongoose.model('City', CitySchema);

const cities = [
  // Dhaka Division - Dhaka District
  {
    name: 'Dhanmondi',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Dhanmondi',
    coordinates: { type: 'Point', coordinates: [90.3742, 23.7461] },
  },
  {
    name: 'Gulshan',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Gulshan',
    coordinates: { type: 'Point', coordinates: [90.4152, 23.7806] },
  },
  {
    name: 'Mirpur',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Mirpur',
    coordinates: { type: 'Point', coordinates: [90.3563, 23.8223] },
  },
  {
    name: 'Uttara',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Uttara',
    coordinates: { type: 'Point', coordinates: [90.3795, 23.8759] },
  },
  {
    name: 'Mohammadpur',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Mohammadpur',
    coordinates: { type: 'Point', coordinates: [90.3563, 23.7658] },
  },
  {
    name: 'Banani',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Banani',
    coordinates: { type: 'Point', coordinates: [90.4040, 23.7937] },
  },
  {
    name: 'Motijheel',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Motijheel',
    coordinates: { type: 'Point', coordinates: [90.4177, 23.7330] },
  },
  {
    name: 'Farmgate',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Farmgate',
    coordinates: { type: 'Point', coordinates: [90.3889, 23.7575] },
  },
  {
    name: 'Badda',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Badda',
    coordinates: { type: 'Point', coordinates: [90.4262, 23.7805] },
  },
  {
    name: 'Khilgaon',
    division: 'Dhaka',
    district: 'Dhaka',
    area: 'Khilgaon',
    coordinates: { type: 'Point', coordinates: [90.4253, 23.7515] },
  },
  
  // Dhaka Division - Gazipur District
  {
    name: 'Gazipur Sadar',
    division: 'Dhaka',
    district: 'Gazipur',
    area: 'Gazipur Sadar',
    coordinates: { type: 'Point', coordinates: [90.4125, 23.9999] },
  },
  {
    name: 'Tongi',
    division: 'Dhaka',
    district: 'Gazipur',
    area: 'Tongi',
    coordinates: { type: 'Point', coordinates: [90.4033, 23.8908] },
  },
  
  // Dhaka Division - Narayanganj District
  {
    name: 'Narayanganj Sadar',
    division: 'Dhaka',
    district: 'Narayanganj',
    area: 'Narayanganj Sadar',
    coordinates: { type: 'Point', coordinates: [90.5000, 23.6238] },
  },
  
  // Chittagong Division - Chittagong District
  {
    name: 'Agrabad',
    division: 'Chittagong',
    district: 'Chittagong',
    area: 'Agrabad',
    coordinates: { type: 'Point', coordinates: [91.8315, 22.3384] },
  },
  {
    name: 'Patenga',
    division: 'Chittagong',
    district: 'Chittagong',
    area: 'Patenga',
    coordinates: { type: 'Point', coordinates: [91.7979, 22.2364] },
  },
  {
    name: 'Khulshi',
    division: 'Chittagong',
    district: 'Chittagong',
    area: 'Khulshi',
    coordinates: { type: 'Point', coordinates: [91.8105, 22.3475] },
  },
  {
    name: 'Halishahar',
    division: 'Chittagong',
    district: 'Chittagong',
    area: 'Halishahar',
    coordinates: { type: 'Point', coordinates: [91.8101, 22.3744] },
  },
  
  // Chittagong Division - Cox's Bazar District
  {
    name: 'Cox\'s Bazar Sadar',
    division: 'Chittagong',
    district: 'Cox\'s Bazar',
    area: 'Cox\'s Bazar Sadar',
    coordinates: { type: 'Point', coordinates: [91.9815, 21.4272] },
  },
  
  // Rajshahi Division - Rajshahi District
  {
    name: 'Rajshahi City',
    division: 'Rajshahi',
    district: 'Rajshahi',
    area: 'Rajshahi Sadar',
    coordinates: { type: 'Point', coordinates: [88.5943, 24.3745] },
  },
  
  // Rajshahi Division - Pabna District
  {
    name: 'Pabna Sadar',
    division: 'Rajshahi',
    district: 'Pabna',
    area: 'Pabna Sadar',
    coordinates: { type: 'Point', coordinates: [89.2372, 24.0064] },
  },
  
  // Khulna Division - Khulna District
  {
    name: 'Khulna City',
    division: 'Khulna',
    district: 'Khulna',
    area: 'Khulna Sadar',
    coordinates: { type: 'Point', coordinates: [89.5403, 22.8456] },
  },
  
  // Khulna Division - Jessore District
  {
    name: 'Jessore Sadar',
    division: 'Khulna',
    district: 'Jessore',
    area: 'Jessore Sadar',
    coordinates: { type: 'Point', coordinates: [89.2081, 23.1697] },
  },
  
  // Sylhet Division - Sylhet District
  {
    name: 'Sylhet City',
    division: 'Sylhet',
    district: 'Sylhet',
    area: 'Sylhet Sadar',
    coordinates: { type: 'Point', coordinates: [91.8709, 24.8949] },
  },
  
  // Sylhet Division - Moulvibazar District
  {
    name: 'Moulvibazar Sadar',
    division: 'Sylhet',
    district: 'Moulvibazar',
    area: 'Moulvibazar Sadar',
    coordinates: { type: 'Point', coordinates: [91.7774, 24.4829] },
  },
  
  // Barisal Division - Barisal District
  {
    name: 'Barisal City',
    division: 'Barisal',
    district: 'Barisal',
    area: 'Barisal Sadar',
    coordinates: { type: 'Point', coordinates: [90.3696, 22.7010] },
  },
  
  // Rangpur Division - Rangpur District
  {
    name: 'Rangpur City',
    division: 'Rangpur',
    district: 'Rangpur',
    area: 'Rangpur Sadar',
    coordinates: { type: 'Point', coordinates: [89.2514, 25.7439] },
  },
  
  // Mymensingh Division - Mymensingh District
  {
    name: 'Mymensingh City',
    division: 'Mymensingh',
    district: 'Mymensingh',
    area: 'Mymensingh Sadar',
    coordinates: { type: 'Point', coordinates: [90.4203, 24.7471] },
  },
];

async function seedCities() {
  try {
    // Load environment variables
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      console.log('💡 Please add MONGODB_URI to your .env file');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing cities
    await City.deleteMany({});
    console.log('🗑️  Cleared existing cities');

    // Insert new cities
    const result = await City.insertMany(cities);
    console.log(`✅ Inserted ${result.length} cities`);

    console.log('\n📍 Cities seeded successfully!\n');
    
    // List all cities by division
    const allCities = await City.find().sort({ division: 1, district: 1, area: 1 });
    
    // Group by division
    const grouped: Record<string, any[]> = allCities.reduce((acc, city) => {
      if (!acc[city.division]) {
        acc[city.division] = [];
      }
      acc[city.division].push(city);
      return acc;
    }, {} as Record<string, any[]>);

    console.log('📋 Seeded Cities by Division:\n');
    Object.keys(grouped).sort().forEach(division => {
      console.log(`\n${division} Division (${grouped[division].length} cities):`);
      grouped[division].forEach(city => {
        console.log(`  • ${city.name} - ${city.area}, ${city.district}`);
      });
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding cities:', error);
    process.exit(1);
  }
}

// Run the seed function
seedCities();