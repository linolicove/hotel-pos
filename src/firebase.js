import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hotel-pos.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://hotel-pos-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hotel-pos",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hotel-pos.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000:web:000000000"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const syncToCloud = (path, data) => {
  try {
    set(ref(db, path), data);
  } catch (err) {
    console.warn("Firebase sync fallback:", err);
  }
};

export const subscribeToCloud = (path, callback) => {
  try {
    const dbRef = ref(db, path);
    return onValue(dbRef, (snapshot) => {
      callback(snapshot.val());
    });
  } catch (err) {
    console.warn("Firebase listener fallback:", err);
    return () => {};
  }
};