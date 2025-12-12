import { Client } from '@googlemaps/google-maps-services-js';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const client = new Client({});

export const geocodeAddress = async (
  address: string
): Promise<{ lat: number; lng: number }> => {
  try {
    const response = await client.geocode({
      params: {
        address,
        key: config.googleMapsApiKey as string,
      },
    });

    if (response.data.results.length === 0) {
      throw new Error('Address not found');
    }

    const location = response.data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  } catch (error) {
    logger.error('Geocoding error:', error);
    throw new Error('Failed to geocode address');
  }
};

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<string> => {
  try {
    const response = await client.reverseGeocode({
      params: {
        latlng: { lat, lng },
        key: config.googleMapsApiKey as string,
      },
    });

    if (response.data.results.length === 0) {
      throw new Error('Location not found');
    }

    return response.data.results[0].formatted_address;
  } catch (error) {
    logger.error('Reverse geocoding error:', error);
    throw new Error('Failed to reverse geocode location');
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};
