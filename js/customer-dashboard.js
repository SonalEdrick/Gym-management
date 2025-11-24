// js/customer-dashboard.js
import { auth, db, logEvent } from "../firebase/firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const userEmailSpan = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");
const membershipCard = document.getElementById("membershipCard");
const paymentHistoryBody = document.getElementById("paymentHistoryBody");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "customer-login.html";
    return;
  }

  try {
    await logEvent("login", { role: "customer" });

    const userRef = doc(db, "customers", user.uid);
    const userSnap = await getDoc(userRef);

    let customerName = user.email.split("@")[0];
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.name) customerName = userData.name;
    }

    userEmailSpan.textContent = customerName;

    // ✅ Load payments
    const paymentsRef = collection(db, "payments");
    const q = query(
      paymentsRef,
      where("customerId", "==", user.uid),
      orderBy("date", "desc")
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      membershipCard.innerHTML = "<p>No active memberships found.</p>";
      paymentHistoryBody.innerHTML =
        "<tr><td colspan='6'>No payments found.</td></tr>";
      return;
    }

    let latestPayment = null;
    let rows = "";

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const startDate = data.date?.toDate?.()
        ? new Date(data.date.toDate())
        : null;

      let expiryDate = "N/A";
      if (startDate && data.duration) {
        const exp = new Date(startDate);
        exp.setMonth(exp.getMonth() + Number(data.duration));
        expiryDate = exp.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }

      if (!latestPayment) latestPayment = { ...data, startDate, expiryDate };

      const expired =
        expiryDate !== "N/A" && new Date(expiryDate) < new Date();

      rows += `
        <tr>
          <td>${data.planName}</td>
          <td>₹${data.amount}</td>
          <td>${data.status}</td>
          <td>${startDate ? startDate.toLocaleDateString("en-IN") : "N/A"}</td>
          <td style="color:${expired ? "#ff4d4d" : "#00ff99"};">${expiryDate}</td>
          <td><button class="downloadBtn" data-id="${docSnap.id}" data-name="${customerName}">⬇️</button></td>
        </tr>
      `;
    });

    paymentHistoryBody.innerHTML = rows;

    const expired =
      latestPayment.expiryDate !== "N/A" &&
      new Date(latestPayment.expiryDate) < new Date();

    membershipCard.innerHTML = `
      <h3>${latestPayment.planName}</h3>
      <p><strong>Amount:</strong> ₹${latestPayment.amount}</p>
      <p><strong>Start Date:</strong> ${latestPayment.startDate.toLocaleDateString(
        "en-IN"
      )}</p>
      <p><strong>Expiry Date:</strong> <span style="color:${
        expired ? "#ff4d4d" : "#00ff99"
      };">${latestPayment.expiryDate}</span></p>
      <p><strong>Status:</strong> ${expired ? "Expired ❌" : "Active ✅"}</p>
      ${
        expired
          ? `<button class="renew-btn" id="renewBtn">Renew Plan</button>`
          : ""
      }
    `;

    if (expired) {
      document.getElementById("renewBtn").addEventListener("click", async () => {
        await logEvent("update", { target: "membership-renewal" });
        window.location.href = "customer-renew.html";
      });
    }

    document.querySelectorAll(".downloadBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest("tr");
        const plan = row.children[0].textContent;
        const amount = row.children[1].textContent;
        const status = row.children[2].textContent;
        const start = row.children[3].textContent;
        const expiry = row.children[4].textContent;
        const name = btn.dataset.name;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("Titan's Club - Payment Receipt", 20, 20);
        pdf.setFontSize(12);
        pdf.text(`Customer: ${name}`, 20, 40);
        pdf.text(`Plan: ${plan}`, 20, 50);
        pdf.text(`Amount: ${amount}`, 20, 60);
        pdf.text(`Status: ${status}`, 20, 70);
        pdf.text(`Start Date: ${start}`, 20, 80);
        pdf.text(`Expiry Date: ${expiry}`, 20, 90);
        pdf.text("Thank you for choosing Titan's Club 💪", 20, 110);
        pdf.save(`${name}_receipt.pdf`);

        await logEvent("download", { target: "receipt", plan });
      });
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    membershipCard.innerHTML = "<p>Error loading membership data.</p>";
  }
});

logoutBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  await logEvent("logout", { role: "customer" });
  await signOut(auth);
  window.location.href = "customer-login.html";
});
