/* =========================================================
   ÚTILHUB V25 — SCRIPT.JS
   ---------------------------------------------------------
   ÚtilHub = plataforma principal
   NOVA FLOW = sistema de animaciones

   120 animaciones con comportamientos diferenciados.
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const STORAGE_KEY = "utilhub-v25";

const OLD_KEYS = [
  "utilhub-v24",
  "utilhub-v23",
  "utilhub-v22",
  "utilhub-v21",
  "utilhub-v20",
  "utilhub-v19",
  "utilhub-v18",
  "utilhub-v17",
  "utilhub-v15-advanced"
];

const DEFAULT_STATE = {
  theme: "dark",
  motion: true,
  performance: "balanced",
  focus: false,

  novaActive: false,
  novaMode: null,
  novaIntensity: 0.8,
  scrollParallax: true,

  favorites: [],
  recent: [],

  notes: "",
  tasks: [],
  shopping: [],

  settings: {}
};

let state = loadState();

/* =========================================================
   UTILIDADES GENERALES
   ========================================================= */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function random(min = 0, max = 1) {
  return min + Math.random() * (max - min);
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function deg(value) {
  return value * Math.PI / 180;
}

function rgba(hex, alpha) {
  const clean = hex.replace("#", "");

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "0";

  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 8
  }).format(value);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   STORAGE
   ========================================================= */

function loadState() {
  let saved = null;

  try {
    saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null"
    );
  } catch {
    saved = null;
  }

  if (!saved) {
    for (const key of OLD_KEYS) {
      try {
        const old = JSON.parse(
          localStorage.getItem(key) || "null"
        );

        if (old) {
          saved = old;
          break;
        }
      } catch {
        /* continuar */
      }
    }
  }

  return {
    ...DEFAULT_STATE,
    ...(saved || {}),
    favorites: Array.isArray(saved?.favorites)
      ? saved.favorites
      : [],
    recent: Array.isArray(saved?.recent)
      ? saved.recent
      : [],
    tasks: Array.isArray(saved?.tasks)
      ? saved.tasks
      : [],
    shopping: Array.isArray(saved?.shopping)
      ? saved.shopping
      : []
  };
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn(
      "ÚtilHub: no se pudo guardar:",
      error
    );
  }
}

/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;

function toast(message) {
  const element = $("#toast");

  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 2600);
}

/* =========================================================
   TEMA
   ========================================================= */

function applyTheme() {
  document.body.classList.toggle(
    "light",
    state.theme === "light"
  );

  const button = $("#themeBtn");

  if (button) {
    button.textContent =
      state.theme === "dark"
        ? "☀"
        : "☾";
  }
}

function toggleTheme() {
  state.theme =
    state.theme === "dark"
      ? "light"
      : "dark";

  applyTheme();
  saveState();

  toast(
    state.theme === "dark"
      ? "Modo oscuro activado."
      : "Modo claro activado."
  );
}

/* =========================================================
   MOTION
   ========================================================= */

function applyMotion() {
  document.body.classList.toggle(
    "motion-off",
    !state.motion
  );

  if (!state.motion) {
    state.novaActive = false;
    updateNovaVisibility();
  }
}

function toggleMotion() {
  state.motion = !state.motion;

  applyMotion();
  saveState();

  toast(
    state.motion
      ? "Movimiento activado."
      : "Movimiento desactivado."
  );
}

/* =========================================================
   FOCUS
   ========================================================= */

function applyFocus() {
  document.body.classList.toggle(
    "focus-mode",
    Boolean(state.focus)
  );
}

function toggleFocus() {
  state.focus = !state.focus;

  applyFocus();
  saveState();

  toast(
    state.focus
      ? "Modo concentración activado."
      : "Modo concentración desactivado."
  );
}

/* =========================================================
   HERRAMIENTAS
   ========================================================= */

const TOOLS = [

  {
    id: "calculator",
    name: "Calculadora",
    icon: "🧮",
    category: "math",
    description: "Realiza cálculos rápidos.",
    label: "Cálculo"
  },

  {
    id: "percentage",
    name: "Porcentaje",
    icon: "％",
    category: "math",
    description: "Calcula porcentajes fácilmente.",
    label: "Matemática"
  },

  {
    id: "discount",
    name: "Descuento",
    icon: "🏷️",
    category: "math",
    description: "Calcula descuentos y precios finales.",
    label: "Matemática"
  },

  {
    id: "rule3",
    name: "Regla de tres",
    icon: "📐",
    category: "math",
    description: "Resuelve reglas de tres.",
    label: "Matemática"
  },

  {
    id: "average",
    name: "Promedio",
    icon: "📊",
    category: "math",
    description: "Calcula el promedio de números.",
    label: "Matemática"
  },

  {
    id: "percentage-change",
    name: "Cambio porcentual",
    icon: "📈",
    category: "math",
    description: "Compara valores mediante porcentajes.",
    label: "Matemática"
  },

  {
    id: "area",
    name: "Área",
    icon: "⬛",
    category: "math",
    description: "Calcula áreas de figuras.",
    label: "Matemática"
  },

  {
    id: "base",
    name: "Conversor de bases",
    icon: "🔢",
    category: "math",
    description: "Convierte números entre bases.",
    label: "Matemática"
  },

  {
    id: "length",
    name: "Longitud",
    icon: "📏",
    category: "convert",
    description: "Convierte unidades de longitud.",
    label: "Conversión"
  },

  {
    id: "weight",
    name: "Peso",
    icon: "⚖️",
    category: "convert",
    description: "Convierte unidades de peso.",
    label: "Conversión"
  },

  {
    id: "volume",
    name: "Volumen",
    icon: "🧊",
    category: "convert",
    description: "Convierte unidades de volumen.",
    label: "Conversión"
  },

  {
    id: "temperature",
    name: "Temperatura",
    icon: "🌡️",
    category: "convert",
    description: "Convierte temperaturas.",
    label: "Conversión"
  },

  {
    id: "speed",
    name: "Velocidad",
    icon: "🚀",
    category: "convert",
    description: "Convierte unidades de velocidad.",
    label: "Conversión"
  },

  {
    id: "timeconvert",
    name: "Tiempo",
    icon: "⏳",
    category: "convert",
    description: "Convierte unidades de tiempo.",
    label: "Conversión"
  },

  {
    id: "currency",
    name: "Monedas",
    icon: "💱",
    category: "convert",
    description: "Convierte monedas con datos disponibles.",
    label: "Conversión"
  },

  {
    id: "datediff",
    name: "Diferencia de fechas",
    icon: "📅",
    category: "time",
    description: "Calcula el tiempo entre dos fechas.",
    label: "Tiempo"
  },

  {
    id: "age",
    name: "Calculadora de edad",
    icon: "🎂",
    category: "time",
    description: "Calcula una edad aproximada.",
    label: "Tiempo"
  },

  {
    id: "clock",
    name: "Reloj",
    icon: "🕐",
    category: "time",
    description: "Muestra la hora actual.",
    label: "Tiempo"
  },

  {
    id: "timer",
    name: "Temporizador",
    icon: "⏱️",
    category: "time",
    description: "Cuenta hacia atrás.",
    label: "Tiempo"
  },

  {
    id: "countdown",
    name: "Cuenta regresiva",
    icon: "⌛",
    category: "time",
    description: "Cuenta hasta una fecha.",
    label: "Tiempo"
  },

  {
    id: "stopwatch",
    name: "Cronómetro",
    icon: "🏁",
    category: "time",
    description: "Mide intervalos de tiempo.",
    label: "Tiempo"
  },

  {
    id: "text-counter",
    name: "Contador de texto",
    icon: "🔤",
    category: "text",
    description: "Cuenta palabras y caracteres.",
    label: "Texto"
  },

  {
    id: "case",
    name: "Mayúsculas y minúsculas",
    icon: "Aa",
    category: "text",
    description: "Cambia el formato del texto.",
    label: "Texto"
  },

  {
    id: "slug",
    name: "Generador de slug",
    icon: "🔗",
    category: "text",
    description: "Convierte texto en un slug.",
    label: "Texto"
  },

  {
    id: "json",
    name: "JSON Formatter",
    icon: "{ }",
    category: "text",
    description: "Ordena y formatea JSON.",
    label: "Texto"
  },

  {
    id: "notes",
    name: "Notas",
    icon: "📝",
    category: "organize",
    description: "Guarda notas localmente.",
    label: "Organización"
  },

  {
    id: "tasks",
    name: "Tareas",
    icon: "✅",
    category: "organize",
    description: "Organiza tus tareas.",
    label: "Organización"
  },

  {
    id: "shopping",
    name: "Lista de compras",
    icon: "🛒",
    category: "organize",
    description: "Organiza productos.",
    label: "Organización"
  },

  {
    id: "checklist",
    name: "Checklist",
    icon: "☑️",
    category: "organize",
    description: "Crea una lista rápida.",
    label: "Organización"
  },

  {
    id: "focus",
    name: "Concentración",
    icon: "🎯",
    category: "organize",
    description: "Activa una sesión de enfoque.",
    label: "Organización"
  },

  {
    id: "tip",
    name: "Propina",
    icon: "💰",
    category: "life",
    description: "Calcula una propina.",
    label: "Vida diaria"
  },

  {
    id: "split",
    name: "Dividir cuenta",
    icon: "🍽️",
    category: "life",
    description: "Divide una cuenta entre personas.",
    label: "Vida diaria"
  },

  {
    id: "food",
    name: "Buscar comida",
    icon: "🍔",
    category: "life",
    description: "Busca lugares o comida.",
    label: "Vida diaria"
  },

  {
    id: "buy",
    name: "Buscar productos",
    icon: "🛍️",
    category: "life",
    description: "Busca productos en Internet.",
    label: "Vida diaria"
  },

  {
    id: "password",
    name: "Contraseña segura",
    icon: "🔐",
    category: "fun",
    description: "Genera una contraseña aleatoria.",
    label: "Utilidad"
  },

  {
    id: "random",
    name: "Número aleatorio",
    icon: "🎲",
    category: "fun",
    description: "Genera números aleatorios.",
    label: "Utilidad"
  },

  {
    id: "qr",
    name: "Código QR",
    icon: "▦",
    category: "fun",
    description: "Genera un código QR.",
    label: "Utilidad"
  },

  {
    id: "color",
    name: "Color HEX",
    icon: "🎨",
    category: "fun",
    description: "Convierte y visualiza colores.",
    label: "Utilidad"
  }

];

/* =========================================================
   RENDER DE HERRAMIENTAS
   ========================================================= */

let activeCategory = "all";
let toolSearchText = "";

function getFilteredTools() {
  const query =
    toolSearchText.trim().toLowerCase();

  return TOOLS.filter((tool) => {
    const categoryMatch =
      activeCategory === "all" ||
      tool.category === activeCategory;

    const searchMatch =
      !query ||
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.label.toLowerCase().includes(query);

    return categoryMatch && searchMatch;
  });
}

function renderTools() {
  const grid = $("#toolGrid");

  if (!grid) return;

  const tools = getFilteredTools();

  if (!tools.length) {
    grid.innerHTML = `
      <div class="noResults">
        No encontramos una herramienta con esa búsqueda.
      </div>
    `;

    return;
  }

  grid.innerHTML = tools.map((tool) => {
    const favorite =
      state.favorites.includes(tool.id);

    return `
      <article
        class="toolCard"
        data-tool="${tool.id}"
        tabindex="0"
      >

        <div class="toolCardTop">

          <div class="toolIcon">
            ${tool.icon}
          </div>

          <button
            class="favoriteBtn ${favorite ? "active" : ""}"
            data-favorite="${tool.id}"
            type="button"
            aria-label="Favorito"
          >
            ${favorite ? "★" : "☆"}
          </button>

        </div>

        <div>

          <h3>
            ${escapeHTML(tool.name)}
          </h3>

          <p>
            ${escapeHTML(tool.description)}
          </p>

          <small>
            ${escapeHTML(tool.label)}
          </small>

        </div>

      </article>
    `;
  }).join("");
}

function renderQuickTools() {
  const container = $("#quickTools");

  if (!container) return;

  const recentTools = state.recent
    .map((id) =>
      TOOLS.find((tool) => tool.id === id)
    )
    .filter(Boolean);

  if (!recentTools.length) {
    container.innerHTML = `
      <div class="noResults">
        Tus herramientas recientes aparecerán aquí.
      </div>
    `;

    return;
  }

  container.innerHTML =
    recentTools.map((tool) => `
      <button
        class="quickItem"
        data-quick="${tool.id}"
        type="button"
      >

        <span class="quickItemIcon">
          ${tool.icon}
        </span>

        <span class="quickItemText">
          <strong>
            ${escapeHTML(tool.name)}
          </strong>

          <small>
            Abrir herramienta
          </small>
        </span>

      </button>
    `).join("");
}

function updateStats() {
  const toolCount = $("#toolCount");
  const favoriteCount = $("#favoriteCount");
  const recentCount = $("#recentCount");

  if (toolCount) {
    toolCount.textContent = TOOLS.length;
  }

  if (favoriteCount) {
    favoriteCount.textContent =
      state.favorites.length;
  }

  if (recentCount) {
    recentCount.textContent =
      state.recent.length;
  }
}

/* =========================================================
   FAVORITOS
   ========================================================= */

function toggleFavorite(id) {
  const index =
    state.favorites.indexOf(id);

  if (index >= 0) {
    state.favorites.splice(index, 1);
    toast("Eliminado de favoritos.");
  } else {
    state.favorites.push(id);
    toast("Añadido a favoritos.");
  }

  saveState();
  renderTools();
  updateStats();
}

/* =========================================================
   RECIENTES
   ========================================================= */

function addRecent(id) {
  state.recent =
    state.recent.filter(
      (item) => item !== id
    );

  state.recent.unshift(id);

  state.recent =
    state.recent.slice(0, 8);

  saveState();

  renderQuickTools();
  updateStats();
}

/* =========================================================
   PANEL DE HERRAMIENTAS
   ========================================================= */

function openTool(id) {
  const tool =
    TOOLS.find(
      (item) => item.id === id
    );

  if (!tool) return;

  addRecent(id);

  const panel = $("#toolPanel");
  const icon = $("#toolPanelIcon");
  const category = $("#toolPanelCategory");
  const title = $("#toolPanelTitle");
  const content = $("#toolContent");

  if (!panel || !content) return;

  icon.textContent = tool.icon;
  category.textContent = tool.label;
  title.textContent = tool.name;

  content.innerHTML =
    getToolHTML(id);

  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");

  bindToolEvents(id);

  document.body.style.overflow = "hidden";
}

function closeTool() {
  const panel = $("#toolPanel");

  if (!panel) return;

  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");

  document.body.style.overflow = "";
}

/* =========================================================
   HTML DE HERRAMIENTAS
   ========================================================= */

