import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs,
  query,
  limit,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, TestResult, Topic } from '../types';

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore & Auth services
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Test the connection as strictly requested by the Firebase Skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Define Firestore Operation Types
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Error handling helper conforming to FirestoreErrorInfo structure
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
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
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auth Actions
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  // Ensure we select accounts each time smoothly
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logOutFromFirebase(): Promise<void> {
  await signOut(auth);
}

// Firestore operations for user Profile syncing
export async function getUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  const userDocRef = doc(db, 'users', uid);
  try {
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
}

export async function saveUserProfileToFirestore(uid: string, profile: any): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  try {
    await setDoc(userDocRef, profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

// Subcollection for storing isolated test results dynamically (prevents 1MB document limit)
export async function saveTestResultToFirestore(uid: string, result: TestResult): Promise<void> {
  // Use dates/timestamp or dynamic document ID as testId
  const testId = result.date ? result.date.replace(/[^a-zA-Z0-9_\-]/g, '_') : `test_${Date.now()}`;
  const testDocRef = doc(db, 'users', uid, 'tests', testId);
  try {
    // Save detailed test scores in subcollection
    await setDoc(testDocRef, result);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/tests/${testId}`);
  }
}

export async function getTestResultsFromFirestore(uid: string): Promise<TestResult[]> {
  const testsCollRef = collection(db, 'users', uid, 'tests');
  try {
    const qSnap = await getDocs(testsCollRef);
    const results: TestResult[] = [];
    qSnap.forEach(docSnap => {
      results.push(docSnap.data() as TestResult);
    });
    // Sort chronologically
    return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/tests`);
    return [];
  }
}
