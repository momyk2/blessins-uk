/**
 * Logo Design slide (#slide-01)
 *
 * PREVIOUS (flat grid) — preserved when USE_LOGO_ORBIT_EXPERIMENT is false:
 * - Per-tile GSAP spins on .logo-type-tile__stage (mixed Y/X/Z, ~4.5–6.5s spins, tilt loops faster).
 * - Hover: pause all tile loops; hovered tile scales up (CSS).
 * - Heading: per-letter “pen” entrance + underline draw; idle loop is a subtle sway on the signature line.
 * - Entrance: bg / heading / body / tiles from(); tiles do NOT tween opacity.
 * - IO + scroll fallbacks on #slide-01.
 *
 * EXPERIMENT (orbit): eight tangential faces on a cylinder; double-sided markup in HTML + mirrored back (CSS).
 */
(function () {
  "use strict";

  /** Set false to restore flat 4×2 grid + independent per-tile spin timelines. */
  var USE_LOGO_ORBIT_EXPERIMENT = true;

  function primaryTileStage(tile) {
    return tile.querySelector(".logo-type-tile__stage--front") || tile.querySelector(".logo-type-tile__stage");
  }

  const slide = document.getElementById("slide-01");
  const root = slide ? slide.querySelector(".slide-logo-studio") : null;
  if (!slide || !root) return;

  const heading = root.querySelector(".slide-logo-studio__heading");
  const bodyEl = root.querySelector(".slide-logo-studio__body");
  const tiles = root.querySelectorAll(".logo-type-tile");
  const grid = root.querySelector(".slide-logo-studio__grid");
  const orbitAxis = grid ? grid.querySelector(".logo-orbit__axis") : null;
  const orbitDock = grid ? grid.querySelector(".logo-orbit__dock") : null;
  const bg = slide.querySelector(".slide-panel__bg-photo");
  const tileLoopAnims = [];
  let headingLoopAnim = null;
  let tileHoverDepth = 0;
  let loopsStarted = false;
  let entranceStarted = false;
  let hoverPauseWired = false;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const useOrbit =
    USE_LOGO_ORBIT_EXPERIMENT &&
    !prefersReducedMotion &&
    !!grid &&
    !!orbitAxis &&
    !!orbitDock &&
    tiles.length >= 2;

  let orbitFrontTickAdded = false;
  let lastOrbitDockIdx = -1;

  /** Which tile actually covers the most screen area (matches what the eye reads as “front”). */
  function orbitFrontIndexFromDom() {
    let best = 0;
    let bestScore = -Infinity;
    let i;
    for (i = 0; i < tiles.length; i += 1) {
      const r = tiles[i].getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      const score = r.width * r.height;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  }

  function syncOrbitDock() {
    if (!useOrbit || !orbitAxis || !orbitDock || !tiles.length) return;
    const idx = orbitFrontIndexFromDom();
    if (idx === lastOrbitDockIdx) return;
    lastOrbitDockIdx = idx;
    const cap = tiles[idx].querySelector(".logo-type-tile__cap");
    if (cap) orbitDock.innerHTML = cap.innerHTML;
  }

  function pauseTileLoops() {
    tileLoopAnims.forEach(function (anim) {
      if (anim && typeof anim.pause === "function") anim.pause();
    });
  }

  function resumeTileLoops() {
    tileLoopAnims.forEach(function (anim) {
      if (anim && typeof anim.resume === "function") anim.resume();
    });
  }

  function wireTileHoverPause() {
    if (hoverPauseWired || !grid || !tiles.length) return;
    hoverPauseWired = true;
    tiles.forEach(function (tile) {
      tile.addEventListener("mouseenter", function () {
        tileHoverDepth += 1;
        if (tileHoverDepth === 1) pauseTileLoops();
      });
      tile.addEventListener("mouseleave", function () {
        tileHoverDepth = Math.max(0, tileHoverDepth - 1);
        if (tileHoverDepth === 0) resumeTileLoops();
      });
    });
  }

  /** Cylinder / “cube ring”: one axis tween, ~2.25s per face at front (360 / 8). */
  function startLogoOrbitLoop() {
    const g = window.gsap;
    if (!g || loopsStarted || !orbitAxis) return;
    loopsStarted = true;

    g.set(tiles, { opacity: 1, visibility: "visible", clearProps: "opacity" });
    tiles.forEach(function (tile) {
      const stage = primaryTileStage(tile);
      if (stage) g.set(stage, { clearProps: "transform" });
    });

    g.set(orbitAxis, {
      transformOrigin: "50% 50%",
      force3D: true,
      transformPerspective: 1400,
      rotationY: 0,
      z: 0.01,
    });
    const anim = g.to(orbitAxis, {
      rotationY: "+=360",
      duration: 28,
      repeat: -1,
      ease: "none",
      force3D: true,
      transformPerspective: 1400,
    });
    if (!orbitFrontTickAdded) {
      orbitFrontTickAdded = true;
      g.ticker.add(syncOrbitDock);
    }
    syncOrbitDock();
    tileLoopAnims.push(anim);
    /* Orbit tiles overlap in screen space — hover would pin pause on one stacked figure */
    if (!useOrbit) wireTileHoverPause();
  }

  /**
   * Flat grid: each tile its own infinite tween (previous behaviour).
   */
  function startLogoTileLoops() {
    const g = window.gsap;
    if (!g || loopsStarted || !tiles.length) return;
    loopsStarted = true;

    g.set(tiles, { opacity: 1, visibility: "visible", clearProps: "transform" });

    tiles.forEach(function (tile, i) {
      const stage = primaryTileStage(tile);
      if (!stage) return;

      g.set(stage, {
        transformOrigin: "50% 55%",
        force3D: true,
        transformPerspective: 640,
      });

      const spin = {
        ease: "none",
        repeat: -1,
        transformPerspective: 640,
      };

      let anim;
      switch (i) {
        case 0:
          anim = g.to(stage, Object.assign({}, spin, { rotationY: 360, duration: 4.5 }));
          break;
        case 1:
          anim = g.to(stage, Object.assign({}, spin, { rotationY: -360, duration: 5.5 }));
          break;
        case 2:
          anim = g.to(stage, Object.assign({}, spin, { rotationX: 360, duration: 6 }));
          break;
        case 3:
          anim = g.to(stage, Object.assign({}, spin, { rotationX: -360, duration: 5 }));
          break;
        case 4: {
          const tl = g.timeline({ repeat: -1 });
          tl.to(
            stage,
            { rotationY: 28, rotationX: -14, duration: 0.95, ease: "sine.inOut", transformPerspective: 640 },
            0
          ).to(
            stage,
            { rotationY: -28, rotationX: 14, duration: 0.95, ease: "sine.inOut", transformPerspective: 640 }
          );
          anim = tl;
          break;
        }
        case 5:
          anim = g.to(stage, Object.assign({}, spin, { rotationZ: 360, duration: 6.5 }));
          break;
        case 6:
          anim = g.to(stage, Object.assign({}, spin, { rotationY: 360, rotationX: 22, duration: 6 }));
          break;
        case 7:
        default: {
          const tl = g.timeline({ repeat: -1 });
          tl.to(stage, {
            rotationY: 160,
            rotationX: -8,
            duration: 1.15,
            ease: "power2.inOut",
            transformPerspective: 640,
          })
            .to(stage, {
              rotationY: -160,
              rotationX: 8,
              duration: 1.15,
              ease: "power2.inOut",
              transformPerspective: 640,
            })
            .to(stage, {
              rotationY: 0,
              rotationX: 0,
              duration: 0.85,
              ease: "power2.inOut",
              transformPerspective: 640,
            });
          anim = tl;
          break;
        }
      }

      tileLoopAnims.push(anim);
    });

    wireTileHoverPause();
  }

  function startHeadingLoop() {
    const g = window.gsap;
    if (!g || !heading || headingLoopAnim) return;
    const sigLine = heading.querySelector(".slide-logo-studio__sig-line");
    const reveal = heading.querySelector(".slide-logo-studio__heading-reveal");
    const track = heading.querySelector(".slide-logo-studio__heading-track");
    g.set(heading, { clearProps: "transform", transformOrigin: "0% 90%" });

    if (sigLine) {
      g.set(sigLine, { transformOrigin: "0% 55%" });
      headingLoopAnim = g.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.75 });
      headingLoopAnim.to(sigLine, {
        y: 1.15,
        rotateZ: 0.48,
        duration: 2.85,
        ease: "sine.inOut",
      });
      return;
    }

    if (!reveal || !track) {
      headingLoopAnim = g.timeline({ repeat: -1, repeatDelay: 0.85 });
      headingLoopAnim
        .to(heading, {
          rotation: -1.8,
          skewX: -4,
          y: -3,
          duration: 1.45,
          ease: "sine.inOut",
        })
        .to(heading, {
          rotation: 1.5,
          skewX: 3,
          y: 2,
          duration: 1.45,
          ease: "sine.inOut",
        });
      return;
    }
    const clipHidden = "inset(-8% 100% -8% 0)";
    const clipShown = "inset(-8% -0.5% -8% 0)";
    const clipProps = { clipPath: clipHidden, WebkitClipPath: clipHidden };
    const clipShownProps = { clipPath: clipShown, WebkitClipPath: clipShown };
    g.set(reveal, clipShownProps);
    g.set(track, { opacity: 1, rotateZ: 0, x: 0, y: 0 });
    headingLoopAnim = g.timeline({ repeat: -1, repeatDelay: 0.4 });
    headingLoopAnim
      .to(heading, { opacity: 1, duration: 0.55, ease: "none" })
      .to(reveal, Object.assign({ duration: 0.32, ease: "power2.in" }, clipProps))
      .set(track, { rotateZ: -3.8, x: -6 })
      .to(reveal, Object.assign({ duration: 1.08, ease: "power1.inOut" }, clipShownProps))
      .to(track, { rotateZ: 0, x: 0, duration: 1.08, ease: "power1.out" }, "<")
      .to(track, { rotateZ: 0.5, y: -0.5, duration: 0.4, ease: "sine.out" }, "-=0.28")
      .to(track, { rotateZ: 0, y: 0, duration: 0.38, ease: "sine.inOut" });
  }

  function finish() {
    const g = window.gsap;
    if (g && heading) {
      g.set(heading, { clearProps: "transform" });
    }
    if (g && bodyEl) {
      g.set(bodyEl, { clearProps: "opacity,transform" });
    }
    if (useOrbit && grid) {
      grid.classList.add("logo-orbit--active");
      slide.classList.add("slide-01--orbit-on");
    }
    if (g && tiles.length) {
      if (useOrbit) {
        g.set(tiles, { opacity: 1, visibility: "visible", clearProps: "opacity" });
      } else {
        g.set(tiles, { opacity: 1, visibility: "visible", clearProps: "opacity,transform" });
      }
    } else {
      tiles.forEach(function (t) {
        t.style.opacity = "1";
        t.style.visibility = "visible";
      });
    }
    root.classList.add("is-inview");
    if (!prefersReducedMotion) {
      if (useOrbit) {
        startLogoOrbitLoop();
      } else {
        startLogoTileLoops();
      }
      startHeadingLoop();
    }
  }

  if (prefersReducedMotion) {
    if (window.gsap) {
      window.gsap.set([heading, bodyEl, tiles, bg].filter(Boolean), { clearProps: "all" });
    }
    finish();
    return;
  }

  function onEnter() {
    if (entranceStarted) return;
    entranceStarted = true;

    const g = window.gsap;
    if (!g || !heading) {
      finish();
      return;
    }

    const tl = g.timeline();

    if (bodyEl) {
      g.set(bodyEl, { opacity: 1, clearProps: "transform" });
    }

    if (bg) {
      tl.from(
        bg,
        {
          duration: 1.08,
          z: -85,
          scale: 1.09,
          rotationX: 6,
          ease: "power2.out",
          transformOrigin: "50% 50%",
        },
        0
      );
    }

    const sigChars = heading.querySelectorAll(".slide-logo-studio__sig-ch");
    const headingUnderline = heading.querySelector(".slide-logo-studio__heading-underline");

    if (sigChars.length) {
      g.set(sigChars, { transformOrigin: "12% 92%", force3D: true });
      tl.from(
        sigChars,
        {
          opacity: 0,
          y: 30,
          x: -16,
          rotation: -24,
          scale: 0.56,
          stagger: 0.064,
          duration: 0.72,
          ease: "power3.out",
        },
        bg ? 0.06 : 0
      );
      if (headingUnderline) {
        tl.fromTo(
          headingUnderline,
          { scaleX: 0, opacity: 0.3 },
          {
            scaleX: 1,
            opacity: 0.95,
            duration: 0.88,
            ease: "power1.inOut",
            transformOrigin: "0% 50%",
          },
          "-=0.48"
        );
      }
    } else {
      tl.from(
        heading,
        {
          duration: 0.88,
          opacity: 0,
          z: -55,
          rotationX: 22,
          y: 18,
          ease: "power3.out",
          transformOrigin: "0% 50%",
        },
        bg ? 0.06 : 0
      );
    }

    /* Body copy + Includes list: keep visible (no opacity tween — was read as “missing” on slow/strict IO) */

    /* Orbit: CSS sets each tile’s 3D ring transform — do not tween z/rotate here or GSAP overrides it */
    if (useOrbit) {
      tl.from(
        tiles,
        {
          duration: 0.58,
          opacity: 0,
          stagger: 0.055,
          ease: "power2.out",
        },
        "-=0.38"
      );
    } else {
      tl.from(
        tiles,
        {
          duration: 0.82,
          z: -100,
          rotationX: 12,
          rotationY: function (idx) {
            return idx % 2 === 0 ? -18 : 18;
          },
          stagger: 0.09,
          ease: "power2.out",
          transformOrigin: "50% 50%",
        },
        "-=0.38"
      );
    }

    tl.call(finish);
  }

  function slideIsMeaningfullyVisible() {
    const r = slide.getBoundingClientRect();
    if (r.width < 8) return false;
    /* Lenient: tall slide-01 + curtain scroll — top may be off-screen while user is in the section */
    return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  }

  let io;
  function disconnectIo() {
    if (io) {
      io.disconnect();
      io = null;
    }
  }

  function tryStartEntrance() {
    if (entranceStarted) return;
    if (!slideIsMeaningfullyVisible()) return;
    disconnectIo();
    onEnter();
  }

  if (typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          tryStartEntrance();
        });
      },
      {
        root: null,
        threshold: [0, 0.02, 0.08, 0.15],
        rootMargin: "120px 0px 120px 0px",
      }
    );
    io.observe(slide);
  }

  window.addEventListener("scroll", tryStartEntrance, { passive: true });
  window.addEventListener("resize", tryStartEntrance, { passive: true });

  if (typeof IntersectionObserver === "undefined") {
    finish();
  } else {
    tryStartEntrance();
    window.setTimeout(tryStartEntrance, 1200);
    window.setTimeout(function () {
      if (!entranceStarted) finish();
    }, 4000);
  }
})();
