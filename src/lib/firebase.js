import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  signInWithCredential
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  writeBatch
} from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDWHAvper5tII_cGL5pLYmjhxsE3pRQsw8",
  authDomain: "the-brand-41e3b.firebaseapp.com",
  projectId: "the-brand-41e3b",
  storageBucket: "the-brand-41e3b.firebasestorage.app",
  messagingSenderId: "8455735843",
  appId: "1:8455735843:web:d4b3b5ea895a91549bff96",
  measurementId: "G-T0HLVVM65Q"
};

// Dynamically initialize Firebase if configuration exists
export const initFirebase = (config) => {
  try {
    if (!config || !config.apiKey || !config.projectId) {
      return false;
    }
    
    localStorage.setItem('brand-firebase-config', JSON.stringify(config));
    
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    return true;
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    return false;
  }
};

// Check if Firebase is initialized
export const getFirebase = () => {
  if (app && auth && db) {
    return { app, auth, db, googleProvider };
  }
  
  // Try loading from localStorage, fallback to DEFAULT_FIREBASE_CONFIG
  try {
    let config = null;
    const savedConfig = localStorage.getItem('brand-firebase-config');
    if (savedConfig) {
      config = JSON.parse(savedConfig);
    } else {
      config = DEFAULT_FIREBASE_CONFIG;
    }

    if (config) {
      const success = initFirebase(config);
      if (success) {
        return { app, auth, db, googleProvider };
      }
    }
  } catch (e) {
    console.error("Failed to load saved Firebase config:", e);
  }
  
  return { app: null, auth: null, db: null, googleProvider: null };
};

