import { NextRequest, NextResponse } from "next/server";

// 1. Helper to redirect unauthorized requests to login
function redirectToLogin(req: NextRequest, redirectPath: string, withCheckoutMessage = false) {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", redirectPath);
  if (withCheckoutMessage) {
    loginUrl.searchParams.set("message", "checkout_required");
  }
  return NextResponse.redirect(loginUrl);
}

// 2. Cryptographic signature check at Next.js Edge runtime (using Web Crypto)
async function verifyHmacEdge(signed: string, secret: string): Promise<string | null> {
  try {
    const lastDot = signed.lastIndexOf(".");
    if (lastDot === -1) return null;
    
    const data = signed.substring(0, lastDot);
    const sig = signed.substring(lastDot + 1);

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    // Convert hex signature back to bytes
    const sigBytes = new Uint8Array(
      (sig.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16))
    );
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(data)
    );

    return isValid ? data : null;
  } catch (err) {
    return null;
  }
}

// Base64url helper for Edge
function base64urlDecode(str: string): string {
  // Add padding if needed
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const redirectPath = `${pathname}${req.nextUrl.search || ""}`;
  const method = req.method;

  // ── CSRF PROTECTION (Origin & Referer Validation on State-Changing API Requests) ──
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && pathname.startsWith("/api")) {
    // Exclude Razorpay webhook since it is verified cryptographically by its own signature
    if (pathname !== "/api/razorpay/webhook") {
      const origin = req.headers.get("origin");
      const referer = req.headers.get("referer");
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";

      let isAllowed = false;

      if (origin) {
        const originUrl = new URL(origin);
        if (originUrl.host.toLowerCase() === host.toLowerCase()) {
          isAllowed = true;
        }
      } else if (referer) {
        const refererUrl = new URL(referer);
        if (refererUrl.host.toLowerCase() === host.toLowerCase()) {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        return new NextResponse(
          JSON.stringify({ error: "CSRF check failed: Request origin unauthorized." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // ── USER AUTHENTICATION & SESSION VERIFICATION ──
  const sessionCookie = req.cookies.get("session")?.value;
  const secret = process.env.COOKIE_SECRET_CURRENT || "zynora-dev-secret-key-change-in-production";
  
  let user = null;

  if (sessionCookie) {
    const rawData = await verifyHmacEdge(sessionCookie, secret);
    if (rawData) {
      try {
        const decodedString = base64urlDecode(rawData);
        const userData = JSON.parse(decodedString);
        
        // Ensure token has not expired chronologically
        if (userData && userData.exp && Date.now() < userData.exp) {
          user = userData;
        }
      } catch (e) {
        user = null;
      }
    }
  }

  // Routing Guards
  if (pathname.startsWith("/checkout")) {
    if (!user) {
      return redirectToLogin(req, redirectPath, true);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!user || user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }
  }

  if (pathname.startsWith("/api/admin")) {
    if (!user || user.role !== "ADMIN") {
      return new NextResponse(JSON.stringify({ error: "Unauthorized access denied." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    if (user) {
      return NextResponse.redirect(new URL("/account", req.url));
    }
  }

  // ── ENTERPRISE SECURITY HEADERS (Mozilla Observatory A+ Target) ──
  const response = NextResponse.next();

  // Strict CSP Directives
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://accounts.google.com https://checkout.razorpay.com https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://*.firebaseusercontent.com https://lh3.googleusercontent.com https://firebasestorage.googleapis.com https://*.razorpay.com https://images.unsplash.com https://tse1.mm.bing.net",
    "connect-src 'self' https://*.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://accounts.google.com https://api.razorpay.com https://challenges.cloudflare.com https://api.sandbox.co.in",
    "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://apis.google.com https://api.razorpay.com https://checkout.razorpay.com https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspDirectives);
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Cross-Origin headers — carefully tuned to allow Google OAuth popup
  // COOP must be same-origin-allow-popups (not same-origin) to let Google signInWithPopup work
  // COEP is intentionally omitted — it breaks Google's auth iframe
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");

  return response;
}

export const config = {
  // Run on all paths except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|models|public|assets).*)"],
};
