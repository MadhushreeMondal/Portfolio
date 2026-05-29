// Portfolio interactivity:
// 1) Active navbar highlighting while scrolling
// 2) Subtle reveal animations on scroll
// 3) Scroll-to-top button
// 4) Mobile menu toggle

function throttle(fn, waitMs) {
  let lastCall = 0;
  let timeoutId = null;

  return function throttled(...args) {
    const now = Date.now();
    const remaining = waitMs - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Smooth anchor navigation (respects sticky header via scroll-margin-top CSS)
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "start" });

      // If mobile menu is open, close it after navigation
      const nav = document.querySelector("[data-nav]");
      const menuToggle = document.querySelector("[data-menu-toggle]");
      if (nav && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  // Mobile menu toggle
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (menuToggle && nav) {
    const setMenuOpen = (isOpen) => {
      nav.classList.toggle("is-open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = !nav.classList.contains("is-open");
      setMenuOpen(isOpen);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    });

    document.addEventListener("click", (e) => {
      // Close menu when clicking outside (only on small screens, but harmless elsewhere)
      const target = e.target;
      const clickedInsideNav = nav.contains(target);
      const clickedToggle = menuToggle.contains(target);
      if (!clickedInsideNav && !clickedToggle) setMenuOpen(false);
    });
  }

  // Reveal animation (subtle, not overused)
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  // Stat counter animation (when stats enter view)
  const statEls = Array.from(document.querySelectorAll("[data-stat]"));
  const animateStat = (el) => {
    const target = Number(el.getAttribute("data-stat"));
    const suffix = el.getAttribute("data-stat-suffix") || "";
    const decimals = Number(el.getAttribute("data-stat-decimals") || "0");
    if (!Number.isFinite(target)) return;

    const duration = 900;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent =
        decimals > 0 ? value.toFixed(decimals) + suffix : Math.round(value) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if (statEls.length) {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateStat(entry.target);
          statObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    statEls.forEach((el) => statObserver.observe(el));
  }

  // Active navbar highlighting — scroll position + click
  const sectionLinks = Array.from(
    document.querySelectorAll(".nav-link[data-nav-link]")
  );
  const sectionEls = sectionLinks
    .map((a) => {
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("#")) return null;
      return document.querySelector(href);
    })
    .filter(Boolean);

  const setActiveNav = (activeId) => {
    sectionLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const id = href.replace("#", "");
      link.classList.toggle("active", id === activeId);
    });
  };

  const getActiveSectionId = () => {
    const headerOffset =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--header-h"),
        10
      ) || 72;
    const marker = window.scrollY + headerOffset + 120;

    let activeId = sectionEls[0]?.id || "home";
    sectionEls.forEach((section) => {
      if (section.offsetTop <= marker) activeId = section.id;
    });
    return activeId;
  };

  const updateActiveNav = () => {
    setActiveNav(getActiveSectionId());
  };

  const hashId = window.location.hash.replace("#", "");
  if (hashId && sectionEls.some((s) => s.id === hashId)) {
    setActiveNav(hashId);
  } else {
    updateActiveNav();
  }

  sectionLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const href = link.getAttribute("href") || "";
      if (href.startsWith("#")) setActiveNav(href.replace("#", ""));
    });
  });

  window.addEventListener("scroll", throttle(updateActiveNav, 80));
  window.addEventListener("resize", throttle(updateActiveNav, 120));

  // Contact form → mailto with prefilled body
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(contactForm);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const message = String(data.get("message") || "").trim();
      const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\n${message}`
      );
      window.location.href = `mailto:shreemadhumondal@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  // Scroll-to-top button
  const scrollTopBtn = document.getElementById("scrollTop");
  if (scrollTopBtn) {
    const update = () => {
      scrollTopBtn.classList.toggle("show", window.scrollY > 600);
    };

    update();
    window.addEventListener("scroll", throttle(update, 120));

    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});

