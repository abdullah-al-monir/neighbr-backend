import { Request, Response, NextFunction } from "express";
import City from "../models/City";

// Get all active cities
const getAllCities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, search, division } = req.query;

    const query: any = { isActive: true };

    // Filter by division
    if (division && division !== "all") {
      query.division = division;
    }

    // Search by name, district, or area
    if (search) {
      const searchRegex = { $regex: search as string, $options: "i" };
      query.$or = [
        { name: searchRegex },
        { district: searchRegex },
        { area: searchRegex },
        { division: searchRegex },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const limitNum = parseInt(limit as string);

    const [cities, total] = await Promise.all([
      City.find(query)
        .sort({ division: 1, district: 1, area: 1, name: 1 })
        .skip(skip)
        .limit(limitNum),
      City.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: cities,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Get cities by division
const getCitiesByDivision = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { division } = req.params;

    const cities = await City.find({
      division,
      isActive: true,
    }).sort({ district: 1, area: 1 });

    res.status(200).json({
      success: true,
      data: cities,
    });
  } catch (error: any) {
    next(error);
  }
};

// Get cities by district
const getCitiesByDistrict = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { division, district } = req.params;

    const cities = await City.find({
      division,
      district,
      isActive: true,
    }).sort({ area: 1 });

    res.status(200).json({
      success: true,
      data: cities,
    });
  } catch (error: any) {
    next(error);
  }
};

// Get all divisions
const getDivisions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const divisions = await City.distinct("division", { isActive: true });

    res.status(200).json({
      success: true,
      data: divisions.sort(),
    });
  } catch (error: any) {
    next(error);
  }
};

// Get districts by division
const getDistrictsByDivision = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { division } = req.params;

    const districts = await City.distinct("district", {
      division,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: districts.sort(),
    });
  } catch (error: any) {
    next(error);
  }
};

// Get areas by district
const getAreasByDistrict = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { division, district } = req.params;

    const areas = await City.distinct("area", {
      division,
      district,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: areas.sort(),
    });
  } catch (error: any) {
    next(error);
  }
};

// Create a new city (Admin only)
const createCity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, division, district, area, coordinates } = req.body;

    const existingCity = await City.findOne({ name });
    if (existingCity) {
      res.status(400).json({
        success: false,
        message: "City already exists",
      });
      return;
    }

    const city = await City.create({
      name,
      division,
      district,
      area,
      coordinates,
    });

    res.status(201).json({
      success: true,
      message: "City created successfully",
      data: city,
    });
  } catch (error: any) {
    next(error);
  }
};

// get a city (Admin only)
const getCity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const city = await City.findById(id);
    if (!city) {
      res.status(404).json({
        success: false,
        message: "City not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: city,
    });
  } catch (error: any) {
    next(error);
  }
};

// Update a city (Admin only)
const updateCity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const city = await City.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!city) {
      res.status(404).json({
        success: false,
        message: "City not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "City updated successfully",
      data: city,
    });
  } catch (error: any) {
    next(error);
  }
};

// Delete a city (Admin only - soft delete)
const deleteCity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const city = await City.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!city) {
      res.status(404).json({
        success: false,
        message: "City not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "City deleted successfully",
    });
  } catch (error: any) {
    next(error);
  }
};

export {
  getAllCities,
  getCitiesByDivision,
  getCitiesByDistrict,
  getDivisions,
  getDistrictsByDivision,
  getAreasByDistrict,
  createCity,
  getCity,
  updateCity,
  deleteCity,
};
