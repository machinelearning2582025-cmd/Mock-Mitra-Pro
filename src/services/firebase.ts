import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs,
  query,
  limit,
  getDocFromServer,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, TestResult, Topic } from '../types';

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore & Auth services
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId || "(default)"); /* CRITICAL: The app will break without this line */
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

export async function saveGuestActivityToFirestore(guestId: string, profile: UserProfile): Promise<void> {
  const guestDocRef = doc(db, 'guests', guestId);
  try {
    await setDoc(guestDocRef, {
      guestId,
      name: profile.name || '',
      exam: profile.exam || '',
      language: profile.language || '',
      onboarded: profile.onboarded || false,
      performance: {
        streak: profile.performance.streak || 0,
        strongTopics: profile.performance.strongTopics || [],
        weakTopics: profile.performance.weakTopics || [],
        knowledgeProfile: profile.performance.knowledgeProfile || {},
        testHistoryCount: profile.performance.testHistory?.length || 0,
        testHistorySnapshot: profile.performance.testHistory?.map(t => ({
          date: t.date,
          score: t.score,
          total: t.total,
          timeSpent: t.timeSpent,
          subject: t.subject
        })) || []
      },
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    // Fail silently or handle error without crashing the application for a guest
    console.warn("Silent guest save failed:", error);
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

export async function deleteTestResultsFromFirestore(uid: string): Promise<void> {
  const testsCollRef = collection(db, 'users', uid, 'tests');
  try {
    const qSnap = await getDocs(testsCollRef);
    for (const docSnap of qSnap.docs) {
      await deleteDoc(doc(db, 'users', uid, 'tests', docSnap.id));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/tests`);
  }
}

export async function deleteUserProfileFromFirestore(uid: string): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  try {
    await deleteDoc(userDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
  }
}
