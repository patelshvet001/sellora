# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

<!-- New -->

# Sellora Auth Starter — OTP Registration & Login

Drop the `sellora-api` folder contents into your existing `sellora-api`, and
the `sellora-ui` folder contents into your existing `sellora-ui`.

## Pages created

- `/auth/register` — Customer sign-up (simple form)
- `/auth/partner-register` — Seller / Delivery Partner sign-up on ONE page,
  with an animated toggle that swaps the form fields
- `/auth/verify-otp` — 6-digit OTP entry with resend cooldown
- `/auth/login` — shared login for all roles, redirects to the right dashboard

## 1. Backend setup (`sellora-api`)

```bash
cd sellora-api
npm install express cors helmet dotenv jsonwebtoken bcrypt zod nodemailer
npm install prisma --save-dev
npm install @prisma/client
```

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` — your local MySQL connection string
- `JWT_SECRET` — any long random string
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — create an App Password at
  https://myaccount.google.com/apppasswords (needs 2-Step Verification
  enabled on the Gmail account first)

Run the migration:

```bash
npx prisma migrate dev --name init
```

Start the server:

```bash
node index.js
# → Sellora API running on http://localhost:4000
```

## 2. Frontend setup (`sellora-ui`)

```bash
cd sellora-ui
npm install pinia @pinia/nuxt
npm install -D @nuxtjs/tailwindcss
```

Make sure `nuxt.config.ts` includes:

```ts
export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:4000/api",
    },
  },
});
```

Copy `.env.example` to `.env` (already points at port 4000).

Start the app:

```bash
npm run dev
```

## Flow to test

1. Go to `/auth/partner-register`, toggle between Seller / Delivery Partner,
   fill the form, submit.
2. Check the Gmail inbox for the OTP (also logs to the API console if email
   fails, so you're not blocked while testing SMTP).
3. Enter the OTP on `/auth/verify-otp` — you're logged in and redirected to
   the correct dashboard route (`/vendor/dashboard`, `/delivery/dashboard`,
   etc. — build those pages next).
4. Try `/auth/login` with the same credentials.

## What's intentionally left for you

- The actual dashboard pages (`/vendor/dashboard`, `/delivery/dashboard`,
  `/home`) — they're just redirect targets right now, build them
  as the next phase.
- Admin approval flow for `VendorProfile.isApproved` /
  `DeliveryPartnerProfile.isApproved` — right now accounts can log in as
  soon as they verify OTP, even if not yet approved by an admin. Add a
  check in `login()` if you want approval to gate access.
- Route middleware to protect pages by role (a `middleware/auth.ts` that
  redirects unauthenticated users, and checks `role` against the page).
