import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

let appInstance: App | null = null;
let firestoreInstance: Firestore | null = null;

/**
 * Initializes Firebase Admin SDK using only environment variables
 */
export const initFirebase = (): Firestore | null => {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Replace escaped newlines with actual newlines for the RSA private key
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      'Warning: Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) not found in .env.'
    );
    console.warn('Firestore messaging operations will remain inactive until these variables are added.');
    return null;
  }

  try {
    if (getApps().length === 0) {
      appInstance = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    firestoreInstance = getAdminFirestore();
    console.log('Firebase Admin SDK initialized successfully via environment variables.');
    return firestoreInstance;
  } catch (error: any) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message || error);
    return null;
  }
};

/**
 * Safe accessor for the Firestore instance
 */
export const getFirestore = (): Firestore => {
  if (!firestoreInstance) {
    firestoreInstance = initFirebase();
  }

  if (!firestoreInstance) {
    throw new Error(
      'Firebase Firestore is not initialized. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your .env file.'
    );
  }

  return firestoreInstance;
};

export { FieldValue };
