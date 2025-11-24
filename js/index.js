// index.js — Dropdown + Start Now navigation
document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.querySelector(".dropdown");
  const dropdownContent = document.querySelector(".dropdown-content");
  const loginMain = document.getElementById("loginMain");
  const startBtn = document.getElementById("startBtn");

  // Dropdown toggle
  if (dropdown && dropdownContent && loginMain) {
    loginMain.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdownContent.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdownContent.classList.remove("show");
      }
    });

    // Close when selecting an option
    dropdownContent.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        dropdownContent.classList.remove("show");
      });
    });
  }

  // Redirect Start button
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      window.location.href = "customer/customer-login.html";
    });
  }
});
