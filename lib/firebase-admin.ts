import * as admin from "firebase-admin";

const projectId = "zynora-acd32";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
  if (clientEmail && privateKey && privateKey.includes("BEGIN PRIVATE KEY") && privateKey.length > 500) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    } catch (error) {
      console.error("Firebase admin initialization error", error);
    }
  } else if (clientEmail || privateKey) {
    console.warn("Firebase Admin SDK credentials found but appear invalid or placeholders. Session validation will fall back.");
  }
}

/**
 * Returns the initialized Firebase auth service instance, or null if credentials are missing.
 */
export function getAdminAuth() {
  if (admin.apps.length > 0) {
    return admin.auth();
  }
  return null;
}
