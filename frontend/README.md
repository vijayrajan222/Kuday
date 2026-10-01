# 📖 KUDAY Frontend - Master Architecture, Reference & Learning Notes

---

## 1. Executive Summary & Brand Purpose

### **Project Identity**: **KUDAY** (Roommate Finder Portal)
- **Core Mission**: KUDAY connects homeowners who own a house and want to list empty rooms with individuals searching for their ideal roommate.
- **Tech Stack**: React 18/19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Zod, React Hook Form, Axios, Context API.
- **Backend Connection**: Communicates with the Express + Node.js + Clean Architecture backend running on `http://localhost:3000`.
- **Level 1 Status**: 🎉 **100% COMPLETE** (Sign Up, Email OTP Verification, Login, Google Auth, Forgot Password, Reset OTP, Reset Password, Refresh Token, Logout).

---

## 2. Master Directory Sitemap & File Index

```
frontend/
├── public/                       # Static public assets (icons, favicon)
├── src/
│   ├── assets/                   # Images, SVGs, static media
│   ├── components/               # UI & Layout Components
│   │   ├── auth/                 # Auth Layouts & Route Protection
│   │   │   ├── AuthLayout.tsx    # Responsive Auth Card Layout with KUDAY Branding
│   │   │   ├── AuthProtectedRoute.tsx # Route Guards (GuestRoute & AuthProtectedRoute)
│   │   │   └── GoogleAuthButton.tsx   # "Continue with Google" OAuth Button Component
│   │   ├── common/               # General Purpose Shared UI
│   │   │   ├── BrandLogo.tsx     # KUDAY Logo & Badge
│   │   │   ├── ErrorBoundary.tsx # React Error Catching Component
│   │   │   ├── PageLoader.tsx    # Full-page Spinner
│   │   │   ├── PasswordStrength.tsx # Live Visual Password Strength Bar
│   │   │   └── StatCard.tsx      # Dashboard Metric Display Card
│   │   ├── layout/               # App Layout Containers
│   │   │   ├── DashboardLayout.tsx # Main App Layout (Header + Sidebar + Content)
│   │   │   ├── Header.tsx        # Top Navigation Bar
│   │   │   └── Sidebar.tsx       # Side Navigation Menu
│   │   ├── roommate/             # Roommate Feature Components
│   │   │   └── MatchCard.tsx     # Roommate / Property Listing Card
│   │   └── ui/                   # Primitive UI Controls (Shadcn-style)
│   │       ├── avatar.tsx        # User Avatar Circle
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
│   │   ├── apiEndpoints.ts       # API Route URLs (/auth/signUp, /auth/login, /auth/google, /auth/verify-otp, /auth/forgot-password, /auth/verify-reset-otp, /auth/reset-password, /auth/refresh-token, /auth/logout)
│   │   ├── events.ts             # Global Custom Events (AUTH_UNAUTHORIZED_EVENT)
│   │   ├── messages.ts           # Centralized Success & Error Notification Strings
│   │   └── routes.ts             # App Route Constants (SIGN_UP, LOGIN, OTP, FORGOT_PASSWORD, VERIFY_RESET_OTP, RESET_PASSWORD, DASHBOARD)
│   │
│   ├── context/                  # Global Session State
│   │   ├── authContext.ts        # Auth React Context Definition
│   │   └── AuthProvider.tsx      # Auth State Provider (Session, Token, User Info)
│   │
│   ├── data/                     # Mock Data
│   │   └── dummyData.ts          # Sample Roommate & House Listings
│   ├── hooks/                    # Custom React Hooks
│   │   ├── useAuth.ts            # Hook to access global AuthContext
│   │   ├── useCountdown.ts       # Hook for 60-Second OTP Timer
│   │   ├── useForgotPassword.ts   # Hook managing Forgot Password submission
│   │   ├── useGoogleAuth.ts      # Hook managing Google Auth API & Session activation
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
│   ├── pages/                    # Main Page Views
│   │   ├── common/               # LandingPage.tsx, NotFound.tsx
│   │   └── customer/             # CustomerSignup.tsx, Login.tsx, Otp.tsx, ForgotPassword.tsx, VerifyResetOtp.tsx, ResetPassword.tsx, CustomerDashboard.tsx
│   │
│   ├── routes/                   # Router Setup
│   │   └── AppRoutes.tsx         # React Router v7 Route Map (Lazy loaded routes)
│   │
│   ├── services/                 # API Service Layer
│   │   ├── api.ts                # Axios Instance with Request/Response Interceptors & Automatic 401 Refresh Token Retry
│   │   └── authService.ts        # Auth API Functions (googleAuth, login, signUp, verifyOtp, resendOtp, forgotPassword, verifyResetOtp, resetPassword, refreshToken, logout)
│   │
│   ├── shared/                   # Shared Schemas & Enums
│   │   ├── enums/
│   │   │   └── HttpStatusCodes.ts  # HTTP Status Code Enum (200, 201, 400, 401, 404, 500)
│   │   └── schema/
│   │       └── auth/
│   │           ├── ForgotPasswordSchema.ts # Zod Schema for Forgot Password
│   │           ├── LoginUserSchema.ts    # Zod Schema for User Login Validation
│   │           ├── RegisterUserSchema.ts # Zod Schema for Registration Validation
│   │           ├── ResetPasswordSchema.ts # Zod Schema for Setting New Password
│   │           └── VerifyOtpSchema.ts    # Zod Schema for 6-Digit OTP Code
│   │
│   ├── types/                    # TypeScript Definitions
│   │   ├── auth.types.ts         # GoogleAuth, Login, SignUp, VerifyOTP, ResetPassword Payload / Response Types
│   │   └── index.ts              # Unified Type Exports
│   │
│   └── utils/                    # Utility Functions
│       ├── errorHandler.ts       # Error Message Extractor
│       ├── formatters.ts         # Email Masking & Seconds Formatting
│       └── storage.ts            # Encapsulated LocalStorage Helper (getToken, setToken, clear)
│   ├── App.css
│   ├── App.tsx                   # Main App Container
│   ├── index.css                 # Tailwind Directives & Base Styles
│   └── main.tsx                  # Application Entry Point
├── .env.example
├── eslint.config.js              # Strict ESLint Configuration
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 3. "What Does What" - Level 1 Feature & Component Breakdown

### A. Authentication & Session Management
- **`src/services/api.ts`**: Axios instance with automatic 401 Unauthorized handling. When an access token expires, it silently requests a fresh access token from `POST /auth/refresh-token` using the `httpOnly` cookie and retries the original request seamlessly.
- **`src/services/authService.ts`**: Clean API service layer handling `googleAuth`, `login`, `signUp`, `verifyOtp`, `forgotPassword`, `verifyResetOtp`, `resetPassword`, `refreshToken`, and `logout`.
- **`src/context/AuthProvider.tsx`**: Manages global session state (`user`, `token`, `isAuthenticated`, `pendingSignup`). Listens for `AUTH_UNAUTHORIZED_EVENT` to automatically log out users when session refresh fails.

---

## 4. End-to-End Execution Traces

### Phase 1: Refresh Token Flow (Silent Auto-Renewal)
```
API Request returns HTTP 401 Unauthorized
             │
             ▼
Axios Response Interceptor catches 401 (services/api.ts)
             │
             ▼
Dispatches HTTP POST /auth/refresh-token with httpOnly Cookie
             │
             ▼
Express Backend verifies refreshToken cookie & issues new Access Token
             │
             ▼
Frontend stores new token & retries original failed API call seamlessly! 🎉
```
