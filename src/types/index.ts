export interface AuthPayload {
  userId: string;
  role: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SearchQuery {
  category?: string;
  skills?: string[];
  minRating?: number;
  maxDistance?: number;
  maxRate?: number;
  lat?: number;
  lng?: number;
  sortBy?: "rating" | "distance" | "price" | "reviews";
  page?: number;
  limit?: number;
}

export interface GeoLocation {
  type: "Point";
  coordinates: [number, number];
  address: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  booked?: boolean;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface StripeMetadata {
  bookingId?: string;
  customerId?: string;
  artisanId?: string;
  subscriptionTier?: string;
  [key: string]: string | undefined;
}

export interface DashboardStats {
  totalUsers: number;
  totalArtisans: number;
  totalBookings: number;
  totalRevenue: number;
  platformRevenue: number;
  activeBookings: number;
  pendingVerifications: number;
  userGrowth: number;
  revenueGrowth: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  platformFee: number;
  bookings: number;
}

export interface CategoryStats {
  _id: string;
  count: number;
  avgRating: number;
  totalJobs: number;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

export type UserRole = "customer" | "artisan" | "admin";

export type SubscriptionTier = "free" | "basic" | "premium";

export type ArtisanCategory =
  | "baker"
  | "tailor"
  | "carpenter"
  | "electrician"
  | "plumber"
  | "painter"
  | "mechanic"
  | "gardener"
  | "cleaner"
  | "other";
