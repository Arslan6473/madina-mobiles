/**
 * Generates branded placeholder product/category art into public/demo/*.svg
 * using lucide-static icons. Real photos replace these via the admin (Cloudinary).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const ICONS = path.join(ROOT, "node_modules/lucide-static/icons");
const OUT = path.join(ROOT, "public/demo");

const PALETTES: [string, string, string][] = [
  ["#14286b", "#1d4ed8", "#facc15"],
  ["#0b1640", "#0ea5e9", "#f97316"],
  ["#1d4ed8", "#38bdf8", "#ffffff"],
  ["#7c2d12", "#f97316", "#fde68a"],
  ["#0f172a", "#334155", "#f97316"],
  ["#14286b", "#7c3aed", "#facc15"],
  ["#064e3b", "#0ea5e9", "#ffffff"],
  ["#b91c1c", "#f97316", "#fff7ed"],
];

function iconInner(name: string) {
  const raw = readFileSync(path.join(ICONS, `${name}.svg`), "utf8");
  const match = raw.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  if (!match) throw new Error(`Bad icon ${name}`);
  return match[1].trim();
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Splits a label into at most two lines of ~22 chars. */
function lines(label: string) {
  const words = label.split(/\s+/);
  const out: string[] = [""];
  for (const w of words) {
    const cur = out[out.length - 1];
    if ((cur + " " + w).trim().length > 22 && cur) {
      if (out.length === 2) {
        out[1] = (out[1] + "…").trim();
        break;
      }
      out.push(w);
    } else out[out.length - 1] = (cur + " " + w).trim();
  }
  return out;
}

export function renderArt(opts: { icon: string; label?: string; sub?: string; palette: number; variant?: number }) {
  const [a, b, accent] = PALETTES[opts.palette % PALETTES.length];
  const v = opts.variant ?? 0;
  const gid = `g${opts.palette}${v}`;
  const angle = v === 0 ? 'x1="0" y1="0" x2="1" y2="1"' : 'x1="1" y1="0" x2="0" y2="1"';
  const text = opts.label ? lines(opts.label) : [];
  const iconY = opts.label ? 170 : 220;
  const scale = opts.label ? 15 : 15;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="${gid}" ${angle}><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
    <radialGradient id="${gid}r" cx="0.5" cy="0.4" r="0.6"><stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#${gid})"/>
  <rect width="800" height="800" fill="url(#${gid}r)"/>
  <circle cx="${v ? 690 : 110}" cy="${v ? 120 : 690}" r="${v ? 160 : 200}" fill="#ffffff" fill-opacity="0.06"/>
  <circle cx="400" cy="${iconY + 180}" r="210" fill="#ffffff" fill-opacity="0.08"/>
  <g transform="translate(${400 - 12 * scale} ${iconY}) scale(${scale})" fill="none" stroke="${accent}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    ${iconInner(opts.icon)}
  </g>
  ${text
    .map(
      (t, i) =>
        `<text x="400" y="${640 + i * 56}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="700" fill="#ffffff">${esc(t)}</text>`,
    )
    .join("\n  ")}
  ${opts.sub ? `<text x="400" y="80" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="600" letter-spacing="6" fill="#ffffff" fill-opacity="0.75">${esc(opts.sub.toUpperCase())}</text>` : ""}
</svg>
`;
}

export function writeDemoImage(file: string, svg: string) {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, file), svg);
  return `/demo/${file}`;
}
