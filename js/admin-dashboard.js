// js/admin-dashboard.js
import { auth, db, logEvent } from "../firebase/firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const adminNameSpan = document.getElementById("adminName");
const logoutBtn = document.getElementById("logoutBtn");
const totalMembersEl = document.getElementById("totalMembers");
const totalPaymentsEl = document.getElementById("totalPayments");
const totalRevenueEl = document.getElementById("totalRevenue");
const activePlansEl = document.getElementById("activePlans");

// ✅ Auth check & role validation
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../admin/admin-login.html";
    return;
  }

  try {
    const adminRef = doc(db, "admins", user.uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      alert("Access denied. You are not registered as an admin.");
      await signOut(auth);
      window.location.href = "../admin/admin-login.html";
      return;
    }

    const adminData = adminSnap.data();
    adminNameSpan.textContent = adminData.name || "Administrator";

    await logEvent("login", { role: "admin", name: adminData.name });
    await loadAnalytics();
  } catch (error) {
    console.error("Error fetching admin data:", error);
  }
});

// ✅ Logout
logoutBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    await logEvent("logout", { role: "admin" });
    await signOut(auth);
    window.location.href = "../admin/admin-login.html";
  } catch (error) {
    alert("Logout failed: " + error.message);
  }
});

// ✅ Load analytics
async function loadAnalytics() {
  try {
    const [membersSnap, paymentsSnap, plansSnap] = await Promise.all([
      getDocs(collection(db, "customers")),
      getDocs(collection(db, "payments")),
      getDocs(collection(db, "plans")),
    ]);

    const totalMembers = membersSnap.size;
    const totalPlans = plansSnap.size;
    const totalPayments = paymentsSnap.size;
    let totalRevenue = 0;

    paymentsSnap.forEach((doc) => {
      const data = doc.data();
      totalRevenue += parseFloat(data.amount || 0);
    });

    totalMembersEl.textContent = totalMembers;
    activePlansEl.textContent = totalPlans;
    totalPaymentsEl.textContent = totalPayments;
    totalRevenueEl.textContent = `₹${totalRevenue.toLocaleString()}`;

    renderCharts(membersSnap, paymentsSnap);
  } catch (err) {
    console.error("Error loading analytics:", err);
  }
}

// ✅ Charts
function renderCharts(membersSnap, paymentsSnap) {
  const monthLabels = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const newMembersData = Array(12).fill(0);
  const monthlyRevenueData = Array(12).fill(0);

  membersSnap.forEach((doc) => {
    const data = doc.data();
    const created = data.createdAt?.toDate?.() || new Date();
    newMembersData[created.getMonth()]++;
  });

  paymentsSnap.forEach((doc) => {
    const data = doc.data();
    const date = data.date?.toDate?.() || new Date();
    monthlyRevenueData[date.getMonth()] += parseFloat(data.amount || 0);
  });

  if (window.membersChart instanceof Chart) window.membersChart.destroy();
  if (window.revenueChart instanceof Chart) window.revenueChart.destroy();

  const ctxRevenue = document.getElementById("revenueChart").getContext("2d");
  window.revenueChart = new Chart(ctxRevenue, {
    type: "bar",
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: "Monthly Revenue (₹)",
          data: monthlyRevenueData,
          backgroundColor: "#e50914",
        },
      ],
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } },
  });

  const ctxMembers = document.getElementById("membersChart").getContext("2d");
  window.membersChart = new Chart(ctxMembers, {
    type: "line",
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: "New Members",
          data: newMembersData,
          borderColor: "#e50914",
          backgroundColor: "rgba(229, 9, 20, 0.2)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } },
  });
}
