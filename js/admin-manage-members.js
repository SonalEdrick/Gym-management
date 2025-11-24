// js/admin-manage-members.js
import { auth, db, logEvent } from "../firebase/firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const membersTable = document.getElementById("membersTable").querySelector("tbody");
const searchInput = document.getElementById("searchInput");
const editModal = document.getElementById("editModal");
const editName = document.getElementById("editName");
const editEmail = document.getElementById("editEmail");
const editPhone = document.getElementById("editPhone");
const saveEditBtn = document.getElementById("saveEditBtn");
const logoutBtn = document.getElementById("logoutBtn");

let members = [];
let currentEditId = null;

// ✅ Auth check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../admin/admin-login.html";
  } else {
    await logEvent("login", { role: "admin", context: "manage-members" });
    loadMembers();
  }
});

// ✅ Load Members
async function loadMembers() {
  membersTable.innerHTML =
    "<tr><td colspan='4' style='text-align:center;color:#888;'>Loading...</td></tr>";

  const querySnapshot = await getDocs(collection(db, "customers"));
  members = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderTable(members);
}

// ✅ Render Table
function renderTable(data) {
  membersTable.innerHTML = "";
  if (data.length === 0) {
    membersTable.innerHTML =
      "<tr><td colspan='4' style='text-align:center;color:#888;'>No members found.</td></tr>";
    return;
  }

  data.forEach((member) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${member.name || "N/A"}</td>
      <td>${member.email}</td>
      <td>${member.phoneNumber || "N/A"}</td>
      <td>
        <button class="btn btn-edit" data-id="${member.id}">Edit</button>
        <button class="btn btn-delete" data-id="${member.id}">Delete</button>
      </td>
    `;
    membersTable.appendChild(row);
  });
}

// ✅ Search filter
searchInput.addEventListener("input", (e) => {
  const keyword = e.target.value.toLowerCase();
  const filtered = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(keyword) ||
      m.email?.toLowerCase().includes(keyword)
  );
  renderTable(filtered);
});

// ✅ Edit member
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-edit")) {
    currentEditId = e.target.dataset.id;
    const member = members.find((m) => m.id === currentEditId);

    editName.value = member.name || "";
    editEmail.value = member.email || "";
    editPhone.value = member.phoneNumber || "";

    editModal.style.display = "flex";
  }

  if (e.target.classList.contains("btn-delete")) {
    const id = e.target.dataset.id;
    if (confirm("Are you sure you want to delete this member?")) {
      await deleteDoc(doc(db, "customers", id));
      await logEvent("delete", { target: "customer", id });
      loadMembers();
      alert("Member deleted successfully!");
    }
  }
});

// ✅ Save edited member
saveEditBtn.addEventListener("click", async () => {
  const updatedData = {
    name: editName.value.trim(),
    email: editEmail.value.trim(),
    phoneNumber: editPhone.value.trim(),
  };

  await updateDoc(doc(db, "customers", currentEditId), updatedData);
  await logEvent("update", { target: "customer", id: currentEditId });
  editModal.style.display = "none";
  loadMembers();
  alert("Member updated successfully!");
});

// ✅ Close modal on outside click
window.addEventListener("click", (e) => {
  if (e.target === editModal) {
    editModal.style.display = "none";
  }
});

// ✅ Logout
logoutBtn.addEventListener("click", async () => {
  await logEvent("logout", { role: "admin" });
  await signOut(auth);
  window.location.href = "../admin/admin-login.html";
});