function getToolHTML(id) {

  switch (id) {

    case "calculator":
      return `
        <div class="toolForm">

          <label>
            Expresión
            <input
              id="calcInput"
              type="text"
              placeholder="Ejemplo: 25 + 8 × 3"
            >
          </label>

          <div class="toolActions">
            <button
              class="primaryBtn"
              id="calcRun"
              type="button"
            >
              Calcular
            </button>
          </div>

          <div
            class="resultBox"
            id="calcResult"
          >
            <strong>—</strong>
            <span>Introduce una operación.</span>
          </div>

        </div>
      `;

    case "percentage":
      return `
        <div class="toolForm">

          <label>
            Porcentaje
            <input
              id="percentValue"
              type="number"
              placeholder="Ejemplo: 20"
            >
          </label>

          <label>
            Número
            <input
              id="percentBase"
              type="number"
              placeholder="Ejemplo: 500"
            >
          </label>

          <button
            class="primaryBtn"
            id="percentRun"
            type="button"
          >
            Calcular
          </button>

          <div class="resultBox" id="percentResult">
            <strong>—</strong>
            <span>Resultado.</span>
          </div>

        </div>
      `;

    case "discount":
      return `
        <div class="toolForm">

          <label>
            Precio
            <input
              id="discountPrice"
              type="number"
            >
          </label>

          <label>
            Descuento %
            <input
              id="discountPercent"
              type="number"
            >
          </label>

          <button
            class="primaryBtn"
            id="discountRun"
            type="button"
          >
            Calcular
          </button>

          <div
            class="resultBox"
            id="discountResult"
          >
            <strong>—</strong>
            <span>Resultado.</span>
          </div>

        </div>
      `;

    case "rule3":
      return `
        <div class="toolForm">

          <label>
            A
            <input
              id="ruleA"
              type="number"
            >
          </label>

          <label>
            B
            <input
              id="ruleB"
              type="number"
            >
          </label>

          <label>
            C
            <input
              id="ruleC"
              type="number"
            >
          </label>

          <button
            class="primaryBtn"
            id="ruleRun"
            type="button"
          >
            Resolver
          </button>

          <div
            class="resultBox"
            id="ruleResult"
          >
            <strong>—</strong>
            <span>x = C × B ÷ A</span>
          </div>

        </div>
      `;

    case "average":
      return `
        <div class="toolForm">

          <label>
            Números separados por comas
            <textarea
              id="averageInput"
              placeholder="10, 15, 20, 25"
            ></textarea>
          </label>

          <button
            class="primaryBtn"
            id="averageRun"
            type="button"
          >
            Calcular promedio
          </button>

          <div
            class="resultBox"
            id="averageResult"
          >
            <strong>—</strong>
            <span>Resultado.</span>
          </div>

        </div>
      `;

    case "percentage-change":
      return `
        <div class="toolForm">

          <label>
            Valor inicial
            <input
              id="changeOld"
              type="number"
            >
          </label>

          <label>
            Valor final
            <input
              id="changeNew"
              type="number"
            >
          </label>

          <button
            class="primaryBtn"
            id="changeRun"
            type="button"
          >
            Calcular cambio
          </button>

          <div
            class="resultBox"
            id="changeResult"
          >
            <strong>—</strong>
            <span>Resultado.</span>
          </div>

        </div>
      `;

    case "area":
      return `
        <div class="toolForm">

          <label>
            Figura
            <select id="areaShape">
              <option value="square">Cuadrado</option>
              <option value="rectangle">Rectángulo</option>
              <option value="triangle">Triángulo</option>
              <option value="circle">Círculo</option>
            </select>
          </label>

          <label>
            Medida A
            <input
              id="areaA"
              type="number"
            >
          </label>

          <label>
            Medida B
            <input
              id="areaB"
              type="number"
              placeholder="Solo rectángulo/triángulo"
            >
          </label>

          <button
            class="primaryBtn"
            id="areaRun"
            type="button"
          >
            Calcular área
          </button>

          <div
            class="resultBox"
            id="areaResult"
          >
            <strong>—</strong>
            <span>Resultado.</span>
          </div>

        </div>
      `;

    case "base":
      return `
        <div class="toolForm">

          <label>
            Número
            <input
              id="baseNumber"
              type="text"
              placeholder="1010"
            >
          </label>

          <label>
            Base de origen
            <select id="baseFrom">
              <option value="2">2</option>
              <option value="8">8</option>
              <option value="10" selected>10</option>
              <option value="16">16</option>
            </select>
          </label>

          <label>
            Base destino
            <select id="baseTo">
              <option value="2">2</option>
              <option value="8">8</option>
              <option value="10">10</option>
              <option value="16" selected>16</option>
            </select>
          </label>

          <button
            class="primaryBtn"
            id="baseRun"
            type="button"
          >
            Convertir
          </button>

          <div
            class="resultBox"
            id="baseResult"
          >
            <strong>—</strong>
            <span>Resultado.</span>
          </div>

        </div>
      `;

    case "length":
      return converterHTML(
        "length",
        [
          ["m", "Metros"],
          ["km", "Kilómetros"],
          ["cm", "Centímetros"],
          ["mm", "Milímetros"],
          ["in", "Pulgadas"],
          ["ft", "Pies"]
        ]
      );

    case "weight":
      return converterHTML(
        "weight",
        [
          ["kg", "Kilogramos"],
          ["g", "Gramos"],
          ["mg", "Miligramos"],
          ["lb", "Libras"],
          ["oz", "Onzas"]
        ]
      );

    case "volume":
      return converterHTML(
        "volume",
        [
          ["l", "Litros"],
          ["ml", "Mililitros"],
          ["m3", "Metros cúbicos"],
          ["gal", "Galones"]
        ]
      );

    case "temperature":
      return converterHTML(
        "temperature",
        [
          ["c", "Celsius"],
          ["f", "Fahrenheit"],
          ["k", "Kelvin"]
        ]
      );

    case "speed":
      return converterHTML(
        "speed",
        [
          ["ms", "m/s"],
          ["kmh", "km/h"],
          ["mph", "mph"],
          ["knot", "Nudos"]
        ]
      );

    case "timeconvert":
      return converterHTML(
        "time",
        [
          ["sec", "Segundos"],
          ["min", "Minutos"],
          ["hour", "Horas"],
          ["day", "Días"]
        ]
      );

    case "currency":
      return `
        <div class="toolForm">

          <label>
            Cantidad
            <input
              id="currencyAmount"
              type="number"
              value="1"
            >
          </label>

          <label>
            Moneda origen
            <select id="currencyFrom">
              <option value="PEN">PEN — Sol</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </label>

          <label>
            Moneda destino
            <select id="currencyTo">
              <option value="USD">USD — Dólar</option>
              <option value="PEN">PEN — Sol</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </label>

          <button
            class="primaryBtn"
            id="currencyRun"
            type="button"
          >
            Convertir
          </button>

          <div
            class="resultBox"
            id="currencyResult"
          >
            <strong>—</strong>
            <span>Se consultará el tipo disponible.</span>
          </div>

        </div>
      `;

    case "datediff":
      return `
        <div class="toolForm">

          <label>
            Fecha inicial
            <input
              id="dateA"
              type="date"
            >
          </label>

          <label>
            Fecha final
            <input
              id="dateB"
              type="date"
            >
          </label>

          <button
            class="primaryBtn"
            id="dateDiffRun"
            type="button"
          >
            Calcular
          </button>

          <div
            class="resultBox"
            id="dateDiffResult"
          >
            <strong>—</strong>
            <span>Diferencia.</span>
          </div>

        </div>
      `;

    case "age":
      return `
        <div class="toolForm">

          <label>
            Fecha de nacimiento
            <input
              id="birthDate"
              type="date"
            >
          </label>

          <button
            class="primaryBtn"
            id="ageRun"
            type="button"
          >
            Calcular edad
          </button>

          <div
            class="resultBox"
            id="ageResult"
          >
            <strong>—</strong>
            <span>Resultado.</span>
          </div>

        </div>
      `;

    case "clock":
      return `
        <div class="resultBox">

          <strong
            id="liveClock"
            style="font-size:3rem"
          >
            --:--:--
          </strong>

          <span id="liveDate">
            Cargando fecha...
          </span>

        </div>
      `;

    case "timer":
      return `
        <div class="toolForm">

          <label>
            Segundos
            <input
              id="timerSeconds"
              type="number"
              min="1"
              value="60"
            >
          </label>

          <div
            class="resultBox"
            id="timerDisplay"
          >
            <strong>01:00</strong>
            <span>Temporizador detenido.</span>
          </div>

          <div class="toolActions">

            <button
              class="primaryBtn"
              id="timerStart"
              type="button"
            >
              Iniciar
            </button>

            <button
              class="secondaryBtn"
              id="timerReset"
              type="button"
            >
              Reiniciar
            </button>

          </div>

        </div>
      `;

    case "stopwatch":
      return `
        <div class="toolForm">

          <div
            class="resultBox"
            id="stopwatchDisplay"
          >
            <strong>00:00.00</strong>
            <span>Cronómetro detenido.</span>
          </div>

          <div class="toolActions">

            <button
              class="primaryBtn"
              id="stopwatchStart"
              type="button"
            >
              Iniciar
            </button>

            <button
              class="secondaryBtn"
              id="stopwatchLap"
              type="button"
            >
              Vuelta
            </button>

            <button
              class="secondaryBtn"
              id="stopwatchReset"
              type="button"
            >
              Reiniciar
            </button>

          </div>

          <div
            id="lapList"
            class="listArea"
          ></div>

        </div>
      `;

    case "countdown":
      return `
        <div class="toolForm">

          <label>
            Fecha y hora
            <input
              id="countdownDate"
              type="datetime-local"
            >
          </label>

          <div
            class="resultBox"
            id="countdownResult"
          >
            <strong>—</strong>
            <span>Selecciona una fecha.</span>
          </div>

          <button
            class="primaryBtn"
            id="countdownStart"
            type="button"
          >
            Iniciar
          </button>

        </div>
      `;

    case "text-counter":
      return `
        <div class="toolForm">

          <label>
            Texto
            <textarea
              id="textCounterInput"
              placeholder="Escribe o pega tu texto..."
            ></textarea>
          </label>

          <div
            class="resultBox"
            id="textCounterResult"
          >
            <strong>0</strong>
            <span>0 palabras · 0 caracteres</span>
          </div>

        </div>
      `;

    case "case":
      return `
        <div class="toolForm">

          <label>
            Texto
            <textarea
              id="caseInput"
              placeholder="Escribe tu texto..."
            ></textarea>
          </label>

          <div class="toolActions">

            <button
              class="secondaryBtn"
              id="caseUpper"
              type="button"
            >
              MAYÚSCULAS
            </button>

            <button
              class="secondaryBtn"
              id="caseLower"
              type="button"
            >
              minúsculas
            </button>

            <button
              class="secondaryBtn"
              id="caseTitle"
              type="button"
            >
              Tipo título
            </button>

          </div>

        </div>
      `;

    case "slug":
      return `
        <div class="toolForm">

          <label>
            Texto
            <input
              id="slugInput"
              type="text"
              placeholder="Mi página genial"
            >
          </label>

          <div
            class="resultBox"
            id="slugResult"
          >
            <strong>—</strong>
            <span>Slug generado.</span>
          </div>

        </div>
      `;

    case "json":
      return `
        <div class="toolForm">

          <label>
            JSON
            <textarea
              id="jsonInput"
              placeholder='{"nombre":"ÚtilHub"}'
            ></textarea>
          </label>

          <button
            class="primaryBtn"
            id="jsonRun"
            type="button"
          >
            Formatear JSON
          </button>

          <div
            class="resultBox"
            id="jsonResult"
          >
            <strong>—</strong>
            <span>Resultado.</span>
          </div>

        </div>
      `;

    case "notes":
      return `
        <div class="toolForm">

          <label>
            Tus notas
            <textarea
              id="notesInput"
              placeholder="Escribe aquí..."
              style="min-height:260px"
            >${escapeHTML(state.notes)}</textarea>
          </label>

          <button
            class="primaryBtn"
            id="saveNotes"
            type="button"
          >
            Guardar notas
          </button>

        </div>
      `;

    case "tasks":
      return taskToolHTML();

    case "shopping":
      return shoppingToolHTML();

    case "checklist":
      return `
        <div class="toolForm">

          <label>
            Elemento
            <input
              id="checkInput"
              type="text"
              placeholder="Ejemplo: estudiar"
            >
          </label>

          <button
            class="primaryBtn"
            id="checkAdd"
            type="button"
          >
            Agregar
          </button>

          <div
            id="checkList"
            class="listArea"
          ></div>

        </div>
      `;

    case "focus":
      return `
        <div class="toolForm">

          <div class="resultBox">

            <strong>
              🎯 Concentración
            </strong>

            <span>
              Reduce distracciones visuales.
            </span>

          </div>

          <button
            class="primaryBtn"
            id="focusOpen"
            type="button"
          >
            Activar modo concentración
          </button>

        </div>
      `;

    case "tip":
      return `
        <div class="toolForm">

          <label>
            Cuenta
            <input
              id="tipBill"
              type="number"
              value="100"
            >
          </label>

          <label>
            Propina %
            <input
              id="tipPercent"
              type="number"
              value="10"
            >
          </label>

          <button
            class="primaryBtn"
            id="tipRun"
            type="button"
          >
            Calcular
          </button>

          <div
            class="resultBox"
            id="tipResult"
          >
            <strong>—</strong>
            <span>Resultado.</span>
          </div>

        </div>
      `;

    case "split":
      return `
        <div class="toolForm">

          <label>
            Total
            <input
              id="splitTotal"
              type="number"
            >
          </label>

          <label>
            Personas
            <input
              id="splitPeople"
              type="number"
              min="1"
              value="2"
            >
          </label>

          <button
            class="primaryBtn"
            id="splitRun"
            type="button"
          >
            Dividir
          </button>

          <div
            class="resultBox"
            id="splitResult"
          >
            <strong>—</strong>
            <span>Resultado.</span>
          </div>

        </div>
      `;

    case "food":
      return `
        <div class="toolForm">

          <label>
            ¿Qué buscas?
            <input
              id="foodQuery"
              type="text"
              placeholder="Pizza, hamburguesas..."
            >
          </label>

          <button
            class="primaryBtn"
            id="foodSearch"
            type="button"
          >
            Buscar
          </button>

          <div class="resultBox">
            <strong>🍔</strong>
            <span>
              La búsqueda se realizará externamente.
              Tú decides dónde pedir.
            </span>
          </div>

        </div>
      `;

    case "buy":
      return `
        <div class="toolForm">

          <label>
            Producto
            <input
              id="buyQuery"
              type="text"
              placeholder="Audífonos, mochila..."
            >
          </label>

          <div class="toolActions">

            <button
              class="primaryBtn"
              id="buyGoogle"
              type="button"
            >
              Buscar
            </button>

            <button
              class="secondaryBtn"
              id="buyMercado"
              type="button"
            >
              Mercado Libre
            </button>

          </div>

        </div>
      `;

    case "password":
      return `
        <div class="toolForm">

          <label>
            Longitud
            <input
              id="passLength"
              type="number"
              min="6"
              max="64"
              value="16"
            >
          </label>

          <button
            class="primaryBtn"
            id="passRun"
            type="button"
          >
            Generar
          </button>

          <div
            class="resultBox"
            id="passResult"
          >
            <strong>—</strong>
            <span>Genera una contraseña aleatoria.</span>
          </div>

        </div>
      `;

    case "random":
      return `
        <div class="toolForm">

          <label>
            Mínimo
            <input
              id="randomMin"
              type="number"
              value="1"
            >
          </label>

          <label>
            Máximo
            <input
              id="randomMax"
              type="number"
              value="100"
            >
          </label>

          <button
            class="primaryBtn"
            id="randomRun"
            type="button"
          >
            Generar
          </button>

          <div
            class="resultBox"
            id="randomResult"
          >
            <strong>—</strong>
            <span>Número aleatorio.</span>
          </div>

        </div>
      `;

    case "qr":
      return `
        <div class="toolForm">

          <label>
            Texto o enlace
            <input
              id="qrInput"
              type="text"
              placeholder="https://..."
            >
          </label>

          <button
            class="primaryBtn"
            id="qrRun"
            type="button"
          >
            Generar QR
          </button>

          <div
            class="resultBox"
            id="qrResult"
          >
            <strong>▦</strong>
            <span>El QR aparecerá aquí.</span>
          </div>

        </div>
      `;

    case "color":
      return `
        <div class="toolForm">

          <label>
            Color
            <input
              id="colorInput"
              type="color"
              value="#6ee7ff"
              style="height:70px"
            >
          </label>

          <div
            class="resultBox"
            id="colorResult"
          >
            <strong>#6EE7FF</strong>
            <span>Color seleccionado.</span>
          </div>

        </div>
      `;

    default:
      return `
        <div class="noResults">
          Herramienta no disponible.
        </div>
      `;
  }
}

/* =========================================================
   CONVERTORES
   ========================================================= */

function converterHTML(type, units) {
  return `
    <div class="toolForm">

      <label>
        Cantidad
        <input
          id="convertValue"
          type="number"
          value="1"
        >
      </label>

      <label>
        Desde
        <select id="convertFrom">
          ${units.map(
            ([value, name]) =>
              `<option value="${value}">
                ${name}
              </option>`
          ).join("")}
        </select>
      </label>

      <label>
        Hacia
        <select id="convertTo">
          ${units.map(
            ([value, name]) =>
              `<option value="${value}">
                ${name}
              </option>`
          ).join("")}
        </select>
      </label>

      <button
        class="primaryBtn"
        id="convertRun"
        type="button"
        data-converter="${type}"
      >
        Convertir
      </button>

      <div
        class="resultBox"
        id="convertResult"
      >
        <strong>—</strong>
        <span>Resultado.</span>
      </div>

    </div>
  `;
}

/* =========================================================
   SAFE MATH
   ========================================================= */

function safeCalculate(expression) {
  let text = String(expression)
    .replaceAll(",", ".")
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-")
    .trim();

  if (!text) {
    throw new Error("Expresión vacía.");
  }

  if (!/^[0-9+\-*/().%\s]+$/.test(text)) {
    throw new Error("Operación no permitida.");
  }

  const tokens = text.match(
    /(\d+(?:\.\d+)?)|([+\-*/%()])/g
  );

  if (!tokens) {
    throw new Error("Operación inválida.");
  }

  let position = 0;

  function parseExpression() {
    let value = parseTerm();

    while (
      tokens[position] === "+" ||
      tokens[position] === "-"
    ) {
      const operator =
        tokens[position++];

      const right = parseTerm();

      value =
        operator === "+"
          ? value + right
          : value - right;
    }

    return value;
  }

  function parseTerm() {
    let value = parseFactor();

    while (
      tokens[position] === "*" ||
      tokens[position] === "/" ||
      tokens[position] === "%"
    ) {
      const operator =
        tokens[position++];

      const right = parseFactor();

      if (operator === "*") {
        value *= right;
      }

      if (operator === "/") {
        if (right === 0) {
          throw new Error("No se puede dividir entre cero.");
        }

        value /= right;
      }

      if (operator === "%") {
        value %= right;
      }
    }

    return value;
  }

  function parseFactor() {
    const token = tokens[position];

    if (token === "+") {
      position++;
      return parseFactor();
    }

    if (token === "-") {
      position++;
      return -parseFactor();
    }

    if (token === "(") {
      position++;

      const value =
        parseExpression();

      if (tokens[position] !== ")") {
        throw new Error("Paréntesis incorrectos.");
      }

      position++;

      return value;
    }

    if (/^\d/.test(token || "")) {
      position++;
      return Number(token);
    }

    throw new Error("Expresión inválida.");
  }

  const result =
    parseExpression();

  if (position !== tokens.length) {
    throw new Error("Expresión incompleta.");
  }

  if (!Number.isFinite(result)) {
    throw new Error("Resultado inválido.");
  }

  return result;
}

/* =========================================================
   CONVERSIONES
   ========================================================= */

const CONVERTERS = {

  length: {
    m: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    in: 0.0254,
    ft: 0.3048
  },

  weight: {
    kg: 1,
    g: 0.001,
    mg: 0.000001,
    lb: 0.45359237,
    oz: 0.0283495231
  },

  volume: {
    l: 1,
    ml: 0.001,
    m3: 1000,
    gal: 3.785411784
  },

  speed: {
    ms: 1,
    kmh: 0.2777777778,
    mph: 0.44704,
    knot: 0.5144444444
  },

  time: {
    sec: 1,
    min: 60,
    hour: 3600,
    day: 86400
  }

};

function convertValue(type, value, from, to) {
  if (type === "temperature") {
    return convertTemperature(
      value,
      from,
      to
    );
  }

  const table =
    CONVERTERS[type];

  if (!table) {
    throw new Error("Conversor desconocido.");
  }

  const base =
    value * table[from];

  return base / table[to];
}

function convertTemperature(
  value,
  from,
  to
) {
  let celsius;

  if (from === "c") {
    celsius = value;
  } else if (from === "f") {
    celsius =
      (value - 32) * 5 / 9;
  } else {
    celsius =
      value - 273.15;
  }

  if (to === "c") {
    return celsius;
  }

  if (to === "f") {
    return celsius * 9 / 5 + 32;
  }

  return celsius + 273.15;
}

/* =========================================================
   BIND DE HERRAMIENTAS
   ========================================================= */

function bindToolEvents(id) {

  if (id === "calculator") {
    $("#calcRun")?.addEventListener(
      "click",
      () => {
        try {
          const result =
            safeCalculate(
              $("#calcInput").value
            );

          $("#calcResult").innerHTML = `
            <strong>
              ${formatNumber(result)}
            </strong>
            <span>
              Resultado
            </span>
          `;
        } catch (error) {
          $("#calcResult").innerHTML = `
            <strong>⚠️</strong>
            <span>
              ${escapeHTML(error.message)}
            </span>
          `;
        }
      }
    );
  }

  if (id === "percentage") {
    $("#percentRun")?.addEventListener(
      "click",
      () => {
        const p =
          Number($("#percentValue").value);

        const n =
          Number($("#percentBase").value);

        const result =
          n * p / 100;

        showResult(
          "#percentResult",
          result,
          `${p}% de ${n}`
        );
      }
    );
  }

  if (id === "discount") {
    $("#discountRun")?.addEventListener(
      "click",
      () => {
        const price =
          Number($("#discountPrice").value);

        const discount =
          Number($("#discountPercent").value);

        const saved =
          price * discount / 100;

        const final =
          price - saved;

        showResult(
          "#discountResult",
          formatNumber(final),
          `Ahorras ${formatNumber(saved)}`
        );
      }
    );
  }

  if (id === "rule3") {
    $("#ruleRun")?.addEventListener(
      "click",
      () => {
        const a =
          Number($("#ruleA").value);

        const b =
          Number($("#ruleB").value);

        const c =
          Number($("#ruleC").value);

        if (a === 0) {
          showResult(
            "#ruleResult",
            "—",
            "A no puede ser 0."
          );

          return;
        }

        const result =
          c * b / a;

        showResult(
          "#ruleResult",
          formatNumber(result),
          "Resultado de la regla de tres"
        );
      }
    );
  }

  if (id === "average") {
    $("#averageRun")?.addEventListener(
      "click",
      () => {
        const values =
          $("#averageInput").value
            .split(",")
            .map(Number)
            .filter(Number.isFinite);

        if (!values.length) {
          showResult(
            "#averageResult",
            "—",
            "Introduce números."
          );

          return;
        }

        const result =
          values.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / values.length;

        showResult(
          "#averageResult",
          formatNumber(result),
          `${values.length} valores`
        );
      }
    );
  }

  if (id === "percentage-change") {
    $("#changeRun")?.addEventListener(
      "click",
      () => {
        const oldValue =
          Number($("#changeOld").value);

        const newValue =
          Number($("#changeNew").value);

        if (oldValue === 0) {
          showResult(
            "#changeResult",
            "—",
            "El valor inicial no puede ser 0."
          );

          return;
        }

        const change =
          ((newValue - oldValue) /
            Math.abs(oldValue)) * 100;

        showResult(
          "#changeResult",
          `${formatNumber(change)}%`,
          change >= 0
            ? "Aumento"
            : "Disminución"
        );
      }
    );
  }

  if (id === "area") {
    $("#areaRun")?.addEventListener(
      "click",
      () => {

        const shape =
          $("#areaShape").value;

        const a =
          Number($("#areaA").value);

        const b =
          Number($("#areaB").value);

        let result;

        if (shape === "square") {
          result = a * a;
        }

        if (shape === "rectangle") {
          result = a * b;
        }

        if (shape === "triangle") {
          result = a * b / 2;
        }

        if (shape === "circle") {
          result = Math.PI * a * a;
        }

        showResult(
          "#areaResult",
          formatNumber(result),
          "Unidades cuadradas"
        );
      }
    );
  }

  if (id === "base") {
    $("#baseRun")?.addEventListener(
      "click",
      () => {
        try {

          const value =
            $("#baseNumber").value.trim();

          const from =
            Number($("#baseFrom").value);

          const to =
            Number($("#baseTo").value);

          const decimal =
            parseInt(value, from);

          if (
            !Number.isFinite(decimal)
          ) {
            throw new Error("Número inválido.");
          }

          const result =
            decimal.toString(to).toUpperCase();

          showResult(
            "#baseResult",
            result,
            `Base ${from} → base ${to}`
          );

        } catch (error) {
          showResult(
            "#baseResult",
            "⚠️",
            error.message
          );
        }
      }
    );
  }

  if (
    [
      "length",
      "weight",
      "volume",
      "temperature",
      "speed",
      "timeconvert"
    ].includes(id)
  ) {

    $("#convertRun")?.addEventListener(
      "click",
      () => {

        try {

          const value =
            Number($("#convertValue").value);

          const from =
            $("#convertFrom").value;

          const to =
            $("#convertTo").value;

          const type =
            $("#convertRun").dataset.converter;

          const result =
            convertValue(
              type,
              value,
              from,
              to
            );

          showResult(
            "#convertResult",
            formatNumber(result),
            `${from} → ${to}`
          );

        } catch (error) {

          showResult(
            "#convertResult",
            "⚠️",
            error.message
          );
        }
      }
    );
  }

  if (id === "currency") {
    $("#currencyRun")?.addEventListener(
      "click",
      convertCurrency
    );
  }

  if (id === "datediff") {
    $("#dateDiffRun")?.addEventListener(
      "click",
      () => {

        const a =
          new Date(
            $("#dateA").value
          );

        const b =
          new Date(
            $("#dateB").value
          );

        if (
          Number.isNaN(a.getTime()) ||
          Number.isNaN(b.getTime())
        ) {
          showResult(
            "#dateDiffResult",
            "—",
            "Selecciona ambas fechas."
          );

          return;
        }

        const days =
          Math.round(
            Math.abs(
              b - a
            ) / 86400000
          );

        showResult(
          "#dateDiffResult",
          `${formatNumber(days)} días`,
          "Diferencia aproximada"
        );
      }
    );
  }

  if (id === "age") {
    $("#ageRun")?.addEventListener(
      "click",
      () => {

        const birth =
          new Date(
            $("#birthDate").value
          );

        if (
          Number.isNaN(
            birth.getTime()
          )
        ) {
          showResult(
            "#ageResult",
            "—",
            "Selecciona una fecha."
          );

          return;
        }

        const now =
          new Date();

        let age =
          now.getFullYear() -
          birth.getFullYear();

        const month =
          now.getMonth() -
          birth.getMonth();

        if (
          month < 0 ||
          (
            month === 0 &&
            now.getDate() <
            birth.getDate()
          )
        ) {
          age--;
        }

        showResult(
          "#ageResult",
          `${age} años`,
          "Edad aproximada"
        );
      }
    );
  }

  if (id === "clock") {
    startClock();
  }

  if (id === "timer") {
    bindTimer();
  }

  if (id === "stopwatch") {
    bindStopwatch();
  }

  if (id === "countdown") {
    bindCountdown();
  }

  if (id === "text-counter") {
    $("#textCounterInput")?.addEventListener(
      "input",
      updateTextCounter
    );
  }

  if (id === "case") {
    bindCaseTool();
  }

  if (id === "slug") {
    $("#slugInput")?.addEventListener(
      "input",
      updateSlug
    );
  }

  if (id === "json") {
    $("#jsonRun")?.addEventListener(
      "click",
      formatJSON
    );
  }

  if (id === "notes") {
    $("#saveNotes")?.addEventListener(
      "click",
      () => {

        state.notes =
          $("#notesInput").value;

        saveState();

        toast("Notas guardadas.");
      }
    );
  }

  if (id === "tasks") {
    bindTasks();
  }

  if (id === "shopping") {
    bindShopping();
  }

  if (id === "checklist") {
    bindChecklist();
  }

  if (id === "focus") {
    $("#focusOpen")?.addEventListener(
      "click",
      () => {

        state.focus = true;

        applyFocus();
        saveState();

        toast(
          "Modo concentración activado."
        );

        closeTool();
      }
    );
  }

  if (id === "tip") {
    $("#tipRun")?.addEventListener(
      "click",
      () => {

        const bill =
          Number($("#tipBill").value);

        const percent =
          Number($("#tipPercent").value);

        const tipValue =
          bill * percent / 100;

        const total =
          bill + tipValue;

        showResult(
          "#tipResult",
          formatNumber(total),
          `Propina: ${formatNumber(tipValue)}`
        );
      }
    );
  }

  if (id === "split") {
    $("#splitRun")?.addEventListener(
      "click",
      () => {

        const total =
          Number($("#splitTotal").value);

        const people =
          Number($("#splitPeople").value);

        if (people <= 0) {
          showResult(
            "#splitResult",
            "—",
            "Número de personas inválido."
          );

          return;
        }

        const each =
          total / people;

        showResult(
          "#splitResult",
          formatNumber(each),
          "Por persona"
        );
      }
    );
  }

  if (id === "food") {
    $("#foodSearch")?.addEventListener(
      "click",
      () => {

        const query =
          $("#foodQuery").value.trim();

        if (!query) {
          toast("Escribe qué comida buscas.");
          return;
        }

        const url =
          `https://www.google.com/search?q=${encodeURIComponent(
            query + " comida restaurantes"
          )}`;

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );
      }
    );
  }

  if (id === "buy") {
    $("#buyGoogle")?.addEventListener(
      "click",
      () => {

        const query =
          $("#buyQuery").value.trim();

        if (!query) {
          toast("Escribe un producto.");
          return;
        }

        window.open(
          `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`,
          "_blank",
          "noopener,noreferrer"
        );
      }
    );

    $("#buyMercado")?.addEventListener(
      "click",
      () => {

        const query =
          $("#buyQuery").value.trim();

        if (!query) {
          toast("Escribe un producto.");
          return;
        }

        window.open(
          `https://listado.mercadolibre.com.pe/${encodeURIComponent(query)}`,
          "_blank",
          "noopener,noreferrer"
        );
      }
    );
  }

  if (id === "password") {
    $("#passRun")?.addEventListener(
      "click",
      generatePassword
    );
  }

  if (id === "random") {
    $("#randomRun")?.addEventListener(
      "click",
      generateRandom
    );
  }

  if (id === "qr") {
    $("#qrRun")?.addEventListener(
      "click",
      generateQR
    );
  }

  if (id === "color") {
    $("#colorInput")?.addEventListener(
      "input",
      updateColor
    );

    updateColor();
  }
}

