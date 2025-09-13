// generate-portfolio.js
// Gera portfolio.json a partir de img/tattoo (12) e img/piercing (8)
// Uso:
//   node generate-portfolio.js
//   node generate-portfolio.js --watch

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----- CONFIG -----
const ROOT = __dirname;
const IMG_DIR = path.join(ROOT, "img");
const DIRS = {
  tattoo: { dir: path.join(IMG_DIR, "tattoo"), limit: 12 },
  piercing: { dir: path.join(IMG_DIR, "piercing"), limit: 8 },
};
const VALID_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

// ----- HELPERS -----
function ensureDirExists(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function naturalCompare(a, b) {
  // ordenação humano-amigável (números em ordem natural)
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
}

function listImages(dirAbs, webPrefix, limit) {
  if (!fs.existsSync(dirAbs)) return [];

  const files = fs
    .readdirSync(dirAbs)
    .filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return VALID_EXT.has(ext);
    })
    .sort(naturalCompare);

  // remove duplicados por basename (case-insensitive)
  const seen = new Set();
  const picked = [];
  for (const f of files) {
    const base = path.basename(f).toLowerCase();
    if (seen.has(base)) continue;
    seen.add(base);
    picked.push(`${webPrefix}/${f}`);
    if (picked.length >= limit) break;
  }
  return picked;
}

function buildData() {
  // Garante que as pastas existem (não quebra caso ainda não tenha criado)
  ensureDirExists(DIRS.tattoo.dir);
  ensureDirExists(DIRS.piercing.dir);

  const tattoo = listImages(DIRS.tattoo.dir, "img/tattoo", DIRS.tattoo.limit).map((src) => ({
    src,
    alt: "",
    estilo: "tattoo",
  }));

  const piercing = listImages(DIRS.piercing.dir, "img/piercing", DIRS.piercing.limit).map((src) => ({
    src,
    alt: "",
    estilo: "piercing",
  }));

  const items = [...tattoo, ...piercing];

  return {
    chips: ["todos", "tattoo", "piercing"],
    items,
  };
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function generate() {
  try {
    const data = buildData();
    const out = path.join(ROOT, "portfolio.json");
    writeJSON(out, data);
    console.log(
      `✔ portfolio.json atualizado — ${data.items.length} itens (tattoo: ${data.items.filter(
        (i) => i.estilo === "tattoo"
      ).length}, piercing: ${data.items.filter((i) => i.estilo === "piercing").length})`
    );
  } catch (err) {
    console.error("✖ Erro ao gerar portfolio.json:", err.message);
  }
}

// Debounce simples para eventos de arquivo em lote
let debounceTimer = null;
function scheduleGenerate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(generate, 200);
}

function watchDirs() {
  console.log("👀 Observando img/tattoo e img/piercing por mudanças…");
  for (const key of Object.keys(DIRS)) {
    const dir = DIRS[key].dir;
    ensureDirExists(dir);
    try {
      // fs.watch com recursive:true funciona em Windows e macOS
      fs.watch(dir, { recursive: true }, (event, filename) => {
        if (!filename) return;
        const ext = path.extname(filename).toLowerCase();
        if (VALID_EXT.has(ext)) {
          console.log(`↻ Mudança detectada em ${path.join(dir, filename)} (${event}).`);
          scheduleGenerate();
        }
      });
    } catch {
      // fallback: polling a cada 2s (caso recursive não esteja disponível)
      setInterval(generate, 2000);
    }
  }
  generate();
}

// ----- MAIN -----
if (process.argv.includes("--watch")) {
  watchDirs();
} else {
  generate();
}
