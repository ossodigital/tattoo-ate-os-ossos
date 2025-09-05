// ===== Navegacao / header
const toggle=document.querySelector('.nav-toggle');
const navList=document.querySelector('.nav-list');
if(toggle&&navList){toggle.addEventListener('click',()=>{const open=navList.classList.toggle('show');toggle.setAttribute('aria-expanded',open?'true':'false')});}
document.querySelectorAll('.nav-list a').forEach(a=>a.addEventListener('click',()=>navList.classList.remove('show')));

// anchors com offset
const headerHeight=document.querySelector('.site-header')?.offsetHeight||0;
function scrollWithOffset(e){
  if(this.hash){
    const el=document.querySelector(this.hash);
    if(el){ e.preventDefault(); const y=el.getBoundingClientRect().top+window.pageYOffset-(headerHeight+12); window.scrollTo({top:y,behavior:'smooth'}); history.pushState(null,'',this.hash); }
  }
}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',scrollWithOffset));

// ===== Toast util
const toast=document.getElementById('toast');
function showToast(msg,ms=2800){ if(!toast) return; toast.textContent=msg; toast.style.display='block'; setTimeout(()=>toast.style.display='none',ms); }

// ===== Mascara WhatsApp (orcamento)
const tel=document.getElementById('whatsapp');
if(tel){ tel.addEventListener('input',()=>{ let v=tel.value.replace(/\D/g,'').slice(0,11);
  if(v.length>6) tel.value=`(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
  else if(v.length>2) tel.value=`(${v.slice(0,2)}) ${v.slice(2)}`;
  else if(v.length>0) tel.value=`(${v}`; });
}

// ===== Lead / Orcamento
const form=document.getElementById('lead-form');
const btnEnviar=document.getElementById('btn-enviar');
function setErr(name,msg=''){ const small=document.querySelector(`[data-err="${name}"]`); if(small) small.textContent=msg; }
function validateLead(d){
  let ok=true;
  if(!d.nome||d.nome.trim().length<2){setErr('nome','informe seu nome');ok=false}else setErr('nome','');
  const digits=(d.whatsapp||'').replace(/\D/g,''); if(digits.length<10){setErr('whatsapp','whatsapp invalido');ok=false}else setErr('whatsapp','');
  const re=/^[^\s@]+@[^\s@]+\.[^\s@]+$/; if(!re.test(d.email||'')){setErr('email','email invalido');ok=false}else setErr('email','');
  if(!d.mensagem||d.mensagem.trim().length<5){setErr('mensagem','conte sua ideia (min 5 chars)');ok=false}else setErr('mensagem','');
  return ok;
}
async function postJSON(url,body){ const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); return res.json(); }
if(form&&btnEnviar){
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const data={
      nome:document.getElementById('nome').value,
      whatsapp:document.getElementById('whatsapp').value,
      email:document.getElementById('email').value,
      estilo:document.getElementById('estilo').value,
      tamanho:document.getElementById('tamanho').value,
      local_corpo:document.getElementById('local_corpo').value,
      referencia_url:document.getElementById('referencia_url').value,
      orcamento:document.getElementById('orcamento').value,
      mensagem:document.getElementById('mensagem').value
    };
    if(!validateLead(data)) return;
    btnEnviar.disabled=true; btnEnviar.textContent='enviando...';
    try{
      const out=await postJSON('/lead',data);
      if(out&&out.ok){ showToast('recebemos seu contato. em breve retornamos!'); form.reset(); }
      else{ showToast('nao foi possivel enviar agora. tente novamente.'); }
    }catch{ showToast('erro de conexao. tente novamente.'); }
    finally{ btnEnviar.disabled=false; btnEnviar.textContent='enviar'; }
  });
}

// ===== FAQ dinamico (faqs.json)
async function loadFaqs(){
  try{
    const res = await fetch('faqs.json'); const faqs = await res.json();
    const wrap = document.querySelector('#faqs .container'); if(!wrap) return;
    wrap.innerHTML = `<h2 class="section-title">faqs</h2>` + faqs.map(item => `
      <div class="faq"><h3>${item.q}</h3><div class="a">${item.a}</div></div>
    `).join('');
    document.querySelectorAll('.faq h3').forEach(h=>h.addEventListener('click',()=>h.parentElement.classList.toggle('open')));
  }catch(e){}
}
loadFaqs();

// ===== Portfolio dinamico + filtro (portfolio.json)
async function loadPortfolio(){
  try{
    const res = await fetch('portfolio.json'); const pj = await res.json();
    const grid = document.querySelector('#trabalhos .grid');
    const cont = document.querySelector('#trabalhos .container');
    if(!grid || !cont) return;

    const chips = pj.chips && pj.chips.length ? pj.chips : ["todos","realismo","blackwork","fino-traco","exclusivos","digital","coverup"];
    const chipsHtml = chips.map(c=>`<button class="chip" data-style="${c}">${c}</button>`).join('');
    const header = cont.querySelector('.lead');
    if(header && !document.getElementById('filter')){
      header.insertAdjacentHTML('afterend', `<div id="filter" style="margin:8px 0 16px;display:flex;gap:8px;flex-wrap:wrap">${chipsHtml}</div>`);
    }

    function render(style="todos"){
      grid.innerHTML = (pj.items||[]).filter(it => style==="todos" || it.estilo===style).map(it=>`
        <a class="tile" href="${it.src}" target="_blank" rel="noopener" data-estilo="${it.estilo}">
          <img src="${it.src}" alt="${it.alt||it.estilo||'portfolio'}">
        </a>
      `).join('');
    }
    render();

    document.querySelectorAll('#filter .chip').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('#filter .chip').forEach(b=>b.style.opacity='0.6');
        btn.style.opacity='1';
        render(btn.dataset.style);
      });
    });
  }catch(e){}
}
loadPortfolio();

// ===== Piercing dinamico (piercing.json)
async function loadPiercing(){
  try{
    const res = await fetch('piercing.json');
    if(!res.ok) return;
    const pj = await res.json();
    const grid = document.querySelector('#piercing .grid');
    if(!grid) return;
    grid.innerHTML = (pj.items||[]).map(it=>`
      <a class="tile" href="${it.src}" target="_blank" rel="noopener">
        <img src="${it.src}" alt="${it.alt||'piercing'}">
      </a>
    `).join('');
  }catch(e){}
}
loadPiercing();

// ===== Videos dinamicos (videos.json) — YouTube / Instagram Reels / TikTok
async function loadVideos(){
  try{
    const res = await fetch('videos.json'); const urls = await res.json();
    const grid = document.getElementById('video-grid'); if(!grid) return;

    const items = urls.map(u => {
      if (/youtube\.com|youtu\.be/.test(u)) {
        const id = u.match(/(v=|youtu\.be\/)([^&?/]+)/)?.[2] || "";
        const src = `https://www.youtube.com/embed/${id}`;
        return `<div class="video"><iframe src="${src}" title="youtube" allowfullscreen loading="lazy"></iframe></div>`;
      } else if (/instagram\.com\/(reel|p)\//.test(u)) {
        return `<blockquote class="instagram-media" data-instgrm-permalink="${u}" data-instgrm-version="14"></blockquote>`;
      } else if (/tiktok\.com\//.test(u)) {
        return `<blockquote class="tiktok-embed" cite="${u}" data-video-id="" style="max-width: 605px; min-width: 325px;"></blockquote>`;
      } else {
        return `<div class="video"><iframe src="${u}" loading="lazy"></iframe></div>`;
      }
    }).join('');
    grid.innerHTML = items;

    if (grid.querySelector('.instagram-media') && !document.getElementById('ig-script')) {
      const s = document.createElement('script'); s.id = 'ig-script'; s.async = true; s.src = "https://www.instagram.com/embed.js"; document.body.appendChild(s);
    } else if (window.instgrm) { window.instgrm.Embeds.process(); }

    if (grid.querySelector('.tiktok-embed') && !document.getElementById('tt-script')) {
      const s2 = document.createElement('script'); s2.id = 'tt-script'; s2.async = true; s2.src = "https://www.tiktok.com/embed.js"; document.body.appendChild(s2);
    }
  }catch(e){}
}
loadVideos();

