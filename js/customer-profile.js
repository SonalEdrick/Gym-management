// js/customer-profile.js
import { auth, db } from "../firebase/firebase-config.js";
import {
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phoneNumber");
const passwordInput = document.getElementById("password");
const profileForm = document.getElementById("profileForm");
const successMsg = document.getElementById("successMsg");
const errorMsg = document.getElementById("errorMsg");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;

// ✅ Load user data
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "customer-login.html";
    return;
  }

  currentUser = user;

  const docRef = doc(db, "customers", user.uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    nameInput.value = data.name || "";
    emailInput.value = data.email || "";
    phoneInput.value = data.phoneNumber || "";
  }
});

// ✅ Helper: reauthenticate if needed
async function reauthenticateUserIfNeeded(currentUser) {
  const currentPassword = prompt("Please enter your current password to confirm this change:");
  if (!currentPassword) throw new Error("Re-authentication cancelled.");

  const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
  await reauthenticateWithCredential(currentUser, credential);
}

// ✅ Update profile
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  successMsg.style.display = "none";
  errorMsg.style.display = "none";

  try {
    // Re-authenticate if email or password are being changed
    const newEmail = emailInput.value.trim();
    const newPassword = passwordInput.value.trim();
    const emailChanged = newEmail !== currentUser.email;
    const passwordChanged = newPassword.length > 0;

    if (emailChanged || passwordChanged) {
      await reauthenticateUserIfNeeded(currentUser);
    }

    if (emailChanged) {
      await updateEmail(currentUser, newEmail);
    }

    if (passwordChanged) {
      await updatePassword(currentUser, newPassword);
    }

    // Update Firestore info
    const userRef = doc(db, "customers", currentUser.uid);
    await updateDoc(userRef, {
      name: nameInput.value.trim(),
      email: newEmail,
      phoneNumber: phoneInput.value.trim()
    });

    passwordInput.value = "";
    successMsg.textContent = "Profile updated successfully!";
    successMsg.style.display = "block";
  } catch (err) {
    console.error("Profile update error:", err);
    errorMsg.textContent = err.message;
    errorMsg.style.display = "block";
  }
});

// ✅ Logout
logoutBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  await signOut(auth);
  window.location.href = "customer-login.html";
});
