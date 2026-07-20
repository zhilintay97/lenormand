(function () {
  const MOBILE_QUERY = window.matchMedia("(max-width: 720px)");

  // ---------- NAV (burger menu, runs on every page) ----------
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("mainNav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("open", open);
      document.body.classList.toggle("nav-open", open);
    }

    toggle.addEventListener("click", () => {
      setOpen(!nav.classList.contains("open"));
    });

    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    MOBILE_QUERY.addEventListener("change", (e) => {
      if (!e.matches) setOpen(false);
    });
  }

  // ---------- SCROLL FADE-UP ----------
  function initFadeUp() {
    const targets = document.querySelectorAll(".fade-up");
    if (!targets.length || !("IntersectionObserver" in window)) {
      targets.forEach(el => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(el => io.observe(el));
  }

  // ---------- AUDIO (card flip sound) ----------
  // Spread pages live at /spreads/<slug>/, so /sounds/card.mp3 is two levels up.
  const FLIP_SOUND_SRC = "../../sounds/card.mp3";
  const FLIP_VOLUME = 0.65;

  function playFlipSound() {
    try {
      const a = new Audio(FLIP_SOUND_SRC);
      a.volume = FLIP_VOLUME;
      a.play().catch(() => {}); // ignore autoplay/permission errors silently
    } catch {}
  }

  // ---------- DRAW MECHANICS ----------
  // Spread pages live at /spreads/<slug>/, so /images/cards/X.png is two
  // levels up. Card pages live at /cards/<slug>/, so the same prefix works.
  const IMG_BASE = "../../images/cards/";
  const FLIP_STAGGER_MS = 140;

  function buildCardElement(position, card) {
    const cardEl = document.createElement("div");
    cardEl.className = "card " + (card ? "drawn" : "empty");

    const imgSlug = card ? card.slug : "back";
    const imgAlt  = card ? `雷诺曼${card.name}牌` : "牌背";

    // When drawn, the image and the name both link to the card's own page
    // in a new tab — readings are session-only.
    const faceInner = `
        <div class="card-face">
          <img src="${IMG_BASE}${imgSlug}.png" alt="${escapeHTML(imgAlt)}" />
        </div>`;
    const faceHTML = card
      ? `<a class="card-face-link" href="../../cards/${card.slug}/" target="_blank" rel="noopener" aria-label="打开${escapeHTML(card.name)}的牌义页">${faceInner}
      </a>`
      : faceInner;

    const cardNameHTML = card
      ? `<a class="card-name-link" href="../../cards/${card.slug}/" target="_blank" rel="noopener">${escapeHTML(card.name)}</a>`
      : "";

    const inlineInterp = card
      ? `<div class="card-interpretation">${getCardInterpretation(card, position.label)}</div>`
      : "";

    cardEl.innerHTML = `${faceHTML}
      <div class="card-name">${cardNameHTML}</div>
      <div class="card-position">${escapeHTML(position.label)}</div>
      <div class="card-meaning">${escapeHTML(position.meaning)}</div>
      ${inlineInterp}
    `;
    return cardEl;
  }

  function renderSpread(spread, drawnCards) {
    const grid = document.getElementById("spreadGrid");
    if (!grid) return;
    grid.innerHTML = "";
    spread.positions.forEach((position, i) => {
      const card = drawnCards ? drawnCards[i] : null;
      grid.appendChild(buildCardElement(position, card));
    });
  }

  function revealCardAt(spread, index, card) {
    const grid = document.getElementById("spreadGrid");
    if (!grid) return;
    const oldEl = grid.children[index];
    if (!oldEl) return;
    grid.replaceChild(buildCardElement(spread.positions[index], card), oldEl);
  }

  function renderInterpretation(spread, drawnCards) {
    const container = document.getElementById("interpretation");
    const content = document.getElementById("interpretationContent");
    if (!container || !content) return;
    content.innerHTML = getReadingSummary(spread, drawnCards);
    container.classList.add("visible");
  }

  // ---------- INIT ----------
  initNav();
  initFadeUp();

  const spreadKey = document.body.dataset.spread;
  if (!spreadKey || typeof SPREADS === "undefined" || !SPREADS[spreadKey]) return;

  const spread = SPREADS[spreadKey];
  const deck = buildDeck();

  renderSpread(spread, null);

  const drawBtn = document.getElementById("drawBtn");

  function performDraw() {
    const drawn = drawCards(deck, spread.cards);

    // Reset to backs first so users see the cards "go face-down"
    // before the new deal begins.
    renderSpread(spread, null);

    // Mobile: scroll to first card so the deal is visible.
    if (MOBILE_QUERY.matches) {
      requestAnimationFrame(() => {
        const firstCard = document.querySelector(".spread-grid .card");
        if (firstCard) firstCard.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    // Reveal each card one at a time, with a flip sound on each.
    drawn.forEach((card, i) => {
      setTimeout(() => {
        revealCardAt(spread, i, card);
        playFlipSound();
      }, i * FLIP_STAGGER_MS);
    });

    const totalDealMs = drawn.length * FLIP_STAGGER_MS + 350;
    setTimeout(() => {
      renderInterpretation(spread, drawn);
      document.body.classList.add("has-drawn");
      if (drawBtn) drawBtn.textContent = "重新洗牌并抽取";
    }, totalDealMs);
  }

  if (drawBtn) drawBtn.addEventListener("click", performDraw);
})();