// ===== Modal de ANAMNESE (abre/fecha + submit)
const openAna=document.getElementById('open-ana');
const closeAna=document.getElementById('close-ana');
const modalAna=document.getElementById('ana-modal');
function openModal(){ modalAna?.classList.add('open'); modalAna?.setAttribute('aria-hidden','false'); }
function closeModal(){ modalAna?.classList.remove('open'); modalAna?.setAttribute('aria-hidden','true'); }
openAna?.addEventListener('click', openModal);
closeAna?.addEventListener('click', closeModal);
modalAna?.addEventListener('click', (e)=>{ if(e.target===modalAna) closeModal(); });

// mascara whatsapp do modal
const anaWhats = document.getElementById('ana_whats');
if(anaWhats){
  anaWhats.addEventListener('input', ()=>{
    let v = anaWhats.value.replace(/\D/g,'').slice(0,11);
    if (v.length>6) anaWhats.value = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length>2) anaWhats.value = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length>0) anaWhats.value = `(${v}`;
  });
}

// submit anamnese
const anaForm = document.getElementById('ana');
const anaBtn  = document.getElementById('ana_enviar');
const anaOK   = document.getElementById('ana_okmsg');
if (anaForm && anaBtn){
  anaForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(anaForm).entries());
    if(!data.nome || !data.whatsapp || !data.email || !data.nascimento || !data.procedimento){
      alert('preencha os campos obrigatorios'); return;
    }
    anaBtn.disabled = true; anaBtn.textContent = 'enviando...';
    try{
      const res = await fetch('/anamnese', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
      const out = await res.json().catch(()=>({ok:false}));
      if(out && out.ok){ anaOK.style.display='block'; anaForm.reset(); }
      else{ alert('nao foi possivel enviar agora. tente novamente.'); }
    }catch{ alert('erro de conexao. tente novamente.'); }
    finally{ anaBtn.disabled=false; anaBtn.textContent='enviar anamnese'; }
  });
}
