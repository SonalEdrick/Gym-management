// js/admin-payments.js
import { auth, db, logEvent } from "../firebase/firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const logoutBtn = document.getElementById("logoutBtn");
const addPaymentBtn = document.getElementById("addPaymentBtn");
const modal = document.getElementById("paymentModal");
const closeModal = document.getElementById("closeModal");
const paymentForm = document.getElementById("paymentForm");
const paymentsTableBody = document.getElementById("paymentsTableBody");

const customerSelect = document.getElementById("customerSelect");
const planSelect = document.getElementById("planSelect");
const amountInput = document.getElementById("amount");
const durationInput = document.getElementById("duration");

let allCustomers = [];
let allPlans = [];

// ✅ Auth check
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../admin/admin-login.html";
  } else {
    loadCustomers();
    loadPlans();
    listenToPayments();
  }
});

// ✅ Logout
logoutBtn.addEventListener("click", async () => {
  await logEvent("logout", { role: "admin" });
  await signOut(auth);
  window.location.href = "../admin/admin-login.html";
});

// ✅ Real-time listener
function listenToPayments() {
  paymentsTableBody.innerHTML =
    "<tr><td colspan='7' class='loading'>Loading payments...</td></tr>";

  const paymentsRef = collection(db, "payments");
  const paymentsQuery = query(paymentsRef, orderBy("date", "desc"));

  onSnapshot(paymentsQuery, (snapshot) => {
    if (snapshot.empty) {
      paymentsTableBody.innerHTML =
        "<tr><td colspan='7'>No payments found.</td></tr>";
      return;
    }

    let rows = "";
    snapshot.forEach((docSnap) => {
      const p = docSnap.data();
      const id = docSnap.id;
      const startDate = p.date?.toDate?.() ? new Date(p.date.toDate()) : null;

      // Compute expiry
      let expiryDate = "N/A";
      if (startDate && p.duration) {
        const exp = new Date(startDate);
        exp.setMonth(exp.getMonth() + Number(p.duration));
        expiryDate = exp.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }

      const formattedStart = startDate
        ? startDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "N/A";

      const expired =
        expiryDate !== "N/A" && new Date(expiryDate) < new Date()
          ? "style='color:#ff4d4d;font-weight:600;'"
          : "";

      rows += `
        <tr>
          <td>${p.customerName || "Unknown"}</td>
          <td>${p.planName || "-"}</td>
          <td>₹${p.amount?.toLocaleString() || 0}</td>
          <td>${p.status || "Pending"}</td>
          <td>${formattedStart}</td>
          <td ${expired}>${expiryDate}</td>
          <td>
            <button class="downloadBtn" data-id="${id}">⬇️</button>
            <button class="deleteBtn" data-id="${id}">🗑️</button>
          </td>
        </tr>
      `;
    });

    paymentsTableBody.innerHTML = rows;

    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (confirm("Delete this payment?")) {
          await deleteDoc(doc(db, "payments", btn.dataset.id));
          await logEvent("delete", { target: "payment", id: btn.dataset.id });
        }
      });
    });

    document.querySelectorAll(".downloadBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const paymentDoc = snapshot.docs.find((d) => d.id === id);
        if (paymentDoc) generateReceipt(paymentDoc.data());
      });
    });
  });
}

// ✅ PDF Receipt
function generateReceipt(payment) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setTextColor(229, 9, 20);
  doc.text("Titan's Club", 20, 20);
  doc.setFontSize(16);
  doc.text("Payment Receipt", 20, 30);

  const startDate = payment.date?.toDate?.()
    ? new Date(payment.date.toDate())
    : new Date();
  const expiryDate = new Date(startDate);
  expiryDate.setMonth(expiryDate.getMonth() + Number(payment.duration));

  doc.setFontSize(12);
  doc.text(`Customer: ${payment.customerName}`, 20, 50);
  doc.text(`Plan: ${payment.planName}`, 20, 60);
  doc.text(`Duration: ${payment.duration} months`, 20, 70);
  doc.text(`Start Date: ${startDate.toLocaleDateString("en-IN")}`, 20, 80);
  doc.text(`Expiry Date: ${expiryDate.toLocaleDateString("en-IN")}`, 20, 90);
  doc.text(`Amount Paid: ₹${payment.amount}`, 20, 100);
  doc.text(`Status: ${payment.status}`, 20, 110);

  doc.text("Thank you for being part of Titan's Club!", 20, 130);

  const filename = `${payment.customerName.replace(/\s+/g, "_")}_receipt.pdf`;
  doc.save(filename);
}

// ✅ Load Customers
async function loadCustomers() {
  const snap = await getDocs(collection(db, "customers"));
  allCustomers = snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name || "Unnamed",
  }));

  customerSelect.innerHTML =
    '<option value="">Select Customer</option>' +
    allCustomers
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => `<option value="${c.id}">${c.name}</option>`)
      .join("");
}

// ✅ Load Plans
async function loadPlans() {
  const plansSnap = await getDocs(collection(db, "plans"));
  allPlans = plansSnap.docs
    .map((d) => ({
      id: d.id,
      name: d.data().name,
      price: d.data().price,
      duration: d.data().duration,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  planSelect.innerHTML =
    '<option value="">Select Plan</option>' +
    allPlans.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
}

// ✅ Modal
addPaymentBtn.addEventListener("click", () => (modal.style.display = "flex"));
closeModal.addEventListener("click", () => (modal.style.display = "none"));

// ✅ Auto-fill fields
planSelect.addEventListener("change", () => {
  const selectedPlan = allPlans.find((p) => p.id === planSelect.value);
  if (selectedPlan) {
    amountInput.value = selectedPlan.price;
    durationInput.value = `${selectedPlan.duration} months`;
  } else {
    amountInput.value = "";
    durationInput.value = "";
  }
});

// ✅ Add Payment
paymentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const customerId = customerSelect.value;
  const customerName =
    allCustomers.find((c) => c.id === customerId)?.name || "Unknown";
  const planId = planSelect.value;
  const selectedPlan = allPlans.find((p) => p.id === planId);
  const planName = selectedPlan?.name || "-";
  const amount = selectedPlan?.price || parseFloat(amountInput.value) || 0;
  const duration = selectedPlan?.duration || 0;
  const status = document.getElementById("status").value;

  if (!customerId || !planId || amount <= 0) {
    alert("Please select a valid customer and plan.");
    return;
  }

  const paymentData = {
    customerId,
    customerName,
    planId,
    planName,
    amount,
    duration,
    status,
    date: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, "payments"), paymentData);
    await logEvent("add", { target: "payment", plan: planName });
    alert("✅ Payment added successfully!");
    paymentForm.reset();
    modal.style.display = "none";
  } catch (error) {
    console.error("Error adding payment:", error);
    alert("❌ Error adding payment: " + error.message);
  }
});
