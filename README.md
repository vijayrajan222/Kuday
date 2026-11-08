# 🏠 KUDAY (Project 2.0) - Full-Stack Roommate & Property Finder Platform

Welcome to **KUDAY (Project 2.0)**, a production-ready, full-stack web application designed to connect homeowners with verified, compatible roommates. The system combines an Express.js backend architected using **Clean Architecture** and **SOLID Principles** with a responsive **React 18/19 + TypeScript + Vite + Tailwind CSS** frontend.

---

## 📑 Table of Contents

- [🏛️ System Architecture](#️-system-architecture)
- [✨ Key Features Implemented](#-key-features-implemented)
- [🧮 Domain Compatibility Matching Algorithm](#-domain-compatibility-matching-algorithm)
- [⚓ Custom Hooks Catalog (11 Total)](#-custom-hooks-catalog-11-total)
- [⚡ Performance & Security Optimizations](#-performance--security-optimizations)
- [🗄️ Database & Data Models](#️-database--data-models)
- [📡 API Endpoints Reference](#-api-endpoints-reference)
- [🚀 Quick Start & Local Setup](#-quick-start--local-setup)
- [📂 Repository Structure](#-repository-structure)

---

## 🏛️ System Architecture

The project enforces strict separation of concerns across both frontend and backend:

```
Project2.0/
├── backend/                       # Express + TypeScript + MongoDB (Clean Architecture)
│   ├── src/
│   │   ├── domain/               # Core business entities & mathematical algorithms (Zero dependencies)
│   │   ├── application/          # Use cases, interfaces, DTOs & custom error definitions
│   │   ├── infrastructure/       # Mongoose schemas, repositories, Cloudinary, Nodemailer, DI container
│   │   └── presentation/         # Controllers, routers, Zod validation, error middlewares
│   └── readme                    # In-depth Backend Technical Guide
│
├── frontend/                      # React 18/19 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Atomic UI, layouts, auth cards, match cards
│   │   ├── context/              # AuthProvider & AdminAuthContext
│   │   ├── hooks/                # 10 modular custom hooks
│   │   ├── pages/                # Customer & Admin pages (Lazy-loaded with Suspense)
│   │   ├── routes/               # App router with protected & guest route guards
│   │   └── services/             # Axios API client with token refresh queueing
│   └── README.md                 # In-depth Frontend Architecture Guide
│
└── README.md                      # Project-Wide Master Documentation
```

---

## ✨ Key Features Implemented

### 1. 🔐 Robust Authentication & Security
- **Email & Password Registration**: Checks uniqueness, hashes passwords with `bcrypt` (10 rounds), generates a 6-digit numeric OTP, and dispatches an HTML email via `nodemailer` (Gmail SMTP).
- **OTP Verification & Expiry**: Verifies OTP codes backed by MongoDB TTL indexes; issues a signed 7-day JWT access token.
- **Silent Refresh Token Auto-Renewal**: Secure `httpOnly` refresh cookies with frontend Axios request queueing to prevent thundering-herd duplicate refresh requests.
- **Google OAuth Integration**: Direct sign-in and account creation through Google.
- **Complete Forgot Password Flow**: Send reset OTP $\rightarrow$ verify reset OTP $\rightarrow$ securely update password.
- **Mass-Assignment Guard**: `MongoUserRepository` strictly enforces `PROFILE_UPDATABLE_FIELDS`, preventing users from tampering with protected flags like `isAdmin` or `isBlocked`.

### 2. 📝 User Onboarding & Dynamic Profile System
- **3-Step Onboarding Wizard**:
  1. *Personal Details*: Full name, gender, occupation, bio, and birth date validation (future dates rejected).
  2. *Living Habits*: Smoking, drinking, diet, sleep schedule, cleanliness rating, visitor policy, and roommate gender preference.
  3. *Identity Upload*: Webcam / file upload for Government ID Card and Selfie photo.
- **Cloudinary CDN Integration**: Uploads images to secure cloud storage (`kuday_id_cards`, `kuday_selfies`, `kuday_rooms`), saving MongoDB storage and maximizing query speeds.
- **Dual-Role Switching**: Seamlessly toggle between **Host** and **Seeker** modes. Switching roles automatically deactivates previous posts to maintain marketplace integrity.

### 3. 🏡 Property Listings & Seeker Preference Management
- **Room Listings**: Hosts create verified room listings with monthly rent, location, capacity, house rules, amenities, and multiple CDN photos.
- **Seeker Preferences**: Seekers define maximum budget, preferred locations, room types, and required amenities.

### 4. 🛡️ Admin Portal & Identity Verification Queue
- **Admin Authentication**: Dedicated admin login protecting platform management tools.
- **Verification Review Modal**: Side-by-side inspection of submitted Government ID and Selfie photos.
- **Approve / Reject Workflows**: Admins can approve (`identityVerified = true`) or reject with a mandatory feedback reason. Automatically notifies the user.
- **User Management**: Instant search, status filtering, and one-click account blocking/unblocking.
- **Platform Analytics**: Real-time KPI counters (Total Users, Active Rooms, Verified Hosts, Pending Verifications).

### 5. 🔔 In-App Real-Time Notifications
- Real-time in-app alerts for visit updates, reschedule requests, cancellations, interest requests, and admin verification results.
- Backed by Socket.io (`new_notification` and `visit_update`) with instant unread badges, dropdown notifications, and toast alerts.

### 6. 🤝 Mutual Connection & Interest Management (Send, Accept, Decline, Cancel, Unmatch)
- **Send Interest**: Users send requests to property listings or seeker profiles with automatic duplicate prevention via compound index `(senderId, receiverId, targetId)`.
- **Accept Interest**: Designated recipient can accept the request, automatically moving the contact into the mutual Matched section and enabling direct messaging and visit scheduling.
- **Decline Interest**: Designated recipient can decline the request cleanly.
- **Cancel Request**: Users can cancel pending interest requests before the other party acts on them.
- **Unmatch / Remove Connection**: Users can unmatch with connected contacts at any time with modal confirmation, safely separating both parties.
- **Privacy & Revenue Protection**: Direct email contact links have been completely removed, steering all communication through verified in-app channels.

### 7. 💬 Real-Time Chat & Socket.io Messaging (`/messages`)
- **Direct 1-on-1 Real-Time Chat**: WebSockets powered by Socket.io for instantaneous message delivery with zero polling.
- **Single Thread Deduplication**: Guarantees a single unified conversation thread per user pair across sender and receiver directions.
- **Live Online Presence & Typing Indicators**: Real-time user status (`Online` / `Offline`) and active typing animations.
- **Unread Counts & Global Badges**: Accurate unread message tracking with auto-incrementing badges on the navigation bar and sidebar.
- **Integrated Visit Management**: Active visit schedules, proposals, and action banners embedded directly into the chat header.

### 8. 📅 In-Person Visit Scheduling & Management (`/schedule-visit/:connectionId`)
- **Interactive Calendar & Time Slots**: Clean date picker paired with 3 distinct daily time slots:
  - 🌅 *Morning* (10:00 AM)
  - ☀️ *Afternoon* (02:00 PM)
  - 🌙 *Evening* (06:00 PM)
- **Host Availability Card & Intro Note**: Displays host details, identity badge, availability notes, and custom introductory message input.
- **Single Active Schedule Constraint**: Prevents duplicate visit requests per connection while a request is active.
- **Strict Role-Based Authorization**: The user who requests a visit is strictly barred from confirming or accepting their own request; only the designated recipient can accept, decline, or propose alternate slots.
- **Comprehensive Visit Lifecycle**:
  - `pending` $\rightarrow$ Requester awaits recipient response; can cancel request.
  - `confirmed` $\rightarrow$ Both parties verified the date and time.
  - `rescheduled` $\rightarrow$ One party proposed alternate time (`Postpone / Prepone`); other party can accept or counter-propose.
  - `cancelled` $\rightarrow$ Produces clear cancellation banners and real-time socket alerts instead of silent deletion.
  - `rejected` $\rightarrow$ Displays decline feedback and allows scheduling again.
- **Manage Schedule Modal**: Embedded in both Matches page and Messages page for immediate status updates and counter-proposals.

### 9. 🔍 Dedicated Explore & Pagination Page (`/explore`)
- **"View More" Transition**: One-click navigation from dashboard potential rooms/seekers into a dedicated exploration page.
- **Advanced Filtering & Sorting**: Multi-criteria filters by budget, room type, location, amenities, and gender preferences with background state management.
- **Responsive Pagination**: Clean 8-12 card paginated layout for high-density listing browsing.

---

## 🧮 Domain Compatibility Matching Algorithm

The matching engine ([`RoomMatchCalculatorService.ts`](file:///c:/Users/ASUS/Desktop/Project2.0/backend/src/domain/services/RoomMatchCalculatorService.ts)) evaluates compatibility on a **0% to 100% scale** based on 5 weighted criteria:

| Dimension | Weight | Matching Logic |
|---|---|---|
| **Location** | **25%** | Case-insensitive substring match between room location and seeker target area. |
| **Budget** | **25%** | 100% points if rent $\le$ budget; partial score if within 10% flexible range. |
| **Room Type** | **15%** | Exact room type match or seeker preference set to `"any"`. |
| **Amenities** | **15%** | Overlap ratio of seeker's required amenities to room's provided amenities. |
| **Lifestyle** | **20%** | Multi-point analysis across smoking, drinking, cleanliness, and sleep schedule. |

---

## ⚓ Custom Hooks Catalog (13 Total)

| # | Hook Name | Path | What It Handles |
|---|---|---|---|
| 1 | `useAuth` | `frontend/src/hooks/useAuth.ts` | Global user authentication context (`user`, `token`, `login`, `logout`). |
| 2 | `useCountdown` | `frontend/src/hooks/useCountdown.ts` | 60-second OTP timer with automatic `clearInterval` cleanup. |
| 3 | `useForgotPassword` | `frontend/src/hooks/useForgotPassword.ts` | Password reset request state and API logic. |
| 4 | `useGoogleAuth` | `frontend/src/hooks/useGoogleAuth.ts` | Google OAuth authentication workflows. |
| 5 | `useLogin` | `frontend/src/hooks/useLogin.ts` | Form submission, loading state, error handling, and session activation. |
| 6 | `useResetPassword` | `frontend/src/hooks/useResetPassword.ts` | Form validation and API call for saving a new password. |
| 7 | `useSignUp` | `frontend/src/hooks/useSignUp.ts` | Signup submission and transition to OTP verification. |
| 8 | `useToast` | `frontend/src/hooks/useToast.ts` | Notification dispatch wrapper around `react-hot-toast`. |
| 9 | `useVerifyOtp` | `frontend/src/hooks/useVerifyOtp.ts` | Code validation and resend triggers during signup. |
| 10 | `useVerifyResetOtp` | `frontend/src/hooks/useVerifyResetOtp.ts` | OTP verification specifically for the password reset flow. |
| 11 | `useInterest` | `frontend/src/hooks/useInterest.ts` | Sending interests, accepting, declining, cancelling sent requests, and unmatching contacts. |
| 12 | `useSocket` | `frontend/src/context/SocketContext.tsx` | Global WebSocket lifecycle, real-time messaging, typing events, presence tracking, and visit updates. |
| 13 | `useAdminAuth` | `frontend/src/context/AdminAuthContext.tsx` | Dedicated session hook for administrator operations. |

---

## ⚡ Performance & Security Optimizations

### Frontend Optimizations
- **Route-Level Code Splitting**: All pages lazy-loaded via `React.lazy` and wrapped in `<Suspense fallback={<PageLoader />}>` in [`AppRoutes.tsx`](file:///c:/Users/ASUS/Desktop/Project2.0/frontend/src/routes/AppRoutes.tsx).
- **Component Memoization (`React.memo`)**: `Header`, `Sidebar`, `StatCard`, `MatchCard`, `Avatar`, and `PasswordStrength` components are memoized to avoid redundant renders.
- **Context Memoization (`useMemo`)**: `AuthProvider.tsx` and `SocketContext.tsx` wrap context payloads in `useMemo` so consumers don't re-render unless values change.
- **Function Stabilization (`useCallback`)**: Handlers across custom hooks, layout containers, and dashboards use `useCallback` to maintain reference stability.
- **Token Refresh Queueing**: Axios interceptor in [`api.ts`](file:///c:/Users/ASUS/Desktop/Project2.0/frontend/src/services/api.ts) queues simultaneous 401 requests, sending only one refresh request and replaying all waiting calls.
- **DOM Pagination**: Admin table pagination (`pageSize = 5`) and explore listings pagination (`pageSize = 8/12`) prevent heavy DOM node creation.

### Backend & Database Optimizations
- **Automatic TTL Index**: `OtpModel` uses `{ expires: 600 }` on `createdAt`. MongoDB's background task deletes expired OTP records automatically.
- **Database Indexing**: Unique lowercase index on `UserModel.email` ($O(1)$ lookup); foreign-key and compound indexes on `userId` in `RoomModel`, `SeekerPreferenceModel`, `NotificationModel`, `(connectionId, status)` in `VisitModel`, and `(senderId, receiverId, targetId)` in `InterestModel`.
- **Centralized Dependency Injection**: All dependencies wired cleanly via [`AppFactory.ts`](file:///c:/Users/ASUS/Desktop/Project2.0/backend/src/infrastructure/di/AppFactory.ts).
- **Centralized Error Handling**: [`ErrorHandlerMiddleware.ts`](file:///c:/Users/ASUS/Desktop/Project2.0/backend/src/presentation/middleware/ErrorHandlerMiddleware.ts) maps application, validation, and database errors into uniform [`ApiResponse`](file:///c:/Users/ASUS/Desktop/Project2.0/backend/src/presentation/utils/ApiResponse.ts) envelopes.

---

## 🗄️ Database & Data Models

| Collection / Model | Key Fields | Special Features / Indexes |
|---|---|---|
| **Users** (`UserModel.ts`) | `email`, `firstName`, `lastName`, `role`, `isBlocked`, `identityStatus`, `idCardUrl`, `selfieUrl` | Unique lowercase index on `email`, Mass-assignment protection |
| **OTPs** (`OtpModel.ts`) | `email`, `otp`, `createdAt` | **TTL Index (`expires: 600`)** for automatic cleanup after 10 min |
| **Rooms** (`RoomModel.ts`) | `userId`, `title`, `roomType`, `monthlyRent`, `location`, `amenities`, `images` | `userId` indexed, Cloudinary image CDN storage |
| **Seeker Preferences** (`SeekerPreferenceModel.ts`) | `userId`, `preferredLocation`, `maxBudget`, `roomTypePreference`, `requiredAmenities` | `userId` indexed |
| **Lifestyles** (`LifestyleModel.ts`) | `userId`, `smoking`, `drinking`, `sleepSchedule`, `cleanliness`, `diet` | Direct 1:1 ref to user living preferences |
| **Notifications** (`NotificationModel.ts`) | `userId`, `title`, `message`, `type`, `isRead` | `userId` indexed |
| **Interests** (`InterestModel.ts`) | `senderId`, `receiverId`, `targetType`, `targetId`, `status`, `message` | Compound unique index `(senderId, receiverId, targetId)` |
| **Visits** (`VisitModel.ts`) | `connectionId`, `seekerId`, `hostId`, `createdBy`, `date`, `timeSlot`, `slotTime`, `message`, `status`, `suggestedDate`, `suggestedSlotTime` | Compound indexes `(connectionId, status)` & `(seekerId, hostId)` |
| **Conversations** (`ConversationModel.ts`) | `participants`, `lastMessage` | Compound index on `participants` array, single-thread enforcement |
| **Messages** (`MessageModel.ts`) | `conversationId`, `senderId`, `receiverId`, `content`, `isRead` | Indexed by `conversationId` and `createdAt` |

---

## 📡 API Endpoints Reference

### Authentication (`/auth`)
- `POST /auth/signUp` — Register user & send OTP email
- `POST /auth/verify-otp` — Verify OTP & issue access token
- `POST /auth/login` — Authenticate user
- `POST /auth/refresh-token` — Silent token renewal via httpOnly cookie
- `POST /auth/forgot-password` — Send password reset OTP
- `POST /auth/verify-reset-otp` — Verify password reset code
- `POST /auth/reset-password` — Update user password
- `POST /auth/google` — Google OAuth authentication

### Users & Onboarding (`/users`)
- `GET /users/profile/:userId` — Fetch user profile & verification status
- `PUT /users/profile` — Update personal profile details
- `PUT /users/role` — Switch between Host and Seeker
- `POST /users/upload-identity` — Upload ID Card & Selfie to Cloudinary
- `POST /users/change-password` — Update password for authenticated user

### Rooms & Compatibility (`/rooms`)
- `POST /rooms` — Create room listing with photos
- `GET /rooms?userId=:userId` — Fetch verified listings with dynamic match scores
- `GET /rooms/host/:hostId` — Fetch rooms listed by a specific host

### Seeker Preferences (`/seeker-preferences`)
- `POST /seeker-preferences` — Save roommate criteria
- `GET /seeker-preferences?userId=:userId` — Fetch verified seekers with match scores
- `GET /seeker-preferences/user/:userId` — Fetch preferences for a specific seeker

### Lifestyles (`/lifestyles`)
- `POST /lifestyles` — Save user living habits
- `GET /lifestyles/:userId` — Retrieve user living habits

### Notifications (`/notifications`)
- `POST /notifications` — Send interest alert or notification
- `GET /notifications/:userId` — Retrieve user notifications
- `PATCH /notifications/:id/read` — Mark notification as read
- `PATCH /notifications/user/:userId/read-all` — Mark all as read

### Connections & Interests (`/interests`)
- `POST /interests` — Send interest request
- `PATCH /interests/:id/status` — Accept or decline request (`status: 'accepted' | 'declined'`)
- `DELETE /interests/:id/cancel` — Cancel pending sent interest request
- `POST /interests/:id/unmatch` — Unmatch / sever mutual connection
- `GET /interests/received/:userId` — Fetch received requests with sender details
- `GET /interests/sent/:userId` — Fetch sent requests with status tracking

### In-Person Visits (`/visits`)
- `POST /visits` — Create a visit schedule request (Morning, Afternoon, Evening)
- `GET /visits/user/:userId` — Fetch all visits for the authenticated user
- `GET /visits/connection/:connectionId` — Fetch all visits for a specific connection
- `PATCH /visits/:id/status` — Update visit status (`confirmed`, `cancelled`, `rejected`)
- `PATCH /visits/:id/suggest` — Propose alternative date/slot (Postpone/Prepone)
- `PATCH /visits/:id/accept-suggestion` — Accept proposed alternative visit time

### Chat & Messaging (`/messages`, `/conversations`)
- `GET /conversations/:userId` — Fetch all 1-on-1 conversations for user
- `POST /conversations` — Get or create a 1-on-1 conversation
- `GET /messages/:conversationId` — Fetch message history for a conversation
- `POST /messages` — Send a direct message
- `PATCH /messages/:conversationId/read` — Mark conversation messages as read
- `GET /messages/unread/:userId` — Get unread messages count

### Admin (`/admin`)
- `POST /admin/login` — Admin login
- `GET /admin/stats` — Retrieve platform KPI metrics
- `GET /admin/users` — List and search users
- `PATCH /admin/users/:userId/block` — Toggle user block status
- `PATCH /admin/users/:userId/verify-identity` — Approve / reject identity documents

### Admin (`/admin`)
- `POST /admin/login` — Admin login
- `GET /admin/stats` — Retrieve platform KPI metrics
- `GET /admin/users` — List and search users
- `PATCH /admin/users/:userId/block` — Toggle user block status
- `PATCH /admin/users/:userId/verify-identity` — Approve / reject identity documents

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18 or higher
- **MongoDB**: Local instance or MongoDB Atlas URI
- **Cloudinary Account**: For image CDN hosting
- **SMTP Provider**: E.g. Gmail App Password for OTP emails

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/project2?retryWrites=true&w=majority
JWT_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
NODE_ENV=development
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:3000
```

Start the frontend:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
