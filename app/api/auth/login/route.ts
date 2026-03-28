import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { SESSION_COOKIE_NAME } from "@/src/lib/auth/constants";
import { createSessionToken } from "@/src/lib/auth/session";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "Invalid request." },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!email) {
    return NextResponse.json(
      { error: "EMAIL_REQUIRED", message: "Please enter your email." },
      { status: 400 }
    );
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      {
        error: "INVALID_EMAIL",
        message: "Please enter a valid email address.",
      },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      {
        error: "USER_NOT_FOUND",
        message: "We couldn't find an account with that email.",
      },
      { status: 401 }
    );
  }

  if (user.role !== "patient") {
    return NextResponse.json(
      {
        error: "NOT_PATIENT",
        message: "This portal is for patients only.",
      },
      { status: 403 }
    );
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    console.error("SESSION_SECRET must be set and at least 32 characters.");
    return NextResponse.json(
      {
        error: "SERVER_MISCONFIGURED",
        message: "Server configuration error.",
      },
      { status: 500 }
    );
  }

  const token = await createSessionToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    secret
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