/* =========================================================
   RESULTADO
   ========================================================= */

function showResult(
  selector,
  value,
  description
) {
  const element = $(selector);

  if (!element) return;

  element.innerHTML = `
    <strong>
      ${escapeHTML(String(value))}
    </strong>

    <span>
      ${escapeHTML(String(description))}
    </span>
  `;
}

/* =========================================================
   MONEDA
   ========================================================= */

async function convertCurrency() {

  const amount =
    Number($("#currencyAmount").value);

  const from =
    $("#currencyFrom").value;

  const to =
    $("#currencyTo").value;

  if (!Number.isFinite(amount)) {
    showResult(
      "#currencyResult",
      "—",
      "Cantidad inválida."
    );

    return;
  }

  if (from === to) {
    showResult(
      "#currencyResult",
      formatNumber(amount),
      `${from} → ${to}`
    );

    return;
  }

  showResult(
    "#currencyResult",
    "⏳",
    "Consultando..."
  );

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      7000
    );

  try {

    const response =
      await fetch(
        `https://api.frankfurter.app/latest?amount=${encodeURIComponent(
          amount
        )}&from=${from}&to=${to}`,
        {
          signal:
            controller.signal
        }
      );

    if (!response.ok) {
      throw new Error(
        "No se pudo consultar."
      );
    }

    const data =
      await response.json();

    const result =
      data.rates?.[to];

    if (!Number.isFinite(result)) {
      throw new Error(
        "Conversión no disponible."
      );
    }

    showResult(
      "#currencyResult",
      formatNumber(result),
      `${from} → ${to}`
    );

  } catch {

    showResult(
      "#currencyResult",
      "Sin conexión",
      "Inténtalo nuevamente."
    );

  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================================
   RELOJ
   ========================================================= */

let clockInterval = null;

function startClock() {

  clearInterval(clockInterval);

  const update = () => {

    const now =
      new Date();

    const time =
      now.toLocaleTimeString(
        "es-PE"
      );

    const date =
      now.toLocaleDateString(
        "es-PE",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      );

    if ($("#liveClock")) {
      $("#liveClock").textContent =
        time;
    }

    if ($("#liveDate")) {
      $("#liveDate").textContent =
        date;
    }
  };

  update();

  clockInterval =
    setInterval(
      update,
      1000
    );
}

/* =========================================================
   TEMPORIZADOR
   ========================================================= */

let timerInterval = null;

function bindTimer() {

  let remaining =
    Number($("#timerSeconds").value) || 60;

  let running = false;

  const render = () => {

    const minutes =
      Math.floor(
        remaining / 60
      );

    const seconds =
      remaining % 60;

    $("#timerDisplay").innerHTML = `
      <strong>
        ${String(minutes).padStart(2, "0")}:
        ${String(seconds).padStart(2, "0")}
      </strong>

      <span>
        ${running ? "En marcha." : "Detenido."}
      </span>
    `;
  };

  $("#timerStart")?.addEventListener(
    "click",
    () => {

      if (running) return;

      running = true;
      render();

      timerInterval =
        setInterval(
          () => {

            remaining--;

            if (remaining <= 0) {
              remaining = 0;

              clearInterval(
                timerInterval
              );

              running = false;

              toast(
                "Temporizador terminado."
              );
            }

            render();

          },
          1000
        );
    }
  );

  $("#timerReset")?.addEventListener(
    "click",
    () => {

      clearInterval(
        timerInterval
      );

      remaining =
        Number(
          $("#timerSeconds").value
        ) || 60;

      running = false;

      render();
    }
  );

  $("#timerSeconds")?.addEventListener(
    "input",
    () => {

      if (!running) {
        remaining =
          Number(
            $("#timerSeconds").value
          ) || 0;

        render();
      }
    }
  );

  render();
}

/* =========================================================
   CRONÓMETRO
   ========================================================= */

let stopwatchInterval = null;

function bindStopwatch() {

  let started = 0;
  let elapsed = 0;
  let running = false;

  const render = () => {

    const total =
      running
        ? performance.now() - started + elapsed
        : elapsed;

    const centiseconds =
      Math.floor(
        total / 10
      ) % 100;

    const seconds =
      Math.floor(
        total / 1000
      ) % 60;

    const minutes =
      Math.floor(
        total / 60000
      );

    $("#stopwatchDisplay").innerHTML = `
      <strong>
        ${String(minutes).padStart(2, "0")}:
        ${String(seconds).padStart(2, "0")}.
        ${String(centiseconds).padStart(2, "0")}
      </strong>

      <span>
        ${running ? "En marcha." : "Detenido."}
      </span>
    `;
  };

  $("#stopwatchStart")?.addEventListener(
    "click",
    () => {

      if (!running) {

        started =
          performance.now();

        running = true;

        stopwatchInterval =
          setInterval(
            render,
            50
          );

      } else {

        elapsed +=
          performance.now() -
          started;

        running = false;

        clearInterval(
          stopwatchInterval
        );
      }

      render();
    }
  );

  $("#stopwatchLap")?.addEventListener(
    "click",
    () => {

      const total =
        running
          ? performance.now() - started + elapsed
          : elapsed;

      const seconds =
        (total / 1000).toFixed(2);

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "listItem";

      item.innerHTML = `
        <span>
          Vuelta ${$("#lapList").children.length + 1}
        </span>

        <strong>
          ${seconds}s
        </strong>
      `;

      $("#lapList").prepend(item);
    }
  );

  $("#stopwatchReset")?.addEventListener(
    "click",
    () => {

      clearInterval(
        stopwatchInterval
      );

      elapsed = 0;
      running = false;

      $("#lapList").innerHTML = "";

      render();
    }
  );

  render();
}

/* =========================================================
   CUENTA REGRESIVA
   ========================================================= */

let countdownInterval = null;

function bindCountdown() {

  $("#countdownStart")?.addEventListener(
    "click",
    () => {

      clearInterval(
        countdownInterval
      );

      const input =
        $("#countdownDate").value;

      const target =
        new Date(input);

      if (
        Number.isNaN(
          target.getTime()
        )
      ) {
        showResult(
          "#countdownResult",
          "—",
          "Selecciona una fecha."
        );

        return;
      }

      const update = () => {

        const difference =
          target.getTime() -
          Date.now();

        if (difference <= 0) {

          showResult(
            "#countdownResult",
            "¡Llegó el momento!",
            "Cuenta finalizada."
          );

          clearInterval(
            countdownInterval
          );

          return;
        }

        const seconds =
          Math.floor(
            difference / 1000
          );

        const days =
          Math.floor(
            seconds / 86400
          );

        const hours =
          Math.floor(
            (seconds % 86400) / 3600
          );

        const minutes =
          Math.floor(
            (seconds % 3600) / 60
          );

        const secs =
          seconds % 60;

        showResult(
          "#countdownResult",
          `${days}d ${hours}h ${minutes}m ${secs}s`,
          "Tiempo restante"
        );
      };

      update();

      countdownInterval =
        setInterval(
          update,
          1000
        );
    }
  );
}

/* =========================================================
   TEXTO
   ========================================================= */

function updateTextCounter() {

  const text =
    $("#textCounterInput").value;

  const characters =
    text.length;

  const words =
    text.trim()
      ? text.trim().split(/\s+/).length
      : 0;

  const lines =
    text
      ? text.split("\n").length
      : 0;

  $("#textCounterResult").innerHTML = `
    <strong>
      ${characters}
    </strong>

    <span>
      ${words} palabras · ${lines} líneas
    </span>
  `;
}

function bindCaseTool() {

  const input =
    $("#caseInput");

  $("#caseUpper")?.addEventListener(
    "click",
    () => {
      input.value =
        input.value.toUpperCase();
    }
  );

  $("#caseLower")?.addEventListener(
    "click",
    () => {
      input.value =
        input.value.toLowerCase();
    }
  );

  $("#caseTitle")?.addEventListener(
    "click",
    () => {
      input.value =
        input.value
          .toLowerCase()
          .replace(
            /(^|\s)\S/g,
            (letter) =>
              letter.toUpperCase()
          );
    }
  );
}

function updateSlug() {

  const text =
    $("#slugInput").value;

  const slug =
    text
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  showResult(
    "#slugResult",
    slug || "—",
    "Slug generado"
  );
}

function formatJSON() {

  try {

    const object =
      JSON.parse(
        $("#jsonInput").value
      );

    const formatted =
      JSON.stringify(
        object,
        null,
        2
      );

    showResult(
      "#jsonResult",
      "✓ JSON válido",
      formatted
    );

  } catch {

    showResult(
      "#jsonResult",
      "✕ JSON inválido",
      "Revisa la estructura."
    );
  }
}

/* =========================================================
   NOTAS
   ========================================================= */

function taskToolHTML() {

  return `
    <div class="toolForm">

      <label>
        Nueva tarea
        <input
          id="taskInput"
          type="text"
          placeholder="Ejemplo: terminar proyecto"
        >
      </label>

      <button
        class="primaryBtn"
        id="taskAdd"
        type="button"
      >
        Agregar tarea
      </button>

      <div
        id="taskList"
        class="listArea"
      ></div>

    </div>
  `;
}

function bindTasks() {

  const render = () => {

    const list =
      $("#taskList");

    if (!list) return;

    if (!state.tasks.length) {
      list.innerHTML = `
        <div class="noResults">
          No tienes tareas.
        </div>
      `;

      return;
    }

    list.innerHTML =
      state.tasks.map(
        (task, index) => `
          <div
            class="listItem ${
              task.done ? "completed" : ""
            }"
          >

            <input
              type="checkbox"
              data-task-check="${index}"
              ${task.done ? "checked" : ""}
            >

            <span>
              ${escapeHTML(task.text)}
            </span>

            <button
              class="deleteItem"
              data-task-delete="${index}"
              type="button"
            >
              ×
            </button>

          </div>
        `
      ).join("");
  };

  $("#taskAdd")?.addEventListener(
    "click",
    () => {

      const input =
        $("#taskInput");

      const text =
        input.value.trim();

      if (!text) return;

      state.tasks.push({
        text,
        done: false
      });

      input.value = "";

      saveState();
      render();
    }
  );

  $("#taskList")?.addEventListener(
    "click",
    (event) => {

      const check =
        event.target.closest(
          "[data-task-check]"
        );

      const remove =
        event.target.closest(
          "[data-task-delete]"
        );

      if (check) {

        const index =
          Number(
            check.dataset.taskCheck
          );

        state.tasks[index].done =
          check.checked;

        saveState();
        render();
      }

      if (remove) {

        const index =
          Number(
            remove.dataset.taskDelete
          );

        state.tasks.splice(
          index,
          1
        );

        saveState();
        render();
      }
    }
  );

  render();
}

/* =========================================================
   LISTA DE COMPRAS
   ========================================================= */

function shoppingToolHTML() {

  return `
    <div class="toolForm">

      <label>
        Producto
        <input
          id="shoppingInput"
          type="text"
          placeholder="Ejemplo: arroz"
        >
      </label>

      <button
        class="primaryBtn"
        id="shoppingAdd"
        type="button"
      >
        Agregar
      </button>

      <div
        id="shoppingList"
        class="listArea"
      ></div>

    </div>
  `;
}

function bindShopping() {

  const render = () => {

    const list =
      $("#shoppingList");

    if (!list) return;

    if (!state.shopping.length) {
      list.innerHTML = `
        <div class="noResults">
          Tu lista está vacía.
        </div>
      `;

      return;
    }

    list.innerHTML =
      state.shopping.map(
        (item, index) => `
          <div
            class="listItem ${
              item.done ? "completed" : ""
            }"
          >

            <input
              type="checkbox"
              data-shop-check="${index}"
              ${item.done ? "checked" : ""}
            >

            <span>
              ${escapeHTML(item.text)}
            </span>

            <button
              class="deleteItem"
              data-shop-delete="${index}"
              type="button"
            >
              ×
            </button>

          </div>
        `
      ).join("");
  };

  $("#shoppingAdd")?.addEventListener(
    "click",
    () => {

      const input =
        $("#shoppingInput");

      const text =
        input.value.trim();

      if (!text) return;

      state.shopping.push({
        text,
        done: false
      });

      input.value = "";

      saveState();
      render();
    }
  );

  $("#shoppingList")?.addEventListener(
    "click",
    (event) => {

      const check =
        event.target.closest(
          "[data-shop-check]"
        );

      const remove =
        event.target.closest(
          "[data-shop-delete]"
        );

      if (check) {

        const index =
          Number(
            check.dataset.shopCheck
          );

        state.shopping[index].done =
          check.checked;

        saveState();
        render();
      }

      if (remove) {

        const index =
          Number(
            remove.dataset.shopDelete
          );

        state.shopping.splice(
          index,
          1
        );

        saveState();
        render();
      }
    }
  );

  render();
}

/* =========================================================
   CHECKLIST
   ========================================================= */

function bindChecklist() {

  const items = [];

  const render = () => {

    const list =
      $("#checkList");

    if (!list) return;

    list.innerHTML =
      items.length
        ? items.map(
            (item, index) => `
              <div class="listItem">

                <input
                  type="checkbox"
                  data-check="${index}"
                >

                <span>
                  ${escapeHTML(item)}
                </span>

                <button
                  class="deleteItem"
                  data-check-delete="${index}"
                  type="button"
                >
                  ×
                </button>

              </div>
            `
          ).join("")
        : `
          <div class="noResults">
            Lista vacía.
          </div>
        `;
  };

  $("#checkAdd")?.addEventListener(
    "click",
    () => {

      const input =
        $("#checkInput");

      const value =
        input.value.trim();

      if (!value) return;

      items.push(value);

      input.value = "";

      render();
    }
  );

  $("#checkList")?.addEventListener(
    "click",
    (event) => {

      const remove =
        event.target.closest(
          "[data-check-delete]"
        );

      if (!remove) return;

      const index =
        Number(
          remove.dataset.checkDelete
        );

      items.splice(
        index,
        1
      );

      render();
    }
  );

  render();
}

/* =========================================================
   CONTRASEÑA
   ========================================================= */

function generatePassword() {

  const length =
    clamp(
      Number(
        $("#passLength").value
      ) || 16,
      6,
      64
    );

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ" +
    "abcdefghijkmnopqrstuvwxyz" +
    "23456789!@#$%^&*_-+=";

  const values =
    new Uint32Array(length);

  crypto.getRandomValues(values);

  let password = "";

  for (let i = 0; i < length; i++) {
    password +=
      chars[
        values[i] % chars.length
      ];
  }

  showResult(
    "#passResult",
    password,
    `${length} caracteres`
  );
}

/* =========================================================
   ALEATORIO
   ========================================================= */

function generateRandom() {

  let min =
    Number($("#randomMin").value);

  let max =
    Number($("#randomMax").value);

  if (min > max) {
    [min, max] =
      [max, min];
  }

  const result =
    Math.floor(
      Math.random() *
      (max - min + 1)
    ) + min;

  showResult(
    "#randomResult",
    result,
    `Entre ${min} y ${max}`
  );
}

/* =========================================================
   QR
   ========================================================= */

function generateQR() {

  const value =
    $("#qrInput").value.trim();

  if (!value) {
    toast("Escribe un texto o enlace.");
    return;
  }

  const url =
    `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(value)}`;

  $("#qrResult").innerHTML = `
    <strong>✓ QR generado</strong>

    <span>
      <img
        src="${url}"
        alt="Código QR"
        style="
          display:block;
          width:240px;
          height:240px;
          margin:15px auto 0;
          border-radius:12px;
          background:white;
        "
      >
    </span>
  `;
}

/* =========================================================
   COLOR
   ========================================================= */

function updateColor() {

  const color =
    $("#colorInput").value
      .toUpperCase();

  $("#colorResult").innerHTML = `
    <strong>
      ${color}
    </strong>

    <span>
      <span
        style="
          display:inline-block;
          width:25px;
          height:25px;
          border-radius:7px;
          vertical-align:middle;
          margin-right:7px;
          background:${color};
        "
      ></span>
      Color seleccionado
    </span>
  `;
}

/* =========================================================
   PANEL NOVA FLOW
   ========================================================= */

let novaCategory = "all";
let novaSearchText = "";

function openNova() {

  const panel =
    $("#novaPanel");

  if (!panel) return;

  panel.classList.add("open");
  panel.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";

  renderNovaModes();

  startNovaPreview();
}

function closeNova() {

  const panel =
    $("#novaPanel");

  if (!panel) return;

  panel.classList.remove("open");

  panel.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow =
    "";

  stopNovaPreview();
}

/* =========================================================
   CATEGORÍAS NOVA
   ========================================================= */

function getNovaFilteredModes() {

  const query =
    novaSearchText
      .trim()
      .toLowerCase();

  return NOVA_MODES.filter(
    (mode) => {

      const categoryMatch =
        novaCategory === "all" ||
        mode.category === novaCategory;

      const searchMatch =
        !query ||
        mode.name
          .toLowerCase()
          .includes(query) ||
        mode.category
          .toLowerCase()
          .includes(query);

      return (
        categoryMatch &&
        searchMatch
      );
    }
  );
}

function renderNovaModes() {

  const container =
    $("#novaModes");

  if (!container) return;

  const modes =
    getNovaFilteredModes();

  container.innerHTML =
    modes.map(
      (mode) => `
        <button
          class="novaMode ${
            state.novaMode === mode.id
              ? "active"
              : ""
          }"
          data-nova-mode="${mode.id}"
          type="button"
        >

          <span class="novaModeNumber">
            ${String(mode.number).padStart(3, "0")}
          </span>

          <span class="novaModeName">
            ${escapeHTML(mode.name)}
          </span>

          <span class="novaModeCategory">
            ${escapeHTML(mode.categoryLabel)}
          </span>

        </button>
      `
    ).join("");

  if (!modes.length) {
    container.innerHTML = `
      <div class="noResults">
        No encontramos esa animación.
      </div>
    `;
  }
}

function selectNovaMode(id) {

  const mode =
    NOVA_MODES.find(
      (item) => item.id === id
    );

  if (!mode) return;

  state.novaMode =
    mode.id;

  state.novaActive =
    true;

  saveState();

  updateNovaVisibility();
  renderNovaModes();
  updateNovaPanelInfo();

  toast(
    `${mode.name} activada en todo ÚtilHub.`
  );
}

function updateNovaPanelInfo() {

  const mode =
    NOVA_MODES.find(
      (item) => item.id === state.novaMode
    );

  const status =
    $("#novaStatus");

  const name =
    $("#novaModeName");

  const button =
    $("#globalFxBtn");

  if (!mode) {

    if (status) {
      status.textContent =
        "NOVA FLOW desactivado";
    }

    if (name) {
      name.textContent =
        "Ninguna animación";
    }

    if (button) {
      button.textContent =
        "Activar NOVA FLOW";
    }

    return;
  }

  if (status) {
    status.textContent =
      state.novaActive
        ? "NOVA FLOW activo en todo ÚtilHub"
        : "NOVA FLOW seleccionado";
  }

  if (name) {
    name.textContent =
      mode.name;
  }

  if (button) {
    button.textContent =
      state.novaActive
        ? "Desactivar NOVA FLOW"
        : "Activar NOVA FLOW";
  }
}

function updateNovaVisibility() {

  const opacity =
    state.novaActive &&
    state.motion
      ? 1
      : 0;

  document.documentElement.style
    .setProperty(
      "--nova-opacity",
      opacity
    );

  document.body.classList.toggle(
    "nova-active",
    Boolean(
      state.novaActive &&
      state.motion
    )
  );

  updateNovaPanelInfo();
}

/* =========================================================
   NOVA RENDIMIENTO
   ========================================================= */

function getPerformanceSettings() {

  const modes = {

    high: {
      particles: 220,
      detail: 1.35,
      fps: 60
    },

    balanced: {
      particles: 130,
      detail: 1,
      fps: 60
    },

    performance: {
      particles: 75,
      detail: 0.78,
      fps: 50
    },

    low: {
      particles: 40,
      detail: 0.55,
      fps: 35
    }

  };

  if (
    state.performance !== "auto"
  ) {
    return modes[
      state.performance
    ] || modes.balanced;
  }

  const width =
    window.innerWidth;

  const memory =
    navigator.deviceMemory || 4;

  if (
    width < 600 ||
    memory <= 2
  ) {
    return modes.low;
  }

  if (
    width < 1000 ||
    memory <= 4
  ) {
    return modes.performance;
  }

  return modes.balanced;
}

/* =========================================================
   NOVA CANVAS
   ========================================================= */

const canvas =
  $("#nova");

const ctx =
  canvas?.getContext(
    "2d",
    {
      alpha: true
    }
  );

let dpr =
  Math.min(
    window.devicePixelRatio || 1,
    2
  );

let canvasWidth = 0;
let canvasHeight = 0;

let novaAnimationFrame = null;
let novaLastTime = 0;
let novaFps = 60;
let novaFrames = 0;
let novaFpsTimer = 0;

let pointerTarget = {
  x: 0.5,
  y: 0.5
};

let pointerSmooth = {
  x: 0.5,
  y: 0.5
};

let scrollTarget = 0;
let scrollSmooth = 0;

function resizeCanvas() {

  if (!canvas || !ctx) return;

  canvasWidth =
    window.innerWidth;

  canvasHeight =
    window.innerHeight;

  dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  canvas.width =
    Math.max(
      1,
      Math.floor(
        canvasWidth * dpr
      )
    );

  canvas.height =
    Math.max(
      1,
      Math.floor(
        canvasHeight * dpr
      )
    );

  canvas.style.width =
    `${canvasWidth}px`;

  canvas.style.height =
    `${canvasHeight}px`;

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );
}

