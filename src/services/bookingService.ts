import Artisan from '../models/Artisan';
import Booking from '../models/Booking';

export const createBookingWithValidation = async (bookingData: any) => {
  // Check for overlapping bookings
  const overlapping = await Booking.findOne({
    artisanId: bookingData.artisanId,
    scheduledDate: bookingData.scheduledDate,
    status: { $in: ['pending', 'confirmed', 'in-progress'] },
    $or: [
      {
        'timeSlot.start': { $lte: bookingData.timeSlot.start },
        'timeSlot.end': { $gt: bookingData.timeSlot.start },
      },
      {
        'timeSlot.start': { $lt: bookingData.timeSlot.end },
        'timeSlot.end': { $gte: bookingData.timeSlot.end },
      },
    ],
  });

  if (overlapping) {
    throw new Error('Time slot not available');
  }

  return await Booking.create(bookingData);
};

export const getUpcomingBookings = async (userId: string, role: string) => {
  const query: any = {
    scheduledDate: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] },
  };

  if (role === 'customer') {
    query.customerId = userId;
  } else if (role === 'artisan') {
    const artisan = await Artisan.findOne({ userId });
    query.artisanId = artisan?._id;
  }

  return await Booking.find(query)
    .populate('customerId artisanId')
    .sort({ scheduledDate: 1 });
};