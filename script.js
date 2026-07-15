/* ==========================================================================
   Shawarma Corner — interactivity only.
   All menu content is static HTML (SEO + zero layout shift); this file
   just wires up search, nav, theme, cart UI, hours badge and skeleton reveal.
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

  /* ---------------- Quantity steppers ---------------- */
  document.querySelectorAll(".qty-control").forEach(function (control) {
    var display = control.querySelector("span");
    var minus = control.querySelector('[data-action="decrease"]');
    var plus = control.querySelector('[data-action="increase"]');
    var qty = 1;

    function render() { display.textContent = qty; }

    minus.addEventListener("click", function () {
      qty = Math.max(1, qty - 1);
      render();
    });
    plus.addEventListener("click", function () {
      qty = Math.min(20, qty + 1);
      render();
    });
  });

  /* ---------------- Cart (UI only, persisted for demo realism) ---------------- */
  var CART_KEY = "scm-cart";
  var cart = [];
  try {
    cart = JSON.parse(sessionStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    cart = [];
  }

  var cartBar = document.getElementById("cartBar");
  var cartPanel = document.getElementById("cartPanel");
  var cartList = document.getElementById("cartList");
  var cartTotalEl = document.getElementById("cartTotal");
  var cartCountEl = document.getElementById("cartCount");
  var scrim = document.getElementById("scrim");

  function money(n) { return "AED " + n.toFixed(2); }

  function persistCart() {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function renderCart() {
    var count = cart.reduce(function (sum, i) { return sum + i.qty; }, 0);
    var total = cart.reduce(function (sum, i) { return sum + i.qty * i.price; }, 0);

    if (count > 0) {
      cartBar.classList.add("show");
      cartBar.querySelector(".cart-bar__info").innerHTML =
        "<span>" + count + "</span> item" + (count === 1 ? "" : "s") + " · " + money(total);
    } else {
      cartBar.classList.remove("show");
    }

    if (cartCountEl) cartCountEl.textContent = count;
    if (cartTotalEl) cartTotalEl.textContent = money(total);

    cartList.innerHTML = "";
    if (cart.length === 0) {
      cartList.innerHTML = '<p class="cart-empty">Your cart is empty. Add a dish to get started.</p>';
      return;
    }
    cart.forEach(function (item, index) {
      var row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML =
        '<div><div class="cart-item__name">' + item.name + '</div>' +
        '<div class="cart-item__meta">Qty ' + item.qty + ' · ' + money(item.price * item.qty) + '</div></div>' +
        '<button class="cart-item__remove" type="button" aria-label="Remove ' + item.name + '">Remove</button>';
      row.querySelector(".cart-item__remove").addEventListener("click", function () {
        cart.splice(index, 1);
        persistCart();
        renderCart();
      });
      cartList.appendChild(row);
    });
  }

  document.querySelectorAll(".add-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".dish-card");
      var name = card.querySelector(".dish-title-row h3").textContent.trim();
      var price = parseFloat(card.getAttribute("data-price"));
      var qtyEl = card.querySelector(".qty-control span");
      var qty = qtyEl ? parseInt(qtyEl.textContent, 10) : 1;

      var existing = cart.find(function (i) { return i.name === name; });
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({ name: name, price: price, qty: qty });
      }
      persistCart();
      renderCart();

      btn.classList.add("added");
      var original = btn.innerHTML;
      btn.innerHTML = "Added";
      setTimeout(function () {
        btn.classList.remove("added");
        btn.innerHTML = original;
      }, 1200);
    });
  });

  function openCart() {
    cartPanel.classList.add("open");
    scrim.classList.add("show");
    cartPanel.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    cartPanel.classList.remove("open");
    scrim.classList.remove("show");
    cartPanel.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  var viewCartBtn = document.getElementById("viewCartBtn");
  var closeCartBtn = document.getElementById("closeCartBtn");
  if (viewCartBtn) viewCartBtn.addEventListener("click", openCart);
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
  if (scrim) scrim.addEventListener("click", closeCart);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeCart();
  });

  renderCart();

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
