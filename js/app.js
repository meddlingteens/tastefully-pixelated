document.addEventListener("DOMContentLoaded", () => {

/* =====================================================
   STATE
===================================================== */

const state = {
  imageLoaded: false,
  mode: "draw",
  brushSize: 25,
  pixelSize: 12,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  undoStack: [],
  originalImageData: null
};

/* =====================================================
   ELEMENTS
===================================================== */

const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
const blurCanvas = document.getElementById("blurCanvas");

const container = document.getElementById("canvasContainer");
const overlay = document.getElementById("canvasOverlay");
const photoInput = document.getElementById("photoInput");

const drawBtn = document.getElementById("drawBtn");
const moveBtn = document.getElementById("moveBtn");
const undoBtn = document.getElementById("undoBtn");

const brushSlider = document.getElementById("brushSlider");
const pixelSlider = document.getElementById("pixelSlider");
const zoomSlider = document.getElementById("zoomSlider");

const baseCtx = baseCanvas.getContext("2d");
const maskCtx = maskCanvas.getContext("2d");
const blurCtx = blurCanvas.getContext("2d");

/* =====================================================
   RANDOM COPY
===================================================== */

const subheadEl = document.getElementById("subhead");
const bannerHeadlineEl = document.getElementById("bannerHeadline");

const subheads = [
  "Just, eeuuuuu.",
  "Ain't no one wanna see that.",
  "Hide your shame.",
  "Seriously, that's gross.",
  "I can't unsee that.",
  "Don't be fickle, apply a pixel."
];

const bannerHeadlines = [
  "Buy something you really don't need",
  "Shop mofo. Buy, buy, buy",
  "This is where you can advertise your useless crap",
  "What the world really needs is more advertising"
];

if (subheadEl)
  subheadEl.textContent = subheads[Math.floor(Math.random() * subheads.length)];

if (bannerHeadlineEl)
  bannerHeadlineEl.textContent =
    bannerHeadlines[Math.floor(Math.random() * bannerHeadlines.length)];

/* =====================================================
   FADE IN
===================================================== */

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

/* =====================================================
   IMAGE LOADING
===================================================== */

photoInput.addEventListener("change", () => {

  if (!photoInput.files.length) return;

  const reader = new FileReader();

  reader.onload = e => {

    const img = new Image();

    img.onload = () => {

      const containerW = container.clientWidth;
      const containerH = container.clientHeight;

      /* -------- BLUR BACKGROUND (COVER) -------- */

      blurCanvas.width = containerW;
      blurCanvas.height = containerH;

      const coverScale = Math.max(
        containerW / img.width,
        containerH / img.height
      );

      const coverW = img.width * coverScale;
      const coverH = img.height * coverScale;

      const coverX = (containerW - coverW) / 2;
      const coverY = (containerH - coverH) / 2;

      blurCtx.clearRect(0, 0, containerW, containerH);
      blurCtx.drawImage(img, coverX, coverY, coverW, coverH);

      /* -------- MAIN IMAGE (FIT) -------- */

      const fitScale = Math.min(
        containerW / img.width,
        containerH / img.height,
        1
      );

      const scaledW = Math.floor(img.width * fitScale);
      const scaledH = Math.floor(img.height * fitScale);

      baseCanvas.width = scaledW;
      baseCanvas.height = scaledH;
      maskCanvas.width = scaledW;
      maskCanvas.height = scaledH;

      baseCtx.clearRect(0, 0, scaledW, scaledH);
      baseCtx.drawImage(img, 0, 0, scaledW, scaledH);

      state.originalImageData =
        baseCtx.getImageData(0, 0, scaledW, scaledH);

      const offsetX = (containerW - scaledW) / 2;
      const offsetY = (containerH - scaledH) / 2;

      baseCanvas.style.left = offsetX + "px";
      baseCanvas.style.top = offsetY + "px";

      maskCanvas.style.left = offsetX + "px";
      maskCanvas.style.top = offsetY + "px";

      baseCanvas.style.opacity = 0;
      setTimeout(() => {
        baseCanvas.style.transition = "opacity 0.4s ease";
        baseCanvas.style.opacity = 1;
      }, 10);

      overlay.classList.add("hidden");
      state.imageLoaded = true;
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(photoInput.files[0]);
});

/* =====================================================
   PIXEL PAINTING
===================================================== */

function pixelateArea(x, y) {

  const size = state.brushSize;
  const pixelSize = state.pixelSize;

  const startX = Math.max(0, x - size / 2);
  const startY = Math.max(0, y - size / 2);

  const imageData = baseCtx.getImageData(
    startX,
    startY,
    size,
    size
  );

  for (let y2 = 0; y2 < size; y2 += pixelSize) {
    for (let x2 = 0; x2 < size; x2 += pixelSize) {

      const i = ((y2 * size) + x2) * 4;

      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];

      baseCtx.fillStyle = `rgb(${r},${g},${b})`;
      baseCtx.fillRect(startX + x2, startY + y2, pixelSize, pixelSize);
    }
  }
}

baseCanvas.addEventListener("mousedown", e => {
  if (!state.imageLoaded) return;

  if (state.mode === "draw") {
    state.undoStack.push(baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height));
    const rect = baseCanvas.getBoundingClientRect();
    pixelateArea(e.clientX - rect.left, e.clientY - rect.top);
  } else {
    state.isDragging = true;
  }
});

baseCanvas.addEventListener("mousemove", e => {
  if (!state.isDragging || state.mode !== "position") return;

  state.offsetX += e.movementX;
  state.offsetY += e.movementY;

  baseCanvas.style.left = parseInt(baseCanvas.style.left) + e.movementX + "px";
  maskCanvas.style.left = parseInt(maskCanvas.style.left) + e.movementX + "px";

  baseCanvas.style.top = parseInt(baseCanvas.style.top) + e.movementY + "px";
  maskCanvas.style.top = parseInt(maskCanvas.style.top) + e.movementY + "px";
});

window.addEventListener("mouseup", () => {
  state.isDragging = false;
});

/* =====================================================
   UNDO
===================================================== */

undoBtn.addEventListener("click", () => {
  if (!state.undoStack.length) return;
  const previous = state.undoStack.pop();
  baseCtx.putImageData(previous, 0, 0);
});

/* =====================================================
   MODE SWITCH
===================================================== */

function setActiveButton(btn) {
  [drawBtn, moveBtn].forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

drawBtn.addEventListener("click", () => {
  state.mode = "draw";
  setActiveButton(drawBtn);
});

moveBtn.addEventListener("click", () => {
  state.mode = "position";
  setActiveButton(moveBtn);
});

/* =====================================================
   SLIDERS
===================================================== */

brushSlider.addEventListener("input", e => {
  state.brushSize = parseInt(e.target.value);
});

pixelSlider.addEventListener("input", e => {
  state.pixelSize = parseInt(e.target.value);
});

zoomSlider.addEventListener("input", e => {
  state.zoom = parseFloat(e.target.value);
  baseCanvas.style.transform = `scale(${state.zoom})`;
  maskCanvas.style.transform = `scale(${state.zoom})`;
});

/* =====================================================
   BLUR BRIGHTNESS TUNING
===================================================== */

blurCanvas.style.filter = "blur(30px) brightness(1.1)";

});