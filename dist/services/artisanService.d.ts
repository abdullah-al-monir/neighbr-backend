export declare const findNearbyArtisans: (coordinates: [number, number], maxDistance: number, filters?: any) => Promise<(import("mongoose").Document<unknown, {}, import("../models/Artisan").IArtisan, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Artisan").IArtisan & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare const updateArtisanRating: (artisanId: string) => Promise<void>;
//# sourceMappingURL=artisanService.d.ts.map