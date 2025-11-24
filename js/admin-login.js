// js/admin-login.js
import { auth, db } from "../firebase/firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const form = document.getElementById("adminLoginForm");

// ✅ Handle Admin Login
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.querySelector('input[name="email"]').value.trim();
  const password = form.querySelector('input[name="password"]').value.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const adminRef = doc(db, "admins", user.uid);
    const adminSnap = await getDoc(adminRef);

    if (adminSnap.exists()) {
      window.location.href = "../admin/admin-dashboard.html";
    } else {
      alert("Access denied. You are not registered as an admin.");
      await signOut(auth);
    }
  } catch (error) {
    alert("Login failed: " + error.message);
  }
});

// ✅ Redirect logged-in admin
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (adminDoc.exists()) {
      window.location.href = "../admin/admin-dashboard.html";
    }
  }
});
