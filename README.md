# Zynora Luxe - Enterprise E-Commerce Platform

Zynora Luxe is a high-end luxury e-commerce platform built with Next.js 15, Firebase Auth, Prisma, and Razorpay. It features enterprise-grade security hardening, sliding-window rate limiting, Cloudflare Turnstile bot protection, server-side price verification, and cryptographically verified Razorpay webhooks.

## 🚀 Getting Started

First, install the dependencies:

```bash
npm install
```

To run the development server locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🔒 Security Features Implemented
- **strict Security Headers**: CSP, HSTS, XSS protection, COOP, COEP, CORP via edge middleware.
- **CSRF & Origin Verification**: Restricts state-changing requests to trusted origins.
- **IDOR Check**: Access controls on user endpoints (e.g. `/api/orders/[id]`).
- **Server-Side Verification**: Recalculates cart price totals server-side on place-order to prevent price-spoofing.
- **Payment Signature Check**: Cryptographically verifies Razorpay payment callbacks and webhooks.
- **Upstash Redis Rate-Limiting**: Sliding window rate limiting to mitigate API abuse.
- **Cloudflare Turnstile Bot Defense**: Challenge/response validation on checkout.

---

## 🌐 Vercel Production Deployment & Config

### 1. Database Configuration (SQLite to PostgreSQL)
Next.js serverless functions running on Vercel are stateless, meaning local SQLite file-based databases will be reset between invocations. For production, you must use a hosted PostgreSQL instance (e.g., Neon PostgreSQL).

To migrate your local SQLite data (which currently contains only your clean Admin user account) to Neon PostgreSQL:

1. Create a Neon PostgreSQL project and obtain your pooled and direct database connection strings.
2. In your Vercel Environment Variables (or local `.env` file), configure:
   ```ini
   DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]-pooler.neon.tech/[DB_NAME]?sslmode=require&pgbouncer=true"
   DIRECT_URL="postgresql://[USER]:[PASSWORD]@[HOST].neon.tech/[DB_NAME]?sslmode=require"
   ```
3. Update `prisma/schema.prisma` datasource provider block to target PostgreSQL:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```
4. Run Prisma database initialization:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Import the baseline database dump containing your admin user profile (`krishnadiamond404@gmail.com`):
   ```bash
   node scripts/db_migration.js --import
   ```

### 2. Required Production Environment Variables
Configure the following environment variables in your Vercel Project Settings:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL pooled URL (with `?pgbouncer=true`) |
| `DIRECT_URL` | Neon PostgreSQL direct connection URL |
| `NEXTAUTH_SECRET` | Cryptographic secret for NextAuth session verification |
| `SMTP_EMAIL` | SMTP server sender email (e.g. your Gmail account) |
| `SMTP_PASSWORD` | SMTP app password for sending emails |
| `RAZORPAY_KEY_ID` | Production/Test Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Production/Test Razorpay Key Secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Publicly accessible Razorpay Key ID |
| `RAZORPAY_WEBHOOK_SECRET` | Signature secret configured in Razorpay Webhooks |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account Email for Admin SDK |
| `FIREBASE_PRIVATE_KEY` | Firebase Service Account Private Key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis API token |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile Secret Key |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile Site Key |
| `SANDBOX_API_KEY` | Sandbox.co.in GST validation API Key |
| `SANDBOX_API_SECRET` | Sandbox.co.in GST validation API Secret |
| `SANDBOX_API_VERSION` | Set to `1.0.0` |
| `SANDBOX_API_BASE_URL` | Set to `https://api.sandbox.co.in` |

---

## ↩️ Rollback Plan (Reverting to SQLite)

If the PostgreSQL migration fails or you encounter unexpected issues, you can roll back to the local SQLite configuration by following these steps:

1. **Restore Prisma Schema**:
   Revert the datasource block in `prisma/schema.prisma` back to SQLite:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```
   *(Alternatively, copy `prisma/schema.prisma.backup` back to `prisma/schema.prisma`)*

2. **Restore local database file**:
   Ensure `prisma/dev.db` is active. If needed, restore from local backup:
   ```bash
   copy prisma\dev.db.backup prisma\dev.db
   ```

3. **Regenerate Prisma Client**:
   Run the Prisma generator to rebuild client libraries for SQLite:
   ```bash
   npx prisma generate
   ```

4. **Start Development Server**:
   Restart the development server:
   ```bash
   npm run dev
   ```
   The local application will now safely fall back to the SQLite local database.