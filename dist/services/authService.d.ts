export declare const createUser: (userData: any) => Promise<{
    user: (import("mongoose").Document<unknown, {}, import("../models/User").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../models/User").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    token: string;
    refreshToken: string;
}>;
export declare const authenticateUser: (email: string, password: string) => Promise<{
    user: import("mongoose").Document<unknown, {}, import("../models/User").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../models/User").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
    token: string;
    refreshToken: string;
}>;
//# sourceMappingURL=authService.d.ts.map