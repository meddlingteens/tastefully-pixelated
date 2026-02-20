/* ==========================================
   Tastefully Pixelated
   Stable Build – Bug Fix + UX Upgrade
========================================== */

const state = {
  mode: "draw",
  brushSize: 25,
  pixelSize: 12,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  history: [],
  imageLoaded: false
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
   INITIAL STATE
========================= */

toggleControls(false);

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

canvasOverlay.addEventListener("click", () => {
  photoInput.click();
});

canvasSelectBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  photoInput.click();
});

photoInput.addEventListener("change", () => {
  if (!photoInput.files.length) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = () => {

      baseCanvas.width = maskCanvas.width = img.width;
      baseCanvas.height = maskCanvas.height = img.height;

      baseCtx.clearRect(0,0,img.width,img.height);
      baseCtx.drawImage(img, 0, 0);

      maskCtx.clearRect(0,0,img.width,img.height);

      canvasOverlay.classList.add("hidden");

      state.imageLoaded = true;
      toggleControls(true);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(photoInput.files[0]);
});

/* =========================
   SLIDERS
========================= */

brushSlider.addEventListener("input", () => {
  state.brushSize = parseInt(brushSlider.value);
});

zoomSlider.addEventListener("input", () => {
  state.zoom = parseFloat(zoomSlider.value);
  applyTransform();
});

pixelSlider.addEventListener("input", () => {
  state.pixelSize = parseInt(pixelSlider.value);
});

/* =========================
   MODE SWITCH
========================= */

function setActiveMode(mode) {
  state.mode = mode;

  drawBtn.classList.remove("active");
  moveBtn.classList.remove("active");

  if (mode === "draw") drawBtn.classList.add("active");
  if (mode === "move") moveBtn.classList.add("active");
}

drawBtn.onclick = () => setActiveMode("draw");
moveBtn.onclick = () => setActiveMode("move");

/* =========================
   DRAWING
========================= */

let drawing = false;

maskCanvas.addEventListener("mousedown", startDraw);
maskCanvas.addEventListener("mousemove", draw);
window.addEventListener("mouseup", stopDraw);

function startDraw(e) {
  if (state.mode !== "draw") return;
  drawing = true;
  saveHistory();
  draw(e);
}

function draw(e) {
  if (!drawing) return;

  const rect = maskCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left - state.offsetX) / state.zoom;
  const y = (e.clientY - rect.top - state.offsetY) / state.zoom;

  maskCtx.fillStyle = "white";
  maskCtx.beginPath();
  maskCtx.arc(x, y, state.brushSize, 0, Math.PI * 2);
  maskCtx.fill();
}

function stopDraw() {
  drawing = false;
}

/* =========================
   MOVE (PAN)
========================= */

let isPanning = false;
let startX = 0;
let startY = 0;

maskCanvas.addEventListener("mousedown", e => {
  if (state.mode !== "move") return;

  isPanning = true;
  startX = e.clientX - state.offsetX;
  startY = e.clientY - state.offsetY;
});

window.addEventListener("mousemove", e => {
  if (!isPanning) return;

  state.offsetX = e.clientX - startX;
  state.offsetY = e.clientY - startY;
  applyTransform();
});

window.addEventListener("mouseup", () => {
  isPanning = false;
});

/* =========================
   UNDO
========================= */

function saveHistory() {
  state.history.push(
    maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height)
  );
  if (state.history.length > 30) state.history.shift();
}

undoBtn.onclick = () => {
  if (!state.history.length) return;
  maskCtx.putImageData(state.history.pop(),0,0);
};

/* =========================
   APPLY PIXELATION
========================= */

applyBtn.onclick = () => {

  const maskData = maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height);
  const hasMask = maskData.data.some((v,i)=> i%4===3 && v>0);
  if (!hasMask) return;

  baseCtx.imageSmoothingEnabled = false;

  const pixelSize = state.pixelSize;

  const imgData = baseCtx.getImageData(0,0,baseCanvas.width,baseCanvas.height);

  for (let y = 0; y < baseCanvas.height; y += pixelSize) {
    for (let x = 0; x < baseCanvas.width; x += pixelSize) {

      const i = (y * baseCanvas.width + x) * 4;
      if (maskData.data[i+3] === 0) continue;

      let r=0,g=0,b=0,count=0;

      for (let yy=0; yy<pixelSize; yy++) {
        for (let xx=0; xx<pixelSize; xx++) {
          const px = x+xx;
          const py = y+yy;
          if (px>=baseCanvas.width || py>=baseCanvas.height) continue;
          const idx = (py * baseCanvas.width + px) * 4;
          r+=imgData.data[idx];
          g+=imgData.data[idx+1];
          b+=imgData.data[idx+2];
          count++;
        }
      }

      r/=count; g/=count; b/=count;

      for (let yy=0; yy<pixelSize; yy++) {
        for (let xx=0; xx<pixelSize; xx++) {
          const px = x+xx;
          const py = y+yy;
          if (px>=baseCanvas.width || py>=baseCanvas.height) continue;
          const idx = (py * baseCanvas.width + px) * 4;
          if (maskData.data[idx+3] > 0) {
            imgData.data[idx]=r;
            imgData.data[idx+1]=g;
            imgData.data[idx+2]=b;
          }
        }
      }
    }
  }

  baseCtx.putImageData(imgData,0,0);
  maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);
};

/* =========================
   RESTORE / EXPORT / SHARE
========================= */

restoreBtn.onclick = () => location.reload();

exportBtn.onclick = () => {
  const link = document.createElement("a");
  link.download = "tastefully-pixelated.png";
  link.href = baseCanvas.toDataURL();
  link.click();
};

shareBtn.onclick = async () => {
  if (navigator.share) {
    baseCanvas.toBlob(async (blob) => {
      const file = new File([blob], "pixelated.png", { type: "image/png" });
      await navigator.share({ files: [file] });
    });
  } else {
    alert("Sharing not supported on this device.");
  }
};

/* =========================
   CONTROL TOGGLE
========================= */

function toggleControls(enabled) {
  [drawBtn, moveBtn, undoBtn, applyBtn, restoreBtn, exportBtn, shareBtn]
    .forEach(btn => btn.disabled = !enabled);
}