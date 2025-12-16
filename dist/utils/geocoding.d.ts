/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export declare const calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
/**
 * Convert radians to degrees
 */
export declare const toDegrees: (radians: number) => number;
/**
 * Check if a point is within a circular radius
 */
export declare const isWithinRadius: (centerLat: number, centerLon: number, pointLat: number, pointLon: number, radiusKm: number) => boolean;
/**
 * Get bounding box coordinates for a given center point and radius
 * Useful for optimizing database queries
 */
export declare const getBoundingBox: (lat: number, lon: number, radiusKm: number) => {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
};
/**
 * Format distance for display
 */
export declare const formatDistance: (distanceKm: number) => string;
/**
 * Validate coordinates
 */
export declare const isValidCoordinates: (lat: number, lon: number) => boolean;
/**
 * Parse coordinates from string
 */
export declare const parseCoordinates: (coordString: string) => {
    lat: number;
    lon: number;
} | null;
//# sourceMappingURL=geocoding.d.ts.map