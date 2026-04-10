/* =============================================================
   EMITOURS TRAVELS — main.js  v4
   Todo el contenido viene de /data/*.json
   Las imágenes se leen del campo "imagen" en promociones.json
   ============================================================= */

const WA_NUM = "573215849716";

/* ── Utilidades ──────────────────────────────────────────── */
function wa(msg) {
  return `https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`;
}

function fmtCOP(valor) {
  return "$" + Number(valor).toLocaleString("es-CO") + " COP";
}

function estrellas(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

/*
  imgSrc(nombre, jsonImagen)
  ─────────────────────────────────────────────────────────────
  Prioridad:
    1. Campo "imagen" del JSON  →  lo que subió el cliente en el CMS
    2. Fallback automático      →  assets/img/<clave>.jpg
*/
function imgSrc(nombre, jsonImagen) {
  if (jsonImagen && jsonImagen.trim() !== "") return jsonImagen.trim();
  const clave = nombre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return `assets/img/${clave}.jpg`;
}

/* Fallback de color por si la imagen no carga */
const FALLBACK_BG = {
  "san-andres":        "#0a2a4a",
  "cartagena":         "#7b241c",
  "santa-marta":       "#154360",
  "punta-cana":        "#4a235a",
  "cancun":            "#0d3349",
  "espana":            "#7b241c",
  "hacienda-napoles":  "#145a32",
};

function bgFallback(id) {
  return FALLBACK_BG[id] || "#1a3a6b";
}

/* ── Fetch con fallback ──────────────────────────────────── */
async function loadJSON(path) {
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn(`[Emitours] No se pudo cargar ${path}:`, e.message);
    return null;
  }
}

/*
  parseItems(data)
  ─────────────────────────────────────────────────────────────
  El CMS de Decap guarda los archivos JSON con wrapper { "items": [...] }
  Esta función normaliza ambos formatos:
    - Array directo:       [ {...}, {...} ]
    - Objeto con items:    { "items": [ {...} ] }
*/
function parseItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

/* ── BANNER (desde data/banner.json) ─────────────────────── */
async function initBanner() {
  const data = await loadJSON("data/banner.json");
  if (!data || !data.activo) return;

  const el  = document.getElementById("banner");
  const txt = document.getElementById("banner-txt");
  const lnk = document.getElementById("banner-lnk");
  if (!el) return;

  txt.textContent  = data.texto;
  lnk.textContent  = data.linkTexto;
  lnk.href         = wa(data.whatsappMensaje);
  lnk.target       = "_blank";
  el.style.display = "block";

  document.getElementById("banner-close")
    ?.addEventListener("click", () => el.remove());
}

/* ── HERO SLIDER (imágenes desde promociones.json) ────────── */
async function initHeroSlider() {
  const data   = await loadJSON("data/promociones.json");
  const slides = document.querySelectorAll(".h-slide");
  const lbls   = document.querySelectorAll(".h-lbl");
  const dotsC  = document.getElementById("hero-dots");
  if (!slides.length || !dotsC) return;

  const items = parseItems(data);
  const heroDestinos = items.filter(d => d.activo !== false && d.heroSlide === true);

  /* Asignar imagen + fallback de color a cada slide */
  slides.forEach((slide, i) => {
    const d = heroDestinos[i];
    if (d) {
      const url = imgSrc(d.destino, d.imagen);
      slide.style.backgroundImage    = `url('${url}')`;
      slide.style.backgroundSize     = "cover";
      slide.style.backgroundPosition = "center";
      slide.style.backgroundColor    = bgFallback(d.id);
    } else {
      slide.style.backgroundColor = bgFallback(Object.keys(FALLBACK_BG)[i] || "san-andres");
    }
  });

  /* Actualizar etiquetas de texto del hero */
  lbls.forEach((lbl, i) => {
    const el = lbl.querySelector(".h-lbl-t");
    if (el && heroDestinos[i]) el.textContent = heroDestinos[i].destino;
  });

  /* Dots + lógica de rotación */
  let cur = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "h-dot" + (i === 0 ? " on" : "");
    dot.setAttribute("aria-label", `Diapositiva ${i + 1}`);
    dot.addEventListener("click", () => go(i));
    dotsC.appendChild(dot);
  });

  function go(n) {
    slides[cur].classList.remove("on");
    lbls[cur]?.classList.remove("on");
    dotsC.children[cur]?.classList.remove("on");
    cur = n;
    slides[cur].classList.add("on");
    lbls[cur]?.classList.add("on");
    dotsC.children[cur]?.classList.add("on");
  }

  const timer = setInterval(() => go((cur + 1) % slides.length), 5000);
  document.getElementById("hero")
    ?.addEventListener("mouseenter", () => clearInterval(timer));
}

/* ── OFERTAS (desde data/promociones.json) ───────────────── */
async function initOfertas() {
  const data = await loadJSON("data/promociones.json");
  const grid = document.getElementById("grid-ofertas");
  if (!grid) return;

  const items   = parseItems(data);
  const activas = items.filter(d => d.activo !== false);

  if (activas.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No hay ofertas activas en este momento.</p>`;
    return;
  }

  grid.innerHTML = activas.map((d, i) => {
    const delay  = (i % 4) * 0.08;
    const imgUrl = imgSrc(d.destino, d.imagen);

    const precio = d.precioDesde
      ? `<div class="o-precio-row">
           <span class="o-desde">Desde</span>
           <span class="o-precio">${fmtCOP(d.precioDesde)}</span>
         </div>
         ${d.incluye  ? `<p class="o-incluye">✅ ${d.incluye}</p>`  : ""}
         ${d.vigencia ? `<p class="o-vigencia">⏳ ${d.vigencia}</p>` : `<div class="o-gap"></div>`}`
      : `<p class="o-incluye" style="margin-top:14px">Consulta disponibilidad y precio personalizado.</p>
         <div class="o-gap"></div>`;

    return `
      <div class="o-card rv" style="transition-delay:${delay}s"
           onclick="window.open('${wa(d.whatsappMensaje)}','_blank')">
        <div class="o-bar"></div>
        <div class="o-img-thumb"
             style="background-image:url('${imgUrl}');background-color:${bgFallback(d.id)}">
          <div class="o-img-ovl"></div>
          ${d.badge ? `<div class="o-badge-over">${d.badge}</div>` : ""}
          <span class="o-emoji-sm">${d.emoji}</span>
        </div>
        <div class="o-body">
          <div class="o-nombre">${d.destino}</div>
          <p class="o-copy">${d.copy}</p>
          ${precio}
          <a class="o-cta" href="${wa(d.whatsappMensaje)}" target="_blank"
             onclick="event.stopPropagation()">Quiero este plan →</a>
        </div>
      </div>`;
  }).join("");

  reveal();
}

/* ── DESTINOS (desde data/promociones.json) ──────────────── */
async function initDestinos() {
  const data = await loadJSON("data/promociones.json");
  const grid = document.getElementById("grid-destinos");
  if (!grid) return;

  const items   = parseItems(data);
  const activos = items.filter(d => d.activo !== false);

  if (activos.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No hay destinos disponibles.</p>`;
    return;
  }

  grid.innerHTML = activos.map((d, i) => {
    const delay  = (i % 4) * 0.08;
    const imgUrl = imgSrc(d.destino, d.imagen);
    const msg    = d.whatsappMensaje ||
      `Hola Emitours 👋, vi su página web y me interesa cotizar un viaje a *${d.destino}*. ¿Me pueden ayudar? ✈️`;

    return `
      <div class="d-card rv" style="transition-delay:${delay}s"
           onclick="window.open('${wa(msg)}','_blank')">
        <div class="d-bg"
             style="background-image:url('${imgUrl}');
                    background-color:${bgFallback(d.id)};
                    background-size:cover;
                    background-position:center;
                    transition:transform 0.6s ease;"></div>
        <div class="d-ovl"></div>
        <div class="d-body">
          <div class="d-nombre">${d.destino}</div>
          <p class="d-copy">${d.copy}</p>
          <div class="d-row">
            <a class="d-cta" href="${wa(msg)}" target="_blank"
               onclick="event.stopPropagation()">Cotizar este destino →</a>
          </div>
        </div>
      </div>`;
  }).join("");

  reveal();
}

/* ── TESTIMONIOS (desde data/testimonios.json) ───────────── */
async function initTestimonios() {
  const data = await loadJSON("data/testimonios.json");
  const grid = document.getElementById("grid-testimonios");
  if (!grid) return;

  const lista   = parseItems(data);
  const activos = lista.filter(t => t.activo !== false);

  if (activos.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No hay testimonios disponibles.</p>`;
    return;
  }

  grid.innerHTML = activos.map((t, i) => {
    const delay = (i % 3) * 0.1;
    return `
      <div class="t-card rv" style="transition-delay:${delay}s">
        <div class="t-dest">${t.emoji} ${t.destino}</div>
        <div class="t-q">"</div>
        <p class="t-txt">${t.texto}</p>
        <div class="t-author">
          <div class="t-av">${t.emoji}</div>
          <div>
            <div class="t-name">${t.nombre}</div>
            <div class="t-loc">${t.ciudad}</div>
            <div class="t-stars" title="${t.estrellas} estrellas">
              ${estrellas(t.estrellas || 5)}
            </div>
          </div>
        </div>
      </div>`;
  }).join("");

  reveal();
}

/* ── NAVBAR SCROLL ───────────────────────────────────────── */
function initNavbar() {
  const nav = document.getElementById("main-nav");
  if (!nav) return;
  const update = () => nav.classList.toggle("scrolled", window.scrollY > 60);
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/* ── MENÚ MÓVIL ──────────────────────────────────────────── */
function initMobileMenu() {
  const btn   = document.getElementById("menu-btn");
  const close = document.getElementById("menu-close");
  const menu  = document.getElementById("mobile-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click",   () => menu.classList.add("open"));
  close?.addEventListener("click", () => menu.classList.remove("open"));
  menu.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => menu.classList.remove("open"));
  });
}

/* ── VIDEO INTRO ─────────────────────────────────────────── */
function initVideo() {
  const overlay = document.getElementById("video-intro");
  const video   = document.getElementById("intro-vid");
  const skipBtn = document.getElementById("skip-btn");
  if (!overlay || !video) return;

  document.body.classList.add("no-scroll");

  function closeIntro() {
    overlay.classList.add("fade-out");
    document.body.classList.remove("no-scroll");
    setTimeout(() => overlay.remove(), 800);
  }

  video.addEventListener("ended", closeIntro);
  video.addEventListener("error", closeIntro);
  setTimeout(() => { if (skipBtn) skipBtn.style.display = "flex"; }, 3000);
  skipBtn?.addEventListener("click", closeIntro);
}

/* ── REVEAL SCROLL ───────────────────────────────────────── */
function reveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("on");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".rv:not(.on)")
    .forEach(el => obs.observe(el));
}

/* ── INIT ────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initVideo();
  initBanner();
  initNavbar();
  initMobileMenu();
  initHeroSlider();   // depende de promociones.json
  initOfertas();      // depende de promociones.json
  initDestinos();     // depende de promociones.json
  initTestimonios();  // depende de testimonios.json
  reveal();
});
