/**
 * Blessins.uk — Hero tunnel: one spoke per image (no shared hub), wide per-lane timing,
 * light sway so paths stay separated. Motion is time-driven only (no scroll scrub / speed freeze).
 */
(function () {
  "use strict";

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  const MANIFEST_URL = "/assets/portfolio-manifest.json";

  /** One lane per image up to this cap (desktop / mobile). */
  const LANE_CAP_DESKTOP = 56;
  const LANE_CAP_MOBILE = 28;
  /** Seconds per full travel — slightly snappier reads smoother than very slow drifts. */
  const DURATION_MIN = 7.2;
  const DURATION_MAX = 26;

  const ASPECT = "portrait";

  /** Deterministic 0..1 from lane index (stable paths, no Math.random pile-up). */
  function hash01(p, salt) {
    const x = Math.sin(p * 12.9898 + salt * 78.233 + p * p * 0.0013) * 43758.5453;
    return x - Math.floor(x);
  }

  async function loadManifest() {
    try {
      const res = await fetch(MANIFEST_URL, { cache: "no-store" });
      if (!res.ok) return { items: [] };
      return await res.json();
    } catch {
      return { items: [] };
    }
  }

  function createCard() {
    const wrap = document.createElement("div");
    wrap.className = "float-card float-card--" + ASPECT;
    const drift = document.createElement("div");
    drift.className = "float-card__drift";
    const inner = document.createElement("div");
    inner.className = "float-card__inner";
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "eager";
    img.decoding = "async";
    img.className = "float-card__img";
    inner.appendChild(img);
    drift.appendChild(inner);
    wrap.appendChild(drift);
    return { wrap, drift, inner, img };
  }

  /**
   * Even spacing along the viewport rectangle perimeter (no bunching in corners).
   * u in [0,1) → (outerX, outerY) just outside [0,1]² for a “tunnel to edge” read.
   * Mid-edge samples are nudged away from 0.5 so fewer spokes cut through the hero headline.
   */
  function alongAvoidCenter(along, gap) {
    const c = 0.5;
    if (along > c - gap && along < c + gap) {
      return along < c ? c - gap : c + gap;
    }
    return along;
  }

  function perimeterPointEven(u) {
    const bleed = 0.042;
    const margin = 0.18;
    /** Skip a strip around frame midpoints so tunnel lanes favour corners, not over the title. */
    const gap = 0.15;
    const pos = ((u % 1) + 1) % 1 * 4;
    const seg = Math.floor(pos) % 4;
    const t = pos % 1;
    let along = margin + t * (1 - 2 * margin);
    let outerX;
    let outerY;
    if (seg === 0) {
      along = alongAvoidCenter(along, gap);
      outerX = along;
      outerY = -bleed;
    } else if (seg === 1) {
      along = alongAvoidCenter(along, gap);
      outerX = 1 + bleed;
      outerY = along;
    } else if (seg === 2) {
      along = alongAvoidCenter(along, gap);
      outerX = along;
      outerY = 1 + bleed;
    } else {
      along = alongAvoidCenter(along, gap);
      outerX = -bleed;
      outerY = along;
    }
    return { outerX, outerY };
  }

  /**
   * One straight spoke per lane: shared center → unique outer point on the frame.
   * Different lanes never share the same line, so cards don’t ride the same track.
   * inner sits partway out from center (unique per lane) so hubs don’t collapse.
   */
  function buildLanePath(laneIndex, totalLanes) {
    const P = Math.max(totalLanes, 1);
    const u = ((laneIndex + 0.5) / P + hash01(laneIndex, 9) * 0.02) % 1;
    const outer = perimeterPointEven(u);

    /** Hub slightly low so “vanishing” reads under the headline block, not through its centre. */
    const cx = 0.5;
    const cy = 0.54;
    const dx = outer.outerX - cx;
    const dy = outer.outerY - cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len;
    const uy = dy / len;

    /** Start each spoke further out so tiles spend less time over the title ellipse. */
    const tInner = 0.2 + hash01(laneIndex, 3) * 0.22;
    const innerX = cx + ux * len * tInner;
    const innerY = cy + uy * len * tInner;

    const duration = DURATION_MIN + hash01(laneIndex, 1) * (DURATION_MAX - DURATION_MIN);
    const phase = hash01(laneIndex, 2);
    const swayAmp = 0.0025 + hash01(laneIndex, 5) * 0.005;
    const zJitter = (hash01(laneIndex, 4) - 0.5) * (totalLanes > 24 ? 4.2 : 3.2);
    const easeShape = 1 + hash01(laneIndex, 8) * 0.45;

    return {
      innerX,
      innerY,
      outerX: outer.outerX,
      outerY: outer.outerY,
      duration,
      phase,
      swayAmp,
      zJitter,
      easeShape,
    };
  }

  async function init() {
    const hero = document.getElementById("hero-z");
    const rotateLayer = document.getElementById("hero-z-rotate");
    const tunnelBack = document.getElementById("tunnel-back");
    const tunnelFront = document.getElementById("tunnel-front");
    const empty = document.getElementById("hero-z-empty");
    if (!hero || !rotateLayer || !tunnelBack || !tunnelFront) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const laneCap = isMobile ? LANE_CAP_MOBILE : LANE_CAP_DESKTOP;

    tunnelFront.innerHTML = "";
    tunnelFront.setAttribute("aria-hidden", "true");

    const data = await loadManifest();
    const rawItems = Array.isArray(data.items) ? data.items : [];
    const items = rawItems.map((it) => (typeof it === "string" ? { src: it } : it)).filter((it) => it && it.src);

    /* Manifest already lists hero-tiles first; use every image (do not hide portfolio when hero-tiles exist). */
    const tunnelItems = items;

    if (tunnelItems.length === 0) {
      if (empty) empty.hidden = false;
      hero.classList.add("is-ready");
      ScrollTrigger.refresh();
      return;
    }
    if (empty) empty.hidden = true;

    const enriched = tunnelItems.map((it) => ({ src: it.src }));
    const m = enriched.length;
    const P = m === 1 ? 1 : Math.min(m, laneCap);

    const lanes = [];

    for (let p = 0; p < P; p++) {
      const path = buildLanePath(p, P);
      const item = enriched[p % m];
      const { wrap, drift, inner, img } = createCard();
      img.src = item.src;
      tunnelBack.appendChild(wrap);
      lanes.push({
        ...path,
        wrap,
        drift,
        inner,
        img,
        laneIndex: p,
      });
    }

    hero.classList.add("is-ready");

    const curtainEase =
      typeof gsap.parseEase === "function"
        ? gsap.parseEase("power1.inOut")
        : function (t) {
            return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          };

    const t0 = performance.now();

    const zFar = isMobile ? -280 : -400;
    const zNearCap = 24;
    const zSep = isMobile ? 1.25 : 1.55;

    /**
     * Blur only while the card sits in the headline band (normalized stage coords).
     * Outside that ellipse → sharp (no blur).
     */
    function tunnelImgBlurPx(cx, cy) {
      if (reduce) return 0;
      const tcx = 0.5;
      const tcy = 0.43;
      const rx = isMobile ? 0.32 : 0.26;
      const ry = isMobile ? 0.19 : 0.15;
      const dx = (cx - tcx) / rx;
      const dy = (cy - tcy) / ry;
      const d2 = dx * dx + dy * dy;
      if (d2 >= 1) return 0;
      const maxB = isMobile ? 3.1 : 3.6;
      return maxB * Math.pow(1 - d2, 1.38);
    }

    function tickTunnel() {
      const t = (performance.now() - t0) / 1000;

      lanes.forEach((lane) => {
        const cycle = (((t / lane.duration + lane.phase) % 1) + 1) % 1;
        const shaped = reduce ? cycle : Math.pow(cycle, lane.easeShape || 1);
        const easeP = reduce ? 0.58 : curtainEase(shaped);

        let cx = lane.innerX + (lane.outerX - lane.innerX) * easeP;
        let cy = lane.innerY + (lane.outerY - lane.innerY) * easeP;

        const amp = lane.swayAmp || 0.004;
        const curtainSway =
          Math.sin((cycle * 1.17 + lane.phase * 2.1 + lane.laneIndex * 0.41) * Math.PI * 2) * amp * easeP;
        const curtainDrift =
          Math.cos((cycle * 0.93 + lane.phase * 1.6 + lane.laneIndex * 0.33) * Math.PI * 2) * amp * 0.65 * easeP;
        cx += curtainDrift;
        cy += curtainSway;

        const zBase = zFar + easeP * (zNearCap - zFar);
        const z = zBase + lane.laneIndex * zSep + (lane.zJitter || 0);

        /* Min scale 0.1 made layers ~10% size then upscaled → strong blur. Keep a higher floor. */
        const scMin = isMobile ? 0.42 : 0.48;
        const scMax = isMobile ? 0.96 : 1;
        const sc = scMin + easeP * (scMax - scMin);

        let op = 1;
        if (cycle < 0.05) op = cycle / 0.05;
        else if (cycle > 0.93) op = 1 - (cycle - 0.93) / 0.07;
        op *= 0.82 + easeP * 0.18;

        gsap.set(lane.wrap, {
          left: cx * 100 + "%",
          top: cy * 100 + "%",
          xPercent: -50,
          yPercent: -50,
          x: 0,
          y: 0,
          z: z,
          scale: sc,
          opacity: op,
          transformOrigin: "50% 50%",
          force3D: true,
        });

        gsap.set([lane.wrap, lane.drift, lane.inner], {
          filter: "none",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        });

        const bpx = tunnelImgBlurPx(cx, cy);
        if (bpx > 0.08) {
          gsap.set(lane.img, {
            filter: "blur(" + bpx.toFixed(2) + "px) saturate(1.06)",
          });
        } else {
          gsap.set(lane.img, { filter: "none" });
        }

        lane.drift.rotation = 0;
      });
    }

    if (reduce) {
      tickTunnel();
    } else {
      gsap.ticker.add(tickTunnel);
    }

    ScrollTrigger.refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
