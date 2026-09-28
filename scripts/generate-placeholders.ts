/**
 * Generates branded SVG placeholder images for the starter catalogue, categories, blog and reviews.
 * Run: npm run placeholders   (output: public/images/placeholders/**)
 * Replace them by uploading real photos in the admin panel.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { blogCategories, categories, posts, products, testimonials } from "../prisma/seed-data";

const OUT = path.join(process.cwd(), "public/images/placeholders");
const ICONS = path.join(process.cwd(), "node_modules/lucide-static/icons");

function iconInner(name: string) {
  const svg = readFileSync(path.join(ICONS, `${name}.svg`), "utf8");
  return svg.replace(/<!--[\s\S]*?-->/g, "").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();
}

type Theme = "light" | "dark" | "brand";

const THEMES: Record<Theme, { bg: [string, string]; stroke: string; glow: string; mark: string; dots: string }> = {
  light: { bg: ["#f8f8f9", "#e9e9ed"], stroke: "#0a0a0a", glow: "#ffc800", mark: "#0a0a0a", dots: "#0a0a0a" },
  dark: { bg: ["#1c1c1e", "#0a0a0a"], stroke: "#ffc800", glow: "#ffc800", mark: "#ffffff", dots: "#ffffff" },
  brand: { bg: ["#ffd84a", "#ffc800"], stroke: "#0a0a0a", glow: "#ffffff", mark: "#0a0a0a", dots: "#0a0a0a" },
};

function art(icon: string, theme: Theme, w: number, h: number, opts: { label?: string; iconScale?: number; offsetX?: number } = {}) {
  const t = THEMES[theme];
  const size = Math.min(w, h) * (opts.iconScale ?? 0.42);
  const scale = size / 24;
  const cx = w / 2 + (opts.offsetX ?? 0);
  const cy = h / 2 - (opts.label ? h * 0.03 : 0);
  const id = `${theme}${w}${h}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.bg[0]}"/><stop offset="1" stop-color="${t.bg[1]}"/></linearGradient>
<radialGradient id="gl${id}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${t.glow}" stop-opacity="${theme === "brand" ? 0.55 : 0.35}"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient>
<pattern id="dt${id}" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${t.dots}" fill-opacity="${theme === "dark" ? 0.1 : 0.06}"/></pattern>
</defs>
<rect width="${w}" height="${h}" fill="url(#bg${id})"/>
<rect width="${w}" height="${h}" fill="url(#dt${id})"/>
<circle cx="${cx}" cy="${cy}" r="${size * 1.05}" fill="url(#gl${id})"/>
<circle cx="${cx}" cy="${cy}" r="${size * 0.82}" fill="none" stroke="${t.stroke}" stroke-opacity="0.12" stroke-width="1.5"/>
<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${scale})" fill="none" stroke="${t.stroke}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${iconInner(icon)}</g>
${opts.label ? `<text x="${w / 2}" y="${h - h * 0.09}" text-anchor="middle" font-family="Poppins, Arial, sans-serif" font-size="${Math.round(w * 0.028)}" font-weight="600" letter-spacing="${w * 0.006}" fill="${t.mark}" fill-opacity="0.55">${opts.label}</text>` : ""}
</svg>`;
}

function write(rel: string, svg: string) {
  const file = path.join(OUT, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, svg.replace(/\n/g, ""));
}

const themes: Theme[] = ["light", "dark", "brand"];
for (const p of products) {
  themes.forEach((theme, i) => write(`products/${p.slug}-${i + 1}.svg`, art(p.art, theme, 800, 800, { label: "CARSAPPO" })));
}
for (const c of categories) {
  write(`categories/${c.slug}.svg`, art(c.artIcon, "light", 600, 600, { iconScale: 0.36 }));
}
for (const post of posts) {
  write(`blog/${post.slug}.svg`, art(post.art, "dark", 1200, 675, { iconScale: 0.34, offsetX: 280 }));
}
testimonials.forEach((t, i) => {
  if ("art" in t && t.art) write(`reviews/review-${i + 1}.svg`, art(t.art, i % 2 ? "brand" : "light", 600, 600, { iconScale: 0.4 }));
});
console.log(`Placeholders written for ${products.length} products, ${categories.length} categories, ${posts.length} posts (${blogCategories.length} blog categories).`);
