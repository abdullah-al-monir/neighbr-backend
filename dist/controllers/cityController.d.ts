import { Request, Response, NextFunction } from "express";
declare const getAllCities: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const getCitiesByDivision: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const getCitiesByDistrict: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const getDivisions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const getDistrictsByDivision: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const getAreasByDistrict: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const createCity: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const getCity: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const updateCity: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const deleteCity: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export { getAllCities, getCitiesByDivision, getCitiesByDistrict, getDivisions, getDistrictsByDivision, getAreasByDistrict, createCity, getCity, updateCity, deleteCity, };
//# sourceMappingURL=cityController.d.ts.map