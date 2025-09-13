// script.js

// Helpers
const $ = (s) => document.querySelector(s);

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// Tile puro (sem link/caption)
function tileImg({src}){
  const div = document.createElement("div");
  div.className = "tile";
  const img = document.createElement("img");
  img.loading = "lazy";
  img.decoding = "async";
  img.src = src;
  img.alt = "";
  img.onerror = () => { img.src = "img/placeholders/placeholder.png"; };
  div.appendChild(img);
  return div;
}

// Preenche grid com N únicos + placeholders se precisar
function fillGrid(gridEl, items, limit){
  gridEl.innerHTML = "";
  const uniq = Array.from(new Set(items.map(it => it.src))).slice(0, limit);
  uniq.forEach(src => gridEl.appendChild(tileImg({src})));
  if (uniq.length < limit){
    for(let i=0;i<limit-uniq.length;i++){
      gridEl.appendChild(tileImg({src:"img/placeholders/placeholder.png"}));
    }
  }
}

// Menu mobile
const toggle = $(".nav-toggle");
const navList = $(".nav-list");
if (toggle && navList){
  toggle.addEventListener("click", ()=>{
    const show = !navList.classList.contains("show");
    navList.classList.toggle("show", show);
    toggle.setAttribute("aria-expanded", String(show));
  });
}

// Carrega portfolio.json e popula grids
(async function(){
  let data;
  try{
    const res = await fetch("portfolio.json", { cache: "no-store" });
    if (!res.ok) throw new Error("portfolio.json não encontrado");
    data = await res.json();
  }catch(e){
    console.error("Erro ao carregar portfolio.json:", e);
    return;
  }

  const items = Array.isArray(data.items) ? data.items : [];

  // Trabalhos (tattoo) — 12
  const trabEl = $("#trabalhos .grid");
  if (trabEl){
    const tattoos = shuffle(items.filter(it => it.estilo === "tattoo"));
    fillGrid(trabEl, tattoos, 12);
  }

  // Piercing — 8
  const pierEl = $("#piercing .grid");
  if (pierEl){
    const piercings = shuffle(items.filter(it => it.estilo === "piercing"));
    fillGrid(pierEl, piercings, 8);
  }
})();

// Modal anamnese (UI)
const modal = $("#ana-modal");
$("#open-ana")?.addEventListener("click", ()=> modal?.classList.add("open"));
$("#close-ana")?.addEventListener("click", ()=> modal?.classList.remove("open"));

// Orçamento (toast simples)
$("#lead-form")?.addEventListener("submit", (e)=>{
  e.preventDefault();
  const toast = $("#toast");
  toast.style.display = "block";
  toast.textContent = "Recebido! Em breve retornamos no WhatsApp.";
  setTimeout(()=> toast.style.display = "none", 3500);
  e.currentTarget.reset();
});
