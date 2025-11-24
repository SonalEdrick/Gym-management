// contact.js — Click-based dropdown + contact form handling
document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.querySelector(".dropdown");
  const dropdownContent = document.querySelector(".dropdown-content");
  const loginMain = document.getElementById("loginMain");

  // Dropdown logic
  if (dropdown && dropdownContent && loginMain) {
    loginMain.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdownContent.classList.toggle("show");
    });

    dropdownContent.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        dropdownContent.classList.remove("show");
      });
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdownContent.classList.remove("show");
      }
    });
  }

  // Contact form
  const form = document.getElementById("contactForm");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const message = document.getElementById("message").value.trim();

      if (!name || !email || !message) {
        alert("Please fill out all fields before sending.");
        return;
      }

      alert("Your message has been sent successfully! We'll get back to you soon.");
      form.reset();
    });
  }
});
