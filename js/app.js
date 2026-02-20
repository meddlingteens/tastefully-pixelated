document.addEventListener("DOMContentLoaded", () => {

/* ==========================================
   Tastefully Pixelated
   Advanced Stable Build
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
   ELEMENTS
========================= */

const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
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
  "Ain't no one wanna see that.",
  "Hide your shame.",
  "Seriously, that's gross.",
  "I can't unsee that.",
  "WTF?",
  "Place a pixel where the good lord split yea.",
  "Leave everything for your imagination.",
  "Uh, really?",
  "Yeah, nah, yeah, nah, nah, nah.",
  "I think I just puked a little in my mouth.",
  "Don't be fickle, apply a pixel."
];

const bannerHeadlines = [
  "Buy something you really don't need",
  "Shop mofo. Buy, buy, buy",
  "This is where you can advertise your useless crap",
  "What the world really needs is more advertising",
  "Wanna buy one of those endlessly spinning top things?",
  "Sell stuff here, bitches"
];

const subheadEl = document.getElementById("subhead");
const bannerHeadlineEl = document.getElementById("bannerHeadline");

if (subheadEl) {
  subheadEl.textContent =
    subheads[Math.floor(Math.random() * subheads.length)];
}

if (bannerHeadlineEl) {
  bannerHeadlineEl.textContent =
    bannerHeadlines[Math.floor(Math.random() * bannerHeadlines.length)];
}

/* =========================
   INITIAL STATE
========================= */

toggleControls(false);
setActiveMode("draw");

/* =========================
   IMAGE LOADING
========================= */

canvasOverlay.addEventListener("click", () => photoInput.click());
canvasSelectBtn.addEventListener("click", e => {
  e.stopPropagation();
  photoInput.click();
});

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

/* =========================
   TRANSFORM
========================= */

function applyTransform() {
  const t = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom})`;
  baseCanvas.style.transform = t;
  maskCanvas.style.transform = t;
}

zoomSlider.addEventListener("input", () => {
  state.zoom = parseFloat(zoomSlider.value);
  applyTransform();
});

/* =========================
   SLIDERS
========================= */

brushSlider.addEventListener("input", () =>
  state.brushSize = parseInt(brushSlider.value)
);

pixelSlider.addEventListener("input", () =>
  state.pixelSize = parseInt(pixelSlider.value)
);

/* =========================
   MODE SWITCH
========================= */

function setActiveMode(mode) {
  state.mode = mode;
  drawBtn.classList.toggle("active", mode === "draw");
  moveBtn.classList.toggle("active", mode === "move");
}

drawBtn.onclick = () => setActiveMode("draw");
moveBtn.onclick = () => setActiveMode("move");

/* =========================
   CONTROL TOGGLE
========================= */

function toggleControls(enabled) {
  [drawBtn, moveBtn, undoBtn, applyBtn, restoreBtn, exportBtn, shareBtn]
    .forEach(btn => btn.disabled = !enabled);
}

});