Hero tunnel — optional extra images (only for the Z-hero animation)

If this folder has **one or more** images, the hero uses **only** these files
(no `portfolio/` root mix).

**Wordmark / slide-only art** does **not** go here — use `../brand/` instead
(`assets/brand/`) so it does not appear in the floating animation.

Formats: jpg, jpeg, png, webp, avif, gif, svg

Then run from project root:

  node scripts/generate-portfolio-manifest.mjs
