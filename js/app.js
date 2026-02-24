document.addEventListener("DOMContentLoaded", function () {

 // ======================================================
// ELEMENTS
// ======================================================


// Canvas Elements
const canvasContainer = document.getElementById("canvasContainer");
const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
const previewCanvas = document.getElementById("previewCanvas");

if (!canvasContainer || !baseCanvas || !maskCanvas) {
  console.error("Critical canvas elements missing.");
  return;
}

const baseCtx = baseCanvas.getContext("2d");
const maskCtx = maskCanvas.getContext("2d");
const previewCtx = previewCanvas ? previewCanvas.getContext("2d") : null;







window.addEventListener("error", function (e) {
  console.error("Runtime error:", e.message);
});

// UI Elements
const applyBtn = document.getElementById("applyBtn");
const brushSlider = document.getElementById("brushSlider");
const zoomSlider = document.getElementById("zoomSlider");
const uploadInput = document.getElementById("uploadInput");
const drawBtn = document.getElementById("drawBtn");
const moveBtn = document.getElementById("moveBtn");
const canvasSelectBtn = document.getElementById("canvasSelectBtn");

// Safely wire Select Photo
if (canvasSelectBtn && uploadInput) {
  canvasSelectBtn.addEventListener("click", function () {
    uploadInput.click();
  });
} else {
  console.warn("Select photo elements missing.");
}



// ======================================================
// MASK PREVIEW RENDER
// ======================================================

function renderMaskPreview() {

  // Guard required dependencies
  if (!maskCtx || !maskBuffer) return;
  if (dirtyMinX === Infinity) return;

  const width = dirtyMaxX - dirtyMinX + 1;
  const height = dirtyMaxY - dirtyMinY + 1;

  if (width <= 0 || height <= 0) return;

  const imageData = maskCtx.createImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {

    const srcY = dirtyMinY + y;

    for (let x = 0; x < width; x++) {

      const srcX = dirtyMinX + x;
      const srcIndex = srcY * maskWidth + srcX;
      const dstIndex = (y * width + x) * 4;

      const alpha = maskBuffer[srcIndex];

      data[dstIndex]     = 255;
      data[dstIndex + 1] = 255;
      data[dstIndex + 2] = 255;
      data[dstIndex + 3] = alpha;
    }
  }

  maskCtx.putImageData(imageData, dirtyMinX, dirtyMinY);
}





// ======================================================
// SUBHEAD ROTATION
// ======================================================

const subhead = document.getElementById("subhead");

const subheadMessages = [
  "Eeeuuu, hide that.",
  "Hide your shame.",
  "Blur responsibly.",
  "Uh, no. Just no.",
  "That's a hard no.",
  "Pix out where the sun don't shine.",
  "Ain't nobody wanna see that.",
  "For god's sake, pixelate.",
  "For the love of god, hide that shit.",
  "Spare us all."
];

function setRandomSubhead() {
  const randomIndex = Math.floor(Math.random() * subheadMessages.length);
  subhead.textContent = subheadMessages[randomIndex];
}

setRandomSubhead();



// ======================================================
// BANNER HEADLINE ROTATION
// ======================================================

const bannerHeadline = document.getElementById("bannerHeadline");

const bannerMessages = [
  "This is where you can advertise your useless crap",
  "Buy, buy, buy!",
  "Sell stuff no one needs.",
  "Buy this shiny thing.",
  "Consumers of the world, unite!",
  "A thing to buy goes here.",
  "More stuff, that's what you need!",
  "Buy!",
  "Uh, spend money here",
  "Spend!"
];

function setRandomBanner() {
  bannerHeadline.classList.add("fade-out");

  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * bannerMessages.length);
    bannerHeadline.textContent = bannerMessages[randomIndex];
    bannerHeadline.classList.remove("fade-out");
  }, 150);
}

setRandomBanner();


  // ======================================================
  // STATE
  // ======================================================

  let image = null;

  let zoomLevel = 1;
  let targetZoom = 1;
  let offsetX = 0;
  let offsetY = 0;

  let isDrawing = false;
  let mode = "draw";

  let isApplying = false;

  let lastX = null;
  let lastY = null;

  let brushSize = 40;
  let brushHardness = 0.7;
  let brushOpacity = 1.0;

  let maskBuffer = null;
  let maskWidth = 0;
  let maskHeight = 0;

  let kernelDX, kernelDY, kernelIntensity;
  let kernelSize = 0;

  let dirtyMinX = Infinity;
  let dirtyMinY = Infinity;
  let dirtyMaxX = -Infinity;
  let dirtyMaxY = -Infinity;

  const MAX_HISTORY = 20;
  let historyStack = [];





  let redoStack = [];





// ======================================================
// WEB WORKER
// ======================================================

let pixelWorker = null;

