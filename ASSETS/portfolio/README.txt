Place portfolio images here (jpg, png, webp, avif, gif, svg). Subfolders are included in the manifest (recursive scan), except **`not-in-hero/`** (see below) and **`hero-tiles/`** (listed separately first).

The home hero reads **only** `assets/portfolio-manifest.json` (built from this folder tree). After you add, rename, or delete images, regenerate that file from the project root:

  node scripts/generate-portfolio-manifest.mjs

The manifest lists **at most 30** images total (hero-tiles entries first, then portfolio paths in sorted order).

**`not-in-hero/`** — move files here to keep them on disk but **exclude** them from the manifest (e.g. blank/black frames you do not want in the tunnel).

Optional hero-only tiles: put files in `assets/portfolio/hero-tiles/` — they are listed first in the manifest (still followed by everything under `assets/portfolio/`, excluding the `hero-tiles` and `not-in-hero` folders from the recursive pass).

The site loads `/assets/portfolio-manifest.json` and assigns each image a frame
(square / portrait / landscape) from its natural pixel dimensions.
