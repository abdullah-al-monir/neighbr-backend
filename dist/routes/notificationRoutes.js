"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const notificationController_1 = require("../controllers/notificationController");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Get all notifications for current user
router.get("/", notificationController_1.getNotifications);
// Get unread count
router.get("/unread-count", notificationController_1.getUnreadCount);
// Mark notification as read
router.put("/:id/read", notificationController_1.markNotificationAsRead);
// Mark all notifications as read
router.put("/read-all", notificationController_1.markAllNotificationsAsRead);
// Delete a notification
router.delete("/:id", notificationController_1.deleteNotification);
// Delete all read notifications
router.delete("/read/clear", notificationController_1.deleteReadNotifications);
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map