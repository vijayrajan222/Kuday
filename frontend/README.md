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
│   │   │   ├── AuthLayout.tsx    # Responsive Auth Card Layout with Branding
│   │   │   └── AuthProtectedRoute.tsx # Route Guard for Authenticated Users
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
│   │   ├── apiEndpoints.ts       # API Route URLs (/auth/signUp, /auth/verify-otp)
│   │   ├── events.ts             # Global Custom Events (AUTH_UNAUTHORIZED_EVENT)
│   │   ├── messages.ts           # Centralized Success & Error Notification Strings
│   │   └── routes.ts             # App Route Constants (SIGN_UP, VERIFY_OTP, DASHBOARD)
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
│   │   ├── useSignUp.ts          # Hook managing Signup submission logic
│   │   ├── useToast.ts           # Hook for triggering Toast notifications
│   │   └── useVerifyOtp.ts       # Hook managing OTP verification & resend logic
│   │
│   ├── lib/                      # Helper Libraries
│   │   └── utils.ts              # cn() dynamic Tailwind class merger (clsx + twMerge)
│   │
│   ├── pages/                    # Main Page Views
│   │   ├── common/               # LandingPage.tsx, NotFound.tsx
│   │   └── customer/             # CustomerSignup.tsx, Otp.tsx, CustomerDashboard.tsx
│   │
│   ├── routes/                   # Router Setup
│   │   └── AppRoutes.tsx         # React Router v6 Route Map
│   │
│   ├── services/                 # API Service Layer
│   │   ├── api.ts                # Axios Instance with Request/Response Interceptors
│   │   └── authService.ts        # Auth API Functions (signUp, verifyOtp, resendOtp)
│   │
│   ├── shared/                   # Shared Schemas & Enums
│   │   ├── enums/
│   │   │   └── HttpStatusCodes.ts  # HTTP Status Code Enum (200, 201, 400, 401, 404, 500)
│   │   └── schema/
│   │       └── auth/
│   │           ├── RegisterUserSchema.ts  # Zod Schema for Registration Validation
│   │           └── VerifyOtpSchema.ts     # Zod Schema for 6-Digit OTP Code
│   │
│   ├── types/                    # TypeScript Definitions
│   │   ├── auth.types.ts         # SignUp & VerifyOTP Payload / Response Types
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
- **`src/context/AuthProvider.tsx`**: Manages active user authentication state (`user`, `token`, `isAuthenticated`, `pendingSignup`). When a user successfully verifies their OTP, `loginSuccess(token, user)` persists the JWT token to `localStorage` via `storage.ts` and updates React state.
- **`src/utils/storage.ts`**: Encapsulates `localStorage` reads and writes. Prevents raw `localStorage` calls across components.
- **`src/components/auth/AuthProtectedRoute.tsx`**: Route wrapper that checks `isAuthenticated`. If false, redirects the user to `/signUp`.

### B. Custom Hooks (Business Logic Extraction)
- **`useSignUp.ts`**: Connects `CustomerSignup.tsx` to `authService.signUp`. Saves `pendingSignup` info in state and redirects to `/otp`.
- **`useVerifyOtp.ts`**: Connects `Otp.tsx` to `authService.verifyOtp`. Manages OTP verification submission, extracts the returned JWT token, updates `AuthProvider` session, and redirects to `/dashboard`.
- **`useCountdown.ts`**: Manages a 60-second countdown timer for resending OTP codes.

### C. Services & Axios Interceptors
- **`src/services/api.ts`**: Pre-configured Axios client.
  - **Request Interceptor**: Reads token from `storage.ts` and attaches `Authorization: Bearer <token>` to headers.
  - **Response Interceptor**: Catches `401 Unauthorized` responses and dispatches `AUTH_UNAUTHORIZED_EVENT` to trigger automatic logout.
- **`src/services/authService.ts`**: Service object executing HTTP requests (`signUp`, `verifyOtp`, `resendOtp`). Unwraps the backend `payload` property cleanly (`(data as any).payload ?? data.data ?? data`).

### D. UI Primitives & Components
- **`input-otp.tsx`**: 6-box OTP input supporting:
  - **Paste Event Auto-Distribution**: Intercepts `onPaste` to strip non-numeric characters and distribute 6 digits into boxes 1-6 simultaneously.
  - **Arrow Navigation**: Left & Right arrow keys switch focus between boxes.
  - **Countdown Timer Integration**: Displays resend timer with "Resend OTP Code" trigger.
