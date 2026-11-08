# 📖 KUDAY Frontend - Master Architecture, Reference & Component Guide

---

## 1. Executive Summary & Brand Purpose

### **Project Identity**: **KUDAY** (Next-Generation Roommate & Property Finder Portal)
* **Core Mission**: KUDAY connects homeowners who want to rent rooms with compatible, verified individuals searching for their ideal living environment.
* **Tech Stack**: React 18/19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Zod, React Hook Form, Axios, Context API.
* **Backend Connection**: Express + Node.js + Clean Architecture backend running on `http://localhost:3000`.
* **Platform Status**: 🎉 **Level 1 (Auth & Security) + Level 2 (Onboarding, Admin Portal & Roommate Discovery) COMPLETE!**

---

## 2. Master Directory Sitemap & File Index

```
frontend/
├── public/                       # Static public assets (icons, favicon)
├── src/
│   ├── assets/                   # Images, SVGs, static media
│   ├── components/               # Reusable UI & Layout Components
│   │   ├── auth/                 # Auth Layouts & Route Protection
│   │   │   ├── AuthLayout.tsx    # Responsive Auth Card Layout with KUDAY Branding
│   │   │   ├── AuthProtectedRoute.tsx # Route Guards (GuestRoute, AuthProtectedRoute, AdminProtectedRoute)
│   │   │   └── GoogleAuthButton.tsx   # "Continue with Google" OAuth Button Component
│   │   ├── common/               # General Purpose Shared UI
│   │   │   ├── BrandLogo.tsx     # KUDAY Logo & Badge
│   │   │   ├── ErrorBoundary.tsx # React Error Catching Component
│   │   │   ├── PageLoader.tsx    # Full-page Spinner (Used with Suspense)
│   │   │   ├── PasswordStrength.tsx # Visual Password Strength Meter (memoized)
│   │   │   └── StatCard.tsx      # Dashboard Metric Display Card (memoized)
│   │   ├── layout/               # App Layout Containers
│   │   │   ├── DashboardLayout.tsx # Main App Layout (Header + Sidebar + Dynamic Content)
│   │   │   ├── Header.tsx        # Top Navigation Bar with Notification Bell & Avatar (memoized)
│   │   │   └── Sidebar.tsx       # Side Navigation Menu with Role-aware Links (memoized)
│   │   ├── roommate/             # Roommate Feature Components
│   │   │   └── MatchCard.tsx     # Roommate / Property Listing Card with Compatibility Score (memoized)
│   │   └── ui/                   # Primitive UI Controls (Tailwind / Radix style)
│   │       ├── avatar.tsx        # User Avatar Circle (memoized)
│   │       ├── button.tsx        # Reusable Button (Primary, Outline, Loading Spinner)
│   │       ├── card.tsx          # Container Card
│   │       ├── input.tsx         # Input Field with Icon, Label, and Zod Error Text
│   │       ├── input-otp.tsx     # 6-Box OTP Input with Paste Distribution & Countdown Timer
│   │       ├── label.tsx         # Form Label Component
│   │       ├── loader.tsx        # Loading Spinner
│   │       ├── PasswordInput.tsx # Password Input with Show/Hide Eye Toggle
│   │       └── toaster.tsx       # Toast Notification Container
│   │
│   ├── config/                   # App Navigation Configurations
│   │   └── navigation.ts         # Sidebar & Header Links
│   ├── constants/                # App-Wide Immutable Constants
│   │   ├── apiEndpoints.ts       # API Route URLs (/auth, /users, /rooms, /seeker-preferences, /admin, etc.)
│   │   ├── events.ts             # Global Custom Events (AUTH_UNAUTHORIZED_EVENT)
│   │   ├── messages.ts           # Centralized Success & Error Notification Strings
│   │   └── routes.ts             # App Route Constants (SIGN_UP, LOGIN, OTP, DASHBOARD, ADMIN, ONBOARDING, PROFILE)
│   │
│   ├── context/                  # Global Session State
│   │   ├── authContext.ts        # Auth React Context Definition
│   │   ├── AuthProvider.tsx      # User Auth State Provider (Session, Token, User Info, memoized value)
│   │   ├── AdminAuthContext.tsx  # Admin Auth State Provider (Admin Session, Token, useAdminAuth)
│   │   └── SocketContext.tsx     # Socket.io Context (Real-time Messaging, Online Presence, Badges, Visits)
│   │
│   ├── data/                     # Mock Data & Static Presets
│   │   └── dummyData.ts          # Sample Roommate & House Listings
│   ├── hooks/                    # Custom React Hooks
│   │   ├── useAuth.ts            # Hook to access global AuthContext
│   │   ├── useCountdown.ts       # Hook for 60-Second OTP Timer with Auto-Cleanup
│   │   ├── useForgotPassword.ts   # Hook managing Forgot Password submission
│   │   ├── useGoogleAuth.ts      # Hook managing Google Auth API & Session activation
│   │   ├── useInterest.ts        # Hook managing interests (send, accept, decline, cancel, unmatch)
│   │   ├── useLogin.ts           # Hook managing Login API & Session trigger logic
│   │   ├── useResetPassword.ts     # Hook managing Password Reset submission
│   │   ├── useSignUp.ts          # Hook managing Signup submission logic
│   │   ├── useToast.ts           # Hook for triggering Toast notifications
│   │   ├── useVerifyOtp.ts       # Hook managing OTP verification & resend logic
│   │   └── useVerifyResetOtp.ts   # Hook managing Reset OTP verification
│   │
│   ├── lib/                      # Helper Libraries
│   │   └── utils.ts              # cn() dynamic Tailwind class merger (clsx + twMerge)
│   │
│   ├── pages/                    # Main Page Views (Lazy Loaded)
│   │   ├── admin/                # Admin Portal Views
│   │   │   ├── AdminLoginPage.tsx     # Admin Portal Login Screen
│   │   │   └── AdminDashboardPage.tsx # User Directory, Document Review Modal & KPI Metrics
│   │   ├── common/               # LandingPage.tsx, NotFound.tsx
│   │   └── customer/             # Customer Views
│   │       ├── CustomerSignup.tsx     # Registration Page
│   │       ├── Login.tsx              # User Login Page
│   │       ├── Otp.tsx                # Email Verification OTP Screen
│   │       ├── ForgotPassword.tsx     # Forgot Password Request Page
│   │       ├── VerifyResetOtp.tsx     # Reset Password OTP Screen
│   │       ├── ResetPassword.tsx      # New Password Setup Page
│   │       ├── CustomerDashboard.tsx  # Roommate & Property Discovery Dashboard with Match Scores
│   │       ├── ExplorePage.tsx        # Dedicated Paginated Listings (8-12 cards) with Search & Filters
│   │       ├── MatchedPage.tsx        # Interests, Sent/Received, Mutual Matches, Manage Visit Modal
│   │       ├── MessagesPage.tsx       # Real-Time 1-on-1 Chat with Socket.io, Presence & Visit Banner
│   │       ├── ScheduleVisitPage.tsx  # Interactive Calendar & Time Slot Visit Scheduler
│   │       ├── RoomDetailsPage.tsx    # Property Details & Booking Preview
│   │       ├── UserProfilePage.tsx    # Public Profile Inspection View
│   │       ├── OnboardingProfilePage.tsx # 3-Step Onboarding (Profile, Lifestyle, Identity Upload)
│   │       └── ProfilePage.tsx        # User Profile Management & Identity Status View
│   │
│   ├── routes/                   # Router Setup
│   │   └── AppRoutes.tsx         # React Router Route Map with React.lazy & Suspense
│   │
│   ├── services/                 # API Service Layer
│   │   ├── api.ts                # Axios Instance with Request/Response Interceptors & Thundering Herd Queueing
│   │   ├── authService.ts        # Authentication API Calls (Login, Register, OTP, Refresh, Google)
│   │   ├── adminService.ts       # Admin API Calls (Stats, Users, Block, Verify Identity)
│   │   ├── chatService.ts        # Chat Conversations, Messages & Unread Counts
│   │   ├── visitService.ts       # In-Person Visit Scheduling & Status Lifecycle
│   │   ├── onboardingService.ts  # Onboarding API Calls (Profile, Lifestyle, Identity Documents)
│   │   └── notificationService.ts # In-App Notification API Calls (Fetch, Mark Read)
│   │
│   ├── shared/                   # Shared Schemas & Enums
│   │   ├── enums/
│   │   │   └── HttpStatusCodes.ts  # HTTP Status Code Enum (200, 201, 400, 401, 404, 500)
│   │   └── schema/auth/          # Zod Form Validation Schemas
│   │
│   ├── types/                    # TypeScript Type Definitions
│   │   ├── auth.types.ts         # User, Admin, and Auth Payload / Response Types
│   │   └── index.ts              # Unified Type Exports
│   │
│   └── utils/                    # Utility Functions
│       ├── errorHandler.ts       # Error Message Extractor
│       ├── formatters.ts         # Email Masking & Seconds Formatting
│       └── storage.ts            # Encapsulated LocalStorage Helper (getToken, setToken, clear)
```

