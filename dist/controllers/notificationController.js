"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReadNotifications = exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
// Get all notifications for the current user
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { limit = 50, unreadOnly = "false" } = req.query;
        const query = { userId };
        if (unreadOnly === "true") {
            query.read = false;
        }
        const notifications = await Notification_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));
        const unreadCount = await Notification_1.default.countDocuments({
            userId,
            read: false,
        });
        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
// Get unread notification count
const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const unreadCount = await Notification_1.default.countDocuments({
            userId,
            read: false,
        });
        res.status(200).json({
            success: true,
            count: unreadCount,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUnreadCount = getUnreadCount;
// Mark a notification as read
const markNotificationAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const notification = await Notification_1.default.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });
        if (!notification) {
            res.status(404).json({
                success: false,
                message: "Notification not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: notification,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        await Notification_1.default.updateMany({ userId, read: false }, { read: true });
        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Delete a notification
const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const notification = await Notification_1.default.findOneAndDelete({
            _id: id,
            userId,
        });
        if (!notification) {
            res.status(404).json({
                success: false,
                message: "Notification not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Notification deleted",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteNotification = deleteNotification;
// Delete all read notifications
const deleteReadNotifications = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const result = await Notification_1.default.deleteMany({
            userId,
            read: true,
        });
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} notifications deleted`,
            deletedCount: result.deletedCount,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteReadNotifications = deleteReadNotifications;
//# sourceMappingURL=notificationController.js.map