- **`PasswordInput.tsx`**: Password input field with toggleable eye icon (`Eye` / `EyeOff`) to show or hide plain text password.
- **`PasswordStrength.tsx`**: Evaluates password length, uppercase, lowercase, numbers, and special characters, rendering a color-coded strength bar (Weak / Fair / Strong).
- **`button.tsx`**: Reusable button component supporting loading spinner states (`loader.tsx`) and full-width styling.

### E. Validation Layer
- **`RegisterUserSchema.ts`**: Zod schema validating first name, last name, valid email format, password rules (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char), and password confirmation match (`refine`).
- **`VerifyOtpSchema.ts`**: Zod schema validating 6-digit numeric OTP code.

---

## 4. "Why & Where" - Key Architectural Rationale

| Question | Architectural Rationale & Solution | File Location |
| :--- | :--- | :--- |
| **Why use Context API (`AuthProvider.tsx`) + `storage.ts`?** | Centrally manages user session state across all pages without prop-drilling. Encapsulating `localStorage` in `storage.ts` prevents key mismatch errors and allows easy storage swapping. | `src/context/AuthProvider.tsx`<br>`src/utils/storage.ts` |
| **Why extract logic into Custom Hooks (`useSignUp`, `useVerifyOtp`)?** | Separates UI presentation (JSX rendering) from business logic (API calls, timer state, navigation). Makes components clean, readable, and easy to maintain. | `src/hooks/useSignUp.ts`<br>`src/hooks/useVerifyOtp.ts` |
| **Why centralized Axios Interceptors?** | Automatically attaches JWT tokens to outgoing headers and handles global HTTP errors (401, 500) without duplicating header code in every single API call. | `src/services/api.ts` |
| **Why separate Zod Schemas in `shared/schema/`?** | Decouples form validation rules from React component files so schemas can be reused or updated independently. | `src/shared/schema/auth/RegisterUserSchema.ts`<br>`src/shared/schema/auth/VerifyOtpSchema.ts` |
| **Why OTP Paste Auto-Distribution in `input-otp.tsx`?** | Provides an effortless user experience. When users copy a 6-digit code from email and paste it, all 6 input boxes populate instantly. | `src/components/ui/input-otp.tsx` |

---

## 5. End-to-End Data & Execution Trace

### Phase 1: User Registration Flow
```
User Fills Signup Form (CustomerSignup.tsx)
             │
             ▼
Zod Form Validation (RegisterUserSchema.ts)
             │
             ▼
useSignUp Hook (useSignUp.ts)
             │
             ▼
authService.signUp(payload) (authService.ts)
             │
             ▼
Axios Request Interceptor (services/api.ts) ──► HTTP POST /auth/signUp
             │
             ▼
Express Backend (SignUpUserUseCase.ts)
  ├── Hashes Password (Bcrypt)
  ├── Saves Unverified User (MongoDB)
  ├── Generates 6-Digit OTP Code
  └── Sends Verification Email (Nodemailer)
             │
             ▼
Returns Response { success: true, payload: { id, email } }
             │
             ▼
Frontend saves pending email in AuthProvider & Navigates to /otp
```

---

### Phase 2: OTP Verification & Session Activation Flow
```
User Receives 6-Digit Email Code & Pastes into InputOTP (Otp.tsx)
             │
             ▼
Zod OTP Validation (VerifyOtpSchema.ts)
             │
             ▼
useVerifyOtp Hook (useVerifyOtp.ts)
             │
             ▼
authService.verifyOtp(payload) (authService.ts)
             │
             ▼
Axios Request Interceptor (services/api.ts) ──► HTTP POST /auth/verify-otp
             │
             ▼
Express Backend (VerifyOtpUseCase.ts)
  ├── Validates OTP Match & Expiry (10 mins)
  ├── Updates User isVerified = true in MongoDB
  ├── Deletes Used OTP Document
  └── Generates JWT Access Token (JwtService)
             │
             ▼
Returns Response { success: true, payload: { message, isVerified: true, token } }
             │
             ▼
authService.ts unwraps response payload & extracts token
             │
             ▼
loginSuccess(token, user) in AuthProvider saves token to storage.ts
             │
             ▼
Redirects to /dashboard with active user session! 🎉
```
