document.addEventListener("DOMContentLoaded", () => {

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

const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
if (!baseCanvas || !maskCanvas) return;

const baseCtx = baseCanvas.getContext("2d");
const maskCtx = maskCanvas.getContext("2d");

const canvasContainer = document.getElementById("canvasContainer");
const canvasOverlay = document.getElementById("canvasOverlay");
const photoInput = document.getElementById("photoInput");

const brushSlider = document.getElementById("brushSlider");
const zoomSlider = document.getElementById("zoomSlider");
const pixelSlider = document.getElementById("pixelSlider");

const drawBtn = document.getElementById("drawBtn");
const moveBtn = document.getElementById("moveBtn");
const undoBtn = document.getElementById("undoBtn");
const applyBtn = document.getElementById("applyBtn");
const restoreBtn = document.getElementById("restoreBtn");

/* Fade */
window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

/* Parallax */
window.addEventListener("scroll", () => {
  const offset = window.scrollY * 0.15;
  document.body.style.backgroundPosition = `center ${offset}px`;
});

/* Proper proportional image loading */
photoInput.addEventListener("change", () => {
  if (!photoInput.files.length) return;

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {

      const containerWidth = canvasContainer.clientWidth;
      const containerHeight = canvasContainer.clientHeight;

      const widthRatio = containerWidth / img.width;
      const heightRatio = containerHeight / img.height;
      const scale = Math.min(widthRatio, heightRatio, 1);

      const scaledWidth = Math.floor(img.width * scale);
      const scaledHeight = Math.floor(img.height * scale);

      baseCanvas.width = scaledWidth;
      baseCanvas.height = scaledHeight;
      maskCanvas.width = scaledWidth;
      maskCanvas.height = scaledHeight;

      baseCtx.clearRect(0, 0, scaledWidth, scaledHeight);
      baseCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      state.originalImageData =
        baseCtx.getImageData(0, 0, scaledWidth, scaledHeight);

      maskCtx.clearRect(0, 0, scaledWidth, scaledHeight);

      state.zoom = 1;
      state.offsetX = 0;
      state.offsetY = 0;
      applyTransform();

      canvasOverlay.classList.add("hidden");
      state.imageLoaded = true;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(photoInput.files[0]);
});

/* Transform */
function applyTransform() {
  const t = `translate(-50%, -50%) translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom})`;
  baseCanvas.style.transform = t;
  maskCanvas.style.transform = t;
}

});