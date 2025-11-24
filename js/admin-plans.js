// js/admin-plans.js
import { auth, db, logEvent } from "../firebase/firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const logoutBtn = document.getElementById("logoutBtn");
const addPlanBtn = document.getElementById("addPlanBtn");
const modal = document.getElementById("planModal");
const closeModal = document.getElementById("closeModal");
const planForm = document.getElementById("planForm");
const plansTableBody = document.getElementById("plansTableBody");
const modalTitle = document.getElementById("modalTitle");

let editMode = false;
let editId = null;

onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "../admin/admin-login.html";
  else loadPlans();
});

logoutBtn.addEventListener("click", async () => {
  await logEvent("logout", { role: "admin" });
  await signOut(auth);
  window.location.href = "../admin/admin-login.html";
});

function loadPlans() {
  const plansRef = collection(db, "plans");
  const q = query(plansRef, orderBy("name", "asc"));

  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      plansTableBody.innerHTML = "<tr><td colspan='5'>No plans found.</td></tr>";
      return;
    }

    let rows = "";
    snapshot.forEach((docSnap) => {
      const p = docSnap.data();
      rows += `
        <tr>
          <td>${p.name}</td>
          <td>${p.duration} months</td>
          <td>₹${p.price}</td>
          <td>${p.description}</td>
          <td>
            <button class="editBtn" data-id="${docSnap.id}">Edit</button>
            <button class="deleteBtn" data-id="${docSnap.id}">Delete</button>
          </td>
        </tr>
      `;
    });

    plansTableBody.innerHTML = rows;

    document.querySelectorAll(".editBtn").forEach((btn) =>
      btn.addEventListener("click", () => editPlan(btn.dataset.id))
    );

    document.querySelectorAll(".deleteBtn").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (confirm("Delete this plan?")) {
          await deleteDoc(doc(db, "plans", btn.dataset.id));
          await logEvent("delete", { target: "plan", id: btn.dataset.id });
        }
      })
    );
  });
}

planForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const planData = {
    name: document.getElementById("planName").value.trim(),
    duration: parseInt(document.getElementById("planDuration").value),
    price: parseFloat(document.getElementById("planPrice").value),
    description: document.getElementById("planDescription").value.trim(),
    updatedAt: serverTimestamp(),
  };

  try {
    if (editMode && editId) {
      await updateDoc(doc(db, "plans", editId), planData);
      await logEvent("update", { target: "plan", id: editId });
      alert("✅ Plan updated successfully!");
    } else {
      planData.createdAt = serverTimestamp();
      await addDoc(collection(db, "plans"), planData);
      await logEvent("add", { target: "plan", name: planData.name });
      alert("✅ Plan added successfully!");
    }

    planForm.reset();
    modal.style.display = "none";
    editMode = false;
    editId = null;
  } catch (error) {
    alert("Error saving plan: " + error.message);
  }
});

async function editPlan(id) {
  editMode = true;
  editId = id;
  modalTitle.textContent = "Edit Plan";

  const planRef = doc(db, "plans", id);
  const snap = await getDoc(planRef);
  if (snap.exists()) {
    const p = snap.data();
    document.getElementById("planName").value = p.name;
    document.getElementById("planDuration").value = p.duration;
    document.getElementById("planPrice").value = p.price;
    document.getElementById("planDescription").value = p.description;
    modal.style.display = "flex";
  }
}

addPlanBtn.addEventListener("click", () => {
  modal.style.display = "flex";
  modalTitle.textContent = "Add Plan";
  editMode = false;
  editId = null;
});
closeModal.addEventListener("click", () => (modal.style.display = "none"));