---

## 3. "What Does What" - Complete Feature Breakdown

### A. Authentication & Session Management
* **`api.ts` (Network Interceptor & Queue)**: Axios client configured with `withCredentials: true`. Features a **failed request queue** (`failedQueue`) and `isRefreshing` lock. When multiple concurrent requests fail with `401 Unauthorized`, only a single refresh token request is sent. Once refreshed, all queued requests are replayed automatically.
* **`AuthProvider.tsx`**: Manages global session state (`user`, `token`, `isAuthenticated`, `pendingSignup`). Wraps the context value in `useMemo` and methods in `useCallback` to prevent unnecessary component tree re-renders.
* **`AdminAuthContext.tsx`**: Independent authentication context specifically for administrator sessions.

### B. User Onboarding Flow (`OnboardingProfilePage.tsx`)
A structured 3-step onboarding wizard for newly registered users:
1. **Step 1 - Personal Details**: Full name, gender, occupation, date of birth (with future date restriction), and personal bio.
2. **Step 2 - Lifestyle Habits**: Sleep schedule, smoking, drinking, cleanliness rating, diet, visitor policy, and roommate gender preference.
3. **Step 3 - Identity Verification**: Drag-and-drop or webcam capture for **Government ID Card** and **Selfie photo**, uploaded via `CloudinaryService`. Sets verification status to `"pending"`.

