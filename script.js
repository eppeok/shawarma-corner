/* ==========================================================================
   Shawarma Corner — interactivity only.
   All menu content is static HTML (SEO + zero layout shift); this file
   just wires up search, nav, theme, hours badge and skeleton reveal.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;

  /* ---------------- Dark mode (persisted) ---------------- */
  var THEME_KEY = "scm-theme";
  var themeToggle = document.getElementById("themeToggle");

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    if (themeToggle) themeToggle.setAttribute("aria-pressed", theme === "dark");
  }

  var savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    applyTheme("dark");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var isDark = root.getAttribute("data-theme") === "dark";
      var next = isDark ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  /* ---------------- Open / Closed badge ---------------- */
  // Kitchen hours: 10:00 - 02:00 (next day), daily.
  var statusBadge = document.getElementById("statusBadge");
  if (statusBadge) {
    var now = new Date();
    var hour = now.getHours() + now.getMinutes() / 60;
    var isOpen = hour >= 10 || hour < 2;
    statusBadge.classList.add(isOpen ? "badge--open" : "badge--closed");
    statusBadge.querySelector(".status-text").textContent = isOpen
      ? "Open Now"
      : "Closed — Opens 10:00 AM";
    statusBadge.querySelector(".dot").setAttribute("aria-hidden", "true");
  }

  /* ---------------- Skeleton reveal ---------------- */
  window.addEventListener("load", function () {
    setTimeout(function () {
      body.classList.remove("is-loading");
    }, 220);
  });

  /* ---------------- Sticky nav: active section highlight ---------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".category-nav a"));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href").slice(1);
      return document.getElementById(id);
    })
    .filter(Boolean);

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      var match = link.getAttribute("href") === "#" + id;
      link.classList.toggle("active", match);
      if (match) {
        link.setAttribute("aria-current", "true");
        link.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActiveLink(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { observer.observe(s); });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        var offset = document.querySelector(".subnav").offsetHeight + 8;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: "smooth" });
        history.replaceState(null, "", "#" + id);
      }
    });
  });

  /* ---------------- Search / filter ---------------- */
  var searchInput = document.getElementById("menuSearch");
  var searchBox = document.querySelector(".search-box");
  var searchClear = document.querySelector(".search-clear");
  var searchStatus = document.getElementById("searchStatus");
  var allCards = Array.prototype.slice.call(document.querySelectorAll(".dish-card"));
  var allSections = Array.prototype.slice.call(document.querySelectorAll(".menu-section"));
  var noResults = document.getElementById("noResults");

  function runSearch() {
    var query = searchInput.value.trim().toLowerCase();
    searchBox.classList.toggle("has-value", query.length > 0);

    var visibleCount = 0;
    allCards.forEach(function (card) {
      var haystack = card.getAttribute("data-search") || "";
      var match = !query || haystack.indexOf(query) !== -1;
      card.classList.toggle("is-hidden", !match);
      if (match) visibleCount++;
    });

    allSections.forEach(function (section) {
      var visibleInSection = section.querySelectorAll(".dish-card:not(.is-hidden)").length;
      section.style.display = query && visibleInSection === 0 ? "none" : "";
    });

    if (query) {
      searchStatus.textContent =
        visibleCount === 0
          ? "No dishes found for “" + searchInput.value.trim() + "”"
          : visibleCount + " dish" + (visibleCount === 1 ? "" : "es") + " found";
    } else {
      searchStatus.textContent = "";
    }

    if (noResults) noResults.classList.toggle("show", query.length > 0 && visibleCount === 0);
  }

  if (searchInput) {
    searchInput.addEventListener("input", runSearch);
  }
  if (searchClear) {
    searchClear.addEventListener("click", function () {
      searchInput.value = "";
      runSearch();
      searchInput.focus();
    });
  }

  /* ---------------- Coupon copy ---------------- */
  var couponBtn = document.getElementById("couponCopy");
  if (couponBtn) {
    couponBtn.addEventListener("click", function () {
      var code = couponBtn.getAttribute("data-code");
      var fallback = function () {
        var el = document.createElement("textarea");
        el.value = code;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        try { document.execCommand("copy"); } catch (e) { /* no-op */ }
        document.body.removeChild(el);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).catch(fallback);
      } else {
        fallback();
      }
      couponBtn.setAttribute("data-copied", "true");
      var original = couponBtn.textContent;
      couponBtn.textContent = "Copied!";
      setTimeout(function () {
        couponBtn.removeAttribute("data-copied");
        couponBtn.textContent = original;
      }, 1800);
    });
  }
})();
