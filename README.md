# Sellora API

The backend for **Sellora** — a multi-role marketplace platform (customers, vendors/sellers, and delivery partners) built with **Node.js, Express 5, Prisma 7, and MySQL**. It currently ships a complete **authentication system**: registration (role-aware), email OTP verification, login, and a protected "current user" endpoint.

> This document covers the `sellora-api` backend only. A companion Nuxt frontend lives in `sellora-ui/`.

---

## 1. Tech stack

| Layer       | Choice                                         |
| ----------- | ---------------------------------------------- |
| Runtime     | Node.js (Express 5)                            |
| Database    | MySQL                                          |
| ORM         | Prisma 7 (`@prisma/client`)                    |
| Auth        | JWT (`jsonwebtoken`) + bcrypt password hashing |
| Validation  | Zod                                            |
| Email (OTP) | Nodemailer via Gmail SMTP                      |
| Security    | Helmet, CORS                                   |

---

## 2. What was fixed to make it run

This backend had two blocking bugs that were fixed:

1. **`prisma/schema.prisma` was missing `url = env("DATABASE_URL")`** on the datasource — Prisma cannot connect to any database without it.
2. **`src/lib/prisma.js` pointed at a custom generated-client path** (`generated/prisma`) that nothing in the project actually generates, and depended on `@prisma/adapter-mariadb`, which isn't needed for a standard MySQL setup. It now uses the standard `@prisma/client` output, loaded **lazily** — so the server boots and `/api/health` responds even before you've run `prisma generate` or connected a database; you only get an error the moment a route actually needs the DB, with a clear message telling you what to run.

Everything else (routes, controllers, validators, JWT, mailer, schema) was already sound and is unchanged in behavior.

---

## 3. Requirements

Install these before you start:

- **Node.js** 18+ (tested on 22)
- **npm** 9+
- **MySQL** 8+ (local install, Docker, or a hosted instance like PlanetScale/Railway/RDS)
- A **Gmail account with an App Password** (for sending OTP emails) — create one at https://myaccount.google.com/apppasswords

---

## 4. Installation

```bash
# 1. Enter the backend folder
cd sellora-api

# 2. Install dependencies
#    (this also runs `prisma generate` automatically via the postinstall script)
npm install

# 3. Create your local environment file
cp .env.example .env
```

Now open `.env` and fill in real values (see the table below).

```bash
# 4. Create the database (if it doesn't exist yet)
#    e.g. in the mysql CLI:
#    CREATE DATABASE sellora;

# 5. Apply the schema to your database
npx prisma migrate deploy
#   — or, if you're actively developing and want new migrations generated:
npx prisma migrate dev

# 6. Start the server
npm start          # production
npm run dev         # development, auto-restarts on file changes (nodemon)
```

The API is now running at **http://localhost:4000**. Confirm with:

```bash
curl http://localhost:4000/api/health
# {"status":"ok"}
```

### 4.1 Environment variables (`.env`)

| Variable             | Description                                                        | Example                                        |
| -------------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| `PORT`               | Port the Express server listens on                                 | `4000`                                         |
| `CLIENT_URL`         | Frontend origin allowed by CORS                                    | `http://localhost:3000`                        |
| `DATABASE_URL`       | MySQL connection string                                            | `mysql://root:password@localhost:3306/sellora` |
| `JWT_SECRET`         | Long random string used to sign JWTs — **never commit a real one** | output of `openssl rand -hex 32`               |
| `GMAIL_USER`         | Gmail address used to send OTP emails                              | `youraddress@gmail.com`                        |
| `GMAIL_APP_PASSWORD` | 16-character Gmail **App Password** (not your normal password)     | `abcd efgh ijkl mnop`                          |

### 4.2 Useful npm scripts

| Script                    | What it does                                                |
| ------------------------- | ----------------------------------------------------------- |
| `npm start`               | Start the server (`node index.js`)                          |
| `npm run dev`             | Start with nodemon (auto-restart on save)                   |
| `npm run prisma:generate` | Regenerate the Prisma client after editing the schema       |
| `npm run prisma:migrate`  | Create + apply a new migration (development)                |
| `npm run prisma:deploy`   | Apply existing migrations (production/CI)                   |
| `npm run prisma:studio`   | Open Prisma Studio, a GUI for browsing/editing your DB data |

---

## 5. Project structure

```
sellora-api/
├── index.js                     # entry point — starts the HTTP server
├── prisma/
│   ├── schema.prisma             # database models (User, VendorProfile, DeliveryPartnerProfile)
│   └── migrations/               # SQL migration history
├── prisma.config.ts               # Prisma CLI config (schema path, migrations path)
└── src/
    ├── app.js                    # Express app: middleware + route mounting
    ├── routes/
    │   └── authRoutes.js          # /api/auth/* route definitions
    ├── controllers/
    │   └── authController.js      # request handlers: register, login, OTP, me
    ├── middleware/
    │   └── auth.js                # requireAuth / requireRole JWT guards
    └── lib/
        ├── prisma.js               # Prisma client bootstrap (lazy-loaded)
        ├── jwt.js                  # sign/verify JWT helpers
        ├── mailer.js                # Nodemailer OTP email sender
        └── validators.js            # Zod schemas for request bodies
```

