"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscriptionValidation = exports.confirmPaymentValidation = exports.createPaymentIntentValidation = exports.mongoIdValidation = exports.searchArtisansValidation = exports.addPortfolioValidation = exports.createReviewValidation = exports.createBookingValidation = exports.createArtisanValidation = exports.loginValidation = exports.registerValidation = exports.validate = void 0;
const express_validator_1 = require("express-validator");
// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
exports.validate = validate;
// Auth validation
exports.registerValidation = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),
    (0, express_validator_1.body)("name")
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be 2-50 characters"),
    (0, express_validator_1.body)("role")
        .isIn(["customer", "artisan"])
        .withMessage("Role must be customer or artisan"),
    (0, express_validator_1.body)("location.address").notEmpty().withMessage("Address is required"),
    (0, express_validator_1.body)("location.city").notEmpty().withMessage("City is required"),
    (0, express_validator_1.body)("location.postalCode").notEmpty().withMessage("Postal code is required"),
    (0, express_validator_1.body)("location.coordinates")
        .isArray({ min: 2, max: 2 })
        .withMessage("Coordinates must be [longitude, latitude]"),
    exports.validate,
];
exports.loginValidation = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
    exports.validate,
];
// Artisan validation
exports.createArtisanValidation = [
    (0, express_validator_1.body)("businessName")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Business name must be 2-100 characters"),
    (0, express_validator_1.body)("category")
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
    (0, express_validator_1.body)("skills")
        .isArray({ min: 1, max: 20 })
        .withMessage("Must provide 1 to 20 skills")
        .bail()
        .custom((skills) => skills.every((s) => typeof s === "string" && s.trim().length > 0))
        .withMessage("Each skill must be a non-empty string"),
    (0, express_validator_1.body)("bio")
        .trim()
        .isLength({ min: 50, max: 1000 })
        .withMessage("Bio must be between 50 and 1000 characters"),
    (0, express_validator_1.body)("hourlyRate")
        .isFloat({ min: 5, max: 1000 })
        .withMessage("Hourly rate must be between $5 and $1000"),
    // Location validations - matching your actual schema
    (0, express_validator_1.body)("location.division")
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
    (0, express_validator_1.body)("location.district")
        .trim()
        .notEmpty()
        .withMessage("District is required"),
    (0, express_validator_1.body)("location.area").trim().notEmpty().withMessage("Area is required"),
    (0, express_validator_1.body)("location.address")
        .trim()
        .notEmpty()
        .withMessage("Full address is required"),
    (0, express_validator_1.body)("location.cityId")
        .notEmpty()
        .withMessage("City ID is required")
        .bail()
        .isMongoId()
        .withMessage("Invalid city ID format"),
    exports.validate,
];
// Booking validation
exports.createBookingValidation = [
    (0, express_validator_1.body)("artisanId").isMongoId().withMessage("Valid artisan ID required"),
    (0, express_validator_1.body)("serviceType").notEmpty().withMessage("Service type is required"),
    (0, express_validator_1.body)("description")
        .isLength({ min: 10, max: 1000 })
        .withMessage("Description must be 10-1000 characters"),
    (0, express_validator_1.body)("scheduledDate")
        .isISO8601()
        .withMessage("Valid date required")
        .custom((value) => {
        if (new Date(value) <= new Date()) {
            throw new Error("Scheduled date must be in the future");
        }
        return true;
    }),
    (0, express_validator_1.body)("timeSlot.start")
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage("Valid start time required (HH:mm)"),
    (0, express_validator_1.body)("timeSlot.end")
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage("Valid end time required (HH:mm)"),
    (0, express_validator_1.body)("location.address").notEmpty().withMessage("Address is required"),
    (0, express_validator_1.body)("location.coordinates")
        .isArray({ min: 2, max: 2 })
        .withMessage("Coordinates required"),
    exports.validate,
];
// Review validation
exports.createReviewValidation = [
    (0, express_validator_1.body)("bookingId").isMongoId().withMessage("Valid booking ID required"),
    (0, express_validator_1.body)("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1-5"),
    (0, express_validator_1.body)("comment")
        .isLength({ min: 10, max: 1000 })
        .withMessage("Comment must be 10-1000 characters"),
    (0, express_validator_1.body)("images")
        .optional()
        .isArray({ max: 5 })
        .withMessage("Maximum 5 images allowed"),
    exports.validate,
];
// Portfolio validation
exports.addPortfolioValidation = [
    (0, express_validator_1.body)("title")
        .isLength({ min: 3, max: 100 })
        .withMessage("Title must be 3-100 characters"),
    (0, express_validator_1.body)("description")
        .isLength({ min: 10, max: 1000 })
        .withMessage("Description must be 10-1000 characters"),
    (0, express_validator_1.body)("category").notEmpty().withMessage("Category is required"),
    // Add custom validation for files
    (req, res, next) => {
        const files = req.files;
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
    exports.validate,
];
// Search validation
exports.searchArtisansValidation = [
    (0, express_validator_1.query)("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be 1-100"),
    (0, express_validator_1.query)("minRating")
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage("Rating must be 0-5"),
    (0, express_validator_1.query)("maxDistance")
        .optional()
        .isFloat({ min: 1, max: 50 })
        .withMessage("Distance must be 1-50km"),
    (0, express_validator_1.query)("maxRate")
        .optional()
        .isFloat({ min: 5, max: 1000 })
        .withMessage("Rate must be 5-1000"),
    exports.validate,
];
// MongoDB ID validation
exports.mongoIdValidation = [
    (0, express_validator_1.param)("id").isMongoId().withMessage("Valid ID required"),
    exports.validate,
];
// Payment validation
exports.createPaymentIntentValidation = [
    (0, express_validator_1.body)("bookingId").isMongoId().withMessage("Valid booking ID required"),
    exports.validate,
];
exports.confirmPaymentValidation = [
    (0, express_validator_1.body)("paymentIntentId").notEmpty().withMessage("Payment intent ID required"),
    exports.validate,
];
// Subscription validation
exports.createSubscriptionValidation = [
    (0, express_validator_1.body)("tier")
        .isIn(["basic", "premium"])
        .withMessage("Tier must be basic or premium"),
    exports.validate,
];
//# sourceMappingURL=validation.js.map