try {
  pixelWorker = new Worker("pixelWorker.js");

  pixelWorker.onmessage = function (e) {
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

    const { buffer } = e.data;

    const imageData = new ImageData(
      new Uint8ClampedArray(buffer),
      baseCanvas.width,
      baseCanvas.height
    );

    baseCtx.putImageData(imageData, 0, 0);

    maskBuffer = new Uint8Array(maskWidth * maskHeight);

    dirtyMinX = dirtyMinY = Infinity;
    dirtyMaxX = dirtyMaxY = -Infinity;

    isApplying = false;
    applyBtn.disabled = false;
  };

} catch (err) {
  console.error("Worker failed to initialize:", err);
}






  // ======================================================
  // RESIZE
  // ======================================================

function resizeCanvas() {

  const rect = canvasContainer.getBoundingClientRect();

  baseCanvas.width = rect.width;
  baseCanvas.height = rect.height;

  maskCanvas.width = rect.width;
  maskCanvas.height = rect.height;

if (previewCanvas) {
  previewCanvas.width = rect.width;
  previewCanvas.height = rect.height;
}

  maskWidth = baseCanvas.width;
  maskHeight = baseCanvas.height;

  // 🔥 CHANGE HERE
  maskBuffer = new Uint8Array(maskWidth * maskHeight);

  if (image) drawImage();
}



  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // ======================================================
  // BUILD KERNEL
  // ======================================================

  function buildBrushKernel() {

    const radius = Math.floor(brushSize / 2);
    const radiusSq = radius * radius;

    const hardness = Math.min(0.99, Math.max(0.01, brushHardness));
    const k = 1 - hardness;

    let count = 0;

    for (let yy = -radius; yy <= radius; yy++) {
      for (let xx = -radius; xx <= radius; xx++) {
        if (xx * xx + yy * yy <= radiusSq) count++;
      }
    }

    kernelDX = new Int16Array(count);
    kernelDY = new Int16Array(count);
    kernelIntensity = new Uint8Array(count);
    kernelSize = count;

    let i = 0;

    for (let yy = -radius; yy <= radius; yy++) {
      for (let xx = -radius; xx <= radius; xx++) {

        const distSq = xx * xx + yy * yy;
        if (distSq > radiusSq) continue;

        const falloff = 1 - (distSq / radiusSq);
        


const intensity =
  brushOpacity *
  (falloff * (1 - k) + falloff * falloff * k);

kernelIntensity[i] = Math.floor(intensity * 255);



        kernelDX[i] = xx;
        kernelDY[i] = yy;
        i++;
      }
    }
  }

  buildBrushKernel();

  // ======================================================
  // DRAW IMAGE
  // ======================================================

  function drawImage() {

    baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);

    if (!image) return;

    const imgRatio = image.width / image.height;
    const canvasRatio = baseCanvas.width / baseCanvas.height;

    let drawWidth, drawHeight;

    if (imgRatio > canvasRatio) {
      drawWidth = baseCanvas.width * zoomLevel;
      drawHeight = drawWidth / imgRatio;
    } else {
      drawHeight = baseCanvas.height * zoomLevel;
      drawWidth = drawHeight * imgRatio;
    }

    const x = (baseCanvas.width - drawWidth) / 2 + offsetX;
    const y = (baseCanvas.height - drawHeight) / 2 + offsetY;

    baseCtx.drawImage(image, x, y, drawWidth, drawHeight);
  }





  // ======================================================
  // IMAGE UPLOAD
  // ======================================================




 uploadInput.addEventListener("change", function (e) {

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (event) {
    image = new Image();

image.onload = function () {
  zoomLevel = 1;
  offsetX = 0;
  offsetY = 0;

  drawImage();

  setRandomSubhead();
  setRandomBanner();

  const overlay = document.querySelector(".canvas-overlay");
  if (overlay) overlay.classList.add("hidden");

  canvasContainer.classList.add("photo-loaded");
};


    image.src = event.target.result;
  };

  reader.readAsDataURL(file);
});






  // ======================================================
  // MOUSE EVENTS
  // ======================================================

  maskCanvas.addEventListener("mousedown", function (e) {

    if (!image) return;
	 if (isApplying) return;
    isDrawing = true;

if (mode === "move") {

  const rect = maskCanvas.getBoundingClientRect();

  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  lastX = mouseX - offsetX;
  lastY = mouseY - offsetY;

  maskCanvas.style.cursor = "grabbing";
}


else {
      lastX = null;
      lastY = null;
    }
  });

