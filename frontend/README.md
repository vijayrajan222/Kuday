# 📖 KUDAY Frontend - Master Architecture, Reference & Learning Notes

---

## 1. Executive Summary & Brand Purpose

### **Project Identity**: **KUDAY** (Roommate Finder Portal)
- **Core Mission**: KUDAY connects homeowners who own a house and want to list empty rooms with individuals searching for their ideal roommate.
- **Tech Stack**: React 18/19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Zod, React Hook Form, Axios, Context API.
- **Backend Connection**: Communicates with the Express + Node.js + Clean Architecture backend running on `http://localhost:3000`.

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
│   │   ├── apiEndpoints.ts       # API Route URLs (/auth/signUp, /auth/login, /auth/google, /auth/verify-otp)
│   │   ├── events.ts             # Global Custom Events (AUTH_UNAUTHORIZED_EVENT)
│   │   ├── messages.ts           # Centralized Success & Error Notification Strings
│   │   └── routes.ts             # App Route Constants (SIGN_UP, LOGIN, OTP, DASHBOARD)
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
│   │   ├── useGoogleAuth.ts      # Hook managing Google Auth API & Session activation
│   │   ├── useLogin.ts           # Hook managing Login API & Session trigger logic
│   │   ├── useSignUp.ts          # Hook managing Signup submission logic
│   │   ├── useToast.ts           # Hook for triggering Toast notifications
│   │   └── useVerifyOtp.ts       # Hook managing OTP verification & resend logic
│   │
│   ├── lib/                      # Helper Libraries
│   │   └── utils.ts              # cn() dynamic Tailwind class merger (clsx + twMerge)
│   │
│   ├── pages/                    # Main Page Views
│   │   ├── common/               # LandingPage.tsx, NotFound.tsx
│   │   └── customer/             # CustomerSignup.tsx, Login.tsx, Otp.tsx, CustomerDashboard.tsx
│   │
│   ├── routes/                   # Router Setup
│   │   └── AppRoutes.tsx         # React Router v7 Route Map (Lazy loaded routes)
│   │
│   ├── services/                 # API Service Layer
│   │   ├── api.ts                # Axios Instance with Request/Response Interceptors
│   │   └── authService.ts        # Auth API Functions (googleAuth, login, signUp, verifyOtp, resendOtp)
│   │
│   ├── shared/                   # Shared Schemas & Enums
│   │   ├── enums/
│   │   │   └── HttpStatusCodes.ts  # HTTP Status Code Enum (200, 201, 400, 401, 404, 500)
│   │   └── schema/
│   │       └── auth/
│   │           ├── LoginUserSchema.ts    # Zod Schema for User Login Validation
│   │           ├── RegisterUserSchema.ts # Zod Schema for Registration Validation
│   │           └── VerifyOtpSchema.ts    # Zod Schema for 6-Digit OTP Code
│   │
│   ├── types/                    # TypeScript Definitions
│   │   ├── auth.types.ts         # GoogleAuth, Login, SignUp & VerifyOTP Payload / Response Types
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

## 3. "What Does What" - Comprehensive Feature & Component Breakdown

### A. Authentication & Session Management
- **`src/components/auth/GoogleAuthButton.tsx`**: Renders an accessible button with the official Google logo SVG ("Continue with Google"). Handles Google Identity Services (`google.accounts.id`) popup integration when `VITE_GOOGLE_CLIENT_ID` is present, with fallback dev prompt support.
- **`src/hooks/useGoogleAuth.ts`**: Dedicated hook encapsulating Google authentication submission. Calls `authService.googleAuth()`, stores returned JWT token via `loginSuccess(token, user)`, notifies user with toast, and navigates to `/dashboard`.
- **`src/pages/customer/Login.tsx`**: Renders `GoogleAuthButton`, an "Or continue with email" divider, and the email/password form with Zod validation (`mode: 'onTouched'`).
- **`src/pages/customer/CustomerSignup.tsx`**: Renders `GoogleAuthButton`, divider, registration fields, password strength indicator, and link to login.
- **`src/context/AuthProvider.tsx`**: Manages active user authentication state (`user`, `token`, `isAuthenticated`, `pendingSignup`). When a user logs in (via email or Google) or verifies OTP, `loginSuccess(token, user)` persists JWT token and user info to `localStorage` via `storage.ts`.

---

## 4. "Why & Where" - Key Architectural Rationale

| Question | Architectural Rationale & Solution | File Location |
| :--- | :--- | :--- |
| **Why integrate `GoogleAuthButton` in both Login & Signup?** | Provides frictionless single-click authentication for new and returning users without requiring separate signup vs login Google flows. | `src/components/auth/GoogleAuthButton.tsx`<br>`src/pages/customer/Login.tsx`<br>`src/pages/customer/CustomerSignup.tsx` |
| **Why handle Google JWT decoding in `GoogleAuthButton.tsx`?** | Extracts verified Google claims (`email`, `given_name`, `family_name`, `sub`) to send clean DTO payload to `POST /auth/google`. | `src/components/auth/GoogleAuthButton.tsx` |
| **Why use `useGoogleAuth` hook?** | Keeps business logic (API dispatch, session activation, toast, navigation) separated from UI presentation. | `src/hooks/useGoogleAuth.ts` |

---

## 5. End-to-End Data & Execution Trace

### Phase 1: Google Authentication Flow
```
User Clicks "Continue with Google" (GoogleAuthButton.tsx)
             │
             ▼
Google Popup / GIS Callback decodes claims
             │
             ▼
useGoogleAuth Hook (useGoogleAuth.ts)
             │
             ▼
authService.googleAuth(payload) (authService.ts)
             │
             ▼
Axios Request Interceptor (services/api.ts) ──► HTTP POST /auth/google
             │
             ▼
Express Backend (GoogleAuthUseCase.ts)
             ├── Finds User by Email in MongoDB
             ├── If User exists: checks block status & auto-verifies email
             ├── If New User: creates user marked as isVerified = true
             └── Generates JWT Access Token (JwtService)
             │
             ▼
Returns Response { success: true, payload: { id, email, firstName, token, message } }
             │
             ▼
loginSuccess(token, user) in AuthProvider saves token & user info to storage.ts
             │
             ▼
Redirects to /dashboard with active user session! 🎉
```
