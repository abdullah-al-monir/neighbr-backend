import { Request, Response, NextFunction } from "express";
import Notification from "../models/Notification";

// Get all notifications for the current user
export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { limit = 50, unreadOnly = "false" } = req.query;

    const query: any = { userId };

    if (unreadOnly === "true") {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error: any) {
    next(error);
  }
};

// Get unread notification count
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.status(200).json({
      success: true,
      count: unreadCount,
    });
  } catch (error: any) {
    next(error);
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

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
  } catch (error: any) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    await Notification.updateMany({ userId, read: false }, { read: true });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error: any) {
    next(error);
  }
};

// Delete a notification
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const notification = await Notification.findOneAndDelete({
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
  } catch (error: any) {
    next(error);
  }
};

// Delete all read notifications
export const deleteReadNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const result = await Notification.deleteMany({
      userId,
      read: true,
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} notifications deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    next(error);
  }
};
