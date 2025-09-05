import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 60_000, limit: 100 });
app.use(limiter);

const __dirname = path.resolve();
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// estatico
app.use("/uploads", express.static(uploadDir));
app.use(express.static(__dirname));

// util JSON append
function appendJSON(file, ...payloads) {
  const p = path.join(dataDir, file);
  let arr = [];
  if (fs.existsSync(p)) {
    try { arr = JSON.parse(fs.readFileSync(p, "utf8")) || []; } catch { arr = []; }
  }
  arr.push(...payloads);
  fs.writeFileSync(p, JSON.stringify(arr, null, 2), "utf8");
  return arr;
}

// health
app.get("/health", (_req, res) => res.json({ ok: true }));

// lead/orcamento
app.post("/lead", (req, res) => {
  try {
    const { nome, whatsapp, email } = req.body || {};
    if (!nome || !whatsapp || !email) return res.status(400).json({ ok:false, error:"dados_incompletos" });
    const payload = {
      ts: new Date().toISOString(),
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      ua: req.headers["user-agent"] || "",
      ...Object.fromEntries(Object.entries(req.body).map(([k,v])=>[k, String(v||"").trim()]))
    };
    appendJSON("leads.json", payload);
    res.json({ ok: true, saved: true });
  } catch (e) {
    console.error(e); res.status(500).json({ ok:false, error:"erro_interno" });
  }
});

// anamnese
app.post("/anamnese", (req, res) => {
  try {
    const { nome, whatsapp, email, nascimento, procedimento } = req.body || {};
    if (!nome || !whatsapp || !email || !nascimento || !procedimento)
      return res.status(400).json({ ok:false, error:"dados_incompletos" });

    const payload = {
      ts: new Date().toISOString(),
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      ua: req.headers["user-agent"] || "",
      tipo: "anamnese",
      ...Object.fromEntries(Object.entries(req.body).map(([k,v])=>[k, String(v||"").trim()]))
    };
    appendJSON("anamnese.json", payload);
    res.json({ ok: true, saved: true });
  } catch (e) {
    console.error(e); res.status(500).json({ ok:false, error:"erro_interno" });
  }
});

// ===== Upload (multer) + auto-atualiza galerias =====
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

function updateGallery(fileName, itemsToAdd, chipsToAdd = []) {
  const galleryPath = path.join(__dirname, fileName);
  let j = { chips: [], items: [] };
  if (fs.existsSync(galleryPath)) {
    try { j = JSON.parse(fs.readFileSync(galleryPath, "utf8")) || j; } catch {}
  }
  const chipSet = new Set([...(j.chips || []), ...chipsToAdd]);
  j.chips = Array.from(chipSet).filter(Boolean);
  const bySrc = new Map((j.items||[]).map(it => [it.src, it]));
  for (const it of itemsToAdd) bySrc.set(it.src, it);
  j.items = Array.from(bySrc.values());
  fs.writeFileSync(galleryPath, JSON.stringify(j, null, 2), "utf8");
}

app.post("/upload", upload.array("files", 12), (req, res) => {
  try {
    const { tipo="portfolio", estilo="", descricao="", add_to_gallery="on" } = req.body || {};
    const files = (req.files || []).map(f => ({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
      tipo, estilo, descricao,
      ts: new Date().toISOString()
    }));
    if (files.length) appendJSON("media.json", ...files);

    if (files.length && add_to_gallery !== "off") {
      const items = files.map(f => ({
        src: f.url,
        alt: f.descricao || f.estilo || f.tipo,
        estilo: (f.estilo || "").trim() || "exclusivos"
      }));
      const chips = Array.from(new Set(items.map(i => i.estilo)));
      if (tipo === "piercing") updateGallery("piercing.json", items, chips);
      else updateGallery("portfolio.json", items, chips);
    }

    res.json({ ok: true, files });
  } catch (e) {
    console.error(e); res.status(500).json({ ok:false, error:"upload_fail" });
  }
});

// listar midias
app.get("/media", (_req, res) => {
  try {
    const p = path.join(dataDir, "media.json");
    let arr = [];
    if (fs.existsSync(p)) arr = JSON.parse(fs.readFileSync(p,"utf8")) || [];
    res.json({ ok:true, items: arr });
  } catch (e) {
    console.error(e); res.status(500).json({ ok:false });
  }
});

// fallback SPA
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, () => console.log(`server on http://localhost:${PORT}`));
