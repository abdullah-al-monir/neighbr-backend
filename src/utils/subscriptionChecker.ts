import Artisan from "../models/Artisan";
import {
  createNotification,
  NotificationTemplates,
} from "../services/notificationService";

export const checkExpiringSubscriptions = async () => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find subscriptions expiring in 7 days
    const expiringArtisans = await Artisan.find({
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

      const daysLeft = Math.ceil(
        (artisan.subscriptionExpiresAt.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      await createNotification({
        userId: artisan.userId,
        ...NotificationTemplates.subscriptionExpiring(
          artisan.subscriptionTier,
          daysLeft
        ),
      });

      // Mark as notified
      artisan.subscriptionExpiryNotified = true;
      await artisan.save();
    }

    // Find expired subscriptions
    const expiredArtisans = await Artisan.find({
      subscriptionTier: { $in: ["basic", "premium"] },
      subscriptionExpiresAt: { $lt: now },
      subscriptionExpiredNotified: { $ne: true },
    });

    for (const artisan of expiredArtisans) {
      await createNotification({
        userId: artisan.userId,
        ...NotificationTemplates.subscriptionExpired(artisan.subscriptionTier),
      });

      artisan.subscriptionExpiredNotified = true;
      await artisan.save();
    }

    console.log(
      `✅ Checked ${expiringArtisans.length} expiring and ${expiredArtisans.length} expired subscriptions`
    );
  } catch (error) {
    console.error("❌ Error checking subscriptions:", error);
  }
};