### C. Customer Dashboard & Compatibility Discovery (`CustomerDashboard.tsx`)
* **Dynamic Match Cards (`MatchCard.tsx`)**: Displays rooms and seeker profiles with dynamic compatibility match percentages (0–100%) calculated by the domain engine.
* **Interactive Filters**: Filter by budget range, room type, and location.
* **Dual-Role Switcher**: Allows toggling between **Host** mode (viewing verified seekers) and **Seeker** mode (viewing verified properties).
* **Interest Notifications**: Users can click "Send Interest" to automatically notify the listing owner.

### D. Admin Portal & Verification Queue (`AdminDashboardPage.tsx`)
* **KPI Metrics**: Real-time stats cards for Total Users, Active Rooms, Verified Hosts, and Pending Verifications.
* **User Management Directory**: Search users by name or email, filter by verification status, and instantly toggle account block status.
* **Document Inspection Modal**: Side-by-side modal displaying submitted Government ID and Selfie photos. Admins can **Approve** or **Reject** with a mandatory feedback reason, triggering an instant notification to the user.
* **Client-Side Pagination**: Efficient pagination for both user directory (`pageSize = 5`) and verification queue (`pageSize = 4`).

### E. Mutual Connection & Interest Management (`CustomerDashboard.tsx`, `MatchedPage.tsx`, `useInterest.ts`)
* **Send Interest**: Users click "Send Interest" on matching room listings or seeker profiles, automatically initiating a request with compound duplicate prevention.
* **Accept & Decline**: Recipient users manage incoming requests in real-time via the "Connection Requests" dashboard panel or Matched page with dedicated **Accept** (green) and **Decline** buttons.
* **Cancel Request**: Senders can cancel pending requests before they are accepted.
* **Unmatch / Remove Connection**: Connected users can cleanly unmatch via a confirmation modal, removing each other from active matched lists.
* **Privacy & Platform Safety**: Direct email links have been removed in favor of in-app messaging and scheduled in-person visits.

### F. Real-Time Chat & Direct Messaging (`MessagesPage.tsx`, `SocketContext.tsx`)
* **Socket.io WebSockets**: Instant messaging with zero polling, powered by active room channels.
* **Unified Conversations**: Guarantees a single conversation thread per matched user pair with intelligent deduplication.
* **Live Presence & Typing Indicators**: Online/offline green status bubbles and real-time typing dots.
* **Global Badges & Unread Counters**: Sidebar and header badges automatically update when messages arrive while viewing other pages.
* **Integrated Visit Banner**: Active visit requests and reschedule options appear right inside the chat header.

