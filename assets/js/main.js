const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const rippleTargets = document.querySelectorAll(".ripple");

function normalizeHomeUrl() {
  const isIndexPage = /\/index\.html$/i.test(window.location.pathname);
  const isRootPage = window.location.pathname === "/" || window.location.pathname === "";
  const isHomeHash = window.location.hash === "#home";
  const shouldNormalize = (isIndexPage && (!window.location.hash || isHomeHash)) || (isRootPage && isHomeHash);

  if (!shouldNormalize) {
    return;
  }

  const cleanPath = isIndexPage
    ? window.location.pathname.replace(/index\.html$/i, "")
    : window.location.pathname;

  window.history.replaceState(null, document.title, `${cleanPath}${window.location.search}`);
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

normalizeHomeUrl();
setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });
