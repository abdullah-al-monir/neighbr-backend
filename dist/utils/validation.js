"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDateInFuture = exports.validateAmount = exports.validateRating = exports.validateImageUrl = exports.isValidMongoId = exports.isValidUrl = exports.sanitizeInput = exports.isValidTimeSlot = exports.isValidCoordinates = exports.isValidPhone = exports.isValidPassword = exports.isValidEmail = void 0;
const isValidEmail = (email) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    return (password.length >= 8 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password));
};
exports.isValidPassword = isValidPassword;
const isValidPhone = (phone) => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
};
exports.isValidPhone = isValidPhone;
const isValidCoordinates = (coordinates) => {
    if (coordinates.length !== 2)
        return false;
    const [lng, lat] = coordinates;
    return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};
exports.isValidCoordinates = isValidCoordinates;
const isValidTimeSlot = (start, end) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start) || !timeRegex.test(end))
        return false;
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
};
exports.isValidTimeSlot = isValidTimeSlot;
const sanitizeInput = (input) => {
    return input.trim().replace(/[<>]/g, "");
};
exports.sanitizeInput = sanitizeInput;
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
const isValidMongoId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};
exports.isValidMongoId = isValidMongoId;
const validateImageUrl = (url) => {
    if (!(0, exports.isValidUrl)(url))
        return false;
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
};
exports.validateImageUrl = validateImageUrl;
const validateRating = (rating) => {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};
exports.validateRating = validateRating;
const validateAmount = (amount) => {
    return typeof amount === "number" && amount > 0 && amount < 100000;
};
exports.validateAmount = validateAmount;
const validateDateInFuture = (date) => {
    const inputDate = new Date(date);
    return inputDate > new Date();
};
exports.validateDateInFuture = validateDateInFuture;
//# sourceMappingURL=validation.js.map