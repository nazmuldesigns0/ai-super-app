import { existsSync, readFileSync } from "fs";
import path from "path";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let adminApp: App | null = null;

interface AdminCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * Reads a service account JSON key file. Handy for local development where you
 * download the key from Firebase Console → Project Settings → Service Accounts.
 *
 * Configure the location with FIREBASE_SERVICE_ACCOUNT_KEY_PATH (or the
 * standard GOOGLE_APPLICATION_CREDENTIALS).
 */
function readServiceAccountFile(): AdminCredentials | null {
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!filePath) return null;

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  if (!existsSync(absolutePath)) {
    console.warn(
      `[Firebase Admin] Service account file not found: ${absolutePath}`
    );
    return null;
  }

  try {
    const json = JSON.parse(readFileSync(absolutePath, "utf8"));
    if (!json.project_id || !json.client_email || !json.private_key) {
      console.warn(
        `[Firebase Admin] Service account file is missing project_id / client_email / private_key: ${absolutePath}`
      );
      return null;
    }
    return {
      projectId: json.project_id,
      clientEmail: json.client_email,
      privateKey: json.private_key,
    };
  } catch (err) {
    console.warn("[Firebase Admin] Could not parse service account file:", err);
    return null;
  }
}

/**
 * Credentials come from either the individual env vars (recommended for
 * deployment, where no files can be shipped) or a service account JSON file
 * (convenient locally).
 */
function resolveCredentials(): AdminCredentials | null {
  const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } =
    process.env;

  if (FIREBASE_ADMIN_PROJECT_ID && FIREBASE_ADMIN_CLIENT_EMAIL && FIREBASE_ADMIN_PRIVATE_KEY) {
    return {
      projectId: FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return readServiceAccountFile();
}

const credentials = resolveCredentials();

export const isAdminConfigured = credentials !== null;

function getAdminApp(): App | null {
  if (getApps().length) {
    return getApps()[0];
  }

  if (!credentials) {
    return null;
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId: credentials.projectId,
        clientEmail: credentials.clientEmail,
        privateKey: credentials.privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (err) {
    console.warn("Failed to initialize Firebase Admin SDK:", err);
    return null;
  }

  // Configure Firestore before anything can use it. Setting this lazily (on
  // first adminDb() call) fails whenever another module already touched the
  // instance, so it must happen here, at app creation time.
  try {
    getFirestore(adminApp).settings({ ignoreUndefinedProperties: true });
  } catch (err) {
    console.warn("[Firebase Admin] Could not apply Firestore settings:", err);
  }

  return adminApp;
}

export const adminAuth = () => {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
};

/**
 * Firestore must be configured before it is used anywhere in the process.
 * `ignoreUndefinedProperties` is required because profiles legitimately omit
 * optional fields (e.g. photoURL for email/password sign-ups) — without it,
 * any write containing `undefined` is rejected.
 */
export const adminDb = (): Firestore | null => {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
};

export const adminStorage = () => {
  const app = getAdminApp();
  return app ? getStorage(app) : null;
};
