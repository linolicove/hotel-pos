import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCU84gJirHE9c1s7Bqh90pzyOtjdaR5uus",
  authDomain: "hotel-pos-app.firebaseapp.com",
  databaseURL: "https://hotel-pos-app-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hotel-pos-app",
  storageBucket: "hotel-pos-app.firebasestorage.app",
  messagingSenderId: "44475111004",
  appId: "1:44475111004:web:58cc62ea1e050e2f767899",
  measurementId: "G-KWG9FMP5Q7"
};

const app = initializeApp(firebaseConfig);

// Initialize analytics only if running in a browser environment
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const db = getDatabase(app);

export const syncToCloud = (path, data) => {
  try {
    set(ref(db, path), data);
  } catch (err) {
    console.warn("Firebase sync error:", err);
  }
};

export const subscribeToCloud = (path, callback) => {
  try {
    const dbRef = ref(db, path);
    return onValue(dbRef, (snapshot) => {
      callback(snapshot.val());
    });
  } catch (err) {
    console.warn("Firebase subscribe error:", err);
    return () => {};
  }
};