function clearCanvas() {

  if (!ctx) return;

  ctx.clearRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );
}

function updateNovaPointer() {

  pointerSmooth.x =
    lerp(
      pointerSmooth.x,
      pointerTarget.x,
      0.06
    );

  pointerSmooth.y =
    lerp(
      pointerSmooth.y,
      pointerTarget.y,
      0.06
    );

  scrollSmooth =
    lerp(
      scrollSmooth,
      scrollTarget,
      0.035
    );

  document.documentElement.style
    .setProperty(
      "--nova-x",
      `${pointerSmooth.x * 100}%`
    );

  document.documentElement.style
    .setProperty(
      "--nova-y",
      `${pointerSmooth.y * 100}%`
    );
}

/* =========================================================
   NOVA PALETA
   ========================================================= */

const PALETTES = [
  [
    "#6ee7ff",
    "#7c5cff",
    "#a78bfa"
  ],
  [
    "#57e6a7",
    "#6ee7ff",
    "#d4ff8a"
  ],
  [
    "#ff6b9d",
    "#9b7cff",
    "#6ee7ff"
  ],
  [
    "#ffd166",
    "#ff8c42",
    "#ff5c8a"
  ],
  [
    "#8be9fd",
    "#50fa7b",
    "#bd93f9"
  ],
  [
    "#f8f9fa",
    "#6ee7ff",
    "#7c5cff"
  ]
];

function getPalette(index) {
  return PALETTES[
    index % PALETTES.length
  ];
}

function colorFor(mode, index = 0) {
  const palette =
    getPalette(mode.palette || 0);

  return palette[
    index % palette.length
  ];
}

/* =========================================================
   SISTEMA DE PARTÍCULAS AUXILIAR
   ========================================================= */

function createParticles(
  count,
  factory
) {
  const result = [];

  for (let i = 0; i < count; i++) {
    result.push(
      factory(i)
    );
  }

  return result;
}

function drawGlowPoint(
  x,
  y,
  radius,
  color,
  alpha = 1
) {
  if (!ctx) return;

  const gradient =
    ctx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      radius
    );

  gradient.addColorStop(
    0,
    rgba(color, 0.8 * alpha)
  );

  gradient.addColorStop(
    0.35,
    rgba(color, 0.22 * alpha)
  );

  gradient.addColorStop(
    1,
    rgba(color, 0)
  );

  ctx.fillStyle =
    gradient;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

function drawLine(
  x1,
  y1,
  x2,
  y2,
  color,
  width = 1,
  alpha = 1
) {
  ctx.strokeStyle =
    rgba(color, alpha);

  ctx.lineWidth =
    width;

  ctx.beginPath();

  ctx.moveTo(
    x1,
    y1
  );

  ctx.lineTo(
    x2,
    y2
  );

  ctx.stroke();
}

/* =========================================================
   120 NOVA FLOW
   ========================================================= */

/*
  Cada modo tiene una función draw propia.
  No se utiliza un único renderer con cambio de color.
*/

const NOVA_MODES = [

/* 001 --------------------------------------------------- */

{
  id: "cosmic-drift",
  number: 1,
  name: "Cosmic Drift",
  category: "space",
  categoryLabel: "Espacial",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const count =
      Math.floor(
        110 * intensity
      );

    for (let i = 0; i < count; i++) {

      const a =
        i * 2.399 +
        t * 0.00015;

      const r =
        80 +
        (i * 31) %
        (Math.max(
          canvasWidth,
          canvasHeight
        ) * 0.65);

      const x =
        canvasWidth / 2 +
        Math.cos(a) * r;

      const y =
        canvasHeight / 2 +
        Math.sin(a * 0.73) * r * 0.65;

      drawGlowPoint(
        x,
        y,
        2 + (i % 3),
        colorFor(
          this,
          i
        ),
        0.55
      );
    }
  }
},

/* 002 --------------------------------------------------- */

{
  id: "aurora",
  number: 2,
  name: "Aurora",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const bands =
      8;

    for (let b = 0; b < bands; b++) {

      ctx.beginPath();

      for (
        let x = -30;
        x <= canvasWidth + 30;
        x += 10
      ) {

        const wave =
          Math.sin(
            x * 0.009 +
            t * 0.0012 +
            b
          ) * 55;

        const wave2 =
          Math.sin(
            x * 0.021 -
            t * 0.0007 +
            b * 1.7
          ) * 25;

        const y =
          canvasHeight * 0.38 +
          b * 34 +
          wave * intensity +
          wave2 * intensity;

        if (x === -30) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, b),
          0.2
        );

      ctx.lineWidth =
        15;

      ctx.stroke();
    }
  }
},

/* 003 --------------------------------------------------- */

{
  id: "pulse-rings",
  number: 3,
  name: "Pulse Rings",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const max =
      Math.max(
        canvasWidth,
        canvasHeight
      );

    for (let i = 0; i < 18; i++) {

      const cycle =
        (t * 0.00018 +
          i / 18) % 1;

      const radius =
        cycle * max * 0.75;

      ctx.beginPath();

      ctx.arc(
        canvasWidth / 2,
        canvasHeight / 2,
        radius,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          (1 - cycle) *
          0.35 *
          intensity
        );

      ctx.lineWidth =
        2 + cycle * 4;

      ctx.stroke();
    }
  }
},

/* 004 --------------------------------------------------- */

{
  id: "matrix-rain",
  number: 4,
  name: "Matrix Rain",
  category: "digital",
  categoryLabel: "Digital",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const spacing = 25;

    for (
      let x = 0;
      x < canvasWidth;
      x += spacing
    ) {

      const column =
        Math.floor(
          x / spacing
        );

      const speed =
        0.035 +
        (column % 5) *
        0.008;

      const offset =
        (t * speed +
          column * 71) %
        (canvasHeight + 400);

      for (
        let j = 0;
        j < 12;
        j++
      ) {

        const y =
          offset -
          j * 24;

        if (
          y < -30 ||
          y > canvasHeight + 30
        ) continue;

        const chars =
          "01アイウエオ";

        const char =
          chars[
            (column + j) %
            chars.length
          ];

        ctx.fillStyle =
          rgba(
            colorFor(this, 1),
            (1 - j / 13) *
            0.7 *
            intensity
          );

        ctx.font =
          "13px monospace";

        ctx.fillText(
          char,
          x,
          y
        );
      }
    }
  }
},

/* 005 --------------------------------------------------- */

{
  id: "nebula-swirl",
  number: 5,
  name: "Nebula Swirl",
  category: "space",
  categoryLabel: "Espacial",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth *
      (0.5 + pointerSmooth.x * 0.08);

    const cy =
      canvasHeight *
      (0.5 + pointerSmooth.y * 0.08);

    for (let i = 0; i < 160; i++) {

      const p =
        i / 160;

      const angle =
        p * Math.PI * 14 +
        t * 0.00025;

      const radius =
        p *
        Math.min(
          canvasWidth,
          canvasHeight
        ) *
        0.65;

      const x =
        cx +
        Math.cos(angle) *
        radius;

      const y =
        cy +
        Math.sin(angle) *
        radius *
        0.55;

      drawGlowPoint(
        x,
        y,
        2 + p * 5,
        colorFor(this, i),
        (1 - p) *
        0.45 *
        intensity
      );
    }
  }
},

/* 006 --------------------------------------------------- */

{
  id: "ocean",
  number: 6,
  name: "Ocean",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let layer = 0; layer < 9; layer++) {

      ctx.beginPath();

      for (
        let x = 0;
        x <= canvasWidth;
        x += 8
      ) {

        const y =
          canvasHeight * 0.58 +
          layer * 28 +
          Math.sin(
            x * 0.012 +
            t * 0.001 +
            layer
          ) * 22 * intensity +
          Math.sin(
            x * 0.028 -
            t * 0.0006
          ) * 10;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, layer),
          0.12
        );

      ctx.lineWidth =
        3;

      ctx.stroke();
    }
  }
},

/* 007 --------------------------------------------------- */

{
  id: "starfield",
  number: 7,
  name: "Starfield",
  category: "space",
  categoryLabel: "Espacial",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const count =
      Math.floor(
        180 * intensity
      );

    for (let i = 0; i < count; i++) {

      const seed =
        i * 91.17;

      const z =
        ((seed +
          t * 0.00009 *
          (1 + i % 4)) %
          1);

      const depth =
        1 - z;

      const x =
        (
          ((seed * 13.17) % 1) -
          0.5
        ) *
        canvasWidth *
        2;

      const y =
        (
          ((seed * 7.91) % 1) -
          0.5
        ) *
        canvasHeight *
        2;

      const sx =
        canvasWidth / 2 +
        x / Math.max(
          0.08,
          depth
        );

      const sy =
        canvasHeight / 2 +
        y / Math.max(
          0.08,
          depth
        );

      if (
        sx < -20 ||
        sx > canvasWidth + 20 ||
        sy < -20 ||
        sy > canvasHeight + 20
      ) continue;

      ctx.fillStyle =
        rgba(
          colorFor(this, i),
          depth * 0.65
        );

      ctx.beginPath();

      ctx.arc(
        sx,
        sy,
        Math.max(
          0.5,
          depth * 3
        ),
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }
},

/* 008 --------------------------------------------------- */

{
  id: "vortex",
  number: 8,
  name: "Vortex",
  category: "energy",
  categoryLabel: "Energía",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let arm = 0; arm < 7; arm++) {

      ctx.beginPath();

      for (
        let r = 10;
        r < Math.max(
          canvasWidth,
          canvasHeight
        );
        r += 7
      ) {

        const angle =
          r * 0.025 +
          arm *
          Math.PI * 2 / 7 -
          t * 0.0006;

        const x =
          cx +
          Math.cos(angle) *
          r;

        const y =
          cy +
          Math.sin(angle) *
          r *
          0.65;

        if (r === 10) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, arm),
          0.23 * intensity
        );

      ctx.lineWidth =
        1.5;

      ctx.stroke();
    }
  }
},

/* 009 --------------------------------------------------- */

{
  id: "fireflies",
  number: 9,
  name: "Fireflies",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 75; i++) {

      const x =
        (
          i * 137.5 +
          Math.sin(
            t * 0.0004 +
            i
          ) * 45
        ) %
        canvasWidth;

      const y =
        (
          i * 83.7 +
          Math.cos(
            t * 0.00032 +
            i * 0.7
          ) * 60
        ) %
        canvasHeight;

      const pulse =
        0.5 +
        Math.sin(
          t * 0.002 +
          i
        ) * 0.5;

      drawGlowPoint(
        x,
        y,
        7 + pulse * 7,
        colorFor(this, i),
        pulse *
        0.5 *
        intensity
      );
    }
  }
},

/* 010 --------------------------------------------------- */

{
  id: "rain",
  number: 10,
  name: "Rain",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 180; i++) {

      const x =
        (
          i * 71.3 +
          Math.sin(i) * 30
        ) %
        canvasWidth;

      const speed =
        0.55 +
        (i % 8) * 0.08;

      const y =
        (
          i * 49.7 +
          t * speed
        ) %
        (canvasHeight + 100) -
        50;

      drawLine(
        x,
        y,
        x - 5,
        y + 22,
        colorFor(this, i),
        1,
        0.18 * intensity
      );
    }
  }
},

/* 011 --------------------------------------------------- */

{
  id: "grid-horizon",
  number: 11,
  name: "Grid Horizon",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const horizon =
      canvasHeight * 0.53;

    ctx.strokeStyle =
      rgba(
        colorFor(this, 0),
        0.22 * intensity
      );

    ctx.lineWidth = 1;

    for (
      let y = horizon;
      y < canvasHeight + 250;
      y += 28
    ) {

      ctx.beginPath();

      ctx.moveTo(
        0,
        y
      );

      ctx.lineTo(
        canvasWidth,
        y
      );

      ctx.stroke();
    }

    for (
      let x = -canvasWidth;
      x < canvasWidth * 2;
      x += 65
    ) {

      ctx.beginPath();

      ctx.moveTo(
        canvasWidth / 2,
        horizon
      );

      ctx.lineTo(
        x +
        Math.sin(t * 0.0003) * 20,
        canvasHeight
      );

      ctx.stroke();
    }
  }
},

/* 012 --------------------------------------------------- */

{
  id: "spiral",
  number: 12,
  name: "Spiral",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    ctx.beginPath();

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (
      let a = 0;
      a < Math.PI * 18;
      a += 0.035
    ) {

      const r =
        4 +
        a * 8;

      const angle =
        a +
        t * 0.0004;

      const x =
        cx +
        Math.cos(angle) *
        r;

      const y =
        cy +
        Math.sin(angle) *
        r *
        0.55;

      if (a === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      rgba(
        colorFor(this, 0),
        0.35 * intensity
      );

    ctx.lineWidth = 2;

    ctx.stroke();
  }
},

/* 013 --------------------------------------------------- */

{
  id: "orbit",
  number: 13,
  name: "Orbit",
  category: "space",
  categoryLabel: "Espacial",
  palette: 4,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    drawGlowPoint(
      cx,
      cy,
      65,
      colorFor(this, 0),
      0.4
    );

    for (let i = 0; i < 8; i++) {

      const radius =
        70 +
        i * 42;

      ctx.beginPath();

      ctx.ellipse(
        cx,
        cy,
        radius,
        radius * 0.45,
        i * 0.25,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.15 * intensity
        );

      ctx.stroke();

      const angle =
        t * 0.0007 *
        (1 + i * 0.12) +
        i;

      const x =
        cx +
        Math.cos(angle) *
        radius;

      const y =
        cy +
        Math.sin(angle) *
        radius *
        0.45;

      drawGlowPoint(
        x,
        y,
        8,
        colorFor(this, i),
        0.7
      );
    }
  }
},

/* 014 --------------------------------------------------- */

{
  id: "plasma",
  number: 14,
  name: "Plasma",
  category: "energy",
  categoryLabel: "Energía",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (
      let y = 0;
      y < canvasHeight;
      y += 16
    ) {

      ctx.beginPath();

      for (
        let x = 0;
        x <= canvasWidth;
        x += 12
      ) {

        const value =
          Math.sin(
            x * 0.018 +
            t * 0.001 +
            y * 0.01
          ) +
          Math.sin(
            y * 0.022 -
            t * 0.0007 +
            x * 0.006
          );

        const py =
          y +
          value *
          12 *
          intensity;

        if (x === 0) {
          ctx.moveTo(x, py);
        } else {
          ctx.lineTo(x, py);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, y),
          0.11
        );

      ctx.stroke();
    }
  }
},

/* 015 --------------------------------------------------- */

{
  id: "dna",
  number: 15,
  name: "DNA",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    for (
      let y = -20;
      y < canvasHeight + 20;
      y += 9
    ) {

      const phase =
        y * 0.025 +
        t * 0.001;

      const x1 =
        cx +
        Math.sin(phase) *
        120;

      const x2 =
        cx +
        Math.sin(phase + Math.PI) *
        120;

      drawGlowPoint(
        x1,
        y,
        3,
        colorFor(this, 0),
        0.7 * intensity
      );

      drawGlowPoint(
        x2,
        y,
        3,
        colorFor(this, 1),
        0.7 * intensity
      );

      if (
        Math.floor(y / 9) % 4 === 0
      ) {
        drawLine(
          x1,
          y,
          x2,
          y,
          colorFor(this, 2),
          1,
          0.3
        );
      }
    }
  }
},

/* 016 --------------------------------------------------- */

{
  id: "snow",
  number: 16,
  name: "Snow",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 150; i++) {

      const size =
        1 +
        (i % 5);

      const x =
        (
          i * 91.2 +
          Math.sin(
            t * 0.0005 +
            i
          ) * 40
        ) %
        canvasWidth;

      const y =
        (
          i * 47.4 +
          t * (0.018 + size * 0.004)
        ) %
        (canvasHeight + 60);

      ctx.fillStyle =
        rgba(
          colorFor(this, i),
          0.5 * intensity
        );

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        size,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }
},

/* 017 --------------------------------------------------- */

{
  id: "lightning",
  number: 17,
  name: "Lightning",
  category: "energy",
  categoryLabel: "Energía",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const strike =
      Math.floor(
        t / 900
      ) % 4;

    if (
      t % 900 >
      560
    ) return;

    for (let branch = 0; branch < 5; branch++) {

      ctx.beginPath();

      let x =
        canvasWidth *
        (0.15 + strike * 0.2);

      let y = 0;

      ctx.moveTo(x, y);

      for (
        let i = 0;
        i < 10;
        i++
      ) {

        x +=
          (Math.random() - 0.5) *
          80;

        y +=
          canvasHeight / 10;

        ctx.lineTo(x, y);
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, branch),
          0.45 * intensity
        );

      ctx.lineWidth =
        branch === 0
          ? 3
          : 1;

      ctx.stroke();
    }
  }
},

/* 018 --------------------------------------------------- */

{
  id: "galaxy",
  number: 18,
  name: "Galaxy",
  category: "space",
  categoryLabel: "Espacial",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 230; i++) {

      const arm =
        i % 4;

      const distance =
        8 +
        (i / 230) *
        Math.min(
          canvasWidth,
          canvasHeight
        ) *
        0.7;

      const angle =
        arm *
        Math.PI / 2 +
        distance * 0.018 +
        t * 0.00025;

      const x =
        cx +
        Math.cos(angle) *
        distance;

      const y =
        cy +
        Math.sin(angle) *
        distance *
        0.55;

      ctx.fillStyle =
        rgba(
          colorFor(this, i),
          (1 - distance /
            Math.max(
              canvasWidth,
              canvasHeight
            )) *
          0.55 *
          intensity
        );

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        1.2 + (i % 3),
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }
},

/* 019 --------------------------------------------------- */

{
  id: "comet",
  number: 19,
  name: "Comet",
  category: "space",
  categoryLabel: "Espacial",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cycle =
      (t * 0.00025) % 1;

    const x =
      -150 +
      cycle *
      (canvasWidth + 300);

    const y =
      canvasHeight *
      0.2 +
      Math.sin(
        cycle * Math.PI * 2
      ) *
      canvasHeight *
      0.25;

    for (let i = 0; i < 25; i++) {

      const tail =
        i * 12;

      drawGlowPoint(
        x - tail,
        y + tail * 0.25,
        5 + (25 - i) / 8,
        colorFor(this, i),
        (1 - i / 25) *
        0.5 *
        intensity
      );
    }

    drawGlowPoint(
      x,
      y,
      18,
      colorFor(this, 0),
      intensity
    );
  }
},

/* 020 --------------------------------------------------- */

{
  id: "quantum",
  number: 20,
  name: "Quantum",
  category: "special",
  categoryLabel: "Especial",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 80; i++) {

      const phase =
        Math.floor(
          t / (250 + i % 5 * 40)
        );

      const x =
        (
          i * 137.3 +
          phase * 37
        ) %
        canvasWidth;

      const y =
        (
          i * 73.1 +
          phase * 53
        ) %
        canvasHeight;

      drawGlowPoint(
        x,
        y,
        2 + (phase % 4),
        colorFor(this, i),
        0.4 * intensity
      );
    }
  }
},

/* 021 --------------------------------------------------- */

{
  id: "solar",
  number: 21,
  name: "Solar",
  category: "space",
  categoryLabel: "Espacial",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth * 0.5;

    const cy =
      canvasHeight * 0.5;

    drawGlowPoint(
      cx,
      cy,
      90,
      colorFor(this, 0),
      0.55 * intensity
    );

    for (let i = 0; i < 24; i++) {

      const angle =
        i *
        Math.PI * 2 / 24 +
        t * 0.0003;

      const inner =
        65 +
        Math.sin(
          t * 0.002 +
          i
        ) * 10;

      const outer =
        140 +
        Math.sin(
          t * 0.001 +
          i
        ) * 30;

      drawLine(
        cx +
          Math.cos(angle) *
          inner,
        cy +
          Math.sin(angle) *
          inner,
        cx +
          Math.cos(angle) *
          outer,
        cy +
          Math.sin(angle) *
          outer,
        colorFor(this, i),
        2,
        0.3 * intensity
      );
    }
  }
},

/* 022 --------------------------------------------------- */

{
  id: "meteor",
  number: 22,
  name: "Meteor",
  category: "space",
  categoryLabel: "Espacial",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 18; i++) {

      const progress =
        (
          t * 0.00035 +
          i / 18
        ) % 1;

      const x =
        progress *
        (canvasWidth + 300) -
        150;

      const y =
        progress *
        canvasHeight *
        0.7 -
        80;

      drawLine(
        x,
        y,
        x - 100,
        y - 60,
        colorFor(this, i),
        2,
        0.45 * intensity
      );

      drawGlowPoint(
        x,
        y,
        7,
        colorFor(this, i),
        0.7 * intensity
      );
    }
  }
},

