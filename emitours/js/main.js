/* =============================================================
   EMITOURS TRAVELS — main.js
   Carga datos desde /data/*.json y construye la UI dinámica
   ============================================================= */

const WA_NUM = "573215849716";

/* ── Utilidades ─────────────────────────────────────────── */
function wa(msg) {
  return `https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`;
}

function fmtCOP(valor) {
  return "$" + Number(valor).toLocaleString("es-CO") + " COP";
}

function estrellas(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

/* ── Nombre → ruta de imagen dinámica ───────────────────────
   "San Andrés"      → "img/sanandres.jpg"
   "Hacienda Nápoles"→ "img/haciendanapoles.jpg"
   ─────────────────────────────────────────────────────────── */
function imgKey(nombre) {
  return nombre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // sin tildes
    .replace(/[^a-z0-9]/g, "");                         // solo letras/números
}

function imgUrl(nombre) {
  return `img/${imgKey(nombre)}.jpg`;
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

/* ── BANNER ─────────────────────────────────────────────── */
async function initBanner() {
  const data = await loadJSON("data/banner.json");
  if (!data || !data.activo) return;

  const el  = document.getElementById("banner");
  const txt = document.getElementById("banner-txt");
  const lnk = document.getElementById("banner-lnk");
  if (!el) return;

  txt.textContent = data.texto;
  lnk.textContent = data.linkTexto;
  lnk.href        = wa(data.whatsappMensaje);
  lnk.target      = "_blank";
  el.style.display = "block";

  document.getElementById("banner-close")
    .addEventListener("click", () => el.remove());
}

/* ── OFERTAS ─────────────────────────────────────────────── */
async function initOfertas() {
  const data = await loadJSON("data/promociones.json");
  const grid = document.getElementById("grid-ofertas");
  if (!data || !grid) return;

  const activas = data.filter(d => d.activo !== false);

  if (activas.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No hay ofertas activas en este momento.</p>`;
    return;
  }

  grid.innerHTML = activas.map((d, i) => {
    const delay = (i % 4) * 0.08;
    const badge = d.badge ? `<div class="o-badge">${d.badge}</div>` : `<div></div>`;
    const precio = d.precioDesde
      ? `<div class="o-precio-row">
           <span class="o-desde">Desde</span>
           <span class="o-precio">${fmtCOP(d.precioDesde)}</span>
         </div>
         ${d.incluye  ? `<p class="o-incluye">✅ ${d.incluye}</p>` : ""}
         ${d.vigencia ? `<p class="o-vigencia">⏳ ${d.vigencia}</p>` : `<div class="o-gap"></div>`}`
      : `<p class="o-incluye" style="margin-top:14px">Consulta disponibilidad y precio personalizado.</p>
         <div class="o-gap"></div>`;

    /* miniatura de imagen en la card de oferta */
    const img = imgUrl(d.destino);

    return `
      <div class="o-card rv" style="transition-delay:${delay}s"
           onclick="window.open('${wa(d.whatsappMensaje)}','_blank')">
        <div class="o-bar"></div>
        <div class="o-img-thumb"
             style="background-image:url('${img}')">
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

/* ── DESTINOS ────────────────────────────────────────────── */
function initDestinos() {
  const DESTS = [
    { n:"San Andrés",       copy:"El mar más azul de Colombia. Arena blanca y puestas de sol que te dejan sin palabras."    },
    { n:"Cartagena",        copy:"Ciudad amurallada, historia viva y playas tropicales del Caribe colombiano."              },
    { n:"Santa Marta",      copy:"Tayrona, la Sierra Nevada y las mejores playas del Caribe en un solo destino."            },
    { n:"Punta Cana",       copy:"Resorts todo incluido, playas vírgenes y la energía del Caribe en su máximo esplendor."  },
    { n:"Cancún",           copy:"Playas turquesas, ruinas mayas y vida nocturna de clase mundial."                        },
    { n:"España",           copy:"Barcelona, Madrid, Sevilla y más. Europa al alcance con asesoría migratoria incluida."    },
    { n:"Hacienda Nápoles", copy:"Aventura familiar en Antioquia. Parque temático, safaris y naturaleza selvática."        },
  ];

  const grid = document.getElementById("grid-destinos");
  if (!grid) return;

  grid.innerHTML = DESTS.map((d, i) => {
    const delay = (i % 4) * 0.08;
    const msg   = `Hola Emitours 👋, vi su página web y me interesa cotizar un viaje a *${d.n}*. ¿Me pueden ayudar? ✈️`;
    const img   = imgUrl(d.n);

    return `
      <div class="d-card rv" style="transition-delay:${delay}s"
           onclick="window.open('${wa(msg)}','_blank')">
        <div class="d-bg"
             style="background-image:url('${img}');background-size:cover;background-position:center;transition:transform 0.6s ease;"></div>
        <div class="d-ovl"></div>
        <div class="d-body">
          <div class="d-nombre">${d.n}</div>
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

/* ── TESTIMONIOS ─────────────────────────────────────────── */
async function initTestimonios() {
  const data = await loadJSON("data/testimonios.json");
  const grid = document.getElementById("grid-testimonios");
  if (!data || !grid) return;

  const activos = data.filter(t => t.activo !== false);

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
            <div class="t-stars" title="${t.estrellas} estrellas">${estrellas(t.estrellas)}</div>
          </div>
        </div>
      </div>`;
  }).join("");

  reveal();
}

/* ── HERO SLIDER con imágenes reales ─────────────────────── */
function initHeroSlider() {
  /* Orden de destinos que corresponde a los 5 slides del HTML */
  const HERO_IMGS = [
    "San Andrés",
    "Cartagena",
    "Cancún",
    "Punta Cana",
    "España",
  ];

  const slides = document.querySelectorAll(".h-slide");
  const lbls   = document.querySelectorAll(".h-lbl");
  const dotsC  = document.getElementById("hero-dots");
  if (!slides.length || !dotsC) return;

  /* Asignar imagen de fondo a cada slide */
  slides.forEach((slide, i) => {
    const nombre = HERO_IMGS[i] || HERO_IMGS[0];
    const url    = imgUrl(nombre);
    slide.style.backgroundImage = `url('${url}')`;
    slide.style.backgroundSize     = "cover";
    slide.style.backgroundPosition = "center";
  });

  let cur = 0;

  slides.forEach((_, i) => {
    const d = document.createElement("button");
    d.className = "h-dot" + (i === 0 ? " on" : "");
    d.setAttribute("aria-label", `Diapositiva ${i + 1}`);
    d.addEventListener("click", () => go(i));
    dotsC.appendChild(d);
  });

  function go(n) {
    slides[cur].classList.remove("on");
    lbls[cur]?.classList.remove("on");
    dotsC.children[cur].classList.remove("on");
    cur = n;
    slides[cur].classList.add("on");
    lbls[cur]?.classList.add("on");
    dotsC.children[cur].classList.add("on");
  }

  const timer = setInterval(() => go((cur + 1) % slides.length), 5000);
  document.getElementById("hero")
    ?.addEventListener("mouseenter", () => clearInterval(timer));
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
  close.addEventListener("click", () => menu.classList.remove("open"));
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

  function close() {
    overlay.classList.add("fade-out");
    document.body.classList.remove("no-scroll");
    setTimeout(() => overlay.remove(), 800);
  }

  video.addEventListener("ended", close);
  video.addEventListener("error", close);
  setTimeout(() => { skipBtn.style.display = "flex"; }, 3000);
  skipBtn.addEventListener("click", close);
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
  initHeroSlider();
  initOfertas();
  initDestinos();
  initTestimonios();
  reveal();
});
