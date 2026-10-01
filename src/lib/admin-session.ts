import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.ADMIN_SESSION_SECRET || process.env.CMS_API_KEY || "stackyup_admin_secret_key_2026";
const COOKIE_NAME = "sy_admin_session";

export interface SessionData {
  email: string;
  iat: number;
  exp: number;
}

export function signToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyToken<T>(token: string): T | null {
  if (!token || !token.includes(".")) return null;
  const [data, signature] = token.split(".");
  const expectedSignature = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

  if (signature !== expectedSignature) return null;

  try {
    const json = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (json.exp && Date.now() > json.exp) {
      return null; // Expired
    }
    return json as T;
  } catch {
    return null;
  }
}

export async function getCurrentAdmin(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifyToken<SessionData>(sessionCookie.value);
}

export async function createAdminSession(email: string): Promise<string> {
  const now = Date.now();
  const token = signToken({
    email,
    iat: now,
    exp: now + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return token;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