---

## 6. Data model

```
User
 ├─ id, name, email (unique), password (hashed)
 ├─ role: CUSTOMER | VENDOR | SERVICE_PROVIDER | DELIVERY_PARTNER | ADMIN
 ├─ isVerified, otpCode, otpExpiry, otpAttempts
 ├─ 1:1 → VendorProfile            (present when role = VENDOR)
 └─ 1:1 → DeliveryPartnerProfile   (present when role = DELIVERY_PARTNER)
```

Registration is **role-aware**: submitting `role: "VENDOR"` or `role: "DELIVERY_PARTNER"` requires extra fields and creates the matching profile row in the same request; `role: "CUSTOMER"` only needs name/email/password.

---

## 7. API reference

Base URL: `http://localhost:4000`

All request/response bodies are JSON. Protected routes require:

```
Authorization: Bearer <token>
```

### 7.1 Health check

**`GET /api/health`**

```bash
curl http://localhost:4000/api/health
```

```json
{ "status": "ok" }
```

---

### 7.2 Register — `POST /api/auth/register`

Creates an account and emails a 6-digit OTP. The required fields depend on `role`.

**Customer**

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Asha Patel",
    "email": "asha@example.com",
    "password": "secret123",
    "role": "CUSTOMER"
  }'
```

**Vendor**

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raj Traders",
    "email": "raj@example.com",
    "password": "secret123",
    "role": "VENDOR",
    "storeName": "Raj Traders",
    "category": "Groceries",
    "address": "12 MG Road",
    "city": "Surat",
    "pincode": "395007"
  }'
```

**Delivery partner**

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vikram Singh",
    "email": "vikram@example.com",
    "password": "secret123",
    "role": "DELIVERY_PARTNER",
    "vehicleType": "bike",
    "vehicleNumber": "GJ05AB1234",
    "licenseNumber": "DL1234567890",
    "city": "Surat"
  }'
```

**Success — `201 Created`**

```json
{
  "message": "Registered. Check your email for the OTP.",
  "email": "asha@example.com"
}
```

**Errors**
| Status | Cause |
|--------|-------|
| `400` | Validation failed (missing/invalid field) |
| `409` | Email already registered |

---

### 7.3 Verify OTP — `POST /api/auth/verify-otp`

```bash
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{ "email": "asha@example.com", "otp": "483920" }'
```

**Success — `200 OK`**

```json
{
  "message": "Account verified",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Asha Patel",
    "email": "asha@example.com",
    "role": "CUSTOMER"
  }
}
```

**Errors:** `404` account not found · `400` already verified / OTP expired / OTP incorrect / no OTP pending.

---

### 7.4 Resend OTP — `POST /api/auth/resend-otp`

```bash
curl -X POST http://localhost:4000/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{ "email": "asha@example.com" }'
```

```json
{ "message": "New OTP sent" }
```

---

### 7.5 Login — `POST /api/auth/login`

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "asha@example.com", "password": "secret123" }'
```

**Success — `200 OK`**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Asha Patel",
    "email": "asha@example.com",
    "role": "CUSTOMER"
  }
}
```

**Errors:** `401` invalid credentials · `403` account not yet OTP-verified (`needsVerification: true`).

---

### 7.6 Current user — `GET /api/auth/me` 🔒

Requires `Authorization: Bearer <token>` from login/verify-otp.

```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

```json
{
  "user": {
    "id": 1,
    "name": "Asha Patel",
    "email": "asha@example.com",
    "role": "CUSTOMER",
    "isVerified": true,
    "createdAt": "2026-07-15T05:00:00.000Z"
  }
}
```

**Errors:** `401` missing/invalid/expired token.

---

## 8. Auth flow at a glance

```
register ──► (email OTP sent) ──► verify-otp ──► token issued ──► use token on protected routes
                                                        ▲
login (already verified user) ─────────────────────────┘
```

---

## 9. Troubleshooting

- **`Prisma client not generated yet` error at runtime** → run `npx prisma generate`, confirm `DATABASE_URL` is set in `.env`.
- **`P1001: Can't reach database server`** → MySQL isn't running or `DATABASE_URL` is wrong; verify host/port/credentials and that the `sellora` database exists.
- **OTP emails not arriving** → confirm `GMAIL_USER`/`GMAIL_APP_PASSWORD` are a real Gmail **App Password** (not your login password) and that 2-Step Verification is enabled on the Gmail account. Registration still succeeds even if the email fails to send (check server logs), so you can grab the OTP via `npx prisma studio` while developing.
- **CORS errors from the frontend** → make sure `CLIENT_URL` in `.env` matches the exact origin your frontend runs on.

---

## 10. Security notes

- Passwords are hashed with `bcrypt` (10 rounds) — never stored in plain text.
- JWTs are signed with `JWT_SECRET` and expire after 7 days.
- `helmet` sets protective HTTP headers; CORS is locked to `CLIENT_URL`.
- Use a long, random `JWT_SECRET` in production (e.g. `openssl rand -hex 32`) and never commit `.env`.
