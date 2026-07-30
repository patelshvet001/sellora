# OneVerse AI — Project Starting Document (MVP)

**Multi-vendor Marketplace · Local Services · Delivery · AI Automation**

| Field | Detail |
|---|---|
| **Project Name** | OneVerse AI |
| **Prepared for** | Manthan |
| **Version** | 3.0 — All five role modules now scaffolded end-to-end |
| **Status** | Active Development |
| **Repository** | `c:/xampp/htdocs/Project/sellora` |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Platform Modules & User Roles](#2-platform-modules--user-roles)
3. [Technology Stack (Detailed)](#3-technology-stack-detailed)
4. [Complete Database Schema](#4-complete-database-schema)
5. [API Reference](#5-api-reference)
6. [UI Component Inventory](#6-ui-component-inventory)
7. [Authentication & Authorization Flow](#7-authentication--authorization-flow)
8. [AI Stack — Google Gemini API](#8-ai-stack--google-gemini-api)
9. [Project Structure (Actual)](#9-project-structure-actual)
10. [Environment Setup & Configuration](#10-environment-setup--configuration)
11. [Development Kickoff Flow](#11-development-kickoff-flow)
12. [Notification & Location Systems](#12-notification--location-systems)
13. [Security & Compliance](#13-security--compliance)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment Guide](#15-deployment-guide)
16. [Estimated Cost Breakdown](#16-estimated-cost-breakdown)
17. [Next Steps](#17-next-steps)
18. [v3.0 Changelog](#18-v30-changelog)

---

## 1. Project Overview

OneVerse AI is a single **"super app" marketplace** that brings together product commerce, local services, delivery logistics, and AI automation on one platform. It supports **five user roles** — Customer, Vendor, Service Provider, Delivery Partner, and Admin — built on one shared codebase for web and Android.

### 1.1 Current Status

The project now has **working end-to-end flows for every role**:

- ✅ **Backend API** (`sellora-api/`) — Express 5 + Prisma 7 + MySQL, fully functional
- ✅ **Frontend UI** (`sellora-ui/`) — Nuxt 3 + Vue 3 + TypeScript + Tailwind CSS
- ✅ **Database Schema** — 22 tables with full migration history
- ✅ **Authentication System** — Registration, Email OTP, Login, JWT, Password Reset
- ✅ **Role-Based Profiles** — Vendor, Service Provider, Delivery Partner profiles
- ✅ **Product & Service Catalog** — Categories, Products, Services CRUD
- ✅ **Address Management** — Full CRUD with geo-coordinates
- ✅ **Customer Dashboard** — Profile, orders, wishlist, addresses, security
- ✅ **Shop & Book flow** — Product browsing, cart, checkout, service browsing, booking
- ✅ **Orders & Bookings (backend + frontend)** — Full checkout → tracking lifecycle
- ✅ **Vendor Dashboard** — Stats, product management, order fulfillment
- ✅ **Service Provider Dashboard** — Stats, service management, booking management
- ✅ **Delivery Partner Dashboard** — Available orders, accept, mark delivered
- ✅ **Admin Panel** — Platform stats, vendor/provider/delivery approvals, user & order oversight
- ✅ **Email Templates** — OTP verification, password reset, reset confirmation (branded HTML)
- ❌ **AI Automation (Gemini)** — Not yet built (see Section 8 and Phase 8 in the roadmap)

### 1.2 Final Goal

| Goal | Description |
|---|---|
| **Customers** | Buy products and book local services in one app |
| **Vendors** | Sell physical products through their own storefront |
| **Service Providers** | Accept and manage service bookings |
| **Delivery Partners** | Handle logistics and real-time tracking |
| **AI Automation** | Automates verification, moderation, routing, support, and fraud detection |
| **Admins** | Oversee the platform and step in only when needed |

### 1.3 Key Design Principles

| Principle | Implementation |
|---|---|
| **Single Codebase** | Nuxt 3 + Capacitor for Web + Android |
| **Role-Based Architecture** | 5 user roles with granular permissions via middleware |
| **Zero-Cost MVP** | Free-tier technologies with clear paid upgrade path |
| **Type Safety** | TypeScript throughout, Zod validation on all API inputs |
| **Consistent API Shape** | `{ success, data?, error? }` response format |
| **Migrations-First DB** | All schema changes via `prisma migrate dev` |
| **Lazy-Loaded DB Client** | Prisma client boots only on first DB access |
| **Prices re-validated server-side** | Checkout never trusts client-submitted totals — always recomputed from the DB |

---

## 2. Platform Modules & User Roles

### 2.1 User Types & Core Features

| User Type | Core Features | Database Table | API Prefix |
|---|---|---|---|
| **Customer** | Registration, login, shop, book services, cart, checkout, orders, bookings, wallet, notifications, reviews | `users` (role: `CUSTOMER`) | `/api/orders`, `/api/bookings` |
| **Vendor** | Registration, store profile, products, orders, stats/earnings | `vendor_profiles` | `/api/vendor/*`, `/api/products` |
| **Service Provider** | Registration, service listings, bookings, stats/earnings | `service_provider_profiles` | `/api/provider/*`, `/api/services` |
| **Delivery Partner** | Registration, accept/track deliveries | `delivery_partner_profiles` | `/api/delivery/*` |
| **Admin** | Dashboard, approvals, user/order oversight | `users` (role: `ADMIN`) | `/api/admin/*` |

### 2.2 Module Inventory (Updated)

| Module | Status | Files |
|---|---|---|
| **Authentication** | ✅ Complete | `authController.js`, `authRoutes.js`, `auth.ts` (store), `middleware/auth.js` |
| **User Profiles** | ✅ Complete | `profileController.js`, `userRoutes.js`, `ProfileInfoForm.vue`, `ProfileAvatar.vue` |
| **Address Management** | ✅ Complete | `addressController.js`, `addressRoutes.js`, `AddressManager.vue`, `address.ts` (store) |
| **Product Catalog** | ✅ Complete | `catalogController.js`, `catalogRoutes.js`, `pages/shop/index.vue` |
| **Service Catalog** | ✅ Complete | `catalogController.js`, `providerController.js`, `pages/services/index.vue` |
| **Cart** | ✅ Complete | `cart.ts` (Pinia store), `pages/cart.vue`, localStorage persistence |
| **Checkout** | ✅ Complete | `orderController.js`, `orders.ts` (store), `pages/checkout.vue` |
| **Orders (customer)** | ✅ Complete | `pages/orders/index.vue`, `pages/orders/[id].vue` (live tracker) |
| **Bookings (customer)** | ✅ Complete | `bookingController.js`, `bookings.ts`, `pages/bookings/index.vue`, booking modal in `services/index.vue` |
| **Customer Dashboard** | ✅ Complete | `DashboardSidebar.vue`, `DashboardOverview.vue`, `DashboardOrders.vue`, `DashboardWishlist.vue` |
| **Vendor Dashboard** | ✅ Complete | `vendorController.js`, `vendor.ts`, `pages/vendor/dashboard`, `/products`, `/orders` |
| **Service Provider Dashboard** | ✅ Complete | `providerController.js`, `provider.ts`, `pages/provider/dashboard`, `/services`, `/bookings` |
| **Delivery Dashboard** | ✅ Complete | `orderController.js` (delivery endpoints), `delivery.ts`, `pages/delivery/dashboard`, `/orders` |
| **Admin Panel** | ✅ Complete | `adminController.js`, `admin.ts`, `pages/admin/dashboard`, `/vendors`, `/providers`, `/delivery-partners`, `/users`, `/orders` |
| **Orders (backend)** | ✅ Complete | `orderController.js`, `orderRoutes.js` — checkout, tracking, status updates, delivery assignment |
| **Bookings (backend)** | ✅ Complete | `bookingController.js`, `bookingRoutes.js` — create, list, status updates |
| **Payments** | ✅ Schema + auto-created on checkout | `payments` table — COD/UPI recorded as `PENDING`; gateway integration still MVP-manual |
| **Wallet** | ✅ Schema only | `wallets`, `wallet_transactions` tables exist; no UI/API yet |
| **Notifications** | ✅ Backend wired | In-app notification rows created on order/booking events; no notification inbox UI yet |
| **Reviews** | ✅ Schema only | `reviews` table exists; no submission UI yet |
| **AI Automation** | ❌ Not built | Planned (Gemini API) — see Section 8 |

---

## 3. Technology Stack (Detailed)

### 3.1 Core Stack

| Layer | Technology | Version | Cost | Purpose |
|---|---|---|---|---|
| **Frontend** | Nuxt 3 + Vue 3 + TypeScript | Latest | Free | Web application framework |
| **Mobile** | Capacitor (same codebase) | Latest | Free | Android app wrapper |
| **UI Framework** | Tailwind CSS | Latest | Free | Utility-first styling |
| **UI Components** | shadcn/ui (custom Vue) | — | Free | Reusable component library |
| **Backend** | Express 5 | ^5.2.1 | Free | REST API framework |
| **Database** | MySQL 8+ | 8.x | Free | Relational database |
| **ORM** | Prisma 7 | ^6.19.3 | Free | Database access & migrations |
| **Runtime** | Node.js 18+ | 22 (tested) | Free | JavaScript runtime |

### 3.2 Authentication & Security Stack

| Library | Version | Purpose |
|---|---|---|
| `jsonwebtoken` | ^9.0.3 | JWT token signing & verification |
| `bcrypt` | ^6.0.0 | Password hashing (10 rounds) |
| `zod` | ^4.4.3 | Request/response validation |
| `helmet` | ^8.2.0 | HTTP security headers |
| `cors` | ^2.8.6 | Cross-origin resource sharing |
| `express-rate-limit` | ^8.6.0 | Rate limiting on auth endpoints |

### 3.3–3.7

*(Unchanged from v2.0 — file upload, email, frontend libraries, and planned production stack. See Section 10 and the companion `OneVerse_Required_Services.md` doc for current free-tier provider recommendations, including a correction that PlanetScale's MySQL free tier no longer exists.)*

---

## 4. Complete Database Schema

Unchanged from v2.0 — 22 tables, 7 enums, all relations already in place and now actively used by the new order/booking/vendor/provider/delivery/admin endpoints. See the full table-by-table reference in the original schema section (`users`, `vendor_profiles`, `service_provider_profiles`, `delivery_partner_profiles`, `product_categories`, `products`, `services`, `addresses`, `orders`, `order_items`, `bookings`, `payments`, `wallets`, `wallet_transactions`, `notifications`, `reviews`, `reports`, `support_tickets`, `coupons`, `banners`, `settings`, `audit_logs`).

No schema changes were needed to build the new modules — the original migration already covered everything.

---

## 5. API Reference

### 5.1 Base URL

```
Development: http://localhost:4000/api
Production:  https://api.domain.com/api
```

### 5.2–5.3

Response format and auth headers unchanged from v2.0.

### 5.4 Complete Endpoint Map (Updated)

#### Authentication — `/api/auth/*`
Unchanged from v2.0 (register, verify-otp, resend-otp, login, forgot-password, reset-password, me).

#### User & Address — `/api/users/*`, `/api/addresses/*`
Unchanged from v2.0.

#### Catalog — `/api/categories`, `/api/products`, `/api/services`
Unchanged from v2.0.

#### Orders — `/api/orders/*` *(new)*

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/api/orders` | ✅ | CUSTOMER | Checkout — validates stock & prices server-side, creates order + payment record, decrements stock |
| `GET` | `/api/orders/mine` | ✅ | CUSTOMER | List own order history |
| `GET` | `/api/orders/:id` | ✅ | Owner / Vendor-on-order / Assigned delivery / Admin | Order detail + live status |
| `PATCH` | `/api/orders/:id/status` | ✅ | VENDOR / DELIVERY_PARTNER / ADMIN | Advance order status, notifies the customer |

#### Bookings — `/api/bookings/*` *(new)*

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/api/bookings` | ✅ | CUSTOMER | Book a service for a future date/time |
| `GET` | `/api/bookings/mine` | ✅ | CUSTOMER | List own bookings |
| `PATCH` | `/api/bookings/:id/status` | ✅ | SERVICE_PROVIDER / ADMIN | Accept / reject / progress / complete a booking |

#### Vendor Dashboard — `/api/vendor/*` *(new)*

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/vendor/stats` | ✅ | VENDOR | Dashboard summary — products, low stock, pending orders, earnings |
| `GET` | `/api/vendor/orders` | ✅ | VENDOR | Orders containing this vendor's products (scoped to their own line items) |
| `GET` | `/api/vendor/products` | ✅ | VENDOR | Own product catalog (existing endpoint, unchanged) |

#### Service Provider Dashboard — `/api/provider/*` *(new)*

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/provider/stats` | ✅ | SERVICE_PROVIDER | Dashboard summary — services, pending/completed bookings, earnings |
| `GET` | `/api/provider/services` | ✅ | SERVICE_PROVIDER | Own service catalog, including hidden/inactive |
| `PATCH` | `/api/provider/services/:id` | ✅ | SERVICE_PROVIDER | Edit a service (including hide/show via `isActive`) |
| `DELETE` | `/api/provider/services/:id` | ✅ | SERVICE_PROVIDER | Delete a service |
| `GET` | `/api/provider/bookings` | ✅ | SERVICE_PROVIDER | Bookings for this provider's services |

#### Delivery — `/api/delivery/*` *(new)*

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/delivery/orders/available` | ✅ | DELIVERY_PARTNER | Unassigned orders ready for pickup |
| `GET` | `/api/delivery/orders/mine` | ✅ | DELIVERY_PARTNER | Orders assigned to this partner |
| `POST` | `/api/delivery/orders/:id/accept` | ✅ | DELIVERY_PARTNER | Claim an available order (requires approved profile) |

#### Admin — `/api/admin/*` *(new)*

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/admin/stats` | ✅ | ADMIN | Platform-wide overview (users, vendors, providers, delivery, orders, GMV) |
| `GET` | `/api/admin/users?role=` | ✅ | ADMIN | List users, optionally filtered by role |
| `PATCH` | `/api/admin/users/:id/status` | ✅ | ADMIN | Activate/deactivate an account |
| `GET` | `/api/admin/vendors` | ✅ | ADMIN | List all vendors |
| `PATCH` | `/api/admin/vendors/:id/approve` | ✅ | ADMIN | Approve/revoke a vendor |
| `GET` | `/api/admin/providers` | ✅ | ADMIN | List all service providers |
| `PATCH` | `/api/admin/providers/:id/approve` | ✅ | ADMIN | Approve/revoke a provider |
| `GET` | `/api/admin/delivery-partners` | ✅ | ADMIN | List all delivery partners |
| `PATCH` | `/api/admin/delivery-partners/:id/approve` | ✅ | ADMIN | Approve/revoke a delivery partner |
| `GET` | `/api/admin/orders` | ✅ | ADMIN | All orders on the platform (latest 200) |

#### Health
Unchanged — `GET /api/health`.

---

## 6. UI Component Inventory

### 6.1 Page Tree (Updated)

```
sellora-ui/app/pages/
├── index.vue                          # Landing page (coming soon / launch page)
├── shop/index.vue                     # Browse products, add to cart          [NEW]
├── services/index.vue                 # Browse services, booking modal        [NEW]
├── cart.vue                           # Cart review                          [NEW]
├── checkout.vue                       # Address + payment + place order      [NEW]
├── orders/
│   ├── index.vue                      # My orders list                       [NEW]
│   └── [id].vue                       # Order detail + live status tracker   [NEW]
├── bookings/index.vue                 # My bookings list                     [NEW]
├── (customer)/
│   └── dashboard/index.vue            # Customer dashboard hub
├── vendor/                                                                    [NEW]
│   ├── dashboard/index.vue            # Stats overview + approval banner
│   ├── products/index.vue             # Product CRUD (modal form)
│   └── orders/index.vue               # Order fulfillment, advance status
├── provider/                                                                  [NEW]
│   ├── dashboard/index.vue            # Stats overview + approval banner
│   ├── services/index.vue             # Service CRUD (modal form)
│   └── bookings/index.vue             # Accept / reject / progress bookings
├── delivery/                                                                  [NEW]
│   ├── dashboard/index.vue            # Available orders, accept
│   └── orders/index.vue               # My deliveries, mark delivered
├── admin/                                                                     [NEW]
│   ├── dashboard/index.vue            # Platform stats + pending-approval banner
│   ├── vendors/index.vue              # Approve/revoke vendors
│   ├── providers/index.vue            # Approve/revoke service providers
│   ├── delivery-partners/index.vue    # Approve/revoke delivery partners
│   ├── users/index.vue                # Activate/deactivate customers
│   └── orders/index.vue               # Platform-wide order list
├── auth/
│   ├── index.vue
│   ├── login.vue
│   ├── register.vue
│   ├── partner-register.vue
│   ├── verify-otp.vue
│   ├── forgot-password.vue
│   └── reset-password.vue
```

### 6.2 Component Tree (Updated)

```
components/
├── dashboard/
│   ├── DashboardSidebar.vue            # Customer dashboard nav (unchanged)
│   ├── RoleSidebar.vue                 # Shared nav shell for Vendor/Provider/Delivery/Admin [NEW]
│   ├── DashboardOverview.vue
│   ├── DashboardOrders.vue
│   └── DashboardWishlist.vue
├── profile/  ...                       # Unchanged
├── site/
│   ├── NewHeaderBar.vue                # Updated: Shop/Services links, role-aware Dashboard link, cart → /cart
│   └── NewFooterBar.vue
└── ui/
    ├── Badge.vue
    ├── Button.vue
    └── Card.vue
```

### 6.3 Pinia Stores (Updated)

| Store | File | Purpose |
|---|---|---|
| **auth** | `stores/auth.ts` | Unchanged — includes `dashboardPath()` which now correctly routes every role to its new dashboard |
| **cart** | `stores/cart.ts` | Unchanged |
| **address** | `stores/address.ts` | Unchanged |
| **orders** | `stores/orders.ts` | *(new)* Checkout, order history, single-order polling for tracking |
| **bookings** | `stores/bookings.ts` | *(new)* Create booking, list own bookings |
| **vendor** | `stores/vendor.ts` | *(new)* Stats, product CRUD, order fulfillment |
| **provider** | `stores/provider.ts` | *(new)* Stats, service CRUD, booking management |
| **delivery** | `stores/delivery.ts` | *(new)* Available/assigned orders, accept, status updates |
| **admin** | `stores/admin.ts` | *(new)* Platform stats, approvals, user/order oversight |

### 6.4–6.6

Middleware, composables, and design tokens unchanged from v2.0. `RoleSidebar.vue` reuses the same teal/emerald tokens and mobile-collapse behavior as the original `DashboardSidebar.vue`.

---

## 7–10

Sections 7 (Auth Flow), 8 (AI Stack — still not built), 9 (original Project Structure diagram), and 10 (Environment Setup) are unchanged from v2.0. See the companion `OneVerse_Required_Services.md` for a corrected, current list of free-tier providers for SMTP, database hosting, and the Gemini/Firebase/Maps integrations still pending in Phase 8.

---

## 11. Development Kickoff Flow (Updated)

### Phase 1 — Foundation ✅
### Phase 2 — Authentication ✅
### Phase 3 — Customer Module ✅ (now complete, not partial — shop, cart, checkout, orders, bookings all shipped)

### Phase 4 — Vendor Module ✅ (Complete)

| Task | Status |
|---|---|
| Vendor dashboard (stats) | ✅ |
| Product management UI | ✅ |
| Order management | ✅ |
| Inventory management | 🟡 Basic (stock field editable; no low-stock alert emails yet) |
| Earnings & analytics charts | 🟡 Numbers shown; no Chart.js visualizations yet |
| Store settings page | ❌ Still to build |

### Phase 5 — Service Provider Module ✅ (Complete)

| Task | Status |
|---|---|
| Service provider dashboard | ✅ |
| Service management UI | ✅ |
| Booking management | ✅ |
| Availability calendar | ❌ Still to build (bookings currently first-come-first-served by date/time typed at booking) |
| Earnings & review response | 🟡 Earnings shown; review reply UI not built |

### Phase 6 — Delivery Module ✅ (Complete for MVP)

| Task | Status |
|---|---|
| Delivery dashboard (available orders) | ✅ |
| Order assignment (accept) | ✅ |
| Mark delivered | ✅ |
| Navigation integration (Leaflet) | ❌ Still to build |
| Live GPS tracking (Socket.IO) | ❌ Still to build |
| Earnings & wallet UI | ❌ Still to build |

### Phase 7 — Admin Panel ✅ (Complete for MVP)

| Task | Status |
|---|---|
| Admin dashboard (platform stats) | ✅ |
| Vendor / provider / delivery approvals | ✅ |
| User management (activate/deactivate) | ✅ |
| Order monitoring | ✅ |
| Reports & analytics charts | 🟡 Raw stats shown; no Chart.js dashboards yet |
| Platform settings, banners, coupons CRUD | ❌ Still to build (schema exists) |
| AI monitoring panel | ❌ Depends on Phase 8 |

### Phase 8 — AI Automation (Gemini) ❌ Not built

Unchanged from v2.0 — this is now the single largest remaining gap. See Section 8.

---

## 12–16

Notification/location systems, security, testing, deployment, and cost breakdown are unchanged from v2.0. One correction: Section 15/16 referenced PlanetScale's free MySQL tier, which no longer exists — see `OneVerse_Required_Services.md` for the current recommendation (TiDB Cloud Starter).

---

## 17. Next Steps

### 17.1 Immediate Actions

- [ ] Run `npx prisma migrate deploy` and `npm run seed` against a real MySQL instance, then smoke-test the full loop: register (each role) → approve vendor/provider/delivery in admin → shop → checkout → vendor fulfills → delivery accepts & delivers → customer sees `DELIVERED`
- [ ] Wire real SMTP credentials so OTP/reset emails send (see `OneVerse_Required_Services.md`)
- [ ] Decide on a real payment gateway path (Razorpay) before charging real customers — COD/UPI-manual is MVP-only

### 17.2 Development Priorities (Updated)

1. **AI Automation (Gemini)** — the one major module with zero code so far
2. **Real-time order/delivery tracking** — Socket.IO + Leaflet map on the order tracking page
3. **Notification inbox UI** — the backend already writes rows to `notifications`; needs a bell icon + list
4. **Reviews** — submission UI for delivered orders / completed bookings
5. **Coupons, banners, platform settings admin CRUD** — schema exists, no UI yet
6. **Charts** — Chart.js on vendor/provider/admin dashboards instead of raw numbers
7. **Wallet UI** — schema exists; no balance/top-up/payout screens yet

### 17.3 Review Schedule

- **Weekly Progress Review** against the Recommended Build Order
- **Sprint Planning** every 2 weeks
- **MVP Launch Milestone** target: TBD

---

## 18. v3.0 Changelog

Everything below was added in this pass, on top of the v2.0 foundation (auth + customer profile/address/catalog browsing), with no changes to the Prisma schema:

**Backend (`sellora-api/`):**
- `controllers/orderController.js` + `routes/orderRoutes.js` — checkout, order history/detail, status updates, delivery accept/available/mine
- `controllers/bookingController.js` + `routes/bookingRoutes.js` — create booking, history, status updates
- `controllers/vendorController.js` + `routes/vendorDashboardRoutes.js` — vendor stats
- `controllers/providerController.js` + `routes/providerDashboardRoutes.js` — provider stats + full service CRUD
- `controllers/adminController.js` + `routes/adminRoutes.js` — platform stats, approvals, user/order oversight
- `app.js` updated to mount all five new route modules

**Frontend (`sellora-ui/`):**
- New pages: `/shop`, `/services`, `/cart`, `/checkout`, `/orders`, `/orders/[id]`, `/bookings`
- New role dashboards: `/vendor/*` (3 pages), `/provider/*` (3 pages), `/delivery/*` (2 pages), `/admin/*` (6 pages)
- New shared component: `components/dashboard/RoleSidebar.vue`
- New Pinia stores: `orders.ts`, `bookings.ts`, `vendor.ts`, `provider.ts`, `delivery.ts`, `admin.ts`
- `NewHeaderBar.vue` updated: Shop/Services nav links, cart button routes to `/cart`, user dropdown now routes to the correct role dashboard via `authStore.dashboardPath()` instead of a hardcoded `/dashboard` link, and gained My Orders / My Bookings links for customers

**Verified working:** `npm run build` (Nuxt) completes clean across every new page and store; the Express app boots and registers all new routes without error.

**Not touched:** AI Automation (Phase 8), Socket.IO real-time tracking, notification inbox UI, reviews UI, coupons/banners/settings admin CRUD, wallet UI, Chart.js visualizations. These are the accurate remaining gaps — see Section 17.2.

---

*This document consolidates the finalized architecture, technology choices, database schema, API reference, UI inventory, and phased roadmap for OneVerse AI. Version 3.0 reflects the actual codebase after all five role modules (Customer, Vendor, Service Provider, Delivery Partner, Admin) received working end-to-end flows.*