### G. In-Person Visit Scheduling (`ScheduleVisitPage.tsx`, `MatchedPage.tsx`)
* **Interactive Custom Calendar**: Monday-starting calendar with past date protection and month navigators.
* **3-Slot Time Selector**: Morning (10:00 AM), Afternoon (02:00 PM), and Evening (06:00 PM) interactive cards with selection badges.
* **Host Card & Availability Note**: Host details, verification badge, host availability quote, and personal intro textarea.
* **Strict Role Guarding**: Requesters are barred from accepting their own visit request; only the recipient can accept, decline, or propose changes.
* **Lifecycle Management**: Real-time banners for Pending, Confirmed, Rescheduled, Cancelled, and Declined visits with full modal management.

### H. Dedicated Explore Listings Page (`ExplorePage.tsx`)
* **"View More" Transition**: Navigates from dashboard 4-card preview to a dedicated, high-density listing view.
* **Background Search, Filter & Sort**: Filter by location, budget range, room type, and required amenities with clean URL/state persistence.
* **Responsive Pagination**: Clean 8–12 card paginated grid.

---

## 4. Custom Hooks Catalog (13 Total)

| # | Hook Name | Path | What It Handles |
|---|---|---|---|
| 1 | `useAuth` | `src/hooks/useAuth.ts` | Accesses the shared user authentication context (`user`, `token`, `login`, `logout`). |
| 2 | `useCountdown` | `src/hooks/useCountdown.ts` | Controls 60-second OTP resend delay with automatic `clearInterval` cleanup. |
| 3 | `useForgotPassword` | `src/hooks/useForgotPassword.ts` | Manages state, validation, and API submission for password reset OTP. |
| 4 | `useGoogleAuth` | `src/hooks/useGoogleAuth.ts` | Handles Google OAuth login and registration workflows. |
| 5 | `useLogin` | `src/hooks/useLogin.ts` | Encapsulates login form submission, error handling, and session activation. |
| 6 | `useResetPassword` | `src/hooks/useResetPassword.ts` | Manages submission and validation for saving a new password. |
| 7 | `useSignUp` | `src/hooks/useSignUp.ts` | Manages user registration form submission and navigation to OTP screen. |
| 8 | `useToast` | `src/hooks/useToast.ts` | Clean wrapper around `react-hot-toast` for consistent notifications. |
| 9 | `useVerifyOtp` | `src/hooks/useVerifyOtp.ts` | Manages OTP code submission and resend triggers during signup. |
| 10 | `useVerifyResetOtp` | `src/hooks/useVerifyResetOtp.ts` | Handles OTP verification specifically for the password reset flow. |
| 11 | `useInterest` | `src/hooks/useInterest.ts` | Manages sending, accepting, declining, cancelling sent requests, and unmatching connections. |
| 12 | `useSocket` | `src/context/SocketContext.tsx` | Provides WebSocket connection, real-time message sending/receiving, presence, and visit update toasts. |
| 13 | `useAdminAuth` | `src/context/AdminAuthContext.tsx` | Provides admin session status, admin token, and admin logout action. |

---

## 5. Optimization Techniques Implemented

1. **Route-Level Code Splitting (`React.lazy` + `Suspense`)**:
   - Implemented in `AppRoutes.tsx`. All pages are loaded on demand via dynamic `import()`, keeping initial bundle size minimal.
2. **Component Memoization (`React.memo`)**:
   - `Header`, `Sidebar`, `StatCard`, `MatchCard`, `Avatar`, and `PasswordStrength` components are wrapped with `memo()` to eliminate unnecessary parent-triggered re-renders.
3. **Context Memoization (`useMemo`)**:
   - The value objects in `AuthProvider.tsx` and `SocketContext.tsx` are wrapped in `useMemo`, preventing all subscribers across the application from re-rendering when unrelated state changes.
4. **Function Reference Stabilization (`useCallback`)**:
   - All custom hooks and event handlers (`handleGoogleAuth`, `openSidebar`, `closeSidebar`, `loadData`, `fetchProfileData`, `sendSocketMessage`) use `useCallback` to prevent function recreations.
5. **Thundering Herd Prevention (Axios Request Queue)**:
   - Implemented in `services/api.ts`. If multiple requests hit a 401 simultaneously, only one refresh token call is dispatched while the others wait in `failedQueue`.
6. **Memory Leak Prevention**:
   - Proper `useEffect` cleanup functions in `useCountdown.ts`, `SocketContext.tsx`, and `Header.tsx` to clear active timers and disconnect socket listeners.
7. **Client-Side DOM Pagination**:
   - In `AdminDashboardPage.tsx` and `ExplorePage.tsx`, large datasets are paginated to prevent rendering hundreds of DOM nodes at once.