maskCanvas.addEventListener("mousemove", function (e) {

  if (!image) return;
  if (isApplying) return;

    const rect = maskCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

if (previewCtx) {
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
}

 if (!isDrawing && mode !== "move" && previewCtx) {
  previewCtx.beginPath();
  previewCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
  previewCtx.strokeStyle = "rgba(255,255,255,0.6)";
  previewCtx.lineWidth = 1;
  previewCtx.stroke();
}


if (isDrawing && mode === "move") {

  const rect = maskCanvas.getBoundingClientRect();

  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  offsetX = mouseX - lastX;
  offsetY = mouseY - lastY;

  drawImage();
}



    if (isDrawing && (mode === "draw" || mode === "erase")) {

      if (lastX === null) {
        lastX = x;
        lastY = y;
      }

const dx = x - lastX;
const dy = y - lastY;

// Chebyshev distance (no sqrt)
const dist = Math.max(Math.abs(dx), Math.abs(dy));

const steps = Math.max(1, Math.floor(dist / (brushSize / 4)));

      const imgRatio = image.width / image.height;
      const canvasRatio = baseCanvas.width / baseCanvas.height;

      let drawWidth, drawHeight;

      if (imgRatio > canvasRatio) {
        drawWidth = baseCanvas.width * zoomLevel;
        drawHeight = drawWidth / imgRatio;
      } else {
        drawHeight = baseCanvas.height * zoomLevel;
        drawWidth = drawHeight * imgRatio;
      }

      const imageDrawX = (baseCanvas.width - drawWidth) / 2 + offsetX;
      const imageDrawY = (baseCanvas.height - drawHeight) / 2 + offsetY;





for (let s = 0; s <= steps; s++) {

  const t = s / steps;
  const ix = lastX + dx * t;
  const iy = lastY + dy * t;

  for (let i = 0; i < kernelSize; i++) {

    const px = Math.floor(ix + kernelDX[i] - imageDrawX);
    const py = Math.floor(iy + kernelDY[i] - imageDrawY);

    if (px < 0 || py < 0 || px >= maskWidth || py >= maskHeight)
      continue;


dirtyMinX = Math.min(dirtyMinX, px);
dirtyMinY = Math.min(dirtyMinY, py);
dirtyMaxX = Math.max(dirtyMaxX, px);
dirtyMaxY = Math.max(dirtyMaxY, py);



    const index = py * maskWidth + px;

const value = kernelIntensity[i];

if (mode === "erase") {
  maskBuffer[index] =
    Math.max(0, maskBuffer[index] - value);
} else {
  maskBuffer[index] =
    Math.min(255, maskBuffer[index] + value);
}

  }
}

// 👇 ADD THIS
renderMaskPreview();



lastX = x;
lastY = y;

    }
  });

  maskCanvas.addEventListener("mouseup", function () {
    isDrawing = false;
    lastX = lastY = null;
    if (mode === "move") maskCanvas.style.cursor = "grab";
  });




maskCanvas.addEventListener("mouseleave", function () {
  isDrawing = false;
  lastX = lastY = null;

  if (previewCtx) {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  }
});




  // ======================================================
  // MODE BUTTONS
  // ======================================================


// Get erase button first (so setMode can use it)
const eraseBtn = document.getElementById("eraseBtn");

function setMode(newMode) {
  mode = newMode;

  // Remove active from all
  drawBtn.classList.remove("active");
  moveBtn.classList.remove("active");
  if (eraseBtn) eraseBtn.classList.remove("active");

  // Set active on selected
  if (newMode === "draw") {
    drawBtn.classList.add("active");
    maskCanvas.style.cursor = "crosshair";
  }

  if (newMode === "move") {
    moveBtn.classList.add("active");
    maskCanvas.style.cursor = "grab";
  }

  if (newMode === "erase" && eraseBtn) {
    eraseBtn.classList.add("active");
    maskCanvas.style.cursor = "crosshair";
  }
}

// Button listeners now call setMode (no duplicate logic)
drawBtn.addEventListener("click", () => setMode("draw"));
moveBtn.addEventListener("click", () => setMode("move"));

if (eraseBtn) {
  eraseBtn.addEventListener("click", () => setMode("erase"));
}

// Set default mode on load
setMode("draw");







  // ======================================================
  // SLIDERS
  // ======================================================

  brushSlider.addEventListener("input", e => {
    brushSize = parseInt(e.target.value);
    buildBrushKernel();
  });

  zoomSlider.addEventListener("input", e => {
    targetZoom = parseFloat(e.target.value);
    zoomLevel = targetZoom;
    drawImage();
  });

  // ======================================================
  // APPLY
  // ======================================================




applyBtn.addEventListener("click", function () {

  if (!pixelWorker) {
    console.error("Pixel worker unavailable.");
    return;
  }

  if (!image) return;
  if (dirtyMinX === Infinity) return;
  if (isApplying) return;



historyStack.push(
  baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height)
);

if (historyStack.length > MAX_HISTORY) {
  historyStack.shift();
}

  redoStack = [];

  const baseData = baseCtx.getImageData(
    0,
    0,
    baseCanvas.width,
    baseCanvas.height
  );

  applyBtn.disabled = true;   // 👈 RIGHT HERE
  isApplying = true;

  pixelWorker.postMessage(
    {
      buffer: baseData.data.buffer,
      maskBuffer: maskBuffer.buffer,
      width: baseCanvas.width,
      height: baseCanvas.height,
      pixelSize: 20,
      dirtyMinX,
      dirtyMinY,
      dirtyMaxX,
      dirtyMaxY
    },
    [
      baseData.data.buffer,
      maskBuffer.buffer
    ]
  );
});






  // ======================================================
  // UNDO
  // ======================================================

  document.addEventListener("keydown", function (e) {

    if ((e.ctrlKey || e.metaKey) && e.key === "z") {

      if (historyStack.length === 0) return;

      const previous = historyStack.pop();
      redoStack.push(
        baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height)
      );

      baseCtx.putImageData(previous, 0, 0);
    }
  });

});