"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpiringSubscriptions = void 0;
const Artisan_1 = __importDefault(require("../models/Artisan"));
const notificationService_1 = require("../services/notificationService");
const checkExpiringSubscriptions = async () => {
    try {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        // Find subscriptions expiring in 7 days
        const expiringArtisans = await Artisan_1.default.find({
            subscriptionTier: { $in: ["basic", "premium"] },
            subscriptionExpiresAt: {
                $gte: now,
                $lte: sevenDaysFromNow,
            },
            subscriptionExpiryNotified: { $ne: true },
        });
        for (const artisan of expiringArtisans) {
            if (!artisan.subscriptionExpiresAt) {
                continue;
            }
            const daysLeft = Math.ceil((artisan.subscriptionExpiresAt.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24));
            await (0, notificationService_1.createNotification)({
                userId: artisan.userId,
                ...notificationService_1.NotificationTemplates.subscriptionExpiring(artisan.subscriptionTier, daysLeft),
            });
            // Mark as notified
            artisan.subscriptionExpiryNotified = true;
            await artisan.save();
        }
        // Find expired subscriptions
        const expiredArtisans = await Artisan_1.default.find({
            subscriptionTier: { $in: ["basic", "premium"] },
            subscriptionExpiresAt: { $lt: now },
            subscriptionExpiredNotified: { $ne: true },
        });
        for (const artisan of expiredArtisans) {
            await (0, notificationService_1.createNotification)({
                userId: artisan.userId,
                ...notificationService_1.NotificationTemplates.subscriptionExpired(artisan.subscriptionTier),
            });
            artisan.subscriptionExpiredNotified = true;
            await artisan.save();
        }
        console.log(`✅ Checked ${expiringArtisans.length} expiring and ${expiredArtisans.length} expired subscriptions`);
    }
    catch (error) {
        console.error("❌ Error checking subscriptions:", error);
    }
};
exports.checkExpiringSubscriptions = checkExpiringSubscriptions;
//# sourceMappingURL=subscriptionChecker.js.map