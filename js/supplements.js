// js/supplement.js
import { db, auth, logEvent } from "../firebase/firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const container = document.getElementById("supplementsContainer");

// Track login state (for Buy button redirection)
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// ✅ Fetch supplements from Firestore
async function loadSupplements() {
  try {
    await logEvent("view", { page: "supplement-store" });

    const supplementsRef = collection(db, "supplements");
    const q = query(supplementsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `<p>No supplements available right now.</p>`;
      return;
    }

    let html = "";
    snap.forEach((doc) => {
      const s = doc.data();
      const image = s.imageURL || "https://via.placeholder.com/250x180?text=No+Image";
      html += `
        <div class="supplement-card">
          <img src="${image}" alt="${s.name}" />
          <h3>${s.name}</h3>
          <p>${s.description || "No description available."}</p>
          <p class="price">₹${s.price || "0"}</p>
          <button class="buy-btn" data-name="${s.name}" data-id="${doc.id}">Buy Now</button>
        </div>
      `;
    });

    container.innerHTML = html;

    // Add Buy Now handlers
    document.querySelectorAll(".buy-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const name = btn.dataset.name;
        await logEvent("click", { target: "supplement-buy", name });

        if (!currentUser) {
          alert("Please login to purchase supplements.");
          window.location.href = "customer/customer-login.html";
          return;
        }

        alert(`You selected: ${name}. (Purchasing coming soon!)`);
      });
    });
  } catch (err) {
    console.error("Error loading supplements:", err);
    container.innerHTML = `<p>Error loading supplements. Please try again later.</p>`;
  }
}

// ✅ Run on page load
loadSupplements();
