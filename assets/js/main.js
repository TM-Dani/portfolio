const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const rippleTargets = document.querySelectorAll(".ripple");

function getCleanUrl() {
  const isIndexPage = /\/index\.html$/i.test(window.location.pathname);
  const cleanPath = isIndexPage
    ? window.location.pathname.replace(/index\.html$/i, "")
    : window.location.pathname;

  return `${cleanPath}${window.location.search}`;
}

function cleanCurrentUrl() {
  const cleanUrl = getCleanUrl();

  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== cleanUrl) {
    window.history.replaceState(null, document.title, cleanUrl);
  }
}

function setupCleanSectionNavigation() {
  document.querySelectorAll("[data-target]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const targetId = link.getAttribute("data-target");
      const target = document.getElementById(targetId);

      if (!target) {
        return;
      }

      closeMobileNavigation();
      const headerOffset = header ? header.offsetHeight : 0;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: Math.max(targetPosition, 0),
        behavior: "smooth",
      });

      window.history.replaceState(null, "", window.location.pathname);
    });
  });
}

function setHeaderState() {
  if (header) {
    header.classList.toggle("scrolled", window.scrollY > 18);
  }
}

function closeMobileNavigation() {
  if (!navLinks || !navToggle) {
    return;
  }

  navLinks.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      closeMobileNavigation();
    }
  });
}

rippleTargets.forEach((target) => {
  target.addEventListener("click", (event) => {
    const rect = target.getBoundingClientRect();
    const circle = document.createElement("span");

    circle.className = "ripple-circle";
    circle.style.left = `${event.clientX - rect.left}px`;
    circle.style.top = `${event.clientY - rect.top}px`;
    target.append(circle);

    window.setTimeout(() => circle.remove(), 600);
  });
});

cleanCurrentUrl();
setupCleanSectionNavigation();
setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });
