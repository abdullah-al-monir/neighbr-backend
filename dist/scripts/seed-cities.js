"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/scripts/seed-cities.ts
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const CitySchema = new mongoose_1.default.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    division: {
        type: String,
        required: true,
        enum: ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh']
    },
    district: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
CitySchema.index({ 'coordinates.coordinates': '2dsphere' });
const City = mongoose_1.default.model('City', CitySchema);
// Data structure representing the Administrative Geography of Bangladesh
const bdGeoData = [
    {
        division: 'Dhaka',
        districts: [
            { name: 'Dhaka', areas: ['Dhanmondi', 'Gulshan', 'Mirpur', 'Uttara', 'Savar', 'Keraniganj', 'Dhamrai'] },
            { name: 'Gazipur', areas: ['Gazipur Sadar', 'Kaliakair', 'Kapasia', 'Sreepur', 'Tongi'] },
            { name: 'Narayanganj', areas: ['Narayanganj Sadar', 'Araihazar', 'Bandar', 'Rupganj', 'Sonargaon'] },
            { name: 'Narsingdi', areas: ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Raipura', 'Shibpur'] },
            { name: 'Manikganj', areas: ['Manikganj Sadar', 'Singair', 'Shibalaya', 'Harirampur'] },
            { name: 'Munshiganj', areas: ['Munshiganj Sadar', 'Lauhajang', 'Sreenagar', 'Sirajdikhan'] },
            { name: 'Faridpur', areas: ['Faridpur Sadar', 'Bhanga', 'Boalmari', 'Madhukhali'] },
            { name: 'Gopalganj', areas: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Tungipara'] },
            { name: 'Madaripur', areas: ['Madaripur Sadar', 'Kalkini', 'Shibchar', 'Dasar'] },
            { name: 'Rajbari', areas: ['Rajbari Sadar', 'Goalanda', 'Pangsha', 'Baliakandi'] },
            { name: 'Shariatpur', areas: ['Shariatpur Sadar', 'Damudya', 'Naria', 'Zajira'] }
        ]
    },
    {
        division: 'Chattogram',
        districts: [
            { name: 'Chattogram', areas: ['Pahartali', 'Panchlaish', 'Halishahar', 'Agrabad', 'Hathazari', 'Sitakunda', 'Patiya'] },
            { name: 'Cox\'s Bazar', areas: ['Cox\'s Bazar Sadar', 'Chakaria', 'Maheshkhali', 'Teknaf', 'Ukhia', 'Ramu'] },
            { name: 'Cumilla', areas: ['Cumilla Sadar', 'Barura', 'Chandina', 'Daudkandi', 'Laksam'] },
            { name: 'Feni', areas: ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Parshuram', 'Sonagazi'] },
            { name: 'Noakhali', areas: ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Hatiya', 'Senbagh'] },
            { name: 'Lakshmipur', areas: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati'] },
            { name: 'Chandpur', areas: ['Chandpur Sadar', 'Faridganj', 'Hajiganj', 'Matlab'] },
            { name: 'Brahmanbaria', areas: ['Brahmanbaria Sadar', 'Akhaura', 'Ashuganj', 'Kasba'] },
            { name: 'Rangamati', areas: ['Rangamati Sadar', 'Kaptai', 'Baghaichhari', 'Langadu'] },
            { name: 'Khagrachhari', areas: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Ramgarh'] },
            { name: 'Bandarban', areas: ['Bandarban Sadar', 'Thanchi', 'Lama', 'Ruma'] }
        ]
    },
    {
        division: 'Rajshahi',
        districts: [
            { name: 'Rajshahi', areas: ['Boalia', 'Motihar', 'Rajpari', 'Bagmara', 'Puthia', 'Godagari'] },
            { name: 'Bogura', areas: ['Bogura Sadar', 'Adamdighi', 'Sherpur', 'Shajahanpur', 'Dhunat'] },
            { name: 'Pabna', areas: ['Pabna Sadar', 'Ishwardi', 'Santhia', 'Chatmohar', 'Bera'] },
            { name: 'Sirajganj', areas: ['Sirajganj Sadar', 'Belkuchi', 'Shahjadpur', 'Ullahpara'] },
            { name: 'Naogaon', areas: ['Naogaon Sadar', 'Badalgachhi', 'Dhamoirhat', 'Mahadevpur'] },
            { name: 'Natore', areas: ['Natore Sadar', 'Bagatipara', 'Baraigram', 'Singra'] },
            { name: 'Chapai Nawabganj', areas: ['Nawabganj Sadar', 'Bholahat', 'Gomastapur', 'Shibganj'] },
            { name: 'Joypurhat', areas: ['Joypurhat Sadar', 'Akkelpur', 'Kalai', 'Panchbibi'] }
        ]
    },
    {
        division: 'Khulna',
        districts: [
            { name: 'Khulna', areas: ['Khulna Sadar', 'Daulatpur', 'Dighalia', 'Dumuria', 'Paikgachha'] },
            { name: 'Jashore', areas: ['Jashore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Sharsha'] },
            { name: 'Satkhira', areas: ['Satkhira Sadar', 'Assasuni', 'Kaliganj', 'Shyamnagar'] },
            { name: 'Bagerhat', areas: ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Mongla'] },
            { name: 'Kushtia', areas: ['Kushtia Sadar', 'Kumarkhali', 'Mirpur', 'Bheramara'] },
            { name: 'Jhenaidah', areas: ['Jhenaidah Sadar', 'Harinakundu', 'Kaliganj', 'Maheshpur'] },
            { name: 'Chuadanga', areas: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'] },
            { name: 'Magura', areas: ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'] },
            { name: 'Meherpur', areas: ['Meherpur Sadar', 'Gangni', 'Mujibnagar'] },
            { name: 'Narail', areas: ['Narail Sadar', 'Kalia', 'Lohagara'] }
        ]
    },
    {
        division: 'Barishal',
        districts: [
            { name: 'Barishal', areas: ['Barishal Sadar', 'Bakerganj', 'Banaripara', 'Gournadi', 'Mehendiganj'] },
            { name: 'Bhola', areas: ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Lalmohan'] },
            { name: 'Patuakhali', areas: ['Patuakhali Sadar', 'Bauphal', 'Galachipa', 'Kalapara'] },
            { name: 'Pirojpur', areas: ['Pirojpur Sadar', 'Bhandaria', 'Mathbaria', 'Nazirpur'] },
            { name: 'Barguna', areas: ['Barguna Sadar', 'Amtali', 'Bamna', 'Patharghata'] },
            { name: 'Jhalokathi', areas: ['Jhalokathi Sadar', 'Kathalia', 'Nalchity', 'Rajapur'] }
        ]
    },
    {
        division: 'Sylhet',
        districts: [
            { name: 'Sylhet', areas: ['Sylhet Sadar', 'Beanibazar', 'Biswanath', 'Fenchuganj', 'Golapganj'] },
            { name: 'Moulvibazar', areas: ['Moulvibazar Sadar', 'Kamalganj', 'Kulaura', 'Sreemangal'] },
            { name: 'Habiganj', areas: ['Habiganj Sadar', 'Bahubal', 'Madhabpur', 'Nabiganj'] },
            { name: 'Sunamganj', areas: ['Sunamganj Sadar', 'Chhatak', 'Jagannathpur', 'Tahirpur'] }
        ]
    },
    {
        division: 'Rangpur',
        districts: [
            { name: 'Rangpur', areas: ['Rangpur Sadar', 'Badarganj', 'Mithapukur', 'Pirganj'] },
            { name: 'Dinajpur', areas: ['Dinajpur Sadar', 'Birganj', 'Fulbari', 'Parbatipur'] },
            { name: 'Kurigram', areas: ['Kurigram Sadar', 'Nageshwari', 'Ulipur', 'Roumari'] },
            { name: 'Gaibandha', areas: ['Gaibandha Sadar', 'Gobindaganj', 'Palashbari', 'Sundarganj'] },
            { name: 'Nilphamari', areas: ['Nilphamari Sadar', 'Saidpur', 'Domar', 'Jaldhaka'] },
            { name: 'Thakurgaon', areas: ['Thakurgaon Sadar', 'Baliadangi', 'Pirganj', 'Ranisankail'] },
            { name: 'Panchagarh', areas: ['Panchagarh Sadar', 'Atwari', 'Boda', 'Tetulia'] },
            { name: 'Lalmonirhat', areas: ['Lalmonirhat Sadar', 'Aditmari', 'Hatibandha', 'Patgram'] }
        ]
    },
    {
        division: 'Mymensingh',
        districts: [
            { name: 'Mymensingh', areas: ['Mymensingh Sadar', 'Bhaluka', 'Muktagachha', 'Trishal', 'Gaffargaon'] },
            { name: 'Jamalpur', areas: ['Jamalpur Sadar', 'Dewanganj', 'Madarganj', 'Sarishabari'] },
            { name: 'Netrokona', areas: ['Netrokona Sadar', 'Durgapur', 'Kendua', 'Mohanganj'] },
            { name: 'Sherpur', areas: ['Sherpur Sadar', 'Jhenaigati', 'Nalitabari', 'Sreebardi'] }
        ]
    }
];
async function seedCities() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI not found');
        }
        console.log('🔄 Connecting to MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        await City.deleteMany({});
        console.log('🗑️  Cleared existing cities');
        const cityList = [];
        // Flattening the structure into individual city documents
        bdGeoData.forEach(div => {
            div.districts.forEach(dist => {
                dist.areas.forEach(areaName => {
                    cityList.push({
                        name: `${areaName}, ${dist.name}`, // Unique name constraint
                        division: div.division,
                        district: dist.name,
                        area: areaName,
                        // Defaulting coordinates to center of BD if specific ones aren't provided
                        coordinates: { type: 'Point', coordinates: [90.3563, 23.6850] },
                    });
                });
            });
        });
        const result = await City.insertMany(cityList);
        console.log(`✅ Seeded ${result.length} areas across 64 districts!`);
        await mongoose_1.default.connection.close();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
seedCities();
//# sourceMappingURL=seed-cities.js.map