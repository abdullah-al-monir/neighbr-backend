import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SubscriptionSettings from '../models/SubscriptionSettings';

dotenv.config();

const subscriptionPlans = [
  {
    tier: 'free',
    name: 'Free Starter',
    price: 0,
    duration: 365, // Free for a year
    features: [
      'Basic profile listing',
      'Up to 5 portfolio items',
      'Standard search visibility',
      'Customer reviews',
      'Basic messaging',
    ],
    maxPortfolioItems: 5,
    prioritySupport: false,
    featuredListing: false,
    analyticsAccess: false,
    isActive: true,
    description: 'Perfect for artisans just starting out. Create your profile and connect with customers.',
    platformFeePercentage: 15, // Higher fee for free tier
  },
  {
    tier: 'basic',
    name: 'Basic Professional',
    price: 29.99,
    duration: 30,
    features: [
      'Enhanced profile with custom branding',
      'Up to 20 portfolio items',
      'Priority in search results',
      'Advanced booking calendar',
      'Customer reviews and ratings',
      'Email notifications',
      'Basic analytics dashboard',
      'Response time badge',
    ],
    maxPortfolioItems: 20,
    prioritySupport: false,
    featuredListing: false,
    analyticsAccess: true,
    isActive: true,
    description: 'Ideal for growing artisans who want better visibility and more portfolio showcase options.',
    platformFeePercentage: 10, // Reduced fee
  },
  {
    tier: 'premium',
    name: 'Premium Master',
    price: 79.99,
    duration: 30,
    features: [
      'Premium profile with video showcase',
      'Unlimited portfolio items',
      'Top priority in search results',
      'Featured listing on homepage',
      'Advanced booking management',
      'Priority customer support',
      'Comprehensive analytics and insights',
      'Customer relationship management tools',
      'Promotional badges and highlights',
      'Early access to new features',
      'Custom booking page URL',
      'Social media integration',
    ],
    maxPortfolioItems: 999,
    prioritySupport: true,
    featuredListing: true,
    analyticsAccess: true,
    isActive: true,
    description: 'The ultimate plan for established artisans. Maximum visibility, unlimited showcase, and priority support.',
    platformFeePercentage: 5, // Lowest fee
  },
];

async function seedSubscriptions() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing subscription settings
    await SubscriptionSettings.deleteMany({});
    console.log('🗑️  Cleared existing subscription plans');

    // Insert new subscription plans
    const createdPlans = await SubscriptionSettings.insertMany(subscriptionPlans);
    console.log('✨ Successfully created subscription plans:');
    
    createdPlans.forEach(plan => {
      console.log(`
      📦 ${plan.name}
         Tier: ${plan.tier}
         Price: $${plan.price}
         Duration: ${plan.duration} days
         Max Portfolio: ${plan.maxPortfolioItems} items
         Platform Fee: ${plan.platformFeePercentage}%
         Features: ${plan.features.length}
      `);
    });

    console.log('\n✅ Subscription seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding subscriptions:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the seed function
seedSubscriptions()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });