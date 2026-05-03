import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Ensure we only initialize the app once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Initialize Firestore with specific settings for sandboxed environments.
 * Forced long-polling is critical for reliability in the AI Studio preview.
 */
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
  console.info("Firestore: Initialized with custom database ID and long-polling.");
} catch (error) {
  console.warn("Firestore: Failed to initialize via initializeFirestore, falling back to getFirestore.");
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = dbInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

/**
 * Diagnostic tool to verify connectivity to the backend.
 */
export async function testConnection() {
  const connectionDoc = doc(db, 'test', 'connection');
  console.info("Firestore: testing connection to", connectionDoc.path);
  
  try {
    // getDocFromServer forces a network request, bypassing any local cache
    await getDocFromServer(connectionDoc);
    console.info("✅ Firestore Connection Established successfully.");
  } catch (error: any) {
    const errorCode = error?.code || 'unknown';
    const isConnectivityIssue = ['unavailable', 'deadline-exceeded', 'permission-denied'].includes(errorCode) || 
                                error.message?.includes('offline');

    if (isConnectivityIssue) {
      console.warn(`⚠️ Firestore Connectivity Alert [${errorCode}]: Backend is currently unreachable. Following the 'set_up_firebase' instructions might resolve this if the project was recently changed.`);
    } else {
      console.error("❌ Firestore Connection Error:", error);
    }
  }
}

// Perform the connectivity check after the app has had a chance to mount
if (typeof window !== 'undefined') {
  setTimeout(testConnection, 3000);
}

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
  const errorMessage = JSON.stringify(errInfo);
  console.error('Firestore Error Payload: ', errorMessage);
  throw new Error(errorMessage);
}
