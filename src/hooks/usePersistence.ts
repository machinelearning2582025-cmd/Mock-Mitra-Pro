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
  logOutFromFirebase,
  deleteTestResultsFromFirestore,
  deleteUserProfileFromFirestore,
  saveGuestActivityToFirestore
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

function getOrCreateGuestId(): string {
  const KEY = 'mockmitra_guest_uuid';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

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

  const mergedCustomNotes = rawCloud.customStudyNotes || guestProfile.customStudyNotes || '';
  const mergedGoals = rawCloud.learningGoals || guestProfile.learningGoals || [];
  const mergedPlan = rawCloud.aiMentorPlan || guestProfile.aiMentorPlan || null;
  const mergedChatHistory = rawCloud.chatHistory || guestProfile.chatHistory || [];

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
    customStudyNotes: mergedCustomNotes,
    learningGoals: mergedGoals,
    aiMentorPlan: mergedPlan,
    chatHistory: mergedChatHistory,
    updatedAt: new Date().toISOString()
  } as any);

  return {
    name: mergedName,
    exam: mergedExam,
    language: mergedLanguage,
    customExamDetails: mergedCustomDetails,
    onboarded: mergedOnboarded,
    customStudyNotes: mergedCustomNotes,
    learningGoals: mergedGoals,
    aiMentorPlan: mergedPlan,
    chatHistory: mergedChatHistory,
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
    let finalProfile: UserProfile | null = null;
    setProfile((prev) => {
      finalProfile = { ...prev, ...updates };
      return finalProfile;
    });

    // If logged in, sync basic attributes to Firestore
    if (firebaseUser) {
      try {
        const activeProfile = finalProfile || { ...profile, ...updates };
        await saveUserProfileToFirestore(firebaseUser.uid, {
          name: activeProfile.name,
          exam: activeProfile.exam,
          language: activeProfile.language,
          customExamDetails: activeProfile.customExamDetails || null,
          onboarded: activeProfile.onboarded,
          streak: activeProfile.performance.streak,
          strongTopics: activeProfile.performance.strongTopics,
          weakTopics: activeProfile.performance.weakTopics,
          knowledgeProfile: activeProfile.performance.knowledgeProfile,
          lastAiAnalysis: activeProfile.performance.lastAiAnalysis || null,
          customStudyNotes: activeProfile.customStudyNotes || null,
          learningGoals: activeProfile.learningGoals || null,
          aiMentorPlan: activeProfile.aiMentorPlan || null,
          chatHistory: activeProfile.chatHistory || null,
          updatedAt: new Date().toISOString()
        } as any);
      } catch (error) {
        console.error("Failed to sync profile update to Firestore:", error);
      }
    } else {
      // Guest mode - save guest activity to Firestore in background
      try {
        const guestId = getOrCreateGuestId();
        const activeProfile = finalProfile || { ...profile, ...updates };
        saveGuestActivityToFirestore(guestId, activeProfile).catch(e => console.warn(e));
      } catch (e) {
        console.warn("Guest update save failed:", e);
      }
    }
  };

  // Add historical test result handler
  const addTestResult = useCallback(async (result: TestResult, aiAnalysis?: any) => {
    const resultWithAnalysis = {
      ...result,
      aiAnalysis: aiAnalysis || result.aiAnalysis
    };

    setProfile((prev) => {
      // 1. Calculate new history
      const history = [...prev.performance.testHistory, resultWithAnalysis];
      
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
      const kProfile = { ...prev.performance.knowledgeProfile };
      
      Object.entries(resultWithAnalysis.topicPerformance).forEach(([topic, data]) => {
        if (!data) return;
        const accuracy = (data.correct / data.total) * 100;
        const currentVal = kProfile[topic as Topic] || 50;
        kProfile[topic as Topic] = Math.round((currentVal * 0.7) + (accuracy * 0.3));
      });

      const entries = Object.entries(kProfile) as [Topic, number][];
      const weakTopics = entries.filter(([_, score]) => score < 60).map(([topic]) => topic);
      const strongTopics = entries.filter(([_, score]) => score >= 80).map(([topic]) => topic);

      const updatedPerformance = {
        ...prev.performance,
        testHistory: history,
        knowledgeProfile: kProfile,
        weakTopics,
        strongTopics,
        streak,
        lastAiAnalysis: aiAnalysis || prev.performance.lastAiAnalysis
      };

      const newProfile = {
        ...prev,
        performance: updatedPerformance
      };

      // Sync to Firestore asynchronously
      if (firebaseUser) {
        saveTestResultToFirestore(firebaseUser.uid, resultWithAnalysis).catch(err => {
          console.error("Background error saving test to Firestore:", err);
        });
        saveUserProfileToFirestore(firebaseUser.uid, {
          streak,
          strongTopics,
          weakTopics,
          knowledgeProfile: kProfile,
          lastAiAnalysis: aiAnalysis || null,
          updatedAt: new Date().toISOString()
        } as any).catch(err => {
          console.error("Background error updating profile in Firestore:", err);
        });
      } else {
        // Guest mode - save guest activity to Firestore in background
        try {
          const guestId = getOrCreateGuestId();
          saveGuestActivityToFirestore(guestId, newProfile).catch(e => console.warn(e));
        } catch (e) {
          console.warn("Guest quiz save failed:", e);
        }
      }

      return newProfile;
    });
  }, [firebaseUser]);

  // Handle Google Sign In popup
  const loginWithGoogle = async () => {
    setAuthLoading(true);
    try {
      const userObj = await signInWithGoogle();
      setFirebaseUser(userObj);

      // Explicitly fetch and merge cloud profile instantly to guarantee UI remains in secure loading state
      const fsProfile = await getUserProfileFromFirestore(userObj.uid);
      const fsTests = await getTestResultsFromFirestore(userObj.uid);

      let currentGuest: UserProfile = INITIAL_PROFILE;
      try {
        const savedRaw = localStorage.getItem(STORAGE_KEY);
        if (savedRaw) {
          currentGuest = JSON.parse(savedRaw);
        }
      } catch (e) {
        console.error("Local storage lookup failed inside loginWithGoogle", e);
      }

      const mergedProfile = await mergeGuestWithCloudAndSave(userObj, fsProfile, fsTests || [], currentGuest);
      setProfile(mergedProfile);

      return userObj;
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

  const updateTestResultWithAnalysis = useCallback(async (date: string, aiAnalysis: any) => {
    setProfile((prev) => {
      const history = prev.performance.testHistory.map(h => {
        if (h.date === date) {
          return { ...h, aiAnalysis };
        }
        return h;
      });

      // Update in Firestore as well
      const matchedTest = history.find(h => h.date === date);
      if (firebaseUser && matchedTest) {
        saveTestResultToFirestore(firebaseUser.uid, matchedTest).catch(e => console.error(e));
        
        // Also update lastAiAnalysis in profile if this is the newest test
        const isNewest = history.length > 0 && history[history.length - 1].date === date;
        if (isNewest) {
          saveUserProfileToFirestore(firebaseUser.uid, {
            lastAiAnalysis: aiAnalysis,
            updatedAt: new Date().toISOString()
          } as any).catch(e => console.error(e));
        }
      } else if (!firebaseUser) {
        // Guest mode - save guest activity to Firestore in background
        try {
          const guestId = getOrCreateGuestId();
          const targetProfile = {
            ...prev,
            performance: {
              ...prev.performance,
              testHistory: history,
              lastAiAnalysis: history.length > 0 && history[history.length - 1].date === date ? aiAnalysis : prev.performance.lastAiAnalysis
            }
          };
          saveGuestActivityToFirestore(guestId, targetProfile).catch(e => console.warn(e));
        } catch (e) {
          console.warn("Guest analysis save failed:", e);
        }
      }

      return {
        ...prev,
        performance: {
          ...prev.performance,
          testHistory: history,
          lastAiAnalysis: history.length > 0 && history[history.length - 1].date === date ? aiAnalysis : prev.performance.lastAiAnalysis
        }
      };
    });
  }, [firebaseUser]);

  // Clear chat history handler
  const clearChatHistory = useCallback(async () => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        chatHistory: []
      };
      
      if (firebaseUser) {
        saveUserProfileToFirestore(firebaseUser.uid, {
          chatHistory: [],
          updatedAt: new Date().toISOString()
        } as any).catch(e => console.error("Firestore chatHistory clear failed:", e));
      }
      return updated;
    });
  }, [firebaseUser]);

  // Clear test/practice history handler
  const clearTestHistory = useCallback(async () => {
    setProfile((prev) => {
      const updatedPerformance = {
        strongTopics: [],
        weakTopics: [],
        testHistory: [],
        streak: 0,
        knowledgeProfile: {},
        lastAiAnalysis: undefined
      };
      const updated = {
        ...prev,
        performance: updatedPerformance,
        aiMentorPlan: undefined
      };

      if (firebaseUser) {
        deleteTestResultsFromFirestore(firebaseUser.uid).catch(e => console.error("Firestore test history delete failed:", e));

        saveUserProfileToFirestore(firebaseUser.uid, {
          streak: 0,
          strongTopics: [],
          weakTopics: [],
          knowledgeProfile: {},
          lastAiAnalysis: null,
          aiMentorPlan: null,
          updatedAt: new Date().toISOString()
        } as any).catch(e => console.error("Firestore test history clear failed:", e));
      }

      return updated;
    });
  }, [firebaseUser]);

  // Complete account reset handler
  const resetAccountData = useCallback(async () => {
    const uid = firebaseUser?.uid;
    
    // 1. If logged in, first delete from Firestore and then sign out
    if (uid) {
      try {
        await deleteTestResultsFromFirestore(uid);
      } catch (e) {
        console.error("Firestore test history deletion failed during reset:", e);
      }
      try {
        await deleteUserProfileFromFirestore(uid);
      } catch (e) {
        console.error("Firestore user profile deletion failed during reset:", e);
      }
      try {
        await logOutFromFirebase();
      } catch (e) {
        console.error("Log out failed during reset:", e);
      }
    }

    // 2. Clear local storage and reset local state
    localStorage.removeItem(STORAGE_KEY);
    setProfile(INITIAL_PROFILE);
    setFirebaseUser(null);
  }, [firebaseUser]);

  return { 
    profile, 
    firebaseUser,
    authLoading,
    updateProfile, 
    addTestResult,
    updateTestResultWithAnalysis,
    loginWithGoogle,
    logout,
    clearChatHistory,
    clearTestHistory,
    resetAccountData
  };
}
