import express from "express";
import { authenticate } from "../middleware/auth";
import {
  deleteNotification,
  deleteReadNotifications,
  getNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notificationController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all notifications for current user
router.get("/", getNotifications);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Mark notification as read
router.put("/:id/read", markNotificationAsRead);

// Mark all notifications as read
router.put("/read-all", markAllNotificationsAsRead);

// Delete a notification
router.delete("/:id", deleteNotification);

// Delete all read notifications
router.delete("/read/clear", deleteReadNotifications);

export default router;
