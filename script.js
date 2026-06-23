const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");
const header = document.querySelector(".site-header");

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Abrir menú");
  navLinks.classList.remove("open");
  document.body.classList.remove("menu-open");
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Abrir menú" : "Cerrar menú");
  navLinks.classList.toggle("open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 30);
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function observeReveals(scope = document) {
  scope.querySelectorAll(".reveal:not(.visible)").forEach((element) => revealObserver.observe(element));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function safeUrl(value = "") {
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:", "tel:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

async function loadJson(path) {
  const response = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
  return response.json();
}

function renderNotices(items) {
  const container = document.getElementById("notice-grid");
  if (!Array.isArray(items) || !items.length) return;
  container.innerHTML = items.map((item, index) => {
    const featured = item.destacado || index === 0;
    return `
      <article class="notice-card ${featured ? "notice-featured" : ""} reveal">
        ${featured ? '<span class="tag">Destacado</span>' : '<span class="icon-box" aria-hidden="true">✦</span>'}
        <p class="date">${escapeHtml(item.fecha || "Próximamente")}</p>
        <h3>${escapeHtml(item.titulo)}</h3>
        <p>${escapeHtml(item.descripcion)}</p>
        ${featured ? '<span class="card-link">Mantente al pendiente <b>→</b></span>' : ""}
      </article>`;
  }).join("");
  observeReveals(container);
}

function renderNews(items) {
  const container = document.getElementById("news-grid");
  if (!Array.isArray(items) || !items.length) return;
  container.innerHTML = items.map((item, index) => {
    const image = item.imagen ? safeUrl(item.imagen) : "";
    const imageStyle = image ? ` style="background-image:url('${escapeHtml(image)}')"` : "";
    return `
      <article class="news-card reveal">
        <div class="news-image abstract-${["one", "two", "three"][index % 3]} ${image ? "has-photo" : ""}"${imageStyle}>
          <span>${escapeHtml(item.categoria || "COMUNIDAD")}</span>
        </div>
        <div class="news-content">
          <p class="date">${escapeHtml(item.fecha || "Próximamente")}</p>
          <h3>${escapeHtml(item.titulo)}</h3>
          <p>${escapeHtml(item.descripcion)}</p>
        </div>
      </article>`;
  }).join("");
  observeReveals(container);
}

function renderEvents(items) {
  const container = document.getElementById("event-list");
  if (!Array.isArray(items) || !items.length) return;
  container.innerHTML = items.map((item) => `
    <article class="event-row reveal">
      <div class="event-date"><strong>${escapeHtml(item.dia || "—")}</strong><span>${escapeHtml(item.mes || "Próximo")}</span></div>
      <div>
        <p class="tag-line">${escapeHtml(item.categoria || "Escolar")}</p>
        <h3>${escapeHtml(item.titulo)}</h3>
        <p>${escapeHtml(item.detalles || "Fecha y horario por confirmar")}</p>
      </div>
    </article>`).join("");
  observeReveals(container);
}

function renderSchool(data) {
  if (!data) return;
  const contact = document.getElementById("contact-cards");
  contact.innerHTML = `
    <a class="contact-item" href="${safeUrl(data.mapa)}" target="_blank" rel="noopener">
      <span>01</span><div><small>Dirección</small><strong>${escapeHtml(data.direccion)}</strong></div>
    </a>
    <a class="contact-item" href="tel:${escapeHtml(data.telefono_enlace)}">
      <span>02</span><div><small>Teléfono local</small><strong>${escapeHtml(data.telefono)}</strong></div>
    </a>
    <div class="contact-item"><span>03</span><div><small>Clave del centro de trabajo</small><strong>${escapeHtml(data.cct)}</strong></div></div>
    <a class="contact-item" href="${safeUrl(data.whatsapp_enlace)}" target="_blank" rel="noopener">
      <span>04</span><div><small>WhatsApp</small><strong>${escapeHtml(data.whatsapp)}</strong></div>
    </a>`;

  const social = document.getElementById("social-links");
  if (Array.isArray(data.redes)) {
    social.innerHTML = data.redes.map((network) => `
      <a class="social-placeholder" href="${safeUrl(network.enlace)}" target="_blank" rel="noopener">
        ${escapeHtml(network.nombre)} <small>${escapeHtml(network.usuario)}</small>
      </a>`).join("");
  }
}

async function loadEditableContent() {
  const results = await Promise.allSettled([
    loadJson("data/avisos.json"),
    loadJson("data/noticias.json"),
    loadJson("data/eventos.json"),
    loadJson("data/escuela.json")
  ]);
  if (results[0].status === "fulfilled") renderNotices(results[0].value);
  if (results[1].status === "fulfilled") renderNews(results[1].value);
  if (results[2].status === "fulfilled") renderEvents(results[2].value);
  if (results[3].status === "fulfilled") renderSchool(results[3].value);
}

observeReveals();
loadEditableContent();
document.getElementById("year").textContent = new Date().getFullYear();
