const revealItems = document.querySelectorAll(".reveal");
const cursorGlow = document.querySelector(".cursor-glow");
const parallaxSections = document.querySelectorAll("[data-parallax]");

// Reveal sections once, so repeated scrolling stays lightweight.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.14,
  rootMargin: "0px 0px -48px"
});

revealItems.forEach((item) => revealObserver.observe(item));

// A soft pointer glow gives desktop users feedback without changing layout.
window.addEventListener("pointermove", (event) => {
  if (!cursorGlow) {
    return;
  }

  cursorGlow.style.transform = `translate(${event.clientX - 180}px, ${event.clientY - 180}px)`;
}, { passive: true });

// Store parallax offset in CSS so design changes stay in stylesheets.
window.addEventListener("scroll", () => {
  const offset = window.scrollY * 0.08;

  parallaxSections.forEach((section) => {
    section.style.setProperty("--parallax-offset", `${offset}px`);
  });
}, { passive: true });
