/* ==========================================
   Tastefully Pixelated
   Stable Build
   Subheads + Banner + Core Functionality
========================================== */

/* =========================
   STATE
========================= */

const state = {
  mode: "draw",
  brushSize: 25,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  history: []
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

const drawBtn = document.getElementById("drawBtn");
const moveBtn = document.getElementById("moveBtn");
const undoBtn = document.getElementById("undoBtn");
const applyBtn = document.getElementById("applyBtn");
const restoreBtn = document.getElementById("restoreBtn");
const exportBtn = document.getElementById("exportBtn");
const shareBtn = document.getElementById("shareBtn");

/* =========================
   RANDOM SUBHEADS
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

const subheadEl = document.getElementById("subhead");
if (subheadEl) {
  subheadEl.textContent =
    subheads[Math.floor(Math.random() * subheads.length)];
}

/* =========================
   RANDOM BANNER HEADLINES
========================= */

const bannerHeadlines = [
  "Buy something you really don't need",
  "Shop mofo. Buy, buy, buy",
  "This is where you can advertise your useless crap",
  "What the world really needs is more advertising",
  "Wanna buy one of those endlessly spinning top things?",
  "Sell stuff here, bitches"
];

const bannerHeadlineEl = document.getElementById("bannerHeadline");
if (bannerHeadlineEl) {
  bannerHeadlineEl.textContent =
    bannerHeadlines[Math.floor(Math.random() * bannerHeadlines.length)];
}

/* =========================
   CANVAS SETUP
========================= */

function resizeCanvas() {
  const rect = canvasContainer.getBoundingClientRect();
  baseCanvas.width = rect.width;
  baseCanvas.height = rect.height;
  maskCanvas.width = rect.width;
  maskCanvas.height = rect.height;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* =========================
   IMAGE LOADING
========================= */

canvasContainer.addEventListener("click", () => {
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
      resizeCanvas();

      const scale = Math.min(
        baseCanvas.width / img.width,
        baseCanvas.height / img.height
      );

      const w = img.width * scale;
      const h = img.height * scale;

      const x = (baseCanvas.width - w) / 2;
      const y = (baseCanvas.height - h) / 2;

      baseCtx.clearRect(0,0,baseCanvas.width,baseCanvas.height);
      baseCtx.drawImage(img, x, y, w, h);

      maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);

      canvasOverlay.classList.add("hidden");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(photoInput.files[0]);
});

/* =========================
   BRUSH SIZE
========================= */

brushSlider.addEventListener("input", () => {
  state.brushSize = parseInt(brushSlider.value);
});

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
   ZOOM
========================= */

zoomSlider.addEventListener("input", () => {
  state.zoom = parseFloat(zoomSlider.value);
  applyTransform();
});

function applyTransform() {
  const t = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom})`;
  baseCanvas.style.transform = t;
  maskCanvas.style.transform = t;
}

/* =========================
   MODE SWITCH
========================= */

drawBtn.onclick = () => state.mode = "draw";
moveBtn.onclick = () => state.mode = "move";

/* =========================
   UNDO
========================= */

function saveHistory() {
  state.history.push(
    maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height)
  );
}

undoBtn.onclick = () => {
  if (!state.history.length) return;
  maskCtx.putImageData(state.history.pop(),0,0);
};

/* =========================
   APPLY PIXELATION
========================= */

applyBtn.onclick = () => {
  const pixelSize = 12;

  const imgData = baseCtx.getImageData(0,0,baseCanvas.width,baseCanvas.height);
  const maskData = maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height);

  for (let y = 0; y < baseCanvas.height; y += pixelSize) {
    for (let x = 0; x < baseCanvas.width; x += pixelSize) {

      const i = (y * baseCanvas.width + x) * 4;

      if (maskData.data[i+3] > 0) {

        let r=0,g=0,b=0,count=0;

        for (let yy=0; yy<pixelSize; yy++) {
          for (let xx=0; xx<pixelSize; xx++) {

            const px = x+xx;
            const py = y+yy;
            if (px>=baseCanvas.width || py>=baseCanvas.height) continue;

            const idx = (py * baseCanvas.width + px) * 4;

            r += imgData.data[idx];
            g += imgData.data[idx+1];
            b += imgData.data[idx+2];
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
   RESTORE
========================= */

restoreBtn.onclick = () => location.reload();

/* =========================
   EXPORT
========================= */

exportBtn.onclick = () => {
  const link = document.createElement("a");
  link.download = "tastefully-pixelated.png";
  link.href = baseCanvas.toDataURL();
  link.click();
};

/* =========================
   SHARE
========================= */

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