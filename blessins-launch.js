(function () {
  var STORAGE_KEY = "blessinsLaunchSeen";
  var root = document.documentElement;
  var body = document.body;
  var launch = document.getElementById("blessins-launch");
  var launchLink = document.getElementById("blessins-launch-link");
  var topbarLogo = document.querySelector(".topbar__logo");
  var bg = launch ? launch.querySelector(".blessins-launch__bg") : null;

  if (!launch || !launchLink || !topbarLogo || !bg) return;

  if (root.classList.contains("blessins-launch-skip")) {
    launch.remove();
    return;
  }

  var reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function finishAndReveal() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
    body.classList.remove("is-launching");
    if (launch.parentNode) launch.remove();
  }

  function alignLaunchToLogo() {
    var logoRect = topbarLogo.getBoundingClientRect();
    var linkRect = launchLink.getBoundingClientRect();
    var dx =
      logoRect.left + logoRect.width / 2 - (linkRect.left + linkRect.width / 2);
    var dy =
      logoRect.top + logoRect.height / 2 - (linkRect.top + linkRect.height / 2);
    var scale = logoRect.height / linkRect.height;
    return { x: dx, y: dy, scale: scale };
  }

  if (reduceMotion || typeof gsap === "undefined") {
    finishAndReveal();
    return;
  }

  body.classList.add("is-launching");

  var chars = launchLink.querySelectorAll(".blessins-launch__ch, .blessins-launch__reg");
  gsap.set(launchLink, { transformOrigin: "50% 50%" });
  gsap.set(chars, { y: -120, opacity: 0 });

  gsap
    .timeline({
      onComplete: function () {
        requestAnimationFrame(function () {
          var t = alignLaunchToLogo();
          gsap
            .timeline({ onComplete: finishAndReveal })
            .to(launchLink, {
              x: t.x,
              y: t.y,
              scale: t.scale,
              duration: 0.85,
              ease: "power2.inOut",
            })
            .to(
              bg,
              { opacity: 0, duration: 0.45, ease: "power1.inOut" },
              "-=0.35"
            )
            .to(
              launchLink,
              { opacity: 0, duration: 0.25, ease: "power1.in" },
              "-=0.2"
            );
        });
      },
    })
    .to(chars, {
      y: 0,
      opacity: 1,
      duration: 0.55,
      stagger: 0.09,
      ease: "bounce.out",
    })
    .to({}, { duration: 0.35 });
})();
