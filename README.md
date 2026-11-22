# 🏡 KUDAY (Project 2.0) - Full-Stack Roommate & Property Finder Platform

Welcome to **KUDAY (Project 2.0)**, an enterprise-grade, full-stack web application designed to connect homeowners with verified, compatible roommates. The system combines a modular Express.js backend architected using **Clean Architecture** and **SOLID Principles** with a responsive **React 18/19 + TypeScript + Vite + Tailwind CSS** frontend.

---

## 📑 Table of Contents

- [🏛️ System Architecture](#️-system-architecture)
- [✨ Key Features Implemented](#-key-features-implemented)
  - [Core Platform Features (Level 1 & 2)](#core-platform-features-level-1--2)
  - [Level 3: Advanced Governance, Geographic Discovery & Digital Rental Agreements](#level-3-advanced-governance-geographic-discovery--digital-rental-agreements)
- [🧠 Domain Compatibility Matching Algorithm](#-domain-compatibility-matching-algorithm)
- [⚓ Custom Hooks Catalog](#-custom-hooks-catalog)
- [🛡️ Clean Architecture & Design Pattern Compliance Audit](#️-clean-architecture--design-pattern-compliance-audit)
- [⚡ Performance & Security Optimizations](#-performance--security-optimizations)
- [🗄️ Database & Data Models](#️-database--data-models)
- [📡 API Endpoints Reference](#-api-endpoints-reference)
- [🚀 Quick Start & Local Setup](#-quick-start--local-setup)
- [📁 Repository Structure](#-repository-structure)

---

## 🏛️ System Architecture

The project enforces strict separation of concerns across both frontend and backend:

```
Project2.0/
├── backend/                       # Express + TypeScript + MongoDB (Clean Architecture)
│   ├── src/
│   │   ├── domain/               # Core business entities & mathematical algorithms (Zero external dependencies)
│   │   ├── application/          # Use cases, interfaces, DTOs & custom error definitions
│   │   ├── infrastructure/       # Mongoose schemas, repositories, Cloudinary, Razorpay, Nodemailer, DI container
│   │   └── presentation/         # Controllers, routers, Zod validation, error middlewares
│   └── readme                    # In-depth Backend Technical Guide
│
├── frontend/                      # React 18/19 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Atomic UI, layouts, auth cards, match cards, modals
│   │   ├── context/              # AuthProvider & AdminAuthContext
│   │   ├── hooks/                # Modular custom hooks (Auth, Chat, Visits, Agreements, Interests, etc.)
│   │   ├── pages/                # Customer & Admin pages (Lazy-loaded with Suspense)
│   │   ├── routes/               # App router with protected & guest route guards
│   │   └── services/             # Axios API client with token refresh queueing
│   └── README.md                 # In-depth Frontend Architecture Guide
│
└── README.md                      # Project-Wide Master Documentation
```

---

## ✨ Key Features Implemented

### Core Platform Features (Level 1 & 2)

#### 1. 🔐 Robust Authentication & Security
- **Email & Password Registration**: Checks uniqueness, hashes passwords with `bcrypt` (10 rounds), generates a 6-digit numeric OTP, and dispatches an HTML email via `nodemailer` (Gmail SMTP).
- **OTP Verification & Expiry**: Verifies OTP codes backed by MongoDB TTL indexes; issues a signed 7-day JWT access token.
- **Silent Refresh Token Auto-Renewal**: Secure `httpOnly` refresh cookies with frontend Axios request queueing to prevent thundering-herd duplicate refresh requests.
- **Google OAuth Integration**: Direct sign-in and account creation through Google.
- **Complete Forgot Password Flow**: Send reset OTP $\rightarrow$ verify reset OTP $\rightarrow$ securely update password.
- **Mass-Assignment Guard**: `MongoUserRepository` strictly enforces `PROFILE_UPDATABLE_FIELDS`, preventing users from tampering with protected flags like `isAdmin` or `isBlocked`.

#### 2. 📋 User Onboarding & Dynamic Profile System
- **3-Step Onboarding Wizard**:
  1. *Personal Details*: Full name, gender, occupation, bio, and birth date validation (future dates rejected).
  2. *Living Habits*: Smoking, drinking, diet, sleep schedule, cleanliness rating, visitor policy, and roommate gender preference.
  3. *Identity Upload*: Webcam / file upload for Government ID Card and Selfie photo.
- **Cloudinary CDN Integration**: Uploads images to secure cloud storage (`kuday_id_cards`, `kuday_selfies`, `kuday_rooms`), saving MongoDB storage and maximizing query speeds.
- **Dual-Role Switching**: Seamlessly toggle between **Host** and **Seeker** modes. Switching roles automatically toggles listing visibility.

#### 3. 🏠 Property Listings & Seeker Preference Management
- **Room Listings**: Hosts create verified room listings with monthly rent, location, capacity, available slots, house rules, amenities, and multiple CDN photos.
- **Seeker Preferences**: Seekers define maximum budget, preferred locations, room types, and required amenities.

#### 4. 🛡️ Admin Portal & Identity Verification Queue
- **Admin Authentication**: Dedicated admin login protecting platform management tools.
- **Verification Review Modal**: Side-by-side inspection of submitted Government ID and Selfie photos.
- **Approve / Reject Workflows**: Admins can approve (`identityVerified = true`) or reject with a mandatory feedback reason. Automatically notifies the user.
- **User Management**: Instant search, status filtering, and one-click account blocking/unblocking.
- **Platform Analytics**: Real-time KPI counters (Total Users, Active Rooms, Verified Hosts, Pending Verifications).

#### 5. 🔔 In-App Real-Time Notifications
- Real-time in-app alerts for visit updates, reschedule requests, cancellations, interest requests, admin verification results, and rental agreement actions.
- Backed by Socket.io (`new_notification` and `visit_update`) with instant unread badges, dropdown notifications, and toast alerts.

#### 6. 🤝 Mutual Connection & Interest Management (Send, Accept, Decline, Cancel, Unmatch)
- **Send Interest**: Users send requests to property listings or seeker profiles with automatic duplicate prevention via compound index `(senderId, receiverId, targetId)`.
- **Accept Interest**: Designated recipient can accept the request, automatically moving the contact into the mutual Matched section and enabling direct messaging, visit scheduling, and agreement creation.
- **Decline Interest**: Designated recipient can decline the request cleanly.
- **Cancel Request**: Users can cancel pending interest requests before the other party acts on them.
- **Unmatch / Remove Connection**: Users can unmatch with connected contacts at any time with modal confirmation, safely separating both parties.
- **Privacy & Revenue Protection**: Direct email contact links have been completely removed, steering all communication through verified in-app channels.

#### 7. 💬 Real-Time Chat & Socket.io Messaging (`/messages`)
- **Direct 1-on-1 Real-Time Chat**: WebSockets powered by Socket.io for instantaneous message delivery with zero polling.
- **Single Thread Deduplication**: Guarantees a single unified conversation thread per user pair across sender and receiver directions.
- **Live Online Presence & Typing Indicators**: Real-time user status (`Online` / `Offline`) and debounced typing animations.
- **Unread Counts & Global Badges**: Accurate unread message tracking with auto-incrementing badges on the navigation bar and sidebar.
- **Integrated Agreement & Visit Management**: Active visit schedules and agreement negotiation progress embedded directly into the chat header.

#### 8. 📅 In-Person Visit Scheduling & Management (`/schedule-visit/:connectionId`)
- **Interactive Calendar & Time Slots**: Clean date picker paired with 3 distinct daily time slots: Morning (10:00 AM), Afternoon (2:00 PM), Evening (6:00 PM).
- **Propose, Accept, Suggest & Reschedule**: Mutual rescheduling with conflict avoidance.

#### 9. 💎 Premium Membership & Subscription Plans (`/membership`)
- **Tiered Plans**: Basic, Pro, and Premium tiers with duration multipliers (Monthly, Quarterly, Annual).
- **Auto-Waiver**: Premium users receive a 100% waiver on platform rental agreement fees.

#### 10. 💳 Kuday Digital Wallet & Transactions (`/wallet`)
- **Wallet Infrastructure**: User-specific digital balances with automated top-up, withdrawal, and transaction logging.
- **Automated Refund Pipeline**: Integrated with agreement cancellation and race condition handling for instant 100% wallet credits.

---

### Level 3: Advanced Governance, Geographic Discovery & Digital Rental Agreements

*Implemented from 14-Nov-2026 onwards to achieve complete post-match tenancy governance, automated legal workflows, spatial search, and platform trust & safety.*

```
                               LEVEL 3 SYSTEM PIPELINE
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│   Geographic Discovery  │ ──> │   Turn-Based Agreement  │ ──> │   Gemini AI Legal Drafter│
│  Interactive Leaflet Map│     │   Lock & Proposal Flow  │     │   Safety & Anti-Bias    │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
             │                               │                               │
             ▼                               ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│   Admin Governance      │ <── │   Atomic Occupancy      │ <── │   Cryptographic PDF     │
│   Reports & Revenue KPI │     │   Reservation & Refund  │     │   Dual Sign & Checksum  │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
```

#### 11. 🗺️ Geographic Discovery & Interactive Map Integration
- **Spatial Coordinates Integration**: Added `coordinates: { lat: number; lng: number }` to `RoomEntity` and Mongoose `RoomModel`.
- **Interactive Host Map (`HostLocationMap.tsx`)**: Integrates Leaflet and OpenStreetMap for draggable pin placement during host onboarding and room editing.
- **Visual Location Explorer**: Embedded interactive map cards in room detail views, displaying exact location coordinates and neighborhood context.

#### 12. 🚨 User Reporting & Safety Moderation Subsystem
- **Domain Entity & Repository (`ReportEntity.ts`, `MongoReportRepository.ts`)**: Structured report tracking with target reference, reporter identity, categorized violation, evidence notes, and optional screenshot URLs.
- **Standardized Categories**: `fake_profile`, `harassment`, `scam`, `inappropriate_behavior`, `other`.
- **User-Facing Reporting Modal (`ReportUserModal.tsx`)**: Accessible from chat headers, user profiles, and roommate cards.
- **Admin Review Console (`AdminReportsPage.tsx`)**: Dedicated moderation interface for administrators with filter tabs (`pending`, `reviewed`, `dismissed`, `action_taken`), evidence inspection modals, and one-click account blocking/dismissal workflows.

#### 13. 📊 Dedicated Admin Revenue & Analytics Portal (`/admin/revenue`)
- **Financial Intelligence KPI Dashboard**:
  - Gross platform revenue across all channels.
  - Net subscription earnings and transaction frequency.
  - Platform rental agreement fee income (split fee collections).
- **Time-Series Charts & Breakdown**: Visual revenue velocity charts paired with an audit-ready transaction ledger.

#### 14. 📜 Digital Roommate Rental Agreement Engine (End-to-End)
- **Lifecycle State Machine**:
  $$\text{draft} \longrightarrow \text{terms\_proposed} \longrightarrow \text{terms\_accepted} \longrightarrow \text{payment\_pending} \longrightarrow \text{completed}$$
  Additional terminal states: `cancelled` (race loser or voluntary cancellation) and `ended` (formal termination).
- **Turn-Based Concurrency Lock (`AcquireAgreementLockUseCase.ts`)**:
  - Prevents race conditions and overwrites during terms editing.
  - Mutual locking mechanism with a 2-minute auto-expiry window and 30-second heartbeat renewal (`HeartbeatAgreementLockUseCase.ts`).
  - Auto-releases lock upon submission or timeout (`ReleaseAgreementLockUseCase.ts`).
- **Whole-Proposal Negotiation Flow (`SubmitAgreementProposalUseCase.ts`, `AcceptAgreementProposalUseCase.ts`)**:
  - Full revision history tracking with proposal snapshots (`rent`, `deposit`, `moveInDate`, `durationMonths`, `noticePeriodDays`, `paymentDueDay`, `utilities`, `houseRules`, `customClauses`).
  - Either party can propose edits; counterparty reviews and accepts or counter-proposes.
- **AI-Assisted Clause Drafter (`DraftClauseUseCase.ts`, Google Gemini `@google/genai`)**:
  - Transforms conversational user requests into formal, legally sound residential rental clauses under Indian tenancy standards.
  - **Safety & Non-Discrimination Guardrails**: Automatically detects and rejects clauses based on caste, religion, gender, sexual orientation, marital status, or nationality.
  - **Base Terms Conflict Detection**: Warns if the clause contradicts primary financial terms (e.g. attempting to alter agreed rent or notice periods).
  - Clear user-facing disclaimers and editable previews prior to agreement insertion.
- **Cryptographic Tamper-Evident PDF Generation (`PdfGeneratorService.ts`, `pdfkit`)**:
  - Generates a finalized residential rental contract including agreed terms, rules, clauses, parties' identity details, move-in schedules, and mutual acceptance timestamps.
  - Computes and embeds an authoritative **SHA-256 integrity hash** into the document footer.
  - Available for direct streaming download via `GET /agreements/:id/pdf`.
- **Platform Fee Engine & Split Payment Flow (`feeCalculator.ts`)**:
  - Flat ₹250 platform fee split equally between host (₹125) and seeker (₹125).
  - **Automatic Premium Waiver**: Users with an active Kuday Premium subscription receive a 100% platform fee waiver (₹0).
  - Order creation and verification with Razorpay gateway (`RazorpayAgreementPaymentService`) or mock provider (`MockAgreementPaymentService`).
  - Webhook ingestion (`HandleAgreementWebhookUseCase.ts`) and verification (`VerifyAgreementPaymentUseCase.ts`) engineered with strict idempotency.

#### 15. 🏨 Atomic Occupancy Management & Room Capacity Saturation
- **Atomic Slot Decrement (`occupancyHelper.ts`)**:
  - When an agreement reaches `completed`, room `availableSlots` is atomically decremented (`$inc: { availableSlots: -1 }`).
- **Race Condition Protection (Competing for Last Slot)**:
  - If multiple agreements race for the final vacancy, an atomic `$inc` with `$expr` constraint ensures only one agreement claims the slot.
  - The losing agreement is automatically marked `cancelled`, and any captured fee is **100% refunded to the user's Kuday wallet** with transaction logging.
- **Exhaustion & Visibility Automation**:
  - When `availableSlots === 0`, the room is automatically unlisted (`isActive: false`).
  - If all rooms owned by the host are full, the host's role transitions to `"none"`.
  - All remaining pending interest requests for the filled room are transitioned to `"room_filled"`.
- **Inactive Agreement Guard**:
  - `activateAgreement` handles `cancelled` or `ended` agreements with an early `{ inactive: true }` return, preventing unwanted slot deductions or duplicate refunds.
- **Agreement Termination Pipeline (`TerminateAgreementUseCase.ts`)**:
  - When either party ends an active tenancy via `POST /agreements/:id/terminate`:
    1. Vacancy is restored (`availableSlots + 1`, strictly capped at `capacity`).
    2. Room is reactivated (`isActive: true`).
    3. Host's role is restored to `"host"` only if it was currently `"none"`.
    4. Seeker's role remains untouched.
- **Room Edit Invariants**:
  - Room edits enforce `capacity >= occupiedSlots (capacity - availableSlots)`.
  - Modifying capacity adjusts `availableSlots` by the exact delta.

#### 16. 👥 Active Roommate Management ("Your Roommate" Section)
- **Dedicated Endpoint (`GET /agreements/roommate`)**:
  - For Hosts: Returns an array of active roommate agreements (one entry per occupied room slot).
  - For Seekers: Returns the single active roommate agreement.
- **Matched List Decoupling**: Active agreement partners are automatically excluded from the "Matched" connection queries and interest lists to prevent UI clutter.
- **Dashboard Section (`YourRoommateSection.tsx`)**:
  - Renders independently of the matched list.
  - Displays partner profile, room details, tenancy dates, PDF download shortcut, message link, and an "End Agreement" button with fee non-refundable confirmation.

#### 17. 🚦 Role Re-Selection & Marketplace Protection Invariants
- **Role Re-Selection for Role `"none"`**:
  - Displays an interactive role switcher ("Continue as Host" or "Continue as Seeker") alongside "Your Roommate" and Chat.
  - "Continue as Host" re-lists rooms with available slots > 0.
- **Seeker Active Agreement Lock**:
  - `UpdateRoleUseCase` rejects changing role to `"seeker"` if the user has an active completed agreement as a seeker (`"You can look for a new room after your current agreement ends"`).
  - Frontend disables "Continue as Seeker" with an explanatory badge in that scenario.
- **Platform-Wide Seeker Exclusion**:
  - Users with active roommate agreements are globally excluded from "Potential Seekers", "Available Seekers", Discover, search filters, pagination, and cannot be sent interest requests.

---

## 🧮 Domain Compatibility Matching Algorithm

The matching algorithm computes compatibility scores across lifestyle dimensions:

$$\text{Total Match Score} = \sum_{i} \left( W_i \times S_i \right) \in [0\%, 100\%]$$

```
┌────────────────────────────────────────────────────────┐
│             LIFESTYLE COMPATIBILITY MATRIX             │
├───────────────────────┬────────┬───────────────────────┤
│ Dimension             │ Weight │ Evaluation Metric     │
├───────────────────────┼────────┼───────────────────────┤
│ Smoking Tolerance     │ 20%    │ Exact habit matching  │
│ Drinking Tolerance    │ 15%    │ Exact habit matching  │
│ Sleep Schedule        │ 20%    │ Chronotype alignment  │
│ Cleanliness Rating    │ 15%    │ Proximity delta       │
│ Dietary Preference    │ 10%    │ Diet classification   │
│ Visitor Policy        │ 10%    │ Guest rules alignment │
│ Gender Preference     │ 10%    │ Mutual eligibility    │
└───────────────────────┴────────┴───────────────────────┘
```

---

## ⚓ Custom Hooks Catalog

1. `useAuth`: Access token, user identity, authenticated states, and logout.
2. `useAdminAuth`: Protected administrator session management.
3. `useChat`: Socket.io connection, real-time message stream, typing indicators.
4. `useNotifications`: In-app notification subscriptions, read status mutations.
5. `useInterest`: Send, accept, decline, cancel, and unmatch connection requests.
6. `useVisit`: In-person visit scheduling, time slots, and rescheduling suggestions.
7. `useAgreement`: Full digital agreement workflow (lock, propose, accept, pay, PDF).
8. `useRoommate`: Dedicated fetching of active roommate tenancy data.
9. `useWallet`: Balance, top-ups, transaction ledger, and payment integrations.
10. `useMembership`: Plan selection, subscription renewals, and feature waivers.
11. `useCountdown`: OTP and lock countdown timers.
12. `useDebounce`: Debounced search inputs and real-time filter queries.

---

## 🛡️ Clean Architecture & Design Pattern Compliance Audit

The backend adheres to Clean Architecture guidelines and SOLID principles:

```
                  CLEAN ARCHITECTURE DEPENDENCY RULE
              Presentation ──> Application ──> Domain
                                     ▲
             Infrastructure ─────────┘ (Inversion of Control)
```

### Layer Verification & Findings

| Layer | Responsibility | Compliance Status | Details |
|---|---|---|---|
| **Domain Layer** | Pure business entities (`AgreementEntity`, `RoomEntity`, `UserEntity`, `ReportEntity`) & algorithms (`feeCalculator`, `matchingAlgorithm`). | **100% Compliant** | Zero external dependencies; no database or framework imports. |
| **Application Layer** | Use cases, input/output DTOs, repository interfaces, custom error classes. | **100% Compliant** | Depends strictly on Domain abstractions; no direct presentation dependencies. |
| **Infrastructure Layer** | Mongoose schemas/models, repository implementations, third-party adapters (Cloudinary, Razorpay, Gemini, Nodemailer, PdfKit). | **100% Compliant** | Implements application interfaces via Inversion of Control. |
| **Presentation Layer** | Express controllers, route definitions, Zod validation middleware, HTTP response envelopes. | **100% Compliant** | Transforms HTTP requests into DTOs and handles response serialization. |

### Design Patterns Enforced
- **Dependency Inversion (IoC)**: High-level use cases depend on interfaces (`IAgreementRepository`, `IAgreementPaymentService`). All dependencies are wired in [`AppFactory.ts`](file:///c:/Users/ASUS/Desktop/Project2.0/backend/src/infrastructure/di/AppFactory.ts).
- **Strategy Pattern**: Payment processing uses an abstraction (`IAgreementPaymentService`) allowing dynamic switching between `RazorpayAgreementPaymentService` and `MockAgreementPaymentService`.
- **State Machine Pattern**: Agreement lifecycles enforce strictly defined valid transitions.
- **Optimistic / Distributed Locking**: Turn-based agreement locks prevent concurrent edit collisions.
- **Unit of Work & Idempotency**: Atomic Mongoose updates (`$inc`, `$set`, `$expr`) ensure consistent state changes during concurrent checkouts.

---

## ⚡ Performance & Security Optimizations

- **Atomic Slot Booking**: Mongoose conditional updates prevent overbooking even under racing requests.
- **Cryptographic Agreement Integrity**: PDF contracts feature embedded SHA-256 checksums to verify authenticity.
- **Anti-Discrimination Guardrails**: Integrated Gemini AI clause drafter automatically rejects discriminatory conditions.
- **Silent JWT Auto-Renewal**: Secure `httpOnly` refresh cookies with Axios concurrency queueing.
- **Database TTL Indexes**: Automated purging of expired OTPs and temporary records.

---

## 🗄️ Database & Data Models

| Collection / Model | Key Fields | Special Features / Indexes |
|---|---|---|
| **Users** (`UserModel.ts`) | `email`, `firstName`, `lastName`, `role`, `isBlocked`, `identityStatus`, `idCardUrl`, `selfieUrl` | Unique lowercase index on `email`, Mass-assignment protection |
| **Rooms** (`RoomModel.ts`) | `userId`, `title`, `roomType`, `monthlyRent`, `location`, `coordinates`, `capacity`, `availableSlots`, `isActive` | `coordinates` (lat, lng), Atomic `$inc` for slot reservation |
| **Agreements** (`AgreementModel.ts`) | `hostId`, `seekerId`, `roomId`, `status`, `lockedBy`, `lockExpiresAt`, `commonTerms`, `proposals`, `payment`, `pdfUrl`, `pdfHash` | Compound index `(hostId, seekerId, roomId)`, Turn-based lock TTL |
| **Reports** (`ReportModel.ts`) | `reporterId`, `reportedUserId`, `reason`, `description`, `evidenceUrls`, `status`, `adminNotes` | Indexed by `reporterId`, `reportedUserId`, `status` |
| **Interests** (`InterestModel.ts`) | `senderId`, `receiverId`, `targetType`, `targetId`, `status`, `message` | Compound unique index `(senderId, receiverId, targetId)` |
| **Visits** (`VisitModel.ts`) | `connectionId`, `seekerId`, `hostId`, `date`, `timeSlot`, `slotTime`, `status`, `suggestedDate` | Compound indexes `(connectionId, status)` & `(seekerId, hostId)` |
| **Conversations** (`ConversationModel.ts`) | `participants`, `lastMessage` | Single-thread compound index on `participants` |
| **Messages** (`MessageModel.ts`) | `conversationId`, `senderId`, `receiverId`, `content`, `isRead` | Indexed by `conversationId` and `createdAt` |
| **Wallets** (`WalletModel.ts`) | `userId`, `balance`, `currency` | Unique index on `userId`, Atomic balance operations |
| **Transactions** (`WalletTransactionModel.ts`) | `walletId`, `userId`, `amount`, `type`, `description`, `referenceId` | Indexed by `userId` and `createdAt` |
| **Subscriptions** (`SubscriptionModel.ts`) | `userId`, `planId`, `status`, `startDate`, `endDate`, `autoRenew` | Indexed by `userId` and `status` |

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
- `PUT /users/role` — Switch between Host and Seeker (with active agreement lock protection)
- `POST /users/upload-identity` — Upload ID Card & Selfie to Cloudinary
- `POST /users/change-password` — Update password for authenticated user

### Rooms & Properties (`/rooms`)
- `POST /rooms` — Create room listing with photos & geographic coordinates
- `GET /rooms?userId=:userId` — Fetch verified listings with dynamic match scores
- `GET /rooms/host/:hostId` — Fetch rooms listed by a specific host
- `PUT /rooms/:id` — Edit room details and capacity (with occupied slot validation)

### Digital Rental Agreements (`/agreements`)
- `POST /agreements` — Create or retrieve an agreement between connected parties
- `GET /agreements/roommate` — Retrieve active roommate partner(s) (list for hosts, single for seekers)
- `GET /agreements/:id` — Fetch agreement details, terms, and proposal status
- `POST /agreements/:id/lock` — Acquire turn-based editing lock (2 min TTL)
- `POST /agreements/:id/heartbeat` — Renew active editing lock
- `DELETE /agreements/:id/lock` — Release editing lock
- `POST /agreements/:id/proposals` — Submit terms proposal
- `POST /agreements/:id/accept` — Accept proposal and transition to payment
- `POST /agreements/:id/draft-clause` — AI-assisted clause drafting with safety checks
- `POST /agreements/:id/payment-order` — Create platform fee payment order
- `POST /agreements/verify-payment` — Verify payment signature and atomically activate agreement
- `POST /agreements/webhook` — Razorpay webhook endpoint for async payment confirmation
- `GET /agreements/:id/pdf` — Stream and download cryptographic PDF agreement
- `POST /agreements/:id/terminate` — Terminate agreement and restore room capacity

### User Safety & Reports (`/reports`, `/admin/reports`)
- `POST /reports` — Submit report against another user
- `GET /admin/reports` — Fetch and filter user reports (Admin only)
- `PATCH /admin/reports/:id/review` — Update report status (`reviewed`, `dismissed`, `action_taken`)

### Connections & Interests (`/interests`)
- `POST /interests` — Send interest request
- `PATCH /interests/:id/status` — Accept or decline request
- `DELETE /interests/:id/cancel` — Cancel pending sent interest request
- `POST /interests/:id/unmatch` — Unmatch / sever mutual connection
- `GET /interests/received/:userId` — Fetch received requests
- `GET /interests/sent/:userId` — Fetch sent requests

### In-Person Visits (`/visits`)
- `POST /visits` — Create a visit schedule request
- `GET /visits/user/:userId` — Fetch visits for authenticated user
- `GET /visits/connection/:connectionId` — Fetch visits for a specific connection
- `PATCH /visits/:id/status` — Update visit status (`confirmed`, `cancelled`, `rejected`)
- `PATCH /visits/:id/suggest` — Propose alternative date/slot
- `PATCH /visits/:id/accept-suggestion` — Accept alternative visit time

### Chat & Messaging (`/messages`, `/conversations`)
- `GET /conversations/:userId` — Fetch conversations for user
- `POST /conversations` — Get or create a conversation
- `GET /messages/:conversationId` — Fetch message history
- `POST /messages` — Send a direct message
- `PATCH /messages/:conversationId/read` — Mark conversation as read

### Kuday Wallet & Membership (`/wallet`, `/membership`)
- `GET /wallet/:userId` — Retrieve wallet balance and ledger
- `POST /wallet/topup` — Credit balance via Razorpay
- `GET /membership/plans` — Fetch subscription tiers
- `POST /membership/subscribe` — Purchase or renew subscription

### Admin Management (`/admin`)
- `POST /admin/login` — Admin authentication
- `GET /admin/stats` — Platform KPI metrics
- `GET /admin/revenue` — Financial breakdown and revenue analytics
- `GET /admin/users` — List and filter platform users
- `PATCH /admin/users/:userId/block` — Toggle user block status
- `PATCH /admin/users/:userId/verify-identity` — Review identity documents

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18 or higher
- **MongoDB**: Local instance or MongoDB Atlas URI
- **Cloudinary Account**: For image CDN hosting
- **SMTP Provider**: E.g. Gmail App Password for OTP emails
- **Razorpay Account**: Key ID & Secret for payments
- **Gemini API Key**: For AI clause drafting

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` in `backend/`:
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
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GEMINI_API_KEY=your_gemini_api_key
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

Create `.env` in `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:3000
```

Start the frontend:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
