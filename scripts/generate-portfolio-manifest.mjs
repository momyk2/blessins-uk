#!/usr/bin/env node
/**
 * Scans /assets/portfolio/hero-tiles (flat) then /assets/portfolio recursively
 * (skipping hero-tiles and not-in-hero — those are not part of the main portfolio list).
 * Writes /assets/portfolio-manifest.json with at most MAX_MANIFEST_ITEMS entries
 * (hero-tiles first, then portfolio paths, sorted).
 *
 * Run from project root: node scripts/generate-portfolio-manifest.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const portfolioDir = path.join(root, "assets", "portfolio");
const heroTilesDir = path.join(portfolioDir, "hero-tiles");
const outFile = path.join(root, "assets", "portfolio-manifest.json");

/** Cap total manifest entries (hero tunnel + anywhere else that reads this file). */
const MAX_MANIFEST_ITEMS = 30;

const EXT = /\.(jpe?g|png|gif|webp|avif|svg)$/i;

function listImageFilesFlat(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && EXT.test(d.name) && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}

/**
 * All images under portfolioDir except /hero-tiles/ (listed separately)
 * and /not-in-hero/ (moved-out assets — not listed in manifest).
 */
function listPortfolioRecursive(dir, relParts = []) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "hero-tiles" || ent.name === "not-in-hero") continue;
      out.push(...listPortfolioRecursive(full, [...relParts, ent.name]));
    } else if (ent.isFile() && EXT.test(ent.name)) {
      const relUrl = [...relParts, ent.name].join("/");
      out.push(relUrl);
    }
  }
  return out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

if (!fs.existsSync(portfolioDir)) {
  fs.mkdirSync(portfolioDir, { recursive: true });
}
if (!fs.existsSync(heroTilesDir)) {
  fs.mkdirSync(heroTilesDir, { recursive: true });
}

const heroFiles = listImageFilesFlat(heroTilesDir);
const portfolioRelPaths = listPortfolioRecursive(portfolioDir);

const items = [
  ...heroFiles.map((f) => ({ src: `/assets/portfolio/hero-tiles/${f}` })),
  ...portfolioRelPaths.map((rel) => ({ src: `/assets/portfolio/${rel}` })),
].slice(0, MAX_MANIFEST_ITEMS);

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  items,
};

fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), "utf8");
console.log(
  `Wrote ${manifest.items.length} entr${manifest.items.length === 1 ? "y" : "ies"} → ${path.relative(root, outFile)}`
);
console.log(
  `  hero-tiles: ${heroFiles.length}, portfolio (recursive, pre-cap): ${portfolioRelPaths.length}, manifest total: ${items.length} (max ${MAX_MANIFEST_ITEMS})`
);
