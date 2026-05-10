import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Improved Firestore initialization with flags to bypass proxy issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  // @ts-ignore - this setting can help with some proxy environments
  useFetchStreams: false,
} as any, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL: Connection test as mandated by integration instructions
export async function testFirestoreConnection() {
  try {
    // getDocFromServer is the right way to bypass local cache and test the pipe.
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connectivity check successful.");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Firestore connectivity check failed:", errorMessage);
    
    if(errorMessage.includes('offline') || errorMessage.includes('reach Cloud Firestore')) {
      console.error("Please check your Firebase configuration. You may be offline or the API key is invalid.");
    }
  }
}