// Google Sign-In helper
export const loginWithGoogle = async () => {
  const { auth, googleProvider } = getFirebase();
  if (!auth) throw new Error("Firebase not initialized.");
  
  try {
    if (Capacitor.isNativePlatform()) {
      const result = await GoogleSignIn.signIn();
      if (!result.idToken) {
        throw new Error("Google Sign-In failed: No ID Token returned.");
      }
      const credential = GoogleAuthProvider.credential(result.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential.user;
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (e) {
    console.error("Google Sign-In failed:", e);
    throw e;
  }
};

// Log Out helper
export const logoutFirebase = async () => {
  const { auth } = getFirebase();
  if (auth) {
    await signOut(auth);
  }
  if (Capacitor.isNativePlatform()) {
    try {
      await GoogleSignIn.signOut();
    } catch (e) {
      console.warn("Native Google Sign-Out failed:", e);
    }
  }
};

// Subscribe to Auth State Changes
export const subscribeToAuth = (callback) => {
  const { auth } = getFirebase();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// Push all localStorage data starting with "brand-" to Firestore
export const pushAllDataToCloud = async (userId) => {
  const { db } = getFirebase();
  if (!db) return false;

  try {
    const batch = writeBatch(db);
    
    // Gather all local storage keys starting with brand-
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Skip config keys or onboarding status if they are user-specific device settings
      if (key && key.startsWith('brand-') && key !== 'brand-firebase-config') {
        const value = JSON.parse(localStorage.getItem(key));
        
        let docRef;
        if (key.startsWith('brand-daily-log:')) {
          const date = key.replace('brand-daily-log:', '');
          docRef = doc(db, 'users', userId, 'dailyLogs', date);
        } else if (key.startsWith('brand-reflections:')) {
          const date = key.replace('brand-reflections:', '');
          docRef = doc(db, 'users', userId, 'reflections', date);
        } else if (key === 'brand-stats-state') {
          docRef = doc(db, 'users', userId, 'profile', 'stats');
        } else if (key === 'brand-streak-data') {
          docRef = doc(db, 'users', userId, 'profile', 'streak');
        } else if (key === 'brand-achievements') {
          docRef = doc(db, 'users', userId, 'profile', 'achievements');
        } else if (key === 'brand-quest-config') {
          docRef = doc(db, 'users', userId, 'profile', 'questConfig');
        } else if (key === 'brand-onboarding-complete') {
          docRef = doc(db, 'users', userId, 'profile', 'onboarding');
        }

        if (docRef) {
          batch.set(docRef, { data: value, updatedAt: new Date().toISOString() });
        }
      }
    }

    await batch.commit();
    localStorage.setItem('brand-last-sync-time', new Date().toISOString());
    return true;
  } catch (e) {
    console.error("Failed to push data to Cloud Firestore:", e);
    throw e;
  }
};

// Pull all data from Firestore and merge into LocalStorage
export const pullAllDataFromCloud = async (userId) => {
  const { db } = getFirebase();
  if (!db) return false;

  try {
    // Helper to read single docs
    const getDocData = async (docRef) => {
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data().data : null;
    };

    // 1. Pull Profile docs
    const statsData = await getDocData(doc(db, 'users', userId, 'profile', 'stats'));
    const streakData = await getDocData(doc(db, 'users', userId, 'profile', 'streak'));
    const achievementsData = await getDocData(doc(db, 'users', userId, 'profile', 'achievements'));
    const questConfigData = await getDocData(doc(db, 'users', userId, 'profile', 'questConfig'));
    const onboardingData = await getDocData(doc(db, 'users', userId, 'profile', 'onboarding'));

    // Save them to localstorage if they exist
    if (statsData) localStorage.setItem('brand-stats-state', JSON.stringify(statsData));
    if (streakData) localStorage.setItem('brand-streak-data', JSON.stringify(streakData));
    if (achievementsData) localStorage.setItem('brand-achievements', JSON.stringify(achievementsData));
    if (questConfigData) localStorage.setItem('brand-quest-config', JSON.stringify(questConfigData));
    if (onboardingData) localStorage.setItem('brand-onboarding-complete', JSON.stringify(onboardingData));

    // 2. Note: For dailyLogs and reflections we would query the collections, but since we want to be clean:
    // We can pull the last 30 daily logs and reflections (matching our history span)
    // To do this, we generate the date strings for the last 30 days and fetch them
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = (new Date(d - tzOffset)).toISOString().slice(0, 10);
      
      const log = await getDocData(doc(db, 'users', userId, 'dailyLogs', dateStr));
      if (log) {
        localStorage.setItem(`brand-daily-log:${dateStr}`, JSON.stringify(log));
      }

      const reflection = await getDocData(doc(db, 'users', userId, 'reflections', dateStr));
      if (reflection) {
        localStorage.setItem(`brand-reflections:${dateStr}`, JSON.stringify(reflection));
      }
    }

    localStorage.setItem('brand-last-sync-time', new Date().toISOString());
    return true;
  } catch (e) {
    console.error("Failed to pull data from Cloud Firestore:", e);
    throw e;
  }
};

// Push a single localStorage document to the cloud
export const pushSingleDocToCloud = async (userId, key, value) => {
  const { db } = getFirebase();
  if (!db) return;

  try {
    let docRef = null;
    if (key.startsWith('brand-daily-log:')) {
      const date = key.replace('brand-daily-log:', '');
      docRef = doc(db, 'users', userId, 'dailyLogs', date);
    } else if (key.startsWith('brand-reflections:')) {
      const date = key.replace('brand-reflections:', '');
      docRef = doc(db, 'users', userId, 'reflections', date);
    } else if (key === 'brand-stats-state') {
      docRef = doc(db, 'users', userId, 'profile', 'stats');
    } else if (key === 'brand-streak-data') {
      docRef = doc(db, 'users', userId, 'profile', 'streak');
    } else if (key === 'brand-achievements') {
      docRef = doc(db, 'users', userId, 'profile', 'achievements');
    } else if (key === 'brand-quest-config') {
      docRef = doc(db, 'users', userId, 'profile', 'questConfig');
    } else if (key === 'brand-onboarding-complete') {
      docRef = doc(db, 'users', userId, 'profile', 'onboarding');
    }

    if (docRef) {
      await setDoc(docRef, { data: value, updatedAt: new Date().toISOString() });
      localStorage.setItem('brand-last-sync-time', new Date().toISOString());
    }
  } catch (e) {
    console.error(`Failed to push single doc (${key}) to Firestore:`, e);
  }
};
