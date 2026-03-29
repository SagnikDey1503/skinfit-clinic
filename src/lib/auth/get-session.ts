import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/src/lib/auth/constants";
import { verifySessionToken } from "@/src/lib/auth/session";

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return null;
  try {
    const { sub } = await verifySessionToken(token, secret);
    return sub || null;
  } catch {
    return null;
  }
}
