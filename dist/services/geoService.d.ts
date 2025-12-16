export declare const geocodeAddress: (address: string) => Promise<{
    lat: number;
    lng: number;
}>;
export declare const reverseGeocode: (lat: number, lng: number) => Promise<string>;
export declare const calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
//# sourceMappingURL=geoService.d.ts.map