/* 023 --------------------------------------------------- */

{
  id: "bubbles",
  number: 23,
  name: "Bubbles",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 55; i++) {

      const size =
        4 +
        (i % 9);

      const x =
        (
          i * 103 +
          Math.sin(
            t * 0.0007 +
            i
          ) * 50
        ) %
        canvasWidth;

      const y =
        canvasHeight -
        (
          i * 61 +
          t * 0.025
        ) %
        (canvasHeight + 100);

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.25 * intensity
        );

      ctx.lineWidth = 1.5;

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        size,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }
  }
},

/* 024 --------------------------------------------------- */

{
  id: "hexgrid",
  number: 24,
  name: "Hex Grid",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const size = 38;

    for (
      let row = -1;
      row < canvasHeight / 30 + 2;
      row++
    ) {

      for (
        let col = -1;
        col < canvasWidth / 66 + 2;
        col++
      ) {

        const x =
          col * size * 1.73 +
          (row % 2) *
          size * 0.86;

        const y =
          row * size * 1.5;

        const pulse =
          (
            Math.sin(
              t * 0.002 +
              col * 0.4 +
              row * 0.6
            ) + 1
          ) / 2;

        ctx.beginPath();

        for (let s = 0; s < 6; s++) {

          const angle =
            Math.PI / 3 * s;

          const px =
            x +
            Math.cos(angle) *
            size;

          const py =
            y +
            Math.sin(angle) *
            size;

          if (s === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }

        ctx.closePath();

        ctx.strokeStyle =
          rgba(
            colorFor(this, row + col),
            (0.05 + pulse * 0.13) *
            intensity
          );

        ctx.stroke();
      }
    }
  }
},

/* 025 --------------------------------------------------- */

{
  id: "ripples",
  number: 25,
  name: "Ripples",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let wave = 0; wave < 7; wave++) {

      const cycle =
        (
          t * 0.0002 +
          wave / 7
        ) % 1;

      const radius =
        cycle *
        Math.min(
          canvasWidth,
          canvasHeight
        ) *
        0.65;

      const x =
        canvasWidth *
        0.5;

      const y =
        canvasHeight *
        0.58;

      ctx.beginPath();

      ctx.ellipse(
        x,
        y,
        radius,
        radius * 0.3,
        0,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, wave),
          (1 - cycle) *
          0.3 *
          intensity
        );

      ctx.lineWidth = 2;

      ctx.stroke();
    }
  }
},

/* 026 --------------------------------------------------- */

{
  id: "sparks",
  number: 26,
  name: "Sparks",
  category: "energy",
  categoryLabel: "Energía",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 45; i++) {

      const cycle =
        (
          t * 0.0008 +
          i * 0.071
        ) % 1;

      const angle =
        i * 2.4;

      const radius =
        cycle * 180;

      const x =
        canvasWidth / 2 +
        Math.cos(angle) *
        radius;

      const y =
        canvasHeight / 2 +
        Math.sin(angle) *
        radius;

      drawLine(
        x,
        y,
        x -
          Math.cos(angle) * 20,
        y -
          Math.sin(angle) * 20,
        colorFor(this, i),
        2,
        (1 - cycle) *
        intensity
      );
    }
  }
},

/* 027 --------------------------------------------------- */

{
  id: "petals",
  number: 27,
  name: "Petals",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 12; i++) {

      const angle =
        i *
        Math.PI / 6 +
        t * 0.0002;

      ctx.save();

      ctx.translate(
        cx,
        cy
      );

      ctx.rotate(angle);

      ctx.beginPath();

      ctx.ellipse(
        0,
        -100,
        30,
        90,
        0,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.22 * intensity
        );

      ctx.stroke();

      ctx.restore();
    }
  }
},

/* 028 --------------------------------------------------- */

{
  id: "constellation",
  number: 28,
  name: "Constellation",
  category: "space",
  categoryLabel: "Espacial",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const points = [];

    for (let i = 0; i < 45; i++) {

      const x =
        (
          i * 157.1 +
          Math.sin(
            t * 0.0003 +
            i
          ) * 20
        ) %
        canvasWidth;

      const y =
        (
          i * 89.3 +
          Math.cos(
            t * 0.0002 +
            i
          ) * 25
        ) %
        canvasHeight;

      points.push({
        x,
        y
      });

      drawGlowPoint(
        x,
        y,
        3,
        colorFor(this, i),
        0.6 * intensity
      );
    }

    for (let i = 0; i < points.length; i++) {

      for (
        let j = i + 1;
        j < points.length;
        j++
      ) {

        const a = points[i];
        const b = points[j];

        const distance =
          Math.hypot(
            a.x - b.x,
            a.y - b.y
          );

        if (distance < 140) {

          drawLine(
            a.x,
            a.y,
            b.x,
            b.y,
            colorFor(this, i),
            1,
            (1 - distance / 140) *
            0.18 *
            intensity
          );
        }
      }
    }
  }
},

/* 029 --------------------------------------------------- */

{
  id: "tunnel",
  number: 29,
  name: "Tunnel",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 20; i++) {

      const depth =
        (
          i / 20 +
          t * 0.00025
        ) % 1;

      const size =
        20 +
        depth *
        Math.max(
          canvasWidth,
          canvasHeight
        );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          (1 - depth) *
          0.28 *
          intensity
        );

      ctx.strokeRect(
        cx - size,
        cy - size * 0.55,
        size * 2,
        size * 1.1
      );
    }
  }
},

/* 030 --------------------------------------------------- */

{
  id: "rings",
  number: 30,
  name: "Rings",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 4,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 9; i++) {

      ctx.save();

      ctx.translate(
        canvasWidth / 2,
        canvasHeight / 2
      );

      ctx.rotate(
        t * 0.0001 *
        (i % 2 ? 1 : -1)
      );

      ctx.scale(
        1,
        0.25 + i * 0.03
      );

      ctx.beginPath();

      ctx.arc(
        0,
        0,
        70 + i * 42,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.22 * intensity
        );

      ctx.lineWidth = 2;

      ctx.stroke();

      ctx.restore();
    }
  }
},

/* 031 --------------------------------------------------- */

{
  id: "glitch",
  number: 31,
  name: "Glitch",
  category: "digital",
  categoryLabel: "Digital",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const blocks =
      35 +
      Math.floor(
        intensity * 25
      );

    for (let i = 0; i < blocks; i++) {

      const phase =
        Math.floor(
          t / 130
        ) + i;

      const x =
        (
          phase * 97
        ) %
        canvasWidth;

      const y =
        (
          phase * 53
        ) %
        canvasHeight;

      const w =
        10 +
        (phase % 70);

      const h =
        2 +
        (phase % 9);

      ctx.fillStyle =
        rgba(
          colorFor(this, i),
          0.08
        );

      ctx.fillRect(
        x,
        y,
        w,
        h
      );
    }

    for (
      let y = 0;
      y < canvasHeight;
      y += 5
    ) {

      ctx.fillStyle =
        "rgba(255,255,255,0.015)";

      ctx.fillRect(
        0,
        y,
        canvasWidth,
        1
      );
    }
  }
},

/* 032 --------------------------------------------------- */

{
  id: "spectrum",
  number: 32,
  name: "Spectrum",
  category: "digital",
  categoryLabel: "Digital",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const bars = 70;
    const width =
      canvasWidth / bars;

    for (let i = 0; i < bars; i++) {

      const wave =
        Math.abs(
          Math.sin(
            i * 0.19 +
            t * 0.002
          )
        );

      const height =
        30 +
        wave *
        canvasHeight *
        0.38 *
        intensity;

      ctx.fillStyle =
        rgba(
          colorFor(this, i),
          0.22
        );

      ctx.fillRect(
        i * width,
        canvasHeight - height,
        width - 2,
        height
      );
    }
  }
},

/* 033 --------------------------------------------------- */

{
  id: "fractal",
  number: 33,
  name: "Fractal",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    function branch(
      x,
      y,
      length,
      angle,
      depth
    ) {

      if (depth <= 0) return;

      const x2 =
        x +
        Math.cos(angle) *
        length;

      const y2 =
        y +
        Math.sin(angle) *
        length;

      drawLine(
        x,
        y,
        x2,
        y2,
        colorFor(this, depth),
        1,
        0.16 * intensity
      );

      branch(
        x2,
        y2,
        length * 0.7,
        angle - 0.45 +
          Math.sin(t * 0.0005) * 0.08,
        depth - 1
      );

      branch(
        x2,
        y2,
        length * 0.7,
        angle + 0.45 +
          Math.sin(t * 0.0005) * 0.08,
        depth - 1
      );
    }

    branch.call(
      this,
      canvasWidth / 2,
      canvasHeight,
      canvasHeight * 0.2,
      -Math.PI / 2,
      7
    );
  }
},

/* 034 --------------------------------------------------- */

{
  id: "satellites",
  number: 34,
  name: "Satellites",
  category: "space",
  categoryLabel: "Espacial",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 6; i++) {

      const radius =
        70 + i * 60;

      const angle =
        t * 0.0005 *
        (i + 1) +
        i;

      const x =
        cx +
        Math.cos(angle) *
        radius;

      const y =
        cy +
        Math.sin(angle) *
        radius *
        0.55;

      ctx.save();

      ctx.translate(
        x,
        y
      );

      ctx.rotate(angle);

      ctx.fillStyle =
        rgba(
          colorFor(this, i),
          0.55 * intensity
        );

      ctx.fillRect(
        -8,
        -4,
        16,
        8
      );

      ctx.fillRect(
        -14,
        -2,
        5,
        4
      );

      ctx.fillRect(
        9,
        -2,
        5,
        4
      );

      ctx.restore();
    }
  }
},

/* 035 --------------------------------------------------- */

{
  id: "electric",
  number: 35,
  name: "Electric",
  category: "energy",
  categoryLabel: "Energía",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let line = 0; line < 12; line++) {

      ctx.beginPath();

      for (
        let x = 0;
        x <= canvasWidth;
        x += 12
      ) {

        const y =
          canvasHeight / 2 +
          line * 25 +
          Math.sin(
            x * 0.04 +
            t * 0.002 +
            line
          ) *
          30 *
          intensity;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, line),
          0.14
        );

      ctx.lineWidth =
        1 +
        (line % 3);

      ctx.stroke();
    }
  }
},

/* 036 --------------------------------------------------- */

{
  id: "chrono",
  number: 36,
  name: "Chrono",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 5; i++) {

      const radius =
        45 + i * 45;

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        radius,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.17 * intensity
        );

      ctx.stroke();

      for (
        let j = 0;
        j < 12;
        j++
      ) {

        const angle =
          j *
          Math.PI / 6;

        const inner =
          radius - 5;

        const outer =
          radius + 8;

        drawLine(
          cx +
            Math.cos(angle) *
            inner,
          cy +
            Math.sin(angle) *
            inner,
          cx +
            Math.cos(angle) *
            outer,
          cy +
            Math.sin(angle) *
            outer,
          colorFor(this, j),
          1,
          0.22
        );
      }
    }

    const hand =
      -Math.PI / 2 +
      t * 0.0007;

    drawLine(
      cx,
      cy,
      cx +
        Math.cos(hand) * 120,
      cy +
        Math.sin(hand) * 120,
      colorFor(this, 0),
      3,
      intensity
    );
  }
},

/* 037 --------------------------------------------------- */

{
  id: "brownian",
  number: 37,
  name: "Brownian Swarm",
  category: "particles",
  categoryLabel: "Partículas",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 110; i++) {

      const x =
        (
          i * 67.3 +
          Math.sin(
            t * 0.0012 +
            i * 2
          ) * 80
        ) %
        canvasWidth;

      const y =
        (
          i * 121.7 +
          Math.cos(
            t * 0.0009 +
            i
          ) * 70
        ) %
        canvasHeight;

      drawGlowPoint(
        x,
        y,
        2 + i % 3,
        colorFor(this, i),
        0.35 * intensity
      );
    }
  }
},

/* 038 --------------------------------------------------- */

{
  id: "mandala",
  number: 38,
  name: "Mandala",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    ctx.save();

    ctx.translate(
      canvasWidth / 2,
      canvasHeight / 2
    );

    for (let ring = 1; ring <= 7; ring++) {

      for (let i = 0; i < 16; i++) {

        const angle =
          i *
          Math.PI * 2 / 16 +
          t * 0.00015 *
          (ring % 2 ? 1 : -1);

        const radius =
          ring * 42;

        ctx.save();

        ctx.rotate(angle);

        ctx.beginPath();

        ctx.ellipse(
          0,
          -radius,
          15 + ring * 2,
          35 + ring * 3,
          0,
          0,
          Math.PI * 2
        );

        ctx.strokeStyle =
          rgba(
            colorFor(this, i + ring),
            0.13 * intensity
          );

        ctx.stroke();

        ctx.restore();
      }
    }

    ctx.restore();
  }
},

/* 039 --------------------------------------------------- */

{
  id: "eclipse",
  number: 39,
  name: "Eclipse",
  category: "space",
  categoryLabel: "Espacial",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2 +
      Math.sin(t * 0.0002) * 80;

    const cy =
      canvasHeight / 2;

    drawGlowPoint(
      cx,
      cy,
      130,
      colorFor(this, 0),
      0.3 * intensity
    );

    ctx.fillStyle =
      "#030711";

    ctx.beginPath();

    ctx.arc(
      cx + 25,
      cy,
      78,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
      rgba(
        colorFor(this, 1),
        0.6 * intensity
      );

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      92,
      0,
      Math.PI * 2
    );

    ctx.stroke();
  }
},

/* 040 --------------------------------------------------- */

{
  id: "crystal",
  number: 40,
  name: "Crystal",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 6; i++) {

      const angle =
        t * 0.00025 +
        i *
        Math.PI / 3;

      const radius =
        80 +
        i * 35;

      const x =
        cx +
        Math.cos(angle) *
        radius;

      const y =
        cy +
        Math.sin(angle) *
        radius *
        0.65;

      ctx.beginPath();

      ctx.moveTo(
        cx,
        cy
      );

      ctx.lineTo(
        x + 30,
        y - 50
      );

      ctx.lineTo(
        x - 25,
        y + 35
      );

      ctx.closePath();

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.18 * intensity
        );

      ctx.stroke();
    }
  }
},

/* 041 --------------------------------------------------- */

{
  id: "prism",
  number: 41,
  name: "Prism",
  category: "energy",
  categoryLabel: "Energía",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const x =
      canvasWidth / 2;

    const y =
      canvasHeight / 2;

    ctx.beginPath();

    ctx.moveTo(
      x - 80,
      y + 80
    );

    ctx.lineTo(
      x,
      y - 80
    );

    ctx.lineTo(
      x + 80,
      y + 80
    );

    ctx.closePath();

    ctx.strokeStyle =
      rgba(
        "#ffffff",
        0.22
      );

    ctx.stroke();

    for (let i = 0; i < 7; i++) {

      const offset =
        Math.sin(
          t * 0.0005 +
          i
        ) * 15;

      drawLine(
        x + 5,
        y,
        canvasWidth,
        y -
          120 +
          i * 40 +
          offset,
        colorFor(this, i),
        2,
        0.18 * intensity
      );
    }
  }
},

/* 042 --------------------------------------------------- */

{
  id: "ink",
  number: 42,
  name: "Ink",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 14; i++) {

      const x =
        canvasWidth *
        (0.15 +
          (i / 14) * 0.7);

      const y =
        canvasHeight *
        0.5 +
        Math.sin(
          t * 0.0004 +
          i
        ) * 100;

      const radius =
        30 +
        Math.sin(
          t * 0.001 +
          i
        ) * 15;

      drawGlowPoint(
        x,
        y,
        radius * 2,
        colorFor(this, i),
        0.08 * intensity
      );

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        rgba(
          colorFor(this, i),
          0.05
        );

      ctx.fill();
    }
  }
},

/* 043 --------------------------------------------------- */

{
  id: "lava",
  number: 43,
  name: "Lava",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 35; i++) {

      const x =
        (
          i * 101 +
          Math.sin(
            t * 0.0004 +
            i
          ) * 50
        ) %
        canvasWidth;

      const y =
        canvasHeight -
        (
          i * 37
        ) % 180;

      const radius =
        15 +
        Math.sin(
          t * 0.001 +
          i
        ) * 7;

      drawGlowPoint(
        x,
        y,
        radius * 2,
        colorFor(this, i),
        0.15 * intensity
      );

      ctx.fillStyle =
        rgba(
          colorFor(this, i),
          0.15 * intensity
        );

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }
},

/* 044 --------------------------------------------------- */

{
  id: "deep-ocean",
  number: 44,
  name: "Deep Ocean",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 14; i++) {

      ctx.beginPath();

      for (
        let x = 0;
        x <= canvasWidth;
        x += 10
      ) {

        const y =
          canvasHeight *
          0.2 +
          i * 55 +
          Math.sin(
            x * 0.01 +
            t * 0.0006 +
            i
          ) * 30;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.09 * intensity
        );

      ctx.stroke();
    }
  }
},

/* 045 --------------------------------------------------- */

{
  id: "desert",
  number: 45,
  name: "Desert",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let dune = 0; dune < 8; dune++) {

      ctx.beginPath();

      for (
        let x = 0;
        x <= canvasWidth;
        x += 12
      ) {

        const y =
          canvasHeight *
          0.55 +
          dune * 35 +
          Math.sin(
            x * 0.007 +
            t * 0.0002 +
            dune
          ) * 35;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, dune),
          0.11 * intensity
        );

      ctx.stroke();
    }
  }
},

/* 046 --------------------------------------------------- */

{
  id: "forest",
  number: 46,
  name: "Forest",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 24; i++) {

      const x =
        i *
        canvasWidth / 23;

      const height =
        70 +
        (i % 7) * 22;

      const sway =
        Math.sin(
          t * 0.001 +
          i
        ) * 10;

      drawLine(
        x,
        canvasHeight,
        x + sway,
        canvasHeight - height,
        colorFor(this, i),
        2,
        0.2 * intensity
      );

      for (let j = 0; j < 4; j++) {

        ctx.beginPath();

        ctx.moveTo(
          x + sway,
          canvasHeight -
            height +
            j * 17
        );

        ctx.lineTo(
          x - 28 + sway,
          canvasHeight -
            height +
            35 +
            j * 17
        );

        ctx.lineTo(
          x + 28 + sway,
          canvasHeight -
            height +
            35 +
            j * 17
        );

        ctx.closePath();

        ctx.strokeStyle =
          rgba(
            colorFor(this, i + j),
            0.1 * intensity
          );

        ctx.stroke();
      }
    }
  }
},

/* 047 --------------------------------------------------- */

{
  id: "embers",
  number: 47,
  name: "Embers",
  category: "energy",
  categoryLabel: "Energía",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 100; i++) {

      const x =
        (
          i * 77 +
          Math.sin(
            t * 0.0008 +
            i
          ) * 35
        ) %
        canvasWidth;

      const y =
        canvasHeight -
        (
          i * 42 +
          t * 0.04
        ) %
        (canvasHeight + 100);

      drawGlowPoint(
        x,
        y,
        4,
        colorFor(this, i),
        0.45 * intensity
      );
    }
  }
},

/* 048 --------------------------------------------------- */

{
  id: "smoke",
  number: 48,
  name: "Smoke",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 18; i++) {

      const x =
        canvasWidth / 2 +
        Math.sin(
          t * 0.0004 +
          i * 0.6
        ) *
        (30 + i * 8);

      const y =
        canvasHeight -
        i * 45 -
        (
          t * 0.025
        ) % 60;

      drawGlowPoint(
        x,
        y,
        35 + i * 2,
        colorFor(this, i),
        0.025 * intensity
      );
    }
  }
},

/* 049 --------------------------------------------------- */

{
  id: "double-vortex",
  number: 49,
  name: "Double Vortex",
  category: "energy",
  categoryLabel: "Energía",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let side = 0; side < 2; side++) {

      const cx =
        canvasWidth *
        (side ? 0.7 : 0.3);

      const cy =
        canvasHeight / 2;

      for (let arm = 0; arm < 5; arm++) {

        ctx.beginPath();

        for (
          let r = 5;
          r < 280;
          r += 7
        ) {

          const angle =
            r * 0.025 +
            arm * 1.25 +
            t * 0.0005 *
            (side ? 1 : -1);

          const x =
            cx +
            Math.cos(angle) *
            r;

          const y =
            cy +
            Math.sin(angle) *
            r *
            0.6;

          if (r === 5) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.strokeStyle =
          rgba(
            colorFor(this, arm + side),
            0.15 * intensity
          );

        ctx.stroke();
      }
    }
  }
},

/* 050 --------------------------------------------------- */

{
  id: "magnetic",
  number: 50,
  name: "Magnetic Field",
  category: "energy",
  categoryLabel: "Energía",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const left =
      canvasWidth * 0.35;

    const right =
      canvasWidth * 0.65;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 15; i++) {

      ctx.beginPath();

      for (
        let p = 0;
        p <= Math.PI;
        p += 0.05
      ) {

        const x =
          canvasWidth / 2 +
          Math.cos(p) *
          (140 + i * 20);

        const y =
          cy +
          Math.sin(p) *
          (60 + i * 15);

        if (p === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.13 * intensity
        );

      ctx.stroke();
    }

    drawGlowPoint(
      left,
      cy,
      25,
      colorFor(this, 0),
      0.5
    );

    drawGlowPoint(
      right,
      cy,
      25,
      colorFor(this, 1),
      0.5
    );
  }
},

/* 051 --------------------------------------------------- */

