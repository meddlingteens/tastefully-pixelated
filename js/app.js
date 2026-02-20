document.addEventListener("DOMContentLoaded", () => {

/* ==========================================
   Tastefully Pixelated – Stable Build
========================================== */

const state = {
  mode: "draw",
  brushSize: 25,
  pixelSize: 12,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  history: [],
  redoStack: [],
  imageLoaded: false,
  originalImageData: null
};

/* =========================
   ELEMENTS (SAFE LOOKUP)
========================= */

const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");

if (!baseCanvas || !maskCanvas) return;

const baseCtx = baseCanvas.getContext("2d");
const maskCtx = maskCanvas.getContext("2d");

const canvasContainer = document.getElementById("canvasContainer");
const canvasOverlay = document.getElementById("canvasOverlay");
const canvasSelectBtn = document.getElementById("canvasSelectBtn");
const photoInput = document.getElementById("photoInput");

const brushSlider = document.getElementById("brushSlider");
const zoomSlider = document.getElementById("zoomSlider");
const pixelSlider = document.getElementById("pixelSlider");

const drawBtn = document.getElementById("drawBtn");
const moveBtn = document.getElementById("moveBtn");
const undoBtn = document.getElementById("undoBtn");
const applyBtn = document.getElementById("applyBtn");
const restoreBtn = document.getElementById("restoreBtn");
const exportBtn = document.getElementById("exportBtn");
const shareBtn = document.getElementById("shareBtn");

/* =========================
   RANDOM COPY
========================= */

const subheads = [
  "Just, eeuuuuu.",
  "Hide your shame.",
  "I can't unsee that.",
  "Don't be fickle, apply a pixel."
];

const bannerHeadlines = [
  "Buy something you really don't need",
  "Shop mofo. Buy, buy, buy",
  "This is where you can advertise your useless crap"
];

const subheadEl = document.getElementById("subhead");
const bannerHeadlineEl = document.getElementById("bannerHeadline");

if (subheadEl)
  subheadEl.textContent =
    subheads[Math.floor(Math.random() * subheads.length)];

if (bannerHeadlineEl)
  bannerHeadlineEl.textContent =
    bannerHeadlines[Math.floor(Math.random() * bannerHeadlines.length)];

/* =========================
   FADE-IN + PARALLAX
========================= */

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

window.addEventListener("scroll", () => {
  const offset = window.scrollY * 0.15;
  document.body.style.backgroundPosition = `center ${offset}px`;
});

/* =========================
   CONTROL TOGGLE
========================= */

function toggleControls(enabled) {
  [drawBtn, moveBtn, undoBtn, applyBtn, restoreBtn, exportBtn, shareBtn]
    .filter(Boolean)
    .forEach(btn => btn.disabled = !enabled);
}

toggleControls(false);

/* =========================
   MODE SWITCH
========================= */

function setActiveMode(mode) {
  state.mode = mode;
  if (drawBtn) drawBtn.classList.toggle("active", mode === "draw");
  if (moveBtn) moveBtn.classList.toggle("active", mode === "move");
}

if (drawBtn) drawBtn.onclick = () => setActiveMode("draw");
if (moveBtn) moveBtn.onclick = () => setActiveMode("move");

setActiveMode("draw");

/* =========================
   SLIDERS
========================= */

if (brushSlider)
  brushSlider.addEventListener("input", () =>
    state.brushSize = parseInt(brushSlider.value)
  );

if (pixelSlider)
  pixelSlider.addEventListener("input", () =>
    state.pixelSize = parseInt(pixelSlider.value)
  );

if (zoomSlider)
  zoomSlider.addEventListener("input", () => {
    state.zoom = parseFloat(zoomSlider.value);
    applyTransform();
  });

/* =========================
   TRANSFORM
========================= */

function applyTransform() {
  const t = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom})`;
  baseCanvas.style.transform = t;
  maskCanvas.style.transform = t;
}

/* =========================
   IMAGE LOADING
========================= */

if (canvasOverlay)
  canvasOverlay.addEventListener("click", () => photoInput.click());

if (canvasSelectBtn)
  canvasSelectBtn.addEventListener("click", e => {
    e.stopPropagation();
    photoInput.click();
  });

if (photoInput)
photoInput.addEventListener("change", () => {
  if (!photoInput.files.length) return;

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {

      const maxW = canvasContainer.clientWidth;
      const maxH = canvasContainer.clientHeight;

      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = Math.floor(img.width * scale);
      const h = Math.floor(img.height * scale);

      baseCanvas.width = maskCanvas.width = w;
      baseCanvas.height = maskCanvas.height = h;

      baseCtx.drawImage(img, 0, 0, w, h);
      state.originalImageData =
        baseCtx.getImageData(0, 0, w, h);

      maskCtx.clearRect(0,0,w,h);

      canvasOverlay.classList.add("hidden");
      state.imageLoaded = true;
      toggleControls(true);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(photoInput.files[0]);
});

});