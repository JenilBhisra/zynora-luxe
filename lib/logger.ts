import { type NextRequest } from "next/server";

const SENSITIVE_KEYS = [
  "password",
  "secret",
  "token",
  "idtoken",
  "privatekey",
  "apikey",
  "cvv",
  "signature",
  "authorization",
  "key"
];

/**
 * Recursively sanitizes sensitive fields from log payloads.
 */
function sanitizePayload(data: any): any {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePayload(item));
  }

  if (typeof data === "object") {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        sanitized[key] = "[REDACTED_SENSITIVE_DATA]";
      } else {
        sanitized[key] = sanitizePayload(value);
      }
    }
    return sanitized;
  }

  return data;
}

export const logger = {
  info(message: string, details?: any) {
    const timestamp = new Date().toISOString();
    console.log(
      JSON.stringify({
        level: "INFO",
        timestamp,
        message,
        details: sanitizePayload(details),
      })
    );
  },

  warn(message: string, details?: any) {
    const timestamp = new Date().toISOString();
    console.warn(
      JSON.stringify({
        level: "WARN",
        timestamp,
        message,
        details: sanitizePayload(details),
      })
    );
  },

  error(message: string, error?: any, details?: any) {
    const timestamp = new Date().toISOString();
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined, // Log stack traces on server only in dev, or redact in prod
    } : error;

    console.error(
      JSON.stringify({
        level: "ERROR",
        timestamp,
        message,
        error: errorDetails,
        details: sanitizePayload(details),
      })
    );
  },

  security(event: string, request?: NextRequest | Request | null, details?: any) {
    const timestamp = new Date().toISOString();
    let ip = "unknown";
    let url = "unknown";
    let method = "unknown";

    if (request) {
      if ("nextUrl" in request) {
        url = request.nextUrl.pathname;
      } else {
        const parsedUrl = new URL(request.url);
        url = parsedUrl.pathname;
      }
      method = request.method;
      
      const headers = request.headers;
      ip = headers.get("x-forwarded-for")?.split(",")[0] ||
           headers.get("x-real-ip") ||
           "127.0.0.1";
    }

    console.warn(
      JSON.stringify({
        level: "SECURITY_AUDIT",
        timestamp,
        event,
        ip,
        url,
        method,
        details: sanitizePayload(details),
      })
    );
  },
};
