import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let adminApp: App | null = null;

export const isAdminConfigured = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY
);

function getAdminApp(): App | null {
  if (getApps().length) {
    return getApps()[0];
  }

  if (!isAdminConfigured) {
    return null;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    return adminApp;
  } catch (err) {
    console.warn("Failed to initialize Firebase Admin SDK:", err);
    return null;
  }
}

export const adminAuth = () => {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
};

export const adminDb = () => {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
};

export const adminStorage = () => {
  const app = getAdminApp();
  return app ? getStorage(app) : null;
};
