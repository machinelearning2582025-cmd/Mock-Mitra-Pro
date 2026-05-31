import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProfile, TestResult, Topic } from '../types';
import { 
  auth, 
  getUserProfileFromFirestore, 
  saveUserProfileToFirestore, 
  saveTestResultToFirestore, 
  getTestResultsFromFirestore, 
  signInWithGoogle, 
  logOutFromFirebase 
} from '../services/firebase';

const STORAGE_KEY = 'mockmitra_profile';

const INITIAL_PROFILE: UserProfile = {
  name: '',
  exam: '',
  language: 'Hinglish',
  onboarded: false,
  performance: {
    strongTopics: [],
    weakTopics: [],
    testHistory: [],
    streak: 0,
    knowledgeProfile: {}
  }
};

// Top-level helpers to rebuild performance metrics and merge accounts
function rebuildPerformance(tests: TestResult[], lastAi?: any) {
  const sortedTests = [...tests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const dates = [...new Set(sortedTests.map(h => new Date(h.date).toDateString()))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  let streak = 0;
  if (dates.length > 0) {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dates[0] === today || dates[0] === yesterday) {
      streak = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        const current = new Date(dates[i]);
        const next = new Date(dates[i+1]);
        const diff = (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
        if (Math.round(diff) === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  const kProfile: Record<string, number> = {};
  sortedTests.forEach(result => {
    Object.entries(result.topicPerformance).forEach(([topic, data]) => {
      if (!data) return;
      const accuracy = (data.correct / data.total) * 100;
      const currentVal = kProfile[topic] || 50;
      kProfile[topic] = Math.round((currentVal * 0.7) + (accuracy * 0.3));
    });
  });

  const entries = Object.entries(kProfile) as [Topic, number][];
  const weakTopics = entries.filter(([_, score]) => score < 60).map(([topic]) => topic);
  const strongTopics = entries.filter(([_, score]) => score >= 80).map(([topic]) => topic);

  return {
    streak,
    kProfile,
    weakTopics,
    strongTopics,
    lastAiAnalysis: lastAi
  };
}

async function mergeGuestWithCloudAndSave(
  userObj: User,
  cloudProfile: any,
  cloudTests: TestResult[],
  guestProfile: UserProfile
): Promise<UserProfile> {
  const localTests = guestProfile.performance?.testHistory || [];
  const unitedTests = [...cloudTests, ...localTests].filter(
    (t, idx, self) => self.findIndex(x => x.date === t.date) === idx
  );

  // Upload new local tests to cloud
  const cloudDates = new Set(cloudTests.map(c => c.date));
  for (const test of unitedTests) {
    if (!cloudDates.has(test.date)) {
      try {
        await saveTestResultToFirestore(userObj.uid, test);
      } catch (err) {
        console.error("Migration test upload failed:", err);
      }
    }
  }

  // Merge general info with preference for cloud data if vorhanden, else local
  const rawCloud = cloudProfile || {};
  const mergedName = rawCloud.name || guestProfile.name || userObj.displayName || '';
  const mergedExam = rawCloud.exam || guestProfile.exam || '';
  const mergedLanguage = rawCloud.language || guestProfile.language || 'Hinglish';
  const mergedCustomDetails = rawCloud.customExamDetails || guestProfile.customExamDetails || '';
  const mergedOnboarded = rawCloud.onboarded || guestProfile.onboarded || false;

  const computedPerf = rebuildPerformance(
    unitedTests,
    guestProfile.performance?.lastAiAnalysis || rawCloud.lastAiAnalysis
  );

  // Save the synchronized profile to cloud
  await saveUserProfileToFirestore(userObj.uid, {
    name: mergedName,
    email: userObj.email || '',
    exam: mergedExam,
    language: mergedLanguage,
    customExamDetails: mergedCustomDetails || null,
    onboarded: mergedOnboarded,
    streak: computedPerf.streak,
    strongTopics: computedPerf.strongTopics,
    weakTopics: computedPerf.weakTopics,
    knowledgeProfile: computedPerf.kProfile,
    lastAiAnalysis: computedPerf.lastAiAnalysis || null,
    updatedAt: new Date().toISOString()
  } as any);

  return {
    name: mergedName,
    exam: mergedExam,
    language: mergedLanguage,
    customExamDetails: mergedCustomDetails,
    onboarded: mergedOnboarded,
    performance: {
      strongTopics: computedPerf.strongTopics,
      weakTopics: computedPerf.weakTopics,
      testHistory: unitedTests,
      knowledgeProfile: computedPerf.kProfile,
      streak: computedPerf.streak,
      lastAiAnalysis: computedPerf.lastAiAnalysis
    }
  };
}

export function usePersistence() {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Initialize from local storage initially (safe fallback)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error parsing profile from local storage', e);
    }
  }, []);

  // Sync state to local storage whenever profile changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // Hook into Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const fsProfile = await getUserProfileFromFirestore(user.uid);
          const fsTests = await getTestResultsFromFirestore(user.uid);

          // Get the current local guest data from local storage
          let currentGuest: UserProfile = INITIAL_PROFILE;
          try {
            const savedRaw = localStorage.getItem(STORAGE_KEY);
            if (savedRaw) {
              currentGuest = JSON.parse(savedRaw);
            }
          } catch (e) {
            console.error("Local storage lookup failed in sync handler", e);
          }

          const mergedProfile = await mergeGuestWithCloudAndSave(user, fsProfile, fsTests || [], currentGuest);
          setProfile(mergedProfile);
        } catch (error) {
          console.error("Error loading user profile from Firestore:", error);
        }
      } else {
        // Logged out -> restore local guest profile in state if available
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            setProfile(JSON.parse(saved));
          } else {
            setProfile(INITIAL_PROFILE);
          }
        } catch (e) {
          setProfile(INITIAL_PROFILE);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update profile handler
  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);

    // If logged in, sync basic attributes to Firestore
    if (firebaseUser) {
      try {
        await saveUserProfileToFirestore(firebaseUser.uid, {
          name: updatedProfile.name,
          exam: updatedProfile.exam,
          language: updatedProfile.language,
          customExamDetails: updatedProfile.customExamDetails || null,
          onboarded: updatedProfile.onboarded,
          streak: updatedProfile.performance.streak,
          strongTopics: updatedProfile.performance.strongTopics,
          weakTopics: updatedProfile.performance.weakTopics,
          knowledgeProfile: updatedProfile.performance.knowledgeProfile,
          lastAiAnalysis: updatedProfile.performance.lastAiAnalysis || null,
          updatedAt: new Date().toISOString()
        } as any);
      } catch (error) {
        console.error("Failed to sync profile update to Firestore:", error);
      }
    }
  };

  // Add historical test result handler
  const addTestResult = useCallback(async (result: TestResult, aiAnalysis?: any) => {
    // 1. Calculate new history
    const history = [...profile.performance.testHistory, result];
    
    // 2. Calculate dynamic streak
    const dates = [...new Set(history.map(h => new Date(h.date).toDateString()))]
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    if (dates.length > 0) {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (dates[0] === today || dates[0] === yesterday) {
        streak = 1;
        for (let i = 0; i < dates.length - 1; i++) {
          const current = new Date(dates[i]);
          const next = new Date(dates[i+1]);
          const diff = (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
          if (Math.round(diff) === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // 3. Compute knowledge Profile and subtopic metrics
    const kProfile = { ...profile.performance.knowledgeProfile };
    
    Object.entries(result.topicPerformance).forEach(([topic, data]) => {
      if (!data) return;
      const accuracy = (data.correct / data.total) * 100;
      const currentVal = kProfile[topic as Topic] || 50;
      kProfile[topic as Topic] = Math.round((currentVal * 0.7) + (accuracy * 0.3));
    });

    const entries = Object.entries(kProfile) as [Topic, number][];
    const weakTopics = entries.filter(([_, score]) => score < 60).map(([topic]) => topic);
    const strongTopics = entries.filter(([_, score]) => score >= 80).map(([topic]) => topic);

    const updatedPerformance = {
      ...profile.performance,
      testHistory: history,
      knowledgeProfile: kProfile,
      weakTopics,
      strongTopics,
      streak,
      lastAiAnalysis: aiAnalysis || profile.performance.lastAiAnalysis
    };

    const newProfile = {
      ...profile,
      performance: updatedPerformance
    };

    setProfile(newProfile);

    // Sync to Firestore if authenticated
    if (firebaseUser) {
      try {
        // Save test dynamically to its independent subcollection path
        await saveTestResultToFirestore(firebaseUser.uid, result);

        // Update parent profile document with aggregated performance fields
        await saveUserProfileToFirestore(firebaseUser.uid, {
          streak,
          strongTopics,
          weakTopics,
          knowledgeProfile: kProfile,
          lastAiAnalysis: aiAnalysis || null,
          updatedAt: new Date().toISOString()
        } as any);
      } catch (error) {
        console.error("Failed to sync new test & performance to Firestore:", error);
      }
    }
  }, [profile, firebaseUser]);

  // Handle Google Sign In popup
  const loginWithGoogle = async () => {
    setAuthLoading(true);
    try {
      const userObj = await signInWithGoogle();
      
      // Load or initialize documents
      const fsProfile = await getUserProfileFromFirestore(userObj.uid);
      const fsTests = await getTestResultsFromFirestore(userObj.uid);

      // Merge current local guest profile with retrieved cloud profile
      const mergedProfile = await mergeGuestWithCloudAndSave(userObj, fsProfile, fsTests || [], profile);
      
      setFirebaseUser(userObj);
      setProfile(mergedProfile);
      return mergedProfile;
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes("popup-closed-by-user") || errMsg.includes("auth/closed-by-user")) {
        console.warn("Google Sign-In popup was closed by the user.");
      } else {
        console.error("Google Sign-In Error:", err);
      }
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Log out handler
  const logout = async () => {
    setAuthLoading(true);
    try {
      await logOutFromFirebase();
      localStorage.removeItem(STORAGE_KEY);
      setProfile(INITIAL_PROFILE);
      setFirebaseUser(null);
    } catch (err) {
      console.error("Log out failed:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  return { 
    profile, 
    firebaseUser,
    authLoading,
    updateProfile, 
    addTestResult,
    loginWithGoogle,
    logout 
  };
}
