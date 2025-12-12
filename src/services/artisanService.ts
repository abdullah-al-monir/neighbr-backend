import Artisan from '../models/Artisan';

export const findNearbyArtisans = async (
  coordinates: [number, number],
  maxDistance: number,
  filters?: any
) => {
  const query: any = {
    verified: true,
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates,
        },
        $maxDistance: maxDistance * 1000,
      },
    },
  };

  if (filters?.category) query.category = filters.category;
  if (filters?.minRating) query.rating = { $gte: filters.minRating };

  return await Artisan.find(query)
    .populate('userId', 'name email avatar')
    .limit(50);
};

export const updateArtisanRating = async (artisanId: string) => {
  const Review = require('../models/Review').default;
  
  const stats = await Review.aggregate([
    { $match: { artisanId } },
    {
      $group: {
        _id: '$artisanId',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Artisan.findByIdAndUpdate(artisanId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].reviewCount,
    });
  }
};