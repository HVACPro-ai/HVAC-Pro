import crypto from "crypto";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error("Missing NEXTAUTH_SECRET/ENCRYPTION_KEY for CSRF");
  return secret;
}

export function generateCsrfToken(): string {
  const random = crypto.randomBytes(32).toString("hex");
  const hmac = crypto.createHmac("sha256", getSecret()).update(random).digest("hex");
  return `${random}.${hmac}`;
}

export function verifyCsrfToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const [random, sig] = token.split(".");
  if (!random || !sig) return false;
  const expected = crypto.createHmac("sha256", getSecret()).update(random).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function getCsrfCookieName() {
  return CSRF_COOKIE_NAME;
}

export function getCsrfHeaderName() {
  return CSRF_HEADER_NAME;
}
