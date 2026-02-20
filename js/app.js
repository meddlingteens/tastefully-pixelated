/* ==========================================
   Tastefully Pixelated
   Advanced Stable Build
   - Non-destructive apply
   - Undo + Redo
   - Touch support
   - Scale-to-fit image loading
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

document.getElementById("subhead").textContent =
  subheads[Math.floor(Math.random() * subheads.length)];

document.getElementById("bannerHeadline").textContent =
  bannerHeadlines[Math.floor(Math.random() * bannerHeadlines.length)];

/* =========================
   INITIAL STATE
========================= */

toggleControls(false);
setActiveMode("draw");

/* =========================
   IMAGE LOADING (SCALE TO FIT)
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

      baseCtx.clearRect(0,0,w,h);
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
   DRAW + TOUCH SUPPORT
========================= */

let drawing = false;
let isPanning = false;
let startX = 0;
let startY = 0;

function getCoords(e) {
  const rect = maskCanvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  return {
    x: (clientX - rect.left - state.offsetX) / state.zoom,
    y: (clientY - rect.top - state.offsetY) / state.zoom
  };
}

function start(e) {
  if (state.mode === "draw") {
    drawing = true;
    saveHistory();
    draw(e);
  } else if (state.mode === "move") {
    isPanning = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX - state.offsetX;
    startY = clientY - state.offsetY;
  }
}

function draw(e) {
  if (!drawing) return;
  const { x, y } = getCoords(e);
  maskCtx.fillStyle = "white";
  maskCtx.beginPath();
  maskCtx.arc(x, y, state.brushSize, 0, Math.PI * 2);
  maskCtx.fill();
}

function move(e) {
  if (drawing) draw(e);

  if (isPanning) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    state.offsetX = clientX - startX;
    state.offsetY = clientY - startY;
    applyTransform();
  }
}

function stop() {
  drawing = false;
  isPanning = false;
}

maskCanvas.addEventListener("mousedown", start);
maskCanvas.addEventListener("mousemove", move);
window.addEventListener("mouseup", stop);

maskCanvas.addEventListener("touchstart", start, { passive: false });
maskCanvas.addEventListener("touchmove", move, { passive: false });
window.addEventListener("touchend", stop);

/* =========================
   UNDO / REDO
========================= */

function saveHistory() {
  state.history.push(
    maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height)
  );
  state.redoStack = [];
  if (state.history.length > 30) state.history.shift();
}

undoBtn.onclick = () => {
  if (!state.history.length) return;
  state.redoStack.push(
    maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height)
  );
  maskCtx.putImageData(state.history.pop(),0,0);
};

document.addEventListener("keydown", e => {
  if (e.metaKey && e.key === "z") undoBtn.click();
  if (e.metaKey && e.key === "y" && state.redoStack.length) {
    state.history.push(
      maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height)
    );
    maskCtx.putImageData(state.redoStack.pop(),0,0);
  }
});

/* =========================
   APPLY (NON-DESTRUCTIVE)
========================= */

applyBtn.onclick = () => {

  if (!state.originalImageData) return;

  baseCtx.putImageData(state.originalImageData, 0, 0);

  const w = baseCanvas.width;
  const h = baseCanvas.height;

  const imgData = baseCtx.getImageData(0,0,w,h);
  const maskData = maskCtx.getImageData(0,0,w,h);

  const block = state.pixelSize;

  for (let y = 0; y < h; y += block) {
    for (let x = 0; x < w; x += block) {

      let masked = false;
      for (let yy = y; yy < y + block && yy < h; yy++) {
        for (let xx = x; xx < x + block && xx < w; xx++) {
          if (maskData.data[(yy*w+xx)*4+3] > 0) {
            masked = true;
            break;
          }
        }
        if (masked) break;
      }

      if (!masked) continue;

      let r=0,g=0,b=0,count=0;

      for (let yy = y; yy < y + block && yy < h; yy++) {
        for (let xx = x; xx < x + block && xx < w; xx++) {
          const i = (yy*w+xx)*4;
          r+=imgData.data[i];
          g+=imgData.data[i+1];
          b+=imgData.data[i+2];
          count++;
        }
      }

      r/=count; g/=count; b/=count;

      for (let yy = y; yy < y + block && yy < h; yy++) {
        for (let xx = x; xx < x + block && xx < w; xx++) {
          const i = (yy*w+xx)*4;
          if (maskData.data[i+3] > 0) {
            imgData.data[i]=r;
            imgData.data[i+1]=g;
            imgData.data[i+2]=b;
          }
        }
      }
    }
  }

  baseCtx.putImageData(imgData,0,0);
  maskCtx.clearRect(0,0,w,h);
};

/* =========================
   EXPORT / SHARE
========================= */

exportBtn.onclick = () => {
  const link = document.createElement("a");
  link.download = "tastefully-pixelated.png";
  link.href = baseCanvas.toDataURL();
  link.click();
};

shareBtn.onclick = async () => {
  if (navigator.share) {
    baseCanvas.toBlob(async blob => {
      const file = new File([blob], "pixelated.png", { type: "image/png" });
      await navigator.share({ files: [file] });
    });
  }
};

/* =========================
   CONTROL TOGGLE
========================= */

function toggleControls(enabled) {
  [drawBtn, moveBtn, undoBtn, applyBtn, restoreBtn, exportBtn, shareBtn]
    .forEach(btn => btn.disabled = !enabled);
}