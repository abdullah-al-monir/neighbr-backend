import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";

// Middleware to check validation results
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
    return;
  }
  next();
};

// Auth validation
export const registerValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("name")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2-50 characters"),
  body("role")
    .isIn(["customer", "artisan"])
    .withMessage("Role must be customer or artisan"),
  body("location.division").notEmpty().withMessage("Division is required"),
  body("location.district").notEmpty().withMessage("District is required"),
  body("location.area").notEmpty().withMessage("Area is required"),
  body("location.address").notEmpty().withMessage("Address is required"),
  body("location.cityId")
    .notEmpty()
    .withMessage("City ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid city ID format"),
  validate,
];

export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

// Artisan validation
export const createArtisanValidation = [
  body("businessName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Business name must be 2-100 characters"),

  body("category")
    .isIn([
      "baker",
      "tailor",
      "carpenter",
      "electrician",
      "plumber",
      "painter",
      "mechanic",
      "gardener",
      "cleaner",
      "cook",
      "tutor",
      "musician",
      "artist",
      "photographer",
      "writer",
      "dancer",
      "singer",
      "actor",
      "model",
      "chef",
      "nurse",
      "therapist",
      "other",
    ])
    .withMessage("Invalid category"),

  body("skills")
    .isArray({ min: 1, max: 20 })
    .withMessage("Must provide 1 to 20 skills")
    .bail()
    .custom((skills: string[]) =>
      skills.every((s) => typeof s === "string" && s.trim().length > 0)
    )
    .withMessage("Each skill must be a non-empty string"),

  body("bio")
    .trim()
    .isLength({ min: 50, max: 1000 })
    .withMessage("Bio must be between 50 and 1000 characters"),

  body("hourlyRate")
    .isFloat({ min: 5, max: 1000 })
    .withMessage("Hourly rate must be between $5 and $1000"),

  // Location validations - matching your actual schema
  body("location.division")
    .notEmpty()
    .withMessage("Division is required")
    .bail()
    .isIn([
      "Dhaka",
      "Chittagong",
      "Rajshahi",
      "Khulna",
      "Barisal",
      "Sylhet",
      "Rangpur",
      "Mymensingh",
    ])
    .withMessage("Invalid division"),

  body("location.district")
    .trim()
    .notEmpty()
    .withMessage("District is required"),

  body("location.area").trim().notEmpty().withMessage("Area is required"),

  body("location.address")
    .trim()
    .notEmpty()
    .withMessage("Full address is required"),

  body("location.cityId")
    .notEmpty()
    .withMessage("City ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid city ID format"),

  validate,
];

// Booking validation
export const createBookingValidation = [
  body("artisanId").isMongoId().withMessage("Valid artisan ID required"),
  body("serviceType").notEmpty().withMessage("Service type is required"),
  body("description")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be 10-1000 characters"),
  body("scheduledDate")
    .isISO8601()
    .withMessage("Valid date required")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Scheduled date must be in the future");
      }
      return true;
    }),
  body("timeSlot.start")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Valid start time required (HH:mm)"),
  body("timeSlot.end")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Valid end time required (HH:mm)"),
  body("location.address").notEmpty().withMessage("Address is required"),
  body("location.coordinates")
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates required"),
  validate,
];

// Review validation
export const createReviewValidation = [
  body("bookingId").isMongoId().withMessage("Valid booking ID required"),
  body("rating")
    .customSanitizer((value) => parseInt(value))
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be 1-5"),
  body("comment")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Comment must be 10-1000 characters"),
  validate,
];

// Portfolio validation
export const addPortfolioValidation = [
  body("title")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be 3-100 characters"),
  body("description")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be 10-1000 characters"),
  body("category").notEmpty().withMessage("Category is required"),
  // Add custom validation for files
  // @ts-ignore
  (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[];
    console.log(files);
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    if (files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 images allowed",
      });
    }

    next();
  },
  validate,
];

// Search validation
export const searchArtisansValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be 1-100"),
  query("minRating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be 0-5"),
  query("maxDistance")
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage("Distance must be 1-50km"),
  query("maxRate")
    .optional()
    .isFloat({ min: 5, max: 1000 })
    .withMessage("Rate must be 5-1000"),
  validate,
];

// MongoDB ID validation
export const mongoIdValidation = [
  param("id").isMongoId().withMessage("Valid ID required"),
  validate,
];

// Payment validation
export const createPaymentIntentValidation = [
  body("bookingId").isMongoId().withMessage("Valid booking ID required"),
  validate,
];

export const confirmPaymentValidation = [
  body("paymentIntentId").notEmpty().withMessage("Payment intent ID required"),
  validate,
];

// Subscription validation
export const createSubscriptionValidation = [
  body("tier")
    .isIn(["basic", "premium"])
    .withMessage("Tier must be basic or premium"),
  validate,
];
