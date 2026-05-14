(function () {
  "use strict";

  const packages = [
    {
      id: "starter",
      name: "Starter",
      price: 79,
      featured: false,
      target: "Best for small businesses & new brands",
      highlights: [
        "2 social media platforms",
        "12 posts per month",
        "Basic graphic design",
        "Captions + hashtags",
        "Monthly content calendar",
        "Basic engagement (replies & likes)",
        "Monthly performance report",
      ],
    },
    {
      id: "growth",
      name: "Growth",
      price: 159,
      featured: true,
      target: "Best for growing businesses",
      highlights: [
        "3 social media platforms",
        "20 posts per month",
        "Custom graphics & reels",
        "Hashtag research",
        "Engagement management",
        "Story posting (8 / month)",
        "Monthly analytics report",
        "Competitor research",
      ],
    },
    {
      id: "professional",
      name: "Professional",
      price: 319,
      featured: false,
      target: "Best for established brands",
      highlights: [
        "4 social media platforms",
        "30 posts per month",
        "Reels / short videos (8 / month)",
        "Advanced branding design",
        "Daily engagement",
        "Ad campaign setup",
        "Influencer outreach assistance",
        "Detailed analytics report",
        "Strategy call (1 / month)",
      ],
    },
  ];

  const matrix = {
    "Ideal for": [
      "Small businesses & new brands",
      "Growing businesses",
      "Established brands",
    ],
    "Social platforms": ["2", "3", "4"],
    "Posts per month": ["12", "20", "30"],
    "Graphic design": ["Basic", "Custom graphics & reels", "Advanced branding"],
    "Captions + hashtags": ["✓", "✓", "✓"],
    "Monthly content calendar": ["✓", "—", "—"],
    "Engagement": ["Basic (replies & likes)", "Full management", "Daily"],
    "Reporting": [
      "Monthly performance report",
      "Monthly analytics report",
      "Detailed analytics + 1 strategy call / mo",
    ],
    "Hashtag research": ["—", "✓", "✓"],
    "Competitor research": ["—", "✓", "—"],
    "Story posting": ["—", "8 / month", "—"],
    "Reels / short videos": ["—", "Included in creative", "8 / month"],
    "Ad campaign setup": ["—", "—", "✓"],
    "Influencer outreach assistance": ["—", "—", "✓"],
  };

  const cardsRoot = document.getElementById("pricing-cards");
  const tableWrap = document.getElementById("pricing-table-wrap");
  const table = document.getElementById("pricing-table");
  const viewCardsBtn = document.getElementById("view-cards");
  const viewTableBtn = document.getElementById("view-table");

  let activeId = packages.find((p) => p.featured)?.id || packages[0].id;

  function formatPrice(n) {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(n);
  }

  function renderCards() {
    if (!cardsRoot) return;
    cardsRoot.innerHTML = "";
    packages.forEach((pkg, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pricing-card" + (pkg.featured ? " is-featured" : "");
      btn.dataset.packageId = pkg.id;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", pkg.id === activeId ? "true" : "false");
      btn.id = "tab-" + pkg.id;

      if (pkg.id === activeId) btn.classList.add("is-active");

      const name = document.createElement("span");
      name.className = "pricing-card__name";
      name.textContent = pkg.name;

      const target = document.createElement("p");
      target.className = "pricing-card__target";
      target.textContent = pkg.target;

      const price = document.createElement("div");
      price.className = "pricing-card__price";
      price.innerHTML = formatPrice(pkg.price) + " <small>/ month</small>";

      const ul = document.createElement("ul");
      ul.className = "pricing-card__features";
      pkg.highlights.forEach((h) => {
        const li = document.createElement("li");
        li.textContent = h;
        ul.appendChild(li);
      });

      const hint = document.createElement("p");
      hint.className = "pricing-card__expand";
      hint.textContent =
        pkg.id === activeId ? "Selected — open Compare to see matrix" : "Select to highlight column";

      btn.appendChild(name);
      btn.appendChild(target);
      btn.appendChild(price);
      btn.appendChild(ul);
      btn.appendChild(hint);

      btn.addEventListener("click", () => {
        activeId = pkg.id;
        renderCards();
        syncTableHighlight();
      });

      btn.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          const next = packages[(index + 1) % packages.length];
          document.getElementById("tab-" + next.id)?.focus();
          activeId = next.id;
          renderCards();
          syncTableHighlight();
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          const prev = packages[(index - 1 + packages.length) % packages.length];
          document.getElementById("tab-" + prev.id)?.focus();
          activeId = prev.id;
          renderCards();
          syncTableHighlight();
        }
      });

      cardsRoot.appendChild(btn);
    });
  }

  function buildTable() {
    if (!table) return;
    const theadRow = table.querySelector("thead tr");
    if (!theadRow) return;
    theadRow.innerHTML = "<th scope=\"col\">Feature</th>";
    packages.forEach((pkg) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.dataset.packageId = pkg.id;
      th.innerHTML =
        "<span class=\"muted\">" +
        pkg.name +
        "</span><br><strong>" +
        formatPrice(pkg.price) +
        "</strong><small> / mo</small>";
      theadRow.appendChild(th);
    });

    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    Object.entries(matrix).forEach(([label, cells]) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = label;
      tr.appendChild(th);
      cells.forEach((cell, i) => {
        const td = document.createElement("td");
        td.dataset.packageId = packages[i].id;
        const isCheck = cell === "✓";
        td.className = isCheck ? "check" : "muted";
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    syncTableHighlight();
  }

  function syncTableHighlight() {
    const colSelector = "[data-package-id=\"" + activeId + "\"]";
    table?.querySelectorAll(".col-highlight").forEach((el) => el.classList.remove("col-highlight"));
    table?.querySelectorAll(colSelector).forEach((el) => {
      if (el.tagName === "TH" || el.tagName === "TD") el.classList.add("col-highlight");
    });
  }

  function setView(mode) {
    const isTable = mode === "table";
    viewCardsBtn?.classList.toggle("chip--active", !isTable);
    viewTableBtn?.classList.toggle("chip--active", isTable);
    cardsRoot?.classList.toggle("hidden", isTable);
    tableWrap?.classList.toggle("hidden", !isTable);
  }

  viewCardsBtn?.addEventListener("click", () => setView("cards"));
  viewTableBtn?.addEventListener("click", () => setView("table"));

  renderCards();
  buildTable();

  /* Horizontal studio slides ↔ rail */
  const horizontalScroll = document.getElementById("horizontal-scroll");
  const railDots = document.querySelectorAll(".slide-rail__dot");

  function syncRailToScroll() {
    if (!horizontalScroll) return;
    const pieces = horizontalScroll.querySelectorAll(".studio-curtain-piece");
    if (pieces.length > 0) {
      const mark = window.innerHeight * 0.35;
      let idx = 0;
      pieces.forEach(function (piece, i) {
        const r = piece.getBoundingClientRect();
        if (r.top <= mark) idx = i;
      });
      railDots.forEach((dot, i) => {
        const on = i === idx;
        dot.classList.toggle("is-active", on);
        if (on) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      return;
    }
    const w = horizontalScroll.clientWidth || 1;
    const slideCount = document.querySelectorAll(".slide-panel").length || 1;
    const idx = Math.min(
      slideCount - 1,
      Math.max(0, Math.round(horizontalScroll.scrollLeft / w))
    );
    railDots.forEach((dot, i) => {
      const on = i === idx;
      dot.classList.toggle("is-active", on);
      if (on) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  window.addEventListener("load", syncRailToScroll);

  railDots.forEach((dot, i) => {
    dot.addEventListener("click", (e) => {
      e.preventDefault();
      const pieces = horizontalScroll?.querySelectorAll(".studio-curtain-piece");
      if (pieces && pieces[i]) {
        pieces[i].scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const w = horizontalScroll?.clientWidth || 0;
      horizontalScroll?.scrollTo({ left: i * w, behavior: "smooth" });
    });
  });

  /* Top bar: contrast when past hero + light logo on dark bands */
  const topbar = document.getElementById("topbar");
  const heroZ = document.getElementById("hero-z");
  const darkBandSelectors = "[data-topbar-theme=\"dark\"]";

  function updateTopbarDarkBand() {
    if (!topbar) return;
    const probeY = 52;
    let onDark = false;
    document.querySelectorAll(darkBandSelectors).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (probeY >= r.top && probeY <= r.bottom) onDark = true;
    });
    topbar.classList.toggle("topbar--on-dark", onDark);
  }

  function onWindowScroll() {
    const threshold = (heroZ?.offsetHeight || 0) - 80;
    topbar?.classList.toggle("is-scrolled", window.scrollY > threshold);
    updateTopbarDarkBand();
    window.requestAnimationFrame(syncRailToScroll);
  }

  window.addEventListener("scroll", onWindowScroll, { passive: true });
  onWindowScroll();
  window.addEventListener(
    "resize",
    function () {
      updateTopbarDarkBand();
      syncRailToScroll();
    },
    { passive: true }
  );

  /* Mobile menu */
  const burger = document.querySelector(".topbar__burger");
  const nav = document.querySelector(".topbar__nav");
  burger?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.querySelectorAll(".topbar__links a").forEach((a) => {
    a.addEventListener("click", () => {
      nav?.classList.remove("is-open");
      burger?.setAttribute("aria-expanded", "false");
    });
  });

  /* Section reveals */
  const revealEls = document.querySelectorAll(".section-reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) en.target.classList.add("is-visible");
      });
    },
    { rootMargin: "-8% 0px -8% 0px", threshold: 0.05 }
  );
  revealEls.forEach((el) => io.observe(el));

  /* Contact → mailto */
  const form = document.getElementById("contact-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const body = String(fd.get("body") || "").trim();
    if (!name || !email || !body) return;
    const subject = encodeURIComponent("Blessins.uk enquiry from " + name);
    const text = encodeURIComponent(
      "Name: " + name + "\nEmail: " + email + "\n\n" + body
    );
    window.location.href =
      "mailto:benedictions.uk@gmail.com?subject=" + subject + "&body=" + text;
  });
})();
