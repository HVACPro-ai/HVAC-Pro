# Money Agent

Production-ready Next.js (App Router) personal finance app using:

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL
- NextAuth (email magic link via Resend)
- Plaid (Link + transactions sync + webhook)
- Stripe (subscription billing) — $7.99/mo; free admin via `ADMIN_EMAIL`
- Resend (transactional emails)
- Web Push (VAPID)
- Zod + @t3-oss/env-nextjs for env validation
- CSRF + LRU rate limiting

## Getting Started

1. Copy `.env.example` to `.env.local` and fill values.
2. Install deps and generate Prisma client:

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
```

3. Run the app:

```bash
npm run dev
```

### Database
- `DATABASE_URL` should point to Postgres.

### Auth (NextAuth + Resend)
- `NEXTAUTH_SECRET`: a strong random string.
- `NEXTAUTH_URL`: set on Vercel to your production URL.
- `RESEND_API_KEY`, `EMAIL_FROM` for magic links.

### Plaid
- `PLAID_CLIENT_ID`, `PLAID_SECRET`
- `PLAID_ENV`: `sandbox` | `development` | `production`
- `PLAID_PRODUCTS`: default `transactions`
- `PLAID_REDIRECT_URI`: required for OAuth institutions
- `PLAID_WEBHOOK_SECRET`: optional shared secret for webhook
- Webhook route: `/api/plaid/webhook`

### Stripe
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_ID`: price for $7.99/mo
- `STRIPE_WEBHOOK_SECRET`
- Webhook route: `/api/stripe/webhook`

### Web Push
- Generate VAPID keys and set:
  - `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_EMAIL`

### App
- `ENCRYPTION_KEY`: 32+ character key for Plaid token encryption
- `ADMIN_EMAIL`: email that gets free access (optional)

### Public
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_PLAID_LINK_ENV`
- `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`

## Security
- All secure API routes under `/api/secure/*` require auth via middleware.
- Input validated with Zod.
- CSRF token endpoint at `/api/csrf` sets `csrf-token` cookie.
- Simple in-memory rate limiter in `src/server/rateLimit.ts`.

## Deploy to Vercel
- Set all env vars in Vercel project settings.
- Add Postgres (Neon/Supabase/PlanetScale Postgres) and run migrations.
- Add Stripe + Resend + Plaid webhooks to point to your domain.
- Ensure `NEXTAUTH_URL` matches production URL.

## Notes
- Start with Plaid sandbox. Switch to `development`/`production` via env.
- UI is minimal; extend `src/app/app/*` for dashboard.
