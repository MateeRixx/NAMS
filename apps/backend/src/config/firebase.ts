import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { config } from './index.js';

let firebaseApp: App | null = null;

export function getFirebaseApp(): App {
  if (!firebaseApp) {
    if (getApps().length === 0) {
      if (
        !config.FIREBASE_PROJECT_ID ||
        !config.FIREBASE_CLIENT_EMAIL ||
        !config.FIREBASE_PRIVATE_KEY
      ) {
        throw new Error(
          'Firebase configuration missing (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)'
        );
      }

      firebaseApp = initializeApp({
        credential: cert({
          projectId: config.FIREBASE_PROJECT_ID,
          clientEmail: config.FIREBASE_CLIENT_EMAIL,
          privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      firebaseApp = getApps()[0]!;
    }
  }

  return firebaseApp;
}

export function isFirebaseConfigured(): boolean {
  return !!(
    config.FIREBASE_PROJECT_ID &&
    config.FIREBASE_CLIENT_EMAIL &&
    config.FIREBASE_PRIVATE_KEY
  );
}

export async function verifyFirebaseToken(token: string) {
  const app = getFirebaseApp();
  return getAuth(app).verifyIdToken(token);
}
