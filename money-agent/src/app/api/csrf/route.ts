import { cookies } from "next/headers";
import { generateCsrfToken, getCsrfCookieName } from "@/lib/csrf";

export async function GET() {
  const token = generateCsrfToken();
  (await cookies()).set(getCsrfCookieName(), token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return Response.json({ ok: true });
}
