"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCoordinates = exports.isValidCoordinates = exports.formatDistance = exports.getBoundingBox = exports.isWithinRadius = exports.toDegrees = exports.calculateDistance = void 0;
/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
};
exports.calculateDistance = calculateDistance;
/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
    return (degrees * Math.PI) / 180;
};
/**
 * Convert radians to degrees
 */
const toDegrees = (radians) => {
    return (radians * 180) / Math.PI;
};
exports.toDegrees = toDegrees;
/**
 * Check if a point is within a circular radius
 */
const isWithinRadius = (centerLat, centerLon, pointLat, pointLon, radiusKm) => {
    const distance = (0, exports.calculateDistance)(centerLat, centerLon, pointLat, pointLon);
    return distance <= radiusKm;
};
exports.isWithinRadius = isWithinRadius;
/**
 * Get bounding box coordinates for a given center point and radius
 * Useful for optimizing database queries
 */
const getBoundingBox = (lat, lon, radiusKm) => {
    const latDelta = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
    const lonDelta = radiusKm / (111.32 * Math.cos(toRadians(lat)));
    return {
        minLat: lat - latDelta,
        maxLat: lat + latDelta,
        minLon: lon - lonDelta,
        maxLon: lon + lonDelta,
    };
};
exports.getBoundingBox = getBoundingBox;
/**
 * Format distance for display
 */
const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
};
exports.formatDistance = formatDistance;
/**
 * Validate coordinates
 */
const isValidCoordinates = (lat, lon) => {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};
exports.isValidCoordinates = isValidCoordinates;
/**
 * Parse coordinates from string
 */
const parseCoordinates = (coordString) => {
    const parts = coordString.split(",").map((s) => s.trim());
    if (parts.length !== 2)
        return null;
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lon) || !(0, exports.isValidCoordinates)(lat, lon)) {
        return null;
    }
    return { lat, lon };
};
exports.parseCoordinates = parseCoordinates;
//# sourceMappingURL=geocoding.js.map