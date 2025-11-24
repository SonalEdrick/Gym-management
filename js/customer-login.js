// js/customer-login.js
import { auth, db } from "../firebase/firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Tabs
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

function showLogin() {
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  loginForm.classList.add("active");
  registerForm.classList.remove("active");
}

function showRegister() {
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerForm.classList.add("active");
  loginForm.classList.remove("active");
}

loginTab.addEventListener("click", showLogin);
registerTab.addEventListener("click", showRegister);
document.getElementById("switchToRegister").addEventListener("click", showRegister);
document.getElementById("switchToLogin").addEventListener("click", showLogin);

// ✅ Handle Customer Registration
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = registerForm.querySelector('input[name="name"]').value.trim();
  const email = registerForm.querySelector('input[name="email"]').value.trim();
  const phoneNumber = registerForm.querySelector('input[name="phone"]').value.trim();
  const password = registerForm.querySelector('input[name="password"]').value.trim();
  const confirmPassword = registerForm.querySelector('input[name="confirmPassword"]').value.trim();

  if (!name || !email || !phoneNumber || !password) {
    alert("Please fill in all fields!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    // ✅ Register user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ✅ Create customer document dynamically
    await setDoc(doc(db, "customers", user.uid), {
      name,
      email,
      phoneNumber,
      createdAt: serverTimestamp(),
    });

    alert(`Welcome ${name}! Registration successful.`);
    window.location.href = "customer-dashboard.html";
  } catch (error) {
    console.error(error);
    alert("Registration failed: " + error.message);
  }
});

// ✅ Handle Login (Admin or Customer)
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm.querySelector('input[name="email"]').value.trim();
  const password = loginForm.querySelector('input[name="password"]').value.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (adminDoc.exists()) {
      window.location.href = "../admin/admin-dashboard.html";
      return;
    }

    const customerDoc = await getDoc(doc(db, "customers", user.uid));
    if (customerDoc.exists()) {
      window.location.href = "customer-dashboard.html";
      return;
    }

    alert("Account not found in any collection. Contact the gym administrator.");
    await signOut(auth);
  } catch (error) {
    alert("Login failed: " + error.message);
  }
});

// ✅ Auto redirect on login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    const customerDoc = await getDoc(doc(db, "customers", user.uid));

    if (adminDoc.exists()) {
      window.location.href = "../admin/admin-dashboard.html";
    } else if (customerDoc.exists()) {
      window.location.href = "customer-dashboard.html";
    }
  }
});
