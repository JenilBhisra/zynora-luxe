/**
 * Verifies a Cloudflare Turnstile token on the backend.
 * Checks against Cloudflare siteverify endpoint.
 * In development, allows mock validation if TURNSTILE_SECRET_KEY is missing.
 */
export async function verifyTurnstileToken(token: string | null | undefined, clientIp?: string): Promise<boolean> {
  const isDev = process.env.NODE_ENV === "development";
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    if (isDev) {
      console.warn("[TURNSTILE] Missing TURNSTILE_SECRET_KEY in development, bypassing token check.");
      return true;
    }
    console.error("[TURNSTILE] Missing TURNSTILE_SECRET_KEY in production. Request rejected for security.");
    return false;
  }

  if (!token) {
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (clientIp) {
      formData.append("remoteip", clientIp);
    }

    const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const result = await fetch(verifyUrl, {
      method: "POST",
      body: formData,
    });

    if (!result.ok) {
      console.error(`[TURNSTILE] Verification request failed with status: ${result.status}`);
      return false;
    }

    const outcome: any = await result.json();
    if (outcome.success) {
      return true;
    }

    console.warn("[TURNSTILE] Token verification failed:", outcome["error-codes"]);
    return false;
  } catch (error) {
    console.error("[TURNSTILE] Unexpected error during verification:", error);
    return false;
  }
}
