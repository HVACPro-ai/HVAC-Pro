import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(16),
    NEXTAUTH_URL: z.string().url().optional(),

    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().email(),

    PLAID_CLIENT_ID: z.string().min(1),
    PLAID_SECRET: z.string().min(1),
    PLAID_ENV: z.enum(["sandbox", "development", "production"]).default("sandbox"),
    PLAID_PRODUCTS: z.string().default("transactions"),
    PLAID_REDIRECT_URI: z.string().url().optional(),
    PLAID_WEBHOOK_SECRET: z.string().optional(),

    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_PRICE_ID: z.string().min(1),
    STRIPE_PUBLISHABLE_KEY: z.string().min(1),

    WEB_PUSH_PUBLIC_KEY: z.string().min(1),
    WEB_PUSH_PRIVATE_KEY: z.string().min(1),
    WEB_PUSH_EMAIL: z.string().email(),

    ENCRYPTION_KEY: z.string().min(32),
    ADMIN_EMAIL: z.string().email().optional(),

    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  },
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().default("Money Agent"),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_PLAID_LINK_ENV: z.enum(["sandbox", "development", "production"]).default("sandbox"),
    NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,

    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,

    PLAID_CLIENT_ID: process.env.PLAID_CLIENT_ID,
    PLAID_SECRET: process.env.PLAID_SECRET,
    PLAID_ENV: process.env.PLAID_ENV,
    PLAID_PRODUCTS: process.env.PLAID_PRODUCTS,
    PLAID_REDIRECT_URI: process.env.PLAID_REDIRECT_URI,
    PLAID_WEBHOOK_SECRET: process.env.PLAID_WEBHOOK_SECRET,

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,

    WEB_PUSH_PUBLIC_KEY: process.env.WEB_PUSH_PUBLIC_KEY,
    WEB_PUSH_PRIVATE_KEY: process.env.WEB_PUSH_PRIVATE_KEY,
    WEB_PUSH_EMAIL: process.env.WEB_PUSH_EMAIL,

    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,

    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,

    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_PLAID_LINK_ENV: process.env.NEXT_PUBLIC_PLAID_LINK_ENV,
    NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
  },
});
