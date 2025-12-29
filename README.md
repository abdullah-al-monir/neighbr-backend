# Neighbr Backend ⚙️

The core API engine for the Neighbr platform. It handles geospatial data, secure authentication, payment processing, and complex business logic for a multi-tenant marketplace.

## 🛠 Tech Stack
* **Runtime:** Node.js with TypeScript
* **Framework:** Express.js 5.0
* **Database:** MongoDB via Mongoose
* **Security:** Helmet, Express Rate Limit, BcryptJS, and JWT.
* **File Storage:** Cloudinary (for artisan portfolios and user avatars).
* **Payments:** Stripe Node SDK.
* **Mailing:** EmailJS for transactional notifications.
* **Logging:** Winston & Morgan.

## 📑 Database Models
* **User:** Handles multi-role (Admin, Artisan, Customer) authentication.
* **Artisan:** Stores portfolio data, availability, and specific skill metrics.
* **Booking:** Manages the lifecycle of a service request.
* **City/ContactMessage:** Handles the hyper-local geographical hierarchy and support inquiries.
* **PlatformFeeConfig:** Allows admins to dynamically adjust service fees.
* **SubscriptionSettings:** Enables admins to configure subscription plans.
* **Transaction:** Manages payment transactions and tracking.
* **Review:** Enables artisans to receive and manage customer reviews.
* **Notification:** Enables admins to send notifications to users.
* **Portfolio:** Handles artisan portfolios and portfolio images.

## 🔌 API Features
* **Geospatial Logic:** Instead of expensive Map APIs, the backend manages a custom hierarchy of **Divisions, Districts, and Cities** to match users accurately.
* **Security:** Middleware-driven JWT verification and role-based access control (RBAC).
* **Seeding Scripts:** Comprehensive TypeScript scripts to populate the database with initial city data, dummy artisans, and subscription plans.
* **Image Handling:** Integrated Multer and Cloudinary for optimized image uploads and compression support.

