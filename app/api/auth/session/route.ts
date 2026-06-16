import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Base64url decode helper for unverified fallback in development
function decodeFirebaseToken(idToken: string) {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    return payload;
  } catch {
    return null;
  }
}

// Simple signing for our session cookie using HMAC
const SECRET = process.env.COOKIE_SECRET_CURRENT || "zynora-dev-secret-key-change-in-production";

function signPayload(data: string): string {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
  return `${data}.${hmac}`;
}

export async function POST(request: Request) {
  try {
    // 1. IP-Based Rate Limiting Check
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
               request.headers.get("x-real-ip") ||
               "127.0.0.1";

    if (!(await checkRateLimit(`session:${ip}`, 30, 60 * 1000))) {
      logger.security("Rate limit violation: Session API spamming", request);
      return NextResponse.json({ error: "Too many requests. Please try again after some time." }, { status: 429 });
    }

    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 401 });
    }

    let decoded: any = null;
    const isDev = process.env.NODE_ENV === "development";
    const firebaseConfigured = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;

    // 2. Strict ID Token signature verification
    if (firebaseConfigured) {
      try {
        const auth = getAdminAuth();
        if (!auth) {
          throw new Error("Firebase admin auth failed to initialize.");
        }
        decoded = await auth.verifyIdToken(idToken, true); // true checks if revoked
      } catch (err: any) {
        logger.security(`Failed ID token verification: ${err.message}`, request);
        return NextResponse.json({ error: "Invalid token signature or expired/revoked." }, { status: 401 });
      }
    } else if (isDev) {
      // Safe fallback in local development mode only if Firebase config is absent
      logger.warn("Running in unverified token sync mode because Firebase Admin credentials are not set.");
      decoded = decodeFirebaseToken(idToken);
    } else {
      logger.error("Firebase Admin SDK is unconfigured in production environment.");
      return NextResponse.json({ error: "Authentication system configuration error." }, { status: 500 });
    }

    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Invalid token payload." }, { status: 401 });
    }

    const userEmail = decoded.email;
    const userName = decoded.name || decoded.email.split("@")[0] || "User";

    // 3. Synchronize user details in database
    let dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    const targetAdminEmail = "krishnadiamond404@gmail.com";
    const isAdminEmail = userEmail.toLowerCase() === targetAdminEmail.toLowerCase();

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          role: isAdminEmail ? "ADMIN" : "USER",
        },
      });
    } else if (isAdminEmail && dbUser.role !== "ADMIN") {
      dbUser = await prisma.user.update({
        where: { email: userEmail },
        data: { role: "ADMIN" },
      });
    }

    // 4. Session cookie generation (5 days expiry, SameSite=Strict, HTTPOnly)
    const expiryTime = Date.now() + 1000 * 60 * 60 * 24 * 5;
    const sessionData = JSON.stringify({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      exp: expiryTime,
    });

    // Sign payload to prevent tampering
    const signedSession = signPayload(
      Buffer.from(sessionData).toString("base64url")
    );

    const cookieStore = await cookies();
    cookieStore.set("session", signedSession, {
      maxAge: 60 * 60 * 24 * 5,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });

    logger.info(`Session successfully established for: ${dbUser.email}`);
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    logger.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  logger.info("Session successfully cleared/logged out.");
  return NextResponse.json({ status: "success" }, { status: 200 });
}