{
  id: "kaleido",
  number: 51,
  name: "Kaleido",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    ctx.save();

    ctx.translate(
      canvasWidth / 2,
      canvasHeight / 2
    );

    for (let mirror = 0; mirror < 10; mirror++) {

      ctx.save();

      ctx.rotate(
        mirror *
        Math.PI / 5 +
        t * 0.0002
      );

      ctx.beginPath();

      ctx.moveTo(
        0,
        0
      );

      ctx.lineTo(
        40,
        -220
      );

      ctx.lineTo(
        -25,
        -140
      );

      ctx.closePath();

      ctx.strokeStyle =
        rgba(
          colorFor(this, mirror),
          0.18 * intensity
        );

      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }
},

/* 052 --------------------------------------------------- */

{
  id: "clockwork",
  number: 52,
  name: "Clockwork",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    function gear(
      x,
      y,
      radius,
      teeth,
      speed,
      index
    ) {

      ctx.save();

      ctx.translate(
        x,
        y
      );

      ctx.rotate(
        t * speed
      );

      ctx.beginPath();

      for (
        let i = 0;
        i < teeth * 2;
        i++
      ) {

        const r =
          i % 2
            ? radius * 0.78
            : radius;

        const angle =
          i *
          Math.PI /
          teeth;

        const px =
          Math.cos(angle) *
          r;

        const py =
          Math.sin(angle) *
          r;

        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }

      ctx.closePath();

      ctx.strokeStyle =
        rgba(
          colorFor(this, index),
          0.18 * intensity
        );

      ctx.stroke();

      ctx.restore();
    }

    gear.call(
      this,
      canvasWidth * 0.35,
      canvasHeight * 0.5,
      100,
      14,
      0.00025,
      0
    );

    gear.call(
      this,
      canvasWidth * 0.65,
      canvasHeight * 0.5,
      70,
      11,
      -0.00035,
      1
    );
  }
},

/* 053 --------------------------------------------------- */

{
  id: "circuit",
  number: 53,
  name: "Circuit",
  category: "digital",
  categoryLabel: "Digital",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 24; i++) {

      const y =
        30 +
        i * 45;

      ctx.beginPath();

      let x = 0;

      ctx.moveTo(
        x,
        y
      );

      for (let j = 0; j < 7; j++) {

        x +=
          70 +
          (i + j) % 4 * 30;

        const direction =
          j % 2
            ? 25
            : -25;

        ctx.lineTo(
          x,
          y + direction
        );
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.12 * intensity
        );

      ctx.stroke();

      const pulse =
        (
          t * 0.001 +
          i * 0.3
        ) % 1;

      drawGlowPoint(
        pulse * canvasWidth,
        y,
        7,
        colorFor(this, i),
        0.7
      );
    }
  }
},

/* 054 --------------------------------------------------- */

{
  id: "radar",
  number: 54,
  name: "Radar",
  category: "digital",
  categoryLabel: "Digital",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    const radius =
      Math.min(
        canvasWidth,
        canvasHeight
      ) * 0.35;

    for (let i = 1; i <= 4; i++) {

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        radius * i / 4,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.12
        );

      ctx.stroke();
    }

    const angle =
      t * 0.001;

    drawLine(
      cx,
      cy,
      cx +
        Math.cos(angle) *
        radius,
      cy +
        Math.sin(angle) *
        radius,
      colorFor(this, 0),
      2,
      0.5 * intensity
    );

    for (let i = 0; i < 12; i++) {

      const a =
        i * 1.7;

      const r =
        50 +
        (i * 73) %
        radius;

      const x =
        cx +
        Math.cos(a) *
        r;

      const y =
        cy +
        Math.sin(a) *
        r;

      drawGlowPoint(
        x,
        y,
        4,
        colorFor(this, i),
        0.6
      );
    }
  }
},

/* 055 --------------------------------------------------- */

{
  id: "sonar",
  number: 55,
  name: "Sonar",
  category: "digital",
  categoryLabel: "Digital",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 6; i++) {

      const radius =
        (
          t * 0.00015 +
          i / 6
        ) % 1 *
        350;

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        radius,
        -Math.PI * 0.7,
        Math.PI * 0.7
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          (1 -
            radius / 350) *
          0.3 *
          intensity
        );

      ctx.stroke();
    }
  }
},

/* 056 --------------------------------------------------- */

{
  id: "topography",
  number: 56,
  name: "Topography",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let layer = 0; layer < 12; layer++) {

      ctx.beginPath();

      for (
        let x = 0;
        x <= canvasWidth;
        x += 8
      ) {

        const y =
          canvasHeight * 0.5 +
          Math.sin(
            x * 0.008 +
            t * 0.0002
          ) * 80 +
          Math.sin(
            x * 0.025 -
            t * 0.0004
          ) * 25 +
          layer * 25;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, layer),
          0.09 * intensity
        );

      ctx.stroke();
    }
  }
},

/* 057 --------------------------------------------------- */

{
  id: "blueprint",
  number: 57,
  name: "Blueprint",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const spacing = 40;

    ctx.strokeStyle =
      rgba(
        colorFor(this, 0),
        0.07 * intensity
      );

    for (
      let x = 0;
      x < canvasWidth;
      x += spacing
    ) {
      drawLine(
        x,
        0,
        x,
        canvasHeight,
        colorFor(this, 0),
        1,
        0.08
      );
    }

    for (
      let y = 0;
      y < canvasHeight;
      y += spacing
    ) {
      drawLine(
        0,
        y,
        canvasWidth,
        y,
        colorFor(this, 0),
        1,
        0.08
      );
    }

    ctx.save();

    ctx.translate(
      canvasWidth / 2,
      canvasHeight / 2
    );

    ctx.rotate(
      t * 0.0001
    );

    ctx.strokeStyle =
      rgba(
        colorFor(this, 1),
        0.25 * intensity
      );

    ctx.strokeRect(
      -130,
      -80,
      260,
      160
    );

    ctx.restore();
  }
},

/* 058 --------------------------------------------------- */

{
  id: "binary",
  number: 58,
  name: "Binary",
  category: "digital",
  categoryLabel: "Digital",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    ctx.font =
      "12px monospace";

    for (
      let x = 0;
      x < canvasWidth;
      x += 22
    ) {

      const column =
        Math.floor(
          x / 22
        );

      for (
        let row = 0;
        row < 20;
        row++
      ) {

        const y =
          (
            row * 34 +
            column * 17 +
            t * 0.035
          ) %
          (canvasHeight + 50);

        const char =
          (
            column +
            row
          ) % 2;

        ctx.fillStyle =
          rgba(
            colorFor(this, column),
            0.25 * intensity
          );

        ctx.fillText(
          char,
          x,
          y
        );
      }
    }
  }
},

/* 059 --------------------------------------------------- */

{
  id: "rainbows",
  number: 59,
  name: "Rainbows",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight * 0.75;

    for (let i = 0; i < 12; i++) {

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        100 + i * 30,
        Math.PI,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.12 * intensity
        );

      ctx.lineWidth =
        5;

      ctx.stroke();
    }
  }
},

/* 060 --------------------------------------------------- */

{
  id: "aurora-ribbons",
  number: 60,
  name: "Aurora Ribbons",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let ribbon = 0; ribbon < 7; ribbon++) {

      ctx.beginPath();

      for (
        let y = 0;
        y <= canvasHeight;
        y += 8
      ) {

        const x =
          canvasWidth * 0.5 +
          Math.sin(
            y * 0.012 +
            t * 0.001 +
            ribbon
          ) *
          180 *
          intensity;

        if (y === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, ribbon),
          0.14
        );

      ctx.lineWidth =
        18;

      ctx.stroke();
    }
  }
},

/* 061 --------------------------------------------------- */

{
  id: "cometstorm",
  number: 61,
  name: "Comet Storm",
  category: "space",
  categoryLabel: "Espacial",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 28; i++) {

      const progress =
        (
          t * 0.0004 +
          i * 0.037
        ) % 1;

      const x =
        progress *
        (canvasWidth + 500) -
        250;

      const y =
        (
          i * 91 +
          progress *
          300
        ) %
        canvasHeight;

      drawLine(
        x,
        y,
        x - 80,
        y - 30,
        colorFor(this, i),
        1.5,
        0.35 * intensity
      );
    }
  }
},

/* 062 --------------------------------------------------- */

{
  id: "firestorm",
  number: 62,
  name: "Firestorm",
  category: "energy",
  categoryLabel: "Energía",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 25; i++) {

      const x =
        i *
        canvasWidth / 24;

      ctx.beginPath();

      ctx.moveTo(
        x,
        canvasHeight
      );

      for (
        let y = canvasHeight;
        y > canvasHeight * 0.35;
        y -= 12
      ) {

        const px =
          x +
          Math.sin(
            y * 0.025 +
            t * 0.001 +
            i
          ) *
          35;

        ctx.lineTo(
          px,
          y
        );
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.13 * intensity
        );

      ctx.lineWidth =
        5;

      ctx.stroke();
    }
  }
},

/* 063 --------------------------------------------------- */

{
  id: "snowstorm",
  number: 63,
  name: "Snowstorm",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 220; i++) {

      const size =
        1 +
        (i % 6);

      const x =
        (
          i * 53 +
          Math.sin(
            t * 0.001 +
            i
          ) * 90
        ) %
        canvasWidth;

      const y =
        (
          i * 37 +
          t * (
            0.02 +
            size * 0.005
          )
        ) %
        canvasHeight;

      drawGlowPoint(
        x,
        y,
        size,
        colorFor(this, i),
        0.3 * intensity
      );
    }
  }
},

/* 064 --------------------------------------------------- */

{
  id: "sandstorm",
  number: 64,
  name: "Sandstorm",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 80; i++) {

      const y =
        (
          i * 23 +
          Math.sin(
            i * 0.5
          ) * 50
        ) %
        canvasHeight;

      const start =
        (
          t * 0.1 +
          i * 60
        ) %
        (canvasWidth + 200) -
        100;

      drawLine(
        start,
        y,
        start + 100,
        y - 8,
        colorFor(this, i),
        1,
        0.13 * intensity
      );
    }
  }
},

/* 065 --------------------------------------------------- */

{
  id: "leafstorm",
  number: 65,
  name: "Leafstorm",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 55; i++) {

      const x =
        (
          i * 83 +
          t * 0.025
        ) %
        (canvasWidth + 100) -
        50;

      const y =
        (
          i * 57 +
          Math.sin(
            t * 0.0008 +
            i
          ) * 100
        ) %
        canvasHeight;

      ctx.save();

      ctx.translate(
        x,
        y
      );

      ctx.rotate(
        t * 0.001 +
        i
      );

      ctx.beginPath();

      ctx.ellipse(
        0,
        0,
        5,
        12,
        0,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.22 * intensity
        );

      ctx.stroke();

      ctx.restore();
    }
  }
},

/* 066 --------------------------------------------------- */

{
  id: "swarm",
  number: 66,
  name: "Swarm",
  category: "particles",
  categoryLabel: "Partículas",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 100; i++) {

      const angle =
        i * 0.37 +
        t * 0.0004;

      const radius =
        80 +
        Math.sin(
          t * 0.0006 +
          i
        ) * 100;

      const x =
        canvasWidth / 2 +
        Math.cos(angle) *
        radius;

      const y =
        canvasHeight / 2 +
        Math.sin(angle) *
        radius;

      drawGlowPoint(
        x,
        y,
        2 + i % 3,
        colorFor(this, i),
        0.35 * intensity
      );
    }
  }
},

/* 067 --------------------------------------------------- */

{
  id: "flock",
  number: 67,
  name: "Flock",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 20; i++) {

      const x =
        (
          i * 90 +
          t * 0.03
        ) %
        (canvasWidth + 100) -
        50;

      const y =
        canvasHeight * 0.35 +
        Math.sin(
          t * 0.001 +
          i * 0.5
        ) * 100;

      const wing =
        8 +
        Math.sin(
          t * 0.004 +
          i
        ) * 5;

      drawLine(
        x,
        y,
        x - wing,
        y - 5,
        colorFor(this, i),
        1.5,
        0.3 * intensity
      );

      drawLine(
        x,
        y,
        x + wing,
        y - 5,
        colorFor(this, i),
        1.5,
        0.3 * intensity
      );
    }
  }
},

/* 068 --------------------------------------------------- */

{
  id: "wavegrid",
  number: 68,
  name: "Wave Grid",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (
      let row = 0;
      row < 16;
      row++
    ) {

      ctx.beginPath();

      for (
        let x = 0;
        x <= canvasWidth;
        x += 15
      ) {

        const z =
          Math.sin(
            x * 0.015 +
            row * 0.6 +
            t * 0.001
          ) *
          25 *
          intensity;

        const y =
          180 +
          row * 35 +
          z;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, row),
          0.11
        );

      ctx.stroke();
    }
  }
},

/* 069 --------------------------------------------------- */

{
  id: "moire",
  number: 69,
  name: "Moire",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 45; i++) {

      const offset =
        Math.sin(
          t * 0.0002 +
          i
        ) * 100;

      ctx.beginPath();

      ctx.ellipse(
        canvasWidth / 2 +
          offset,
        canvasHeight / 2,
        100 + i * 8,
        220 + i * 3,
        t * 0.0001,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.055 * intensity
        );

      ctx.stroke();
    }
  }
},

/* 070 --------------------------------------------------- */

{
  id: "hologram",
  number: 70,
  name: "Hologram",
  category: "digital",
  categoryLabel: "Digital",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    ctx.save();

    ctx.translate(
      canvasWidth / 2,
      canvasHeight / 2
    );

    ctx.rotate(
      t * 0.0003
    );

    ctx.strokeStyle =
      rgba(
        colorFor(this, 0),
        0.3 * intensity
      );

    ctx.strokeRect(
      -120,
      -90,
      240,
      180
    );

    ctx.strokeRect(
      -70,
      -55,
      140,
      110
    );

    for (
      let y = -90;
      y <= 90;
      y += 9
    ) {

      drawLine(
        -120,
        y,
        120,
        y,
        colorFor(this, 1),
        1,
        0.08
      );
    }

    ctx.restore();
  }
},

/* 071 --------------------------------------------------- */

{
  id: "neonlines",
  number: 71,
  name: "Neon Lines",
  category: "digital",
  categoryLabel: "Digital",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 14; i++) {

      ctx.beginPath();

      const y =
        canvasHeight *
        (i + 1) /
        15;

      for (
        let x = 0;
        x <= canvasWidth;
        x += 10
      ) {

        const yy =
          y +
          Math.sin(
            x * 0.015 +
            t * 0.001 +
            i
          ) * 40;

        if (x === 0) {
          ctx.moveTo(x, yy);
        } else {
          ctx.lineTo(x, yy);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.18 * intensity
        );

      ctx.lineWidth = 2;

      ctx.stroke();
    }
  }
},

/* 072 --------------------------------------------------- */

{
  id: "ribbon",
  number: 72,
  name: "Ribbon",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    ctx.beginPath();

    for (
      let x = 0;
      x <= canvasWidth;
      x += 5
    ) {

      const y =
        canvasHeight / 2 +
        Math.sin(
          x * 0.006 +
          t * 0.0007
        ) *
        130 *
        intensity +
        Math.sin(
          x * 0.019 -
          t * 0.0003
        ) *
        40;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      rgba(
        colorFor(this, 0),
        0.28
      );

    ctx.lineWidth =
      12;

    ctx.stroke();
  }
},

/* 073 --------------------------------------------------- */

{
  id: "galaxy2",
  number: 73,
  name: "Galaxy Duo",
  category: "space",
  categoryLabel: "Espacial",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let core = 0; core < 2; core++) {

      const cx =
        canvasWidth *
        (core ? 0.67 : 0.33);

      const cy =
        canvasHeight *
        0.5;

      for (let i = 0; i < 100; i++) {

        const r =
          i * 2.4;

        const a =
          i * 0.3 +
          t * 0.0003;

        const x =
          cx +
          Math.cos(a) *
          r;

        const y =
          cy +
          Math.sin(a) *
          r *
          0.5;

        drawGlowPoint(
          x,
          y,
          2,
          colorFor(this, i + core),
          0.3 * intensity
        );
      }
    }
  }
},

/* 074 --------------------------------------------------- */

{
  id: "supernova",
  number: 74,
  name: "Supernova",
  category: "space",
  categoryLabel: "Espacial",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cycle =
      (
        t * 0.0003
      ) % 1;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    const radius =
      cycle *
      Math.max(
        canvasWidth,
        canvasHeight
      ) *
      0.55;

    for (let i = 0; i < 60; i++) {

      const angle =
        i * 0.42;

      const r =
        radius *
        (0.7 + (i % 7) / 10);

      drawLine(
        cx +
          Math.cos(angle) * r,
        cy +
          Math.sin(angle) * r,
        cx +
          Math.cos(angle) * (r - 30),
        cy +
          Math.sin(angle) * (r - 30),
        colorFor(this, i),
        2,
        (1 - cycle) *
        0.4 *
        intensity
      );
    }
  }
},

/* 075 --------------------------------------------------- */

{
  id: "wormhole",
  number: 75,
  name: "Wormhole",
  category: "space",
  categoryLabel: "Espacial",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 35; i++) {

      const z =
        (
          i / 35 +
          t * 0.0003
        ) % 1;

      const radius =
        20 +
        z *
        Math.max(
          canvasWidth,
          canvasHeight
        ) *
        0.55;

      const twist =
        z * Math.PI * 8 +
        t * 0.0004;

      ctx.beginPath();

      ctx.ellipse(
        cx,
        cy,
        radius,
        radius * 0.45,
        twist,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          (1 - z) *
          0.25 *
          intensity
        );

      ctx.stroke();
    }
  }
},

/* 076 --------------------------------------------------- */

{
  id: "stardust",
  number: 76,
  name: "Stardust",
  category: "particles",
  categoryLabel: "Partículas",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 190; i++) {

      const a =
        i * 0.27 +
        t * 0.0002;

      const r =
        (i % 100) * 3;

      const x =
        canvasWidth / 2 +
        Math.cos(a) *
        r;

      const y =
        canvasHeight / 2 +
        Math.sin(a) *
        r *
        0.55;

      drawGlowPoint(
        x,
        y,
        1 + i % 3,
        colorFor(this, i),
        0.25 * intensity
      );
    }
  }
},

/* 077 --------------------------------------------------- */

{
  id: "portal",
  number: 77,
  name: "Portal",
  category: "special",
  categoryLabel: "Especial",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 18; i++) {

      ctx.save();

      ctx.translate(
        cx,
        cy
      );

      ctx.rotate(
        t * 0.0003 +
        i * 0.2
      );

      ctx.beginPath();

      ctx.ellipse(
        0,
        0,
        90 + i * 8,
        35 + i * 4,
        0,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.14 * intensity
        );

      ctx.stroke();

      ctx.restore();
    }
  }
},

/* 078 --------------------------------------------------- */

{
  id: "heartbeat",
  number: 78,
  name: "Heartbeat",
  category: "energy",
  categoryLabel: "Energía",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    ctx.beginPath();

    for (
      let x = 0;
      x <= canvasWidth;
      x += 5
    ) {

      const phase =
        (
          x / canvasWidth +
          t * 0.00015
        ) % 1;

      let y = 0;

      if (
        phase > 0.42 &&
        phase < 0.46
      ) {
        y =
          -100 *
          Math.sin(
            (phase - 0.42) /
            0.04 *
            Math.PI
          );
      } else if (
        phase >= 0.46 &&
        phase < 0.50
      ) {
        y =
          65 *
          Math.sin(
            (phase - 0.46) /
            0.04 *
            Math.PI
          );
      }

      const py =
        canvasHeight / 2 +
        y *
        intensity;

      if (x === 0) {
        ctx.moveTo(x, py);
      } else {
        ctx.lineTo(x, py);
      }
    }

    ctx.strokeStyle =
      rgba(
        colorFor(this, 0),
        0.5
      );

    ctx.lineWidth = 2;

    ctx.stroke();
  }
},

/* 079 --------------------------------------------------- */

{
  id: "equalizer",
  number: 79,
  name: "Equalizer",
  category: "digital",
  categoryLabel: "Digital",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const bars = 35;

    for (let i = 0; i < bars; i++) {

      const x =
        i *
        canvasWidth / bars;

      const amplitude =
        20 +
        Math.abs(
          Math.sin(
            t * 0.002 +
            i * 0.7
          )
        ) *
        180 *
        intensity;

      ctx.fillStyle =
        rgba(
          colorFor(this, i),
          0.18
        );

      ctx.fillRect(
        x,
        canvasHeight / 2 -
          amplitude / 2,
        canvasWidth / bars - 3,
        amplitude
      );
    }
  }
},

/* 080 --------------------------------------------------- */

{
  id: "infinity",
  number: 80,
  name: "Infinity",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    ctx.beginPath();

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (
      let a = 0;
      a <= Math.PI * 8;
      a += 0.025
    ) {

      const x =
        cx +
        Math.sin(a) *
        170;

      const y =
        cy +
        Math.sin(2 * a) *
        90;

      if (a === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      rgba(
        colorFor(this, 0),
        0.3 * intensity
      );

    ctx.lineWidth = 3;

    ctx.stroke();
  }
},

/* 081 --------------------------------------------------- */

{
  id: "aurora-boreal",
  number: 81,
  name: "Aurora Boreal",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 10; i++) {

      ctx.beginPath();

      for (
        let x = 0;
        x <= canvasWidth;
        x += 10
      ) {

        const base =
          canvasHeight * 0.35 +
          i * 25;

        const y =
          base +
          Math.sin(
            x * 0.008 +
            t * 0.0008 +
            i
          ) * 70 *
          intensity;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.12
        );

      ctx.lineWidth =
        20;

      ctx.stroke();
    }
  }
},

/* 082 --------------------------------------------------- */

{
  id: "deep-space",
  number: 82,
  name: "Deep Space",
  category: "space",
  categoryLabel: "Espacial",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let layer = 0; layer < 4; layer++) {

      const count =
        50 +
        layer * 25;

      for (let i = 0; i < count; i++) {

        const x =
          (
            i * (113 + layer * 17) +
            t *
            (0.004 + layer * 0.002)
          ) %
          canvasWidth;

        const y =
          (
            i * (71 + layer * 13)
          ) %
          canvasHeight;

        ctx.fillStyle =
          rgba(
            colorFor(this, i),
            (0.08 + layer * 0.04) *
            intensity
          );

        ctx.fillRect(
          x,
          y,
          1 + layer,
          1 + layer
        );
      }
    }
  }
},

