import { Request, Response, NextFunction } from "express";
export declare const getNotifications: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getUnreadCount: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const markNotificationAsRead: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const markAllNotificationsAsRead: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteNotification: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteReadNotifications: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=notificationController.d.ts.map