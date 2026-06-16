import { cookies } from "next/headers";
import prisma from "./prisma";

const SECRET = process.env.COOKIE_SECRET_CURRENT || "zynora-dev-secret-key-change-in-production";

function verifyPayload(signed: string): string | null {
  try {
    const crypto = require("crypto");
    const lastDot = signed.lastIndexOf(".");
    if (lastDot === -1) return null;
    
    const data = signed.substring(0, lastDot);
    const sig = signed.substring(lastDot + 1);
    
    const expected = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
    if (sig !== expected) return null;
    
    return data;
  } catch (err) {
    return null;
  }
}

// Drop-in replacement for NextAuth's getServerSession.
// Reads the signed session cookie, verifies the HMAC signature,
// checks expiration, and returns the user data (including role from Prisma DB).
export async function getServerSession(options?: any) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify HMAC signature
    const rawData = verifyPayload(sessionCookie);
    if (!rawData) {
      return null;
    }

    // Decode the base64url payload
    const userData = JSON.parse(Buffer.from(rawData, "base64url").toString("utf-8"));

    if (!userData || !userData.email) {
      return null;
    }

    // Enforce cryptographic expiration check
    if (userData.exp && Date.now() >= userData.exp) {
      return null; // Session expired
    }

    // Re-fetch from cached Prisma singleton for fresh role and account status
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!user) return null;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Error reading session cookie:", error);
    return null;
  }
}
