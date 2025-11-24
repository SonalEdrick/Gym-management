// about.js — Click-based dropdown + Card animation
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

  // Scroll-based animation for facility cards
  const cards = document.querySelectorAll(".card");

  if (cards.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.2 }
    );

    cards.forEach((card) => observer.observe(card));
  }
});
