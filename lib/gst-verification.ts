// Local in-memory cache for Sandbox API JWT tokens (tokens are valid for 24 hours)
let cachedToken: string | null = null;
let cachedTokenExpiry: number = 0; // Epoch milliseconds

/**
 * Validates a GSTIN offline using format matching and the Modulo 36 checksum algorithm.
 */
export function validateGSTINFormatAndChecksum(gstin: string): boolean {
  if (!gstin) return false;

  const normalized = gstin.trim().toUpperCase();
  
  // 1. Regular expression check
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(normalized)) {
    return false;
  }

  // 2. Modulo 36 checksum validation
  const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0;

  for (let i = 0; i < 14; i++) {
    const charValue = characters.indexOf(normalized[i]);
    if (charValue === -1) return false;

    // Weight is 1 for even index, 2 for odd index (0-based)
    const multiplier = i % 2 === 0 ? 1 : 2;
    const product = charValue * multiplier;

    // Sum the digits of the product in base 36
    sum += Math.floor(product / 36) + (product % 36);
  }

  const remainder = sum % 36;
  const checkCode = (36 - remainder) % 36;

  return normalized[14] === characters[checkCode];
}

export interface GSTVerificationResult {
  success: boolean;
  legalName?: string;
  tradeName?: string;
  status?: string;
  state?: string;
  regDate?: string;
  verificationMode: "LIVE" | "MOCK (Dev Fallback)";
  error?: string;
}

/**
 * Authenticates with Sandbox.co.in to fetch a fresh JWT token.
 */
async function fetchSandboxToken(
  baseUrl: string,
  apiKey: string,
  apiSecret: string,
  apiVersion: string
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, "")}/authenticate`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "x-api-secret": apiSecret,
      "x-api-version": apiVersion,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Sandbox Token Authentication failed (${response.status}): ${errText}`);
  }

  const resJson: any = await response.json();
  if (resJson?.code === 200 && resJson?.data?.access_token) {
    return resJson.data.access_token;
  }

  throw new Error("Sandbox token response did not contain access_token.");
}

/**
 * Verifies a GSTIN online using the Sandbox.co.in public search API.
 * Falls back to mock validation if credentials are missing and running in development mode.
 */
export async function verifyGSTINOnline(gstin: string): Promise<GSTVerificationResult> {
  const normalized = gstin.trim().toUpperCase();

  // First verify format and checksum offline
  if (!validateGSTINFormatAndChecksum(normalized)) {
    return {
      success: false,
      verificationMode: "LIVE",
      error: "GSTIN fails offline format/checksum validation.",
    };
  }

  const isDev = process.env.NODE_ENV === "development";
  const apiKey = process.env.SANDBOX_API_KEY;
  const apiSecret = process.env.SANDBOX_API_SECRET;
  const apiVersion = process.env.SANDBOX_API_VERSION || "1.0.0";
  const baseUrl = process.env.SANDBOX_API_BASE_URL || "https://api.sandbox.co.in";

  // Check if credentials are missing
  if (!apiKey || !apiSecret) {
    if (isDev) {
      console.log(`[GST Verification] Running in MOCK Mode (Dev Fallback) for GSTIN: ${normalized}`);
      return {
        success: true,
        legalName: "ZYNORA PARTNER MOCK LTD",
        tradeName: "Zynora Mock Partner",
        status: "Active",
        state: "Gujarat",
        regDate: "01/07/2017",
        verificationMode: "MOCK (Dev Fallback)",
      };
    } else {
      // In production, mock mode is strictly disabled
      console.error("[GST Verification] Missing Sandbox API credentials in production environment.");
      return {
        success: false,
        verificationMode: "LIVE",
        error: "GST verification service is unconfigured in production.",
      };
    }
  }

  try {
    const now = Date.now();
    // Refresh authentication token if expired or missing (cache token for 23 hours)
    if (!cachedToken || now >= cachedTokenExpiry) {
      console.log("[GST Verification] Fetching new Sandbox authorization token...");
      const token = await fetchSandboxToken(baseUrl, apiKey, apiSecret, apiVersion);
      cachedToken = token;
      cachedTokenExpiry = now + 23 * 60 * 60 * 1000;
    }

    const searchUrl = `${baseUrl.replace(/\/$/, "")}/gsp/public/gstin/${normalized}`;
    
    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "x-api-version": apiVersion,
        "authorization": cachedToken, // No "Bearer" prefix, passed directly
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        verificationMode: "LIVE",
        error: `Sandbox GST Search failed (${response.status}): ${errText}`,
      };
    }

    const resJson: any = await response.json();
    
    // Check if response returned data successfully
    if (resJson?.code === 200 && resJson?.data) {
      const data = resJson.data;
      return {
        success: true,
        legalName: data.lgnm || "N/A",
        tradeName: data.tradeNam || "N/A",
        status: data.sts || "Inactive",
        state: data.pradr?.addr?.stcd || "N/A",
        regDate: data.rgdt || "N/A",
        verificationMode: "LIVE",
      };
    }

    return {
      success: false,
      verificationMode: "LIVE",
      error: resJson?.message || "Invalid response format returned by verification service.",
    };
  } catch (error: any) {
    console.error("[GST Verification] Error during online verification request:", error);
    return {
      success: false,
      verificationMode: "LIVE",
      error: error.message || "An unexpected error occurred during online verification.",
    };
  }
}