/* 083 --------------------------------------------------- */

{
  id: "star-pulse",
  number: 83,
  name: "Star Pulse",
  category: "space",
  categoryLabel: "Espacial",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const beat =
      (
        Math.sin(
          t * 0.003
        ) + 1
      ) / 2;

    for (let i = 0; i < 90; i++) {

      const angle =
        i * 2.399;

      const radius =
        80 +
        beat *
        170 +
        (i % 4) * 20;

      const x =
        canvasWidth / 2 +
        Math.cos(angle) *
        radius;

      const y =
        canvasHeight / 2 +
        Math.sin(angle) *
        radius;

      drawGlowPoint(
        x,
        y,
        2 + beat * 5,
        colorFor(this, i),
        0.35 * intensity
      );
    }
  }
},

/* 084 --------------------------------------------------- */

{
  id: "quantum-dust",
  number: 84,
  name: "Quantum Dust",
  category: "particles",
  categoryLabel: "Partículas",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 140; i++) {

      const probability =
        Math.sin(
          t * 0.002 +
          i * 7.13
        );

      if (
        probability < -0.2
      ) continue;

      const x =
        (
          i * 113.7 +
          probability * 30
        ) %
        canvasWidth;

      const y =
        (
          i * 57.9 +
          probability * 50
        ) %
        canvasHeight;

      drawGlowPoint(
        x,
        y,
        1 + Math.abs(probability) * 3,
        colorFor(this, i),
        0.3 * intensity
      );
    }
  }
},

/* 085 --------------------------------------------------- */

{
  id: "cosmic-rings",
  number: 85,
  name: "Cosmic Rings",
  category: "space",
  categoryLabel: "Espacial",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 14; i++) {

      ctx.save();

      ctx.translate(
        canvasWidth / 2,
        canvasHeight / 2
      );

      ctx.rotate(
        t * 0.0002 +
        i * 0.13
      );

      ctx.scale(
        1,
        0.3 + i * 0.02
      );

      ctx.beginPath();

      ctx.arc(
        0,
        0,
        50 + i * 27,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.12 * intensity
        );

      ctx.stroke();

      ctx.restore();
    }
  }
},

/* 086 --------------------------------------------------- */

{
  id: "solar-flare",
  number: 86,
  name: "Solar Flare",
  category: "energy",
  categoryLabel: "Energía",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 18; i++) {

      const angle =
        i * 0.35 +
        t * 0.0003;

      ctx.beginPath();

      for (
        let r = 55;
        r < 210;
        r += 8
      ) {

        const wave =
          Math.sin(
            r * 0.04 +
            t * 0.002 +
            i
          ) * 15;

        const x =
          cx +
          Math.cos(angle + wave * 0.01) *
          (r + wave);

        const y =
          cy +
          Math.sin(angle + wave * 0.01) *
          (r + wave);

        if (r === 55) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.18 * intensity
        );

      ctx.stroke();
    }
  }
},

/* 087 --------------------------------------------------- */

{
  id: "moonlight",
  number: 87,
  name: "Moonlight",
  category: "space",
  categoryLabel: "Espacial",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const phase =
      (
        t * 0.00012
      ) % 1;

    const cx =
      canvasWidth * 0.72;

    const cy =
      canvasHeight * 0.28;

    drawGlowPoint(
      cx,
      cy,
      110,
      colorFor(this, 0),
      0.18 * intensity
    );

    ctx.fillStyle =
      "#dcecff";

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      55,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
      "#030711";

    ctx.beginPath();

    ctx.arc(
      cx +
        Math.cos(
          phase * Math.PI * 2
        ) * 40,
      cy,
      55,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }
},

/* 088 --------------------------------------------------- */

{
  id: "dark-matter",
  number: 88,
  name: "Dark Matter",
  category: "space",
  categoryLabel: "Espacial",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 25; i++) {

      ctx.beginPath();

      for (
        let x = 0;
        x <= canvasWidth;
        x += 15
      ) {

        const y =
          canvasHeight / 2 +
          Math.sin(
            x * 0.006 +
            t * 0.0004 +
            i
          ) *
          (50 + i * 4);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.055 * intensity
        );

      ctx.stroke();
    }
  }
},

/* 089 --------------------------------------------------- */

{
  id: "gravity-well",
  number: 89,
  name: "Gravity Well",
  category: "space",
  categoryLabel: "Espacial",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let r = 20; r < 500; r += 25) {

      ctx.beginPath();

      for (
        let a = 0;
        a < Math.PI * 2;
        a += 0.04
      ) {

        const distortion =
          25 *
          Math.sin(
            a * 4 +
            t * 0.0005
          ) *
          intensity;

        const radius =
          r +
          distortion;

        const x =
          cx +
          Math.cos(a) *
          radius;

        const y =
          cy +
          Math.sin(a) *
          radius *
          0.6;

        if (a === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, r),
          0.1
        );

      ctx.stroke();
    }
  }
},

/* 090 --------------------------------------------------- */

{
  id: "asteroid-field",
  number: 90,
  name: "Asteroid Field",
  category: "space",
  categoryLabel: "Espacial",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 55; i++) {

      const z =
        (
          i * 0.071 +
          t * 0.00008
        ) % 1;

      const x =
        (
          (i * 149) %
          canvasWidth -
          canvasWidth / 2
        ) /
        Math.max(
          0.1,
          z
        ) +
        canvasWidth / 2;

      const y =
        (
          (i * 71) %
          canvasHeight -
          canvasHeight / 2
        ) /
        Math.max(
          0.1,
          z
        ) +
        canvasHeight / 2;

      const size =
        2 +
        (1 - z) * 8;

      ctx.fillStyle =
        rgba(
          colorFor(this, i),
          0.25 * intensity
        );

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        size,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }
},

/* 091 --------------------------------------------------- */

{
  id: "space-dust",
  number: 91,
  name: "Space Dust",
  category: "particles",
  categoryLabel: "Partículas",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 170; i++) {

      const x =
        (
          i * 93 +
          t * 0.018
        ) %
        (canvasWidth + 100) -
        50;

      const y =
        (
          i * 61
        ) %
        canvasHeight;

      drawLine(
        x,
        y,
        x - 18,
        y + 4,
        colorFor(this, i),
        1,
        0.22 * intensity
      );
    }
  }
},

/* 092 --------------------------------------------------- */

{
  id: "energy-flow",
  number: 92,
  name: "Energy Flow",
  category: "energy",
  categoryLabel: "Energía",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 30; i++) {

      ctx.beginPath();

      for (
        let x = 0;
        x <= canvasWidth;
        x += 10
      ) {

        const y =
          canvasHeight / 2 +
          Math.sin(
            x * 0.008 +
            i * 0.5 +
            t * 0.001
          ) *
          (20 + i * 4);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.07 * intensity
        );

      ctx.stroke();
    }
  }
},

/* 093 --------------------------------------------------- */

{
  id: "neon-pulse",
  number: 93,
  name: "Neon Pulse",
  category: "digital",
  categoryLabel: "Digital",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const pulse =
      (
        Math.sin(
          t * 0.003
        ) + 1
      ) / 2;

    for (let i = 0; i < 12; i++) {

      ctx.beginPath();

      const size =
        30 +
        i * 35 +
        pulse * 30;

      ctx.rect(
        canvasWidth / 2 - size,
        canvasHeight / 2 - size,
        size * 2,
        size * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          (0.05 + pulse * 0.2) *
          intensity
        );

      ctx.lineWidth =
        1 + pulse * 2;

      ctx.stroke();
    }
  }
},

/* 094 --------------------------------------------------- */

{
  id: "cyber-rain",
  number: 94,
  name: "Cyber Rain",
  category: "digital",
  categoryLabel: "Digital",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    ctx.font =
      "10px monospace";

    const symbols =
      "01<>[]{}#$%";

    for (
      let x = 0;
      x < canvasWidth;
      x += 18
    ) {

      const column =
        Math.floor(
          x / 18
        );

      for (
        let j = 0;
        j < 10;
        j++
      ) {

        const y =
          (
            column * 47 +
            j * 37 +
            t * 0.05
          ) %
          canvasHeight;

        ctx.fillStyle =
          rgba(
            colorFor(this, column),
            0.3 * intensity
          );

        ctx.fillText(
          symbols[
            (column + j) %
            symbols.length
          ],
          x,
          y
        );
      }
    }
  }
},

/* 095 --------------------------------------------------- */

{
  id: "digital-storm",
  number: 95,
  name: "Digital Storm",
  category: "digital",
  categoryLabel: "Digital",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 160; i++) {

      const angle =
        i * 0.31 +
        t * 0.0004;

      const radius =
        40 +
        (
          i * 17
        ) %
        300;

      const x =
        canvasWidth / 2 +
        Math.cos(angle) *
        radius;

      const y =
        canvasHeight / 2 +
        Math.sin(angle) *
        radius;

      ctx.fillStyle =
        rgba(
          colorFor(this, i),
          0.2 * intensity
        );

      ctx.fillRect(
        x,
        y,
        3 + i % 5,
        2
      );
    }
  }
},

/* 096 --------------------------------------------------- */

{
  id: "laser-grid",
  number: 96,
  name: "Laser Grid",
  category: "digital",
  categoryLabel: "Digital",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 8; i++) {

      const x =
        (
          t * 0.12 +
          i *
          canvasWidth / 8
        ) %
        canvasWidth;

      drawLine(
        x,
        0,
        x + 200,
        canvasHeight,
        colorFor(this, i),
        1,
        0.2 * intensity
      );
    }

    for (let i = 0; i < 8; i++) {

      const y =
        (
          t * 0.08 +
          i *
          canvasHeight / 8
        ) %
        canvasHeight;

      drawLine(
        0,
        y,
        canvasWidth,
        y + 100,
        colorFor(this, i + 2),
        1,
        0.14 * intensity
      );
    }
  }
},

/* 097 --------------------------------------------------- */

{
  id: "techno-wave",
  number: 97,
  name: "Techno Wave",
  category: "digital",
  categoryLabel: "Digital",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    ctx.beginPath();

    for (
      let x = 0;
      x <= canvasWidth;
      x += 4
    ) {

      const frequency =
        0.02 +
        Math.sin(
          t * 0.0005
        ) * 0.004;

      const y =
        canvasHeight / 2 +
        Math.sin(
          x * frequency +
          t * 0.002
        ) *
        70 *
        intensity +
        Math.sin(
          x * 0.08 -
          t * 0.001
        ) *
        15;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      rgba(
        colorFor(this, 0),
        0.35
      );

    ctx.lineWidth = 2;

    ctx.stroke();
  }
},

/* 098 --------------------------------------------------- */

{
  id: "infinity-tunnel",
  number: 98,
  name: "Infinity Tunnel",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 20; i++) {

      const depth =
        (
          i / 20 +
          t * 0.0002
        ) % 1;

      const scale =
        0.15 +
        depth * 1.2;

      ctx.save();

      ctx.translate(
        canvasWidth / 2,
        canvasHeight / 2
      );

      ctx.scale(
        scale,
        scale
      );

      ctx.beginPath();

      ctx.moveTo(
        0,
        -120
      );

      ctx.bezierCurveTo(
        -170,
        -60,
        -170,
        60,
        0,
        120
      );

      ctx.bezierCurveTo(
        170,
        60,
        170,
        -60,
        0,
        -120
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          (1 - depth) *
          0.22 *
          intensity
        );

      ctx.stroke();

      ctx.restore();
    }
  }
},

/* 099 --------------------------------------------------- */

{
  id: "cosmic-portal",
  number: 99,
  name: "Cosmic Portal",
  category: "special",
  categoryLabel: "Especial",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 25; i++) {

      const angle =
        t * 0.0004 +
        i * 0.25;

      const radius =
        70 +
        Math.sin(
          t * 0.001 +
          i
        ) * 30 +
        i * 6;

      drawGlowPoint(
        cx +
          Math.cos(angle) *
          radius,
        cy +
          Math.sin(angle) *
          radius,
        3 + i % 4,
        colorFor(this, i),
        0.4 * intensity
      );
    }

    ctx.fillStyle =
      "#02040a";

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      65,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }
},

/* 100 --------------------------------------------------- */

{
  id: "nova-core",
  number: 100,
  name: "Nova Core",
  category: "special",
  categoryLabel: "Especial",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const pulse =
      (
        Math.sin(
          t * 0.003
        ) + 1
      ) / 2;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    drawGlowPoint(
      cx,
      cy,
      100 +
        pulse * 80,
      colorFor(this, 0),
      0.35 * intensity
    );

    for (let i = 0; i < 50; i++) {

      const angle =
        i * 0.4 +
        t * 0.0003;

      const radius =
        50 +
        pulse * 130 +
        i * 3;

      drawLine(
        cx +
          Math.cos(angle) *
          radius,
        cy +
          Math.sin(angle) *
          radius,
        cx +
          Math.cos(angle) *
          (radius + 25),
        cy +
          Math.sin(angle) *
          (radius + 25),
        colorFor(this, i),
        1.5,
        0.2 * intensity
      );
    }
  }
},

/* 101 --------------------------------------------------- */

{
  id: "prism-rain",
  number: 101,
  name: "Prism Rain",
  category: "energy",
  categoryLabel: "Energía",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 60; i++) {

      const x =
        (
          i * 87
        ) %
        canvasWidth;

      const y =
        (
          i * 51 +
          t * 0.05
        ) %
        canvasHeight;

      ctx.save();

      ctx.translate(
        x,
        y
      );

      ctx.rotate(
        i +
        t * 0.001
      );

      ctx.beginPath();

      ctx.moveTo(
        0,
        -10
      );

      ctx.lineTo(
        7,
        8
      );

      ctx.lineTo(
        -7,
        8
      );

      ctx.closePath();

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.22 * intensity
        );

      ctx.stroke();

      ctx.restore();
    }
  }
},

/* 102 --------------------------------------------------- */

{
  id: "magnetic-storm",
  number: 102,
  name: "Magnetic Storm",
  category: "energy",
  categoryLabel: "Energía",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 16; i++) {

      ctx.beginPath();

      for (
        let a = 0;
        a <= Math.PI * 2;
        a += 0.05
      ) {

        const radius =
          100 +
          i * 20 +
          Math.sin(
            a * 5 +
            t * 0.001 +
            i
          ) * 15;

        const x =
          canvasWidth / 2 +
          Math.cos(a) *
          radius;

        const y =
          canvasHeight / 2 +
          Math.sin(a) *
          radius *
          0.55;

        if (a === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.12 * intensity
        );

      ctx.stroke();
    }
  }
},

/* 103 --------------------------------------------------- */

{
  id: "photon-threads",
  number: 103,
  name: "Photon Threads",
  category: "energy",
  categoryLabel: "Energía",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 45; i++) {

      const progress =
        (
          t * 0.0007 +
          i / 45
        ) % 1;

      const x =
        progress *
        (canvasWidth + 400) -
        200;

      const y =
        (
          i * 73 +
          Math.sin(
            progress * Math.PI * 4 +
            i
          ) * 90
        ) %
        canvasHeight;

      drawLine(
        x,
        y,
        x - 100,
        y - 15,
        colorFor(this, i),
        1,
        0.3 * intensity
      );
    }
  }
},

/* 104 --------------------------------------------------- */

{
  id: "crystal-bloom",
  number: 104,
  name: "Crystal Bloom",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const pulse =
      0.8 +
      Math.sin(
        t * 0.001
      ) * 0.2;

    ctx.save();

    ctx.translate(
      canvasWidth / 2,
      canvasHeight / 2
    );

    for (let i = 0; i < 18; i++) {

      ctx.save();

      ctx.rotate(
        i * Math.PI / 9
      );

      ctx.beginPath();

      ctx.moveTo(
        0,
        -20
      );

      ctx.lineTo(
        25 * pulse,
        -180 * pulse
      );

      ctx.lineTo(
        -25 * pulse,
        -180 * pulse
      );

      ctx.closePath();

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.16 * intensity
        );

      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }
},

/* 105 --------------------------------------------------- */

{
  id: "gravity-bubbles",
  number: 105,
  name: "Gravity Bubbles",
  category: "particles",
  categoryLabel: "Partículas",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 40; i++) {

      const angle =
        i * 0.8 +
        t * 0.0003;

      const radius =
        70 +
        Math.sin(
          t * 0.001 +
          i
        ) * 90;

      const x =
        cx +
        Math.cos(angle) *
        radius;

      const y =
        cy +
        Math.sin(angle) *
        radius *
        0.6;

      const size =
        4 +
        Math.abs(
          Math.sin(
            t * 0.002 +
            i
          )
        ) * 8;

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.22 * intensity
        );

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        size,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }
  }
},

/* 106 --------------------------------------------------- */

{
  id: "time-fragments",
  number: 106,
  name: "Time Fragments",
  category: "special",
  categoryLabel: "Especial",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 20; i++) {

      const x =
        (
          i * 137 +
          t * 0.018
        ) %
        canvasWidth;

      const y =
        (
          i * 71
        ) %
        canvasHeight;

      const size =
        15 +
        (i % 6) * 5;

      ctx.save();

      ctx.translate(
        x,
        y
      );

      ctx.rotate(
        t * 0.0003 +
        i
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.14 * intensity
        );

      ctx.strokeRect(
        -size,
        -size,
        size * 2,
        size * 2
      );

      ctx.restore();
    }
  }
},

/* 107 --------------------------------------------------- */

{
  id: "quantum-lattice",
  number: 107,
  name: "Quantum Lattice",
  category: "special",
  categoryLabel: "Especial",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const spacing = 65;

    for (
      let x = spacing;
      x < canvasWidth;
      x += spacing
    ) {

      for (
        let y = spacing;
        y < canvasHeight;
        y += spacing
      ) {

        const phase =
          Math.sin(
            t * 0.002 +
            x * 0.03 +
            y * 0.02
          );

        const offset =
          phase > 0
            ? 9
            : -9;

        drawLine(
          x,
          y,
          x + offset,
          y + offset,
          colorFor(this, x + y),
          1,
          0.18 * intensity
        );

        drawGlowPoint(
          x,
          y,
          3 + Math.abs(phase) * 3,
          colorFor(this, x),
          0.35 * intensity
        );
      }
    }
  }
},

/* 108 --------------------------------------------------- */

{
  id: "solar-corona",
  number: 108,
  name: "Solar Corona",
  category: "energy",
  categoryLabel: "Energía",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 80; i++) {

      const angle =
        i * 0.17 +
        t * 0.0002;

      const radius =
        80 +
        Math.sin(
          t * 0.002 +
          i
        ) * 35;

      const x =
        cx +
        Math.cos(angle) *
        radius;

      const y =
        cy +
        Math.sin(angle) *
        radius;

      drawLine(
        cx +
          Math.cos(angle) * 60,
        cy +
          Math.sin(angle) * 60,
        x,
        y,
        colorFor(this, i),
        1,
        0.16 * intensity
      );
    }

    drawGlowPoint(
      cx,
      cy,
      95,
      colorFor(this, 0),
      0.45 * intensity
    );
  }
},

/* 109 --------------------------------------------------- */

{
  id: "void-threads",
  number: 109,
  name: "Void Threads",
  category: "special",
  categoryLabel: "Especial",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 35; i++) {

      ctx.beginPath();

      for (
        let x = 0;
        x <= canvasWidth;
        x += 15
      ) {

        const distance =
          Math.abs(
            x -
            canvasWidth / 2
          );

        const y =
          canvasHeight / 2 +
          Math.sin(
            x * 0.01 +
            t * 0.0005 +
            i
          ) *
          (20 + distance * 0.12);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.07 * intensity
        );

      ctx.stroke();
    }
  }
},

/* 110 --------------------------------------------------- */

{
  id: "particle-dna",
  number: 110,
  name: "Particle DNA",
  category: "particles",
  categoryLabel: "Partículas",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const center =
      canvasWidth / 2;

    for (
      let y = 0;
      y < canvasHeight;
      y += 12
    ) {

      const phase =
        y * 0.025 +
        t * 0.001;

      const x1 =
        center +
        Math.sin(phase) *
        150;

      const x2 =
        center +
        Math.sin(
          phase + Math.PI
        ) *
        150;

      drawGlowPoint(
        x1,
        y,
        4,
        colorFor(this, 0),
        0.45 * intensity
      );

      drawGlowPoint(
        x2,
        y,
        4,
        colorFor(this, 1),
        0.45 * intensity
      );
    }
  }
},

/* 111 --------------------------------------------------- */

{
  id: "star-compass",
  number: 111,
  name: "Star Compass",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    ctx.save();

    ctx.translate(
      canvasWidth / 2,
      canvasHeight / 2
    );

    ctx.rotate(
      t * 0.00025
    );

    for (let i = 0; i < 16; i++) {

      const angle =
        i * Math.PI / 8;

      const length =
        i % 2
          ? 100
          : 180;

      drawLine(
        0,
        0,
        Math.cos(angle) * length,
        Math.sin(angle) * length,
        colorFor(this, i),
        i % 2 ? 1 : 2,
        0.2 * intensity
      );
    }

    ctx.restore();
  }
},

/* 112 --------------------------------------------------- */

{
  id: "nebula-cells",
  number: 112,
  name: "Nebula Cells",
  category: "space",
  categoryLabel: "Espacial",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 45; i++) {

      const x =
        (
          i * 127 +
          Math.sin(
            t * 0.0005 +
            i
          ) * 40
        ) %
        canvasWidth;

      const y =
        (
          i * 71 +
          Math.cos(
            t * 0.0004 +
            i
          ) * 50
        ) %
        canvasHeight;

      const radius =
        25 +
        Math.sin(
          t * 0.001 +
          i
        ) * 10;

      drawGlowPoint(
        x,
        y,
        radius * 2,
        colorFor(this, i),
        0.05 * intensity
      );
    }
  }
},

/* 113 --------------------------------------------------- */

{
  id: "fractal-galaxy",
  number: 113,
  name: "Fractal Galaxy",
  category: "space",
  categoryLabel: "Espacial",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let arm = 0; arm < 5; arm++) {

      ctx.beginPath();

      for (
        let r = 5;
        r < 350;
        r += 4
      ) {

        const angle =
          arm * Math.PI * 2 / 5 +
          Math.log(
            r + 1
          ) * 1.8 +
          t * 0.0002;

        const wobble =
          Math.sin(
            r * 0.08 +
            t * 0.001
          ) * 5;

        const x =
          cx +
          Math.cos(angle) *
          (r + wobble);

        const y =
          cy +
          Math.sin(angle) *
          (r + wobble) *
          0.55;

        if (r === 5) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, arm),
          0.16 * intensity
        );

      ctx.stroke();
    }
  }
},

/* 114 --------------------------------------------------- */

{
  id: "energy-vines",
  number: 114,
  name: "Energy Vines",
  category: "nature",
  categoryLabel: "Naturaleza",
  palette: 1,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 12; i++) {

      ctx.beginPath();

      let x =
        i *
        canvasWidth / 11;

      let y =
        canvasHeight;

      ctx.moveTo(
        x,
        y
      );

      for (let j = 0; j < 12; j++) {

        x +=
          Math.sin(
            t * 0.0008 +
            i +
            j
          ) *
          25;

        y -=
          canvasHeight / 14;

        ctx.lineTo(
          x,
          y
        );
      }

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.16 * intensity
        );

      ctx.lineWidth =
        2;

      ctx.stroke();
    }
  }
},

/* 115 --------------------------------------------------- */

{
  id: "holo-cube",
  number: 115,
  name: "Holo Cube",
  category: "digital",
  categoryLabel: "Digital",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const angle =
      t * 0.00035;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    const size = 100;

    const points = [];

    for (let z = -1; z <= 1; z += 2) {

      for (let y = -1; y <= 1; y += 2) {

        for (let x = -1; x <= 1; x += 2) {

          const px =
            x * size;

          const py =
            y * size;

          const pz =
            z * size;

          const rx =
            px * Math.cos(angle) -
            pz * Math.sin(angle);

          const rz =
            px * Math.sin(angle) +
            pz * Math.cos(angle);

          const perspective =
            1 /
            (1.8 + rz / 500);

          points.push({
            x:
              cx +
              rx *
              perspective,

            y:
              cy +
              py *
              perspective
          });
        }
      }
    }

    const edges = [
      [0,1],[0,2],[0,4],
      [1,3],[1,5],
      [2,3],[2,6],
      [3,7],
      [4,5],[4,6],
      [5,7],
      [6,7]
    ];

    edges.forEach(
      ([a,b], i) => {
        drawLine(
          points[a].x,
          points[a].y,
          points[b].x,
          points[b].y,
          colorFor(this, i),
          2,
          0.28 * intensity
        );
      }
    );

    for (
      let y = cy - 130;
      y < cy + 130;
      y += 8
    ) {
      drawLine(
        cx - 140,
        y,
        cx + 140,
        y,
        colorFor(this, 1),
        1,
        0.04
      );
    }
  }
},

/* 116 --------------------------------------------------- */

{
  id: "cosmic-rain",
  number: 116,
  name: "Cosmic Rain",
  category: "space",
  categoryLabel: "Espacial",
  palette: 5,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    for (let i = 0; i < 140; i++) {

      const x =
        (
          i * 73 +
          t * 0.035
        ) %
        (canvasWidth + 200) -
        100;

      const y =
        (
          i * 47 +
          t * 0.02
        ) %
        (canvasHeight + 100) -
        50;

      drawLine(
        x,
        y,
        x - 35,
        y + 45,
        colorFor(this, i),
        1,
        0.25 * intensity
      );
    }
  }
},

/* 117 --------------------------------------------------- */

{
  id: "orbit-maze",
  number: 117,
  name: "Orbit Maze",
  category: "geometry",
  categoryLabel: "Geométrica",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 18; i++) {

      ctx.save();

      ctx.translate(
        cx,
        cy
      );

      ctx.rotate(
        t * 0.0001 *
        (i % 2 ? 1 : -1)
      );

      ctx.beginPath();

      const radius =
        25 +
        i * 18;

      for (
        let j = 0;
        j < 12;
        j++
      ) {

        const angle =
          j * Math.PI / 6;

        const r =
          radius +
          (j % 2) * 18;

        const x =
          Math.cos(angle) *
          r;

        const y =
          Math.sin(angle) *
          r *
          0.55;

        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.1 * intensity
        );

      ctx.stroke();

      ctx.restore();
    }
  }
},

/* 118 --------------------------------------------------- */

{
  id: "event-horizon",
  number: 118,
  name: "Event Horizon",
  category: "space",
  categoryLabel: "Espacial",
  palette: 2,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const pulse =
      (
        Math.sin(
          t * 0.0015
        ) + 1
      ) / 2;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    ctx.fillStyle =
      "#000000";

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      55 + pulse * 10,
      0,
      Math.PI * 2
    );

    ctx.fill();

    for (let i = 0; i < 20; i++) {

      const radius =
        75 +
        i * 9 +
        pulse * 20;

      ctx.beginPath();

      ctx.ellipse(
        cx,
        cy,
        radius,
        radius * 0.38,
        t * 0.0002,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.15 * intensity
        );

      ctx.stroke();
    }
  }
},

/* 119 --------------------------------------------------- */

{
  id: "nova-bloom",
  number: 119,
  name: "Nova Bloom",
  category: "special",
  categoryLabel: "Especial",
  palette: 3,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const pulse =
      (
        Math.sin(
          t * 0.002
        ) + 1
      ) / 2;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    for (let i = 0; i < 24; i++) {

      const angle =
        i *
        Math.PI * 2 / 24;

      const length =
        80 +
        pulse * 160;

      ctx.save();

      ctx.translate(
        cx,
        cy
      );

      ctx.rotate(angle);

      ctx.beginPath();

      ctx.ellipse(
        0,
        -length / 2,
        22 + pulse * 10,
        length / 2,
        0,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        rgba(
          colorFor(this, i),
          0.13 * intensity
        );

      ctx.stroke();

      ctx.restore();
    }
  }
},

/* 120 --------------------------------------------------- */

{
  id: "quantum-nova",
  number: 120,
  name: "Quantum Nova",
  category: "special",
  categoryLabel: "Especial",
  palette: 0,

  draw(env) {

    const {
      t,
      intensity
    } = env;

    const cx =
      canvasWidth / 2;

    const cy =
      canvasHeight / 2;

    const burst =
      Math.floor(
        t / 650
      );

    for (let i = 0; i < 90; i++) {

      const phase =
        (
          i * 0.071 +
          burst * 0.13
        ) % 1;

      const angle =
        i * 2.399 +
        burst * 0.7;

      const radius =
        phase *
        Math.max(
          canvasWidth,
          canvasHeight
        ) *
        0.55;

      const x =
        cx +
        Math.cos(angle) *
        radius;

      const y =
        cy +
        Math.sin(angle) *
        radius;

      drawGlowPoint(
        x,
        y,
        2 + (1 - phase) * 5,
        colorFor(this, i),
        (1 - phase) *
        0.45 *
        intensity
      );
    }

    drawGlowPoint(
      cx,
      cy,
      70,
      colorFor(this, 0),
      0.25 * intensity
    );
  }
}

];

/* =========================================================
   VALIDACIÓN DE LAS 120 ANIMACIONES
   ========================================================= */

if (NOVA_MODES.length !== 120) {
  console.warn(
    `ÚtilHub: NOVA FLOW contiene ${NOVA_MODES.length} modos.`
  );
}

/* =========================================================
   LOOP NOVA FLOW
   ========================================================= */

function novaFrame(timestamp) {

  if (!novaLastTime) {
    novaLastTime =
      timestamp;
  }

  const dt =
    timestamp -
    novaLastTime;

  novaLastTime =
    timestamp;

  novaFrames++;

  if (
    timestamp -
    novaFpsTimer >
    1000
  ) {

    novaFps =
      novaFrames;

    novaFrames = 0;

    novaFpsTimer =
      timestamp;

    const fpsElement =
      $("#fps");

    if (fpsElement) {
      fpsElement.textContent =
        `${novaFps} FPS`;
    }
  }

  updateNovaPointer();

  clearCanvas();

  if (
    state.novaActive &&
    state.motion &&
    ctx
  ) {

    const mode =
      NOVA_MODES.find(
        (item) =>
          item.id ===
          state.novaMode
      );

    if (mode) {

      try {

        mode.draw({
          t: timestamp,
          dt,
          intensity:
            state.novaIntensity,
          width:
            canvasWidth,
          height:
            canvasHeight,
          pointer:
            pointerSmooth,
          scroll:
            scrollSmooth
        });

      } catch (error) {

        console.warn(
          `NOVA FLOW: error en ${mode.name}`,
          error
        );
      }
    }
  }

  novaAnimationFrame =
    requestAnimationFrame(
      novaFrame
    );
}

function startNovaLoop() {

  if (!novaAnimationFrame) {
    novaAnimationFrame =
      requestAnimationFrame(
        novaFrame
      );
  }
}

function stopNovaLoop() {

  if (novaAnimationFrame) {
    cancelAnimationFrame(
      novaAnimationFrame
    );

    novaAnimationFrame =
      null;
  }

  clearCanvas();
}

/* =========================================================
   PREVIEW NOVA
   ========================================================= */

let previewAnimationFrame = null;
let previewCanvas = null;
let previewCtx = null;

function startNovaPreview() {

  previewCanvas =
    $("#novaPreviewCanvas");

  if (!previewCanvas) return;

  previewCtx =
    previewCanvas.getContext(
      "2d"
    );

  resizePreview();

  cancelAnimationFrame(
    previewAnimationFrame
  );

  const previewLoop = (
    timestamp
  ) => {

    if (
      !$("#novaPanel")?.classList.contains(
        "open"
      )
    ) {
      return;
    }

    const mode =
      NOVA_MODES.find(
        (item) =>
          item.id ===
          state.novaMode
      );

    if (
      mode &&
      previewCtx
    ) {

      const width =
        previewCanvas.clientWidth;

      const height =
        previewCanvas.clientHeight;

      previewCanvas.width =
        width *
        Math.min(
          window.devicePixelRatio || 1,
          2
        );

      previewCanvas.height =
        height *
        Math.min(
          window.devicePixelRatio || 1,
          2
        );

      const scale =
        Math.min(
          window.devicePixelRatio || 1,
          2
        );

      previewCtx.setTransform(
        scale,
        0,
        0,
        scale,
        0,
        0
      );

      previewCtx.clearRect(
        0,
        0,
        width,
        height
      );

      const oldCtx =
        window.__novaPreviewContext;

      window.__novaPreviewContext =
        previewCtx;

      /*
        La vista previa usa un contexto
        temporal independiente.
      */

      try {

        previewCtx.save();

        previewCtx.globalAlpha =
          0.8;

        drawPreviewMode(
          mode,
          timestamp,
          width,
          height
        );

        previewCtx.restore();

      } catch {

        /* preview segura */
      }

      window.__novaPreviewContext =
        oldCtx;
    }

    previewAnimationFrame =
      requestAnimationFrame(
        previewLoop
      );
  };

  previewAnimationFrame =
    requestAnimationFrame(
      previewLoop
    );
}

function drawPreviewMode(
  mode,
  t,
  width,
  height
) {

  const pctx =
    previewCtx;

  if (!pctx) return;

  const palette =
    getPalette(
      mode.palette || 0
    );

  const cx =
    width / 2;

  const cy =
    height / 2;

  const intensity =
    state.novaIntensity;

  /*
    Vista previa ligera.
    No modifica el canvas global.
  */

  for (let i = 0; i < 16; i++) {

    const angle =
      t * 0.0004 +
      i * Math.PI / 8;

    const radius =
      25 +
      Math.sin(
        t * 0.001 +
        i
      ) *
      25 +
      i * 4;

    const x =
      cx +
      Math.cos(angle) *
      radius;

    const y =
      cy +
      Math.sin(angle) *
      radius *
      0.55;

    const gradient =
      pctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        25
      );

    gradient.addColorStop(
      0,
      rgba(
        palette[i % palette.length],
        0.6 * intensity
      )
    );

    gradient.addColorStop(
      1,
      rgba(
        palette[i % palette.length],
        0
      )
    );

    pctx.fillStyle =
      gradient;

    pctx.beginPath();

    pctx.arc(
      x,
      y,
      25,
      0,
      Math.PI * 2
    );

    pctx.fill();
  }

  pctx.strokeStyle =
    rgba(
      palette[0],
      0.35
    );

  pctx.lineWidth = 2;

  pctx.beginPath();

  pctx.arc(
    cx,
    cy,
    55 +
      Math.sin(
        t * 0.002
      ) * 15,
    0,
    Math.PI * 2
  );

  pctx.stroke();
}

function stopNovaPreview() {

  cancelAnimationFrame(
    previewAnimationFrame
  );

  previewAnimationFrame =
    null;
}

function resizePreview() {

  if (!previewCanvas) return;

  const width =
    previewCanvas.clientWidth;

  const height =
    previewCanvas.clientHeight;

  const scale =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  previewCanvas.width =
    width * scale;

  previewCanvas.height =
    height * scale;

  previewCtx?.setTransform(
    scale,
    0,
    0,
    scale,
    0,
    0
  );
}

/* =========================================================
   EVENTOS PRINCIPALES
   ========================================================= */

function bindGlobalEvents() {

  $("#themeBtn")?.addEventListener(
    "click",
    toggleTheme
  );

  $("#motionBtn")?.addEventListener(
    "click",
    toggleMotion
  );

  $("#focusBtn")?.addEventListener(
    "click",
    toggleFocus
  );

  $("#openNova")?.addEventListener(
    "click",
    openNova
  );

  $("#novaHeroBtn")?.addEventListener(
    "click",
    openNova
  );

  $("#exploreBtn")?.addEventListener(
    "click",
    () => {
      $("#tools")?.scrollIntoView({
        behavior:
          state.motion
            ? "smooth"
            : "auto"
      });
    }
  );

  $("#toolSearch")?.addEventListener(
    "input",
    (event) => {

      toolSearchText =
        event.target.value;

      renderTools();
    }
  );

  $("#categories")?.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "[data-category]"
        );

      if (!button) return;

      activeCategory =
        button.dataset.category;

      $$(".categoryBtn", $("#categories"))
        .forEach(
          (item) => {
            item.classList.toggle(
              "active",
              item === button
            );
          }
        );

      renderTools();
    }
  );

  $("#toolGrid")?.addEventListener(
    "click",
    (event) => {

      const favorite =
        event.target.closest(
          "[data-favorite]"
        );

      if (favorite) {

        event.stopPropagation();

        toggleFavorite(
          favorite.dataset.favorite
        );

        return;
      }

      const card =
        event.target.closest(
          "[data-tool]"
        );

      if (card) {
        openTool(
          card.dataset.tool
        );
      }
    }
  );

  $("#quickTools")?.addEventListener(
    "click",
    (event) => {

      const item =
        event.target.closest(
          "[data-quick]"
        );

      if (!item) return;

      openTool(
        item.dataset.quick
      );
    }
  );

  $("#clearRecentBtn")?.addEventListener(
    "click",
    () => {

      state.recent = [];

      saveState();

      renderQuickTools();
      updateStats();

      toast(
        "Historial reciente limpiado."
      );
    }
  );

  $("#novaPanel")?.addEventListener(
    "click",
    (event) => {

      const close =
        event.target.closest(
          "[data-close-nova]"
        );

      if (close) {
        closeNova();
        return;
      }

      const mode =
        event.target.closest(
          "[data-nova-mode]"
        );

      if (mode) {
        selectNovaMode(
          mode.dataset.novaMode
        );
      }
    }
  );

  $("#novaSearch")?.addEventListener(
    "input",
    (event) => {

      novaSearchText =
        event.target.value;

      renderNovaModes();
    }
  );

  $("#novaCategories")?.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "[data-nova-category]"
        );

      if (!button) return;

      novaCategory =
        button.dataset.novaCategory;

      $$(".categoryBtn", $("#novaCategories"))
        .forEach(
          (item) => {
            item.classList.toggle(
              "active",
              item === button
            );
          }
        );

      renderNovaModes();
    }
  );

  $("#globalFxBtn")?.addEventListener(
    "click",
    () => {

      if (!state.novaMode) {

        toast(
          "Primero selecciona una animación."
        );

        return;
      }

      state.novaActive =
        !state.novaActive;

      saveState();

      updateNovaVisibility();

      toast(
        state.novaActive
          ? "NOVA FLOW activado en todo ÚtilHub."
          : "NOVA FLOW desactivado."
      );
    }
  );

  $("#parallaxBtn")?.addEventListener(
    "click",
    () => {

      state.scrollParallax =
        !state.scrollParallax;

      saveState();

      updateParallaxButton();

      toast(
        state.scrollParallax
          ? "Parallax activado."
          : "Parallax desactivado."
      );
    }
  );

  $("#novaIntensity")?.addEventListener(
    "input",
    (event) => {

      state.novaIntensity =
        Number(
          event.target.value
        );

      saveState();
    }
  );

  $("#performanceSelect")?.addEventListener(
    "change",
    (event) => {

      state.performance =
        event.target.value;

      saveState();

      toast(
        "Rendimiento actualizado."
      );
    }
  );

  $$(".toolPanelBackdrop, [data-close-tool]")
    .forEach(
      (element) => {
        element.addEventListener(
          "click",
          closeTool
        );
      }
    );

  $$(".modalBackdrop, [data-close-modal]")
    .forEach(
      (element) => {
        element.addEventListener(
          "click",
          closeModal
        );
      }
    );

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape"
      ) {
        closeTool();
        closeNova();
        closeModal();
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {

        event.preventDefault();

        $("#toolSearch")?.focus();
      }
    }
  );

  window.addEventListener(
    "resize",
    () => {

      resizeCanvas();
      resizePreview();
    }
  );

  window.addEventListener(
    "pointermove",
    (event) => {

      pointerTarget.x =
        event.clientX /
        Math.max(
          1,
          window.innerWidth
        );

      pointerTarget.y =
        event.clientY /
        Math.max(
          1,
          window.innerHeight
        );
    },
    {
      passive: true
    }
  );

  window.addEventListener(
    "scroll",
    () => {

      scrollTarget =
        window.scrollY /
        Math.max(
          1,
          document.documentElement.scrollHeight -
          window.innerHeight
        );

    },
    {
      passive: true
    }
  );

  $("#exportBtn")?.addEventListener(
    "click",
    exportData
  );

  $("#importBtn")?.addEventListener(
    "click",
    () => {
      $("#importFile")?.click();
    }
  );

  $("#importFile")?.addEventListener(
    "change",
    importData
  );

  window.addEventListener(
    "online",
    updateConnection
  );

  window.addEventListener(
    "offline",
    updateConnection
  );
}

/* =========================================================
   PARALLAX
   ========================================================= */

function updateParallaxButton() {

  const button =
    $("#parallaxBtn");

  if (!button) return;

  button.textContent =
    state.scrollParallax
      ? "Parallax: Activado"
      : "Parallax: Desactivado";
}

/* =========================================================
   MODAL
   ========================================================= */

function closeModal() {

  const modal =
    $("#modal");

  if (!modal) return;

  modal.classList.remove(
    "open"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );
}

/* =========================================================
   EXPORTAR
   ========================================================= */

function exportData() {

  const data = {
    ...state,
    exportedAt:
      new Date().toISOString(),
    version:
      "ÚtilHub V25"
  };

  const blob =
    new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;

  link.download =
    "utilhub-v25-datos.json";

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );

  toast(
    "Datos exportados."
  );
}

/* =========================================================
   IMPORTAR
   ========================================================= */

function importData(event) {

  const file =
    event.target.files?.[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = () => {

    try {

      const imported =
        JSON.parse(
          reader.result
        );

      state = {
        ...DEFAULT_STATE,
        ...imported
      };

      saveState();

      applyTheme();
      applyMotion();
      applyFocus();
      updateNovaVisibility();

      renderTools();
      renderQuickTools();
      updateStats();
      updateParallaxButton();

      toast(
        "Datos importados correctamente."
      );

    } catch {

      toast(
        "El archivo no es válido."
      );
    }

    event.target.value = "";
  };

  reader.readAsText(file);
}

/* =========================================================
   CONEXIÓN
   ========================================================= */

function updateConnection() {

  const element =
    $("#connectionStatus");

  if (!element) return;

  if (navigator.onLine) {

    element.textContent =
      "● En línea";

    element.style.color =
      "var(--success)";

  } else {

    element.textContent =
      "● Sin conexión";

    element.style.color =
      "var(--warning)";
  }
}

/* =========================================================
   SERVICE WORKER
   ========================================================= */

async function registerServiceWorker() {

  if (
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  try {

    await navigator.serviceWorker.register(
      "./sw.js",
      {
        scope: "./"
      }
    );

  } catch (error) {

    console.warn(
      "ÚtilHub: Service Worker no registrado:",
      error
    );
  }
}

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

function initialize() {

  applyTheme();
  applyMotion();
  applyFocus();

  if ($("#novaIntensity")) {
    $("#novaIntensity").value =
      state.novaIntensity;
  }

  if ($("#performanceSelect")) {
    $("#performanceSelect").value =
      state.performance;
  }

  resizeCanvas();

  renderTools();
  renderQuickTools();
  updateStats();

  renderNovaModes();
  updateNovaVisibility();
  updateParallaxButton();
  updateConnection();

  bindGlobalEvents();

  startNovaLoop();

  registerServiceWorker();

  document.body.classList.add(
    "utilhub-ready"
  );

  /*
    NOVA FLOW queda apagado al entrar,
    incluso si había una animación guardada.
    El usuario debe activarla desde el menú.
  */

  if (
    !state.novaActive
  ) {
    document.documentElement.style
      .setProperty(
        "--nova-opacity",
        "0"
      );
  }
}

/* =========================================================
   ARRANQUE
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialize,
    {
      once: true
    }
  );

} else {

  initialize();
}
