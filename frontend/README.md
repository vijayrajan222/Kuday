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
│   │   │   └── AuthProtectedRoute.tsx # Route Guards (GuestRoute & AuthProtectedRoute)
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
│   │   ├── apiEndpoints.ts       # API Route URLs (/auth/signUp, /auth/login, /auth/verify-otp)
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
│   │   └── authService.ts        # Auth API Functions (login, signUp, verifyOtp, resendOtp)
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
│   │   ├── auth.types.ts         # Login, SignUp & VerifyOTP Payload / Response Types
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
- **`src/pages/customer/Login.tsx`**: The customer login page built using `AuthLayout`. Renders email input with icon and `PasswordInput` with eye toggle. Uses React Hook Form with Zod validation (`mode: 'onTouched'`) so error messages appear cleanly without flashing on initial page load.
- **`src/hooks/useLogin.ts`**: Dedicated hook encapsulating login submission logic. Invokes `authService.login()`, updates session state via `loginSuccess(token, user)`, displays a success toast notification, and navigates to `/dashboard`.
- **`src/shared/schema/auth/LoginUserSchema.ts`**: Zod validation schema ensuring the user inputs a valid, non-empty email address and a password before firing HTTP requests.
- **`src/context/AuthProvider.tsx`**: Manages active user authentication state (`user`, `token`, `isAuthenticated`, `pendingSignup`). When a user logs in or verifies their OTP, `loginSuccess(token, user)` persists the JWT token and user details to `localStorage` via `storage.ts` and updates React state.
- **`src/utils/storage.ts`**: Encapsulates `localStorage` reads and writes. Prevents raw `localStorage` calls across components.
- **`src/components/auth/AuthProtectedRoute.tsx`**:
  - `GuestRoute`: Guard restricting routes (`/signUp`, `/login`, `/otp`) to unauthenticated visitors.
  - `AuthProtectedRoute`: Guard restricting `/dashboard` to logged-in users with valid tokens.

### B. Custom Hooks (Business Logic Extraction)
- **`useLogin.ts`**: Connects `Login.tsx` to `authService.login`. Stores active JWT token and user info, then redirects to `/dashboard`.
- **`useSignUp.ts`**: Connects `CustomerSignup.tsx` to `authService.signUp`. Saves `pendingSignup` info in state and redirects to `/otp`.
- **`useVerifyOtp.ts`**: Connects `Otp.tsx` to `authService.verifyOtp`. Manages OTP verification submission, extracts the returned JWT token, updates `AuthProvider` session, and redirects to `/dashboard`.
- **`useCountdown.ts`**: Manages a 60-second countdown timer for resending OTP codes.

### C. Services & Axios Interceptors
- **`src/services/api.ts`**: Pre-configured Axios client.
  - **Request Interceptor**: Reads token from `storage.ts` and attaches `Authorization: Bearer <token>` to headers.
  - **Response Interceptor**: Catches `401 Unauthorized` responses and dispatches `AUTH_UNAUTHORIZED_EVENT` to trigger automatic logout.
- **`src/services/authService.ts`**: Service object executing HTTP requests (`login`, `signUp`, `verifyOtp`, `resendOtp`). Unwraps the backend `payload` property cleanly (`(data as any).payload ?? data.data ?? data`).

### D. UI Primitives & Components
- **`PasswordInput.tsx`**: Password input field with toggleable eye icon (`Eye` / `EyeOff`) to show or hide plain text password.
- **`PasswordStrength.tsx`**: Evaluates password length, uppercase, lowercase, numbers, and special characters, rendering a color-coded strength bar (Weak / Fair / Strong).
- **`input-otp.tsx`**: 6-box OTP input supporting paste auto-distribution, arrow navigation, and countdown timer.
- **`button.tsx`**: Reusable button component supporting loading spinner states (`loader.tsx`) and full-width styling.

---

## 4. "Why & Where" - Key Architectural Rationale

| Question | Architectural Rationale & Solution | File Location |
| :--- | :--- | :--- |
| **Why use `mode: 'onTouched'` in React Hook Form?** | Prevents red error messages from displaying before the user has touched or typed in the input fields, maintaining clean UX. | `src/pages/customer/Login.tsx`<br>`src/pages/customer/CustomerSignup.tsx` |
| **Why unwrap `payload` in `authService.ts`?** | The Express backend wraps all successful JSON API responses in `{ success: true, message: "...", payload: { ... } }`. Standardizing unwrapping in `authService` keeps components clean. | `src/services/authService.ts` |
| **Why use Context API (`AuthProvider.tsx`) + `storage.ts`?** | Centrally manages user session state across all pages without prop-drilling. Encapsulating `localStorage` in `storage.ts` prevents key mismatch errors and allows easy storage swapping. | `src/context/AuthProvider.tsx`<br>`src/utils/storage.ts` |
| **Why extract logic into Custom Hooks (`useLogin`, `useSignUp`, `useVerifyOtp`)?** | Separates UI presentation (JSX rendering) from business logic (API calls, timer state, navigation). Makes components clean, readable, and easy to maintain. | `src/hooks/useLogin.ts`<br>`src/hooks/useSignUp.ts`<br>`src/hooks/useVerifyOtp.ts` |
| **Why centralized Axios Interceptors?** | Automatically attaches JWT tokens to outgoing headers and handles global HTTP errors (401, 500) without duplicating header code in every single API call. | `src/services/api.ts` |
| **Why separate Zod Schemas in `shared/schema/`?** | Decouples form validation rules from React component files so schemas can be reused or updated independently. | `src/shared/schema/auth/LoginUserSchema.ts`<br>`src/shared/schema/auth/RegisterUserSchema.ts` |

---

## 5. End-to-End Data & Execution Trace

### Phase 1: User Login Flow
```
User Fills Login Form (Login.tsx)
             │
             ▼
Zod Form Validation (LoginUserSchema.ts)
             │
             ▼
useLogin Hook (useLogin.ts)
             │
             ▼
authService.login(payload) (authService.ts)
             │
             ▼
Axios Request Interceptor (services/api.ts) ──► HTTP POST /auth/login
             │
             ▼
Express Backend (LoginUserUseCase.ts)
             ├── Fetches User by Email from MongoDB
             ├── Checks Account Status (isVerified, isBlocked)
             ├── Compares Password Hash (Bcrypt)
             └── Generates JWT Access Token (JwtService)
             │
             ▼
Returns Response { success: true, payload: { id, email, firstName, token, message } }
             │
             ▼
authService.ts unwraps response payload & extracts token & user info
             │
             ▼
loginSuccess(token, user) in AuthProvider saves token & user info to storage.ts
             │
             ▼
Redirects to /dashboard with active user session! 🎉
```

---

### Phase 2: User Registration & OTP Flow
```
User Fills Signup Form (CustomerSignup.tsx) ──► Zod Validation ──► POST /auth/signUp
             │
             ▼
Express Backend hashes password, creates unverified user, sends 6-digit OTP email
             │
             ▼
User enters 6-digit OTP in Otp.tsx ──► Zod OTP Validation ──► POST /auth/verify-otp
             │
             ▼
Express Backend validates OTP, marks user verified, returns JWT access token
             │
             ▼
loginSuccess(token, user) activates session and redirects to /dashboard 🎉
```
