"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = exports.reverseGeocode = exports.geocodeAddress = void 0;
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const client = new google_maps_services_js_1.Client({});
const geocodeAddress = async (address) => {
    try {
        const response = await client.geocode({
            params: {
                address,
                key: env_1.config.googleMapsApiKey,
            },
        });
        if (response.data.results.length === 0) {
            throw new Error('Address not found');
        }
        const location = response.data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
    }
    catch (error) {
        logger_1.logger.error('Geocoding error:', error);
        throw new Error('Failed to geocode address');
    }
};
exports.geocodeAddress = geocodeAddress;
const reverseGeocode = async (lat, lng) => {
    try {
        const response = await client.reverseGeocode({
            params: {
                latlng: { lat, lng },
                key: env_1.config.googleMapsApiKey,
            },
        });
        if (response.data.results.length === 0) {
            throw new Error('Location not found');
        }
        return response.data.results[0].formatted_address;
    }
    catch (error) {
        logger_1.logger.error('Reverse geocoding error:', error);
        throw new Error('Failed to reverse geocode location');
    }
};
exports.reverseGeocode = reverseGeocode;
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};
exports.calculateDistance = calculateDistance;
//# sourceMappingURL=geoService.js.map