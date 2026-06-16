export const authConfig = {
  apiKey: "AIzaSyASOo99AX_f_W8DI1WM0vt-Ue7ysgZCrKs",
  cookieName: "AuthToken",
  cookieSignatureKeys: [process.env.COOKIE_SECRET_CURRENT || "fallback-secret-12345", process.env.COOKIE_SECRET_PREVIOUS || "fallback-secret-previous"],
  cookieSerializeOptions: {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Set to true on HTTPS environments
    sameSite: "lax" as const,
    maxAge: 12 * 60 * 60 * 24, // twelve days
  },
  serviceAccount: {
    projectId: "zynora-acd32",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : "",
  },
};
