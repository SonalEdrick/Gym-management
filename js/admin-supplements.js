// js/admin-supplements.js
import { auth, db, logEvent } from "../firebase/firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const logoutBtn = document.getElementById("logoutBtn");
const addForm = document.getElementById("addSupplementForm");
const tableBody = document.getElementById("supplementsTableBody");

// ✅ Auth check for admin
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../admin/admin-login.html";
    return;
  }
  await logEvent("login", { role: "admin", page: "supplements" });
  loadSupplements();
});

// ✅ Logout
logoutBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  await logEvent("logout", { role: "admin" });
  await signOut(auth);
  window.location.href = "../admin/admin-login.html";
});

// ✅ Load all supplements
async function loadSupplements() {
  try {
    const snap = await getDocs(collection(db, "supplements"));
    if (snap.empty) {
      tableBody.innerHTML = "<tr><td colspan='5'>No supplements found.</td></tr>";
      return;
    }

    let html = "";
    snap.forEach((docSnap) => {
      const s = docSnap.data();
      html += `
        <tr>
          <td>${s.name}</td>
          <td>₹${s.price}</td>
          <td>${s.description || "-"}</td>
          <td><img src="${s.imageURL || "https://via.placeholder.com/60"}" width="60" height="60" style="border-radius:5px;"></td>
          <td>
            <button class="edit-btn" data-id="${docSnap.id}">✏️</button>
            <button class="delete-btn" data-id="${docSnap.id}">🗑️</button>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

    // Add handlers
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteSupplement(btn.dataset.id));
    });
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => editSupplement(btn.dataset.id));
    });
  } catch (err) {
    console.error("Error loading supplements:", err);
    tableBody.innerHTML = `<tr><td colspan="5">Error loading data.</td></tr>`;
  }
}

// ✅ Add supplement
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("suppName").value.trim();
  const price = parseFloat(document.getElementById("suppPrice").value);
  const imageURL = document.getElementById("suppImage").value.trim();
  const description = document.getElementById("suppDesc").value.trim();

  if (!name || !price) {
    alert("Please enter supplement name and price.");
    return;
  }

  try {
    await addDoc(collection(db, "supplements"), {
      name,
      price,
      imageURL,
      description,
      createdAt: serverTimestamp(),
    });

    await logEvent("add", { target: "supplement", name });
    alert("Supplement added successfully!");
    addForm.reset();
    loadSupplements();
  } catch (error) {
    console.error("Error adding supplement:", error);
  }
});

// ✅ Delete supplement
async function deleteSupplement(id) {
  if (!confirm("Are you sure you want to delete this supplement?")) return;

  try {
    await deleteDoc(doc(db, "supplements", id));
    await logEvent("delete", { target: "supplement", id });
    alert("Supplement deleted successfully!");
    loadSupplements();
  } catch (error) {
    console.error("Error deleting supplement:", error);
  }
}

// ✅ Edit supplement
async function editSupplement(id) {
  const newName = prompt("Enter new supplement name:");
  const newPrice = prompt("Enter new price (₹):");
  if (!newName || !newPrice) return;

  try {
    const ref = doc(db, "supplements", id);
    await updateDoc(ref, {
      name: newName,
      price: parseFloat(newPrice),
    });

    await logEvent("update", { target: "supplement", id, newName });
    alert("Supplement updated successfully!");
    loadSupplements();
  } catch (error) {
    console.error("Error updating supplement:", error);
  }
}
