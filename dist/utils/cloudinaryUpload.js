"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const stream_1 = require("stream");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadToCloudinary = (fileBuffer, folder = "artisan-portfolios") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({
            folder,
            resource_type: "image",
            transformation: [
                { width: 800, height: 600, crop: "limit", quality: "auto" },
            ],
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(result.secure_url);
            }
        });
        stream_1.Readable.from(fileBuffer).pipe(uploadStream);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
const deleteFromCloudinary = async (imageUrl) => {
    try {
        // Extract public_id from Cloudinary URL
        const urlParts = imageUrl.split("/");
        const filename = urlParts[urlParts.length - 1];
        const publicId = `artisan-portfolios/${filename.split(".")[0]}`;
        await cloudinary_1.default.uploader.destroy(publicId);
    }
    catch (error) {
        console.error("Error deleting from Cloudinary:", error);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
//# sourceMappingURL=cloudinaryUpload.js.map