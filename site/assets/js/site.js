/* Site shell: mobile navigation and restrained scroll reveals */
(() => {
  "use strict";

  const nav = document.querySelector("[data-site-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");

  function setMenu(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    const label = toggle.querySelector(".sr-only");
    if (label) label.textContent = open ? "Close menu" : "Open menu";
    if (open) {
      const firstLink = nav.querySelector("a");
      if (firstLink) firstLink.focus();
    }
  }

  if (nav && toggle) {
    toggle.addEventListener("click", () => {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setMenu(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760 && nav.classList.contains("is-open")) setMenu(false);
    });
  }

  const reveals = Array.from(document.querySelectorAll(".reveal"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reveals.length) return;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  reveals.forEach((element, index) => {
    if (element.parentElement) {
      const siblings = Array.from(element.parentElement.querySelectorAll(":scope > .reveal"));
      if (siblings.length > 1) element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    }
    observer.observe(element);
  });
})();
