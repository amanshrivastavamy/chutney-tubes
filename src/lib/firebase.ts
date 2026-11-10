// Firebase Firestore Integration with offline/fallback resilience

let dbInstance: any = null;
let isFirebaseConfigured = false;

export function initFirebase() {
  if (dbInstance) return { db: dbInstance, isConfigured: isFirebaseConfigured };

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    // Config not present yet; tracking continues via /api/events and localStorage
    return { db: null, isConfigured: false };
  }

  try {
    const { initializeApp, getApps, getApp } = require("firebase/app");
    const { getFirestore } = require("firebase/firestore");

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    isFirebaseConfigured = true;
    return { db: dbInstance, isConfigured: true };
  } catch (err) {
    console.warn("Firebase initialization skipped (client libraries not bundled or offline):", err);
    return { db: null, isConfigured: false };
  }
}

/**
 * Record demand test event to Firestore collection 'events'
 */
export async function logEventToFirestore(payload: any) {
  const { db, isConfigured } = initFirebase();
  if (!isConfigured || !db) return false;

  try {
    const { collection, addDoc } = require("firebase/firestore");
    await addDoc(collection(db, "events"), {
      ...payload,
      createdAtServer: new Date(),
    });
    return true;
  } catch (err) {
    console.error("Firestore write event failed:", err);
    return false;
  }
}

/**
 * Record waitlist registration to Firestore collection 'waitlist'
 */
export async function saveWaitlistToFirestore(waitlistData: any) {
  const { db, isConfigured } = initFirebase();
  if (!isConfigured || !db) return false;

  try {
    const { collection, addDoc } = require("firebase/firestore");
    await addDoc(collection(db, "waitlist"), {
      ...waitlistData,
      submittedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("Firestore write waitlist failed:", err);
    return false;
  }
}
