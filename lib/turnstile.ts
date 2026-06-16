/**
 * Verifies a Cloudflare Turnstile token on the backend.
 * Checks against Cloudflare siteverify endpoint.
 * In development, allows mock validation if TURNSTILE_SECRET_KEY is missing.
 */
export async function verifyTurnstileToken(token: string | null | undefined, clientIp?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If no secret key is configured, skip bot check entirely
  if (!secretKey) {
    console.warn("[TURNSTILE] TURNSTILE_SECRET_KEY not set — skipping bot verification.");
    return true;
  }

  // If secret is the Cloudflare test bypass key, always pass
  if (secretKey === "1x0000000000000000000000000000000AA") {
    return true;
  }

  // If token is missing but key is configured, reject
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
