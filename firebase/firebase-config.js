// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsiqRzu9WPKWA_x5SY2MKj54sKuGVgM6I",
  authDomain: "gym-management-31831.firebaseapp.com",
  projectId: "gym-management-31831",
  storageBucket: "gym-management-31831.appspot.com",
  messagingSenderId: "335988791743",
  appId: "1:335988791743:web:a28ca850b96f3fb55fa90a",
  measurementId: "G-Z5SH9T4RZD",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Universal logging function
export async function logEvent(action, details = {}) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const logData = {
      userId: user.uid,
      email: user.email,
      action, // e.g. login, logout, add, update, delete
      details,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, "logs"), logData);
  } catch (error) {
    console.warn("Logging failed:", error.message);
  }
}

export { app, auth, db };
