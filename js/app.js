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
const pixelSlider = document.getElementById("pixelSlider");
const uploadInput = document.getElementById("uploadInput");
const drawBtn = document.getElementById("drawBtn");
const moveBtn = document.getElementById("moveBtn");
const eraseBtn = document.getElementById("eraseBtn");
const canvasSelectBtn = document.getElementById("canvasSelectBtn");
const undoBtn = document.getElementById("undoBtn");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const shareBtn = document.getElementById("shareBtn");


if (shareBtn) {
  shareBtn.addEventListener("click", async () => {

if (!navigator.share) {
  const link = document.createElement("a");
  link.download = "pixelated.png";
  link.href = baseCanvas.toDataURL();
  link.click();
  return;
}

    try {

      const blob = await new Promise(resolve => {
        baseCanvas.toBlob(resolve, "image/png");
      });

      const file = new File([blob], "pixelated.png", { type: "image/png" });

await navigator.share({
  files: [file],
  title: "Tastefully Pixelated",
  text: "Tastefully pixelated 😎"
});

    } catch (err) {
      console.error("Share failed:", err);
    }
  });
}

// 🔎 DEBUG — check button bindings
console.log("drawBtn:", drawBtn);
console.log("moveBtn:", moveBtn);
console.log("eraseBtn:", eraseBtn);

console.log("undoBtn:", undoBtn);

// Safely wire Select Photo
if (canvasSelectBtn && uploadInput) {
  canvasSelectBtn.addEventListener("click", function () {
    uploadInput.click();
  });
} 

if (takePhotoBtn && uploadInput) {
  takePhotoBtn.addEventListener("click", function () {
    uploadInput.click();
  });
}

else {
  console.warn("Select photo elements missing.");
}



// ======================================================
// MASK PREVIEW RENDER
// ======================================================

function renderMaskPreview() {

  if (!image || !maskBuffer) return;

  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

  const scaleX = currentDrawWidth / image.width;
  const scaleY = currentDrawHeight / image.height;

  maskCtx.fillStyle = "white";

  for (let y = 0; y < maskHeight; y++) {
    for (let x = 0; x < maskWidth; x++) {

      const index = y * maskWidth + x;
      if (maskBuffer[index] === 0) continue;

      const canvasX = imageDrawX + x * scaleX;
      const canvasY = imageDrawY + y * scaleY;

      maskCtx.fillRect(canvasX, canvasY, scaleX, scaleY);
    }
  }
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

  if (!subhead) return;

  const random = subheadMessages[
    Math.floor(Math.random() * subheadMessages.length)
  ];

  subhead.textContent = random;
}


// ======================================================
// BANNER HEADLINE ROTATION
// ======================================================

const bannerHeadline = document.getElementById("bannerHeadline");

const bannerMessages = [
  "Advertise useless crap",
  "Buy, buy, buy!",
  "Sell stuff no one needs.",
  "Buy this shiny thing.",
  "A thing to buy goes here.",
  "Buy more stuff!",
  "Buy!",
  "Uh, spend money here",
  "Spend!"
];

function setRandomBanner() {

  if (!bannerHeadline) return;

  const randomIndex = Math.floor(Math.random() * bannerMessages.length);
  const randomHeadline = bannerMessages[randomIndex];

  bannerHeadline.textContent = randomHeadline;

  bannerHeadline.classList.remove("animate");

  setTimeout(() => {
    bannerHeadline.classList.add("animate");
  }, 10);
}



setRandomSubhead();
setRandomBanner();


  // ======================================================
  // STATE
  // ======================================================

  let image = null;

let originalImageData = null;



let imageDrawX = 0;
let imageDrawY = 0;

let currentDrawWidth = 0;
let currentDrawHeight = 0;

  let zoomLevel = 1;
  let targetZoom = 1;
  let offsetX = 0;
  let offsetY = 0;

  let isDrawing = false;
  let mode = "draw";

  let isApplying = false;

  let lastX = null;
  let lastY = null;
let startDragX = 0;
let startDragY = 0;
let startOffsetX = 0;
let startOffsetY = 0;

  let brushSize = 40;
let pixelSize = 12; // match slider default




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
let applyVersion = 0;



// ======================================================
// WEB WORKER
// ======================================================

let pixelWorker = null;

try {

  pixelWorker = new Worker("js/pixelWorker.js");

  pixelWorker.onmessage = function (e) {

  const { buffer, version } = e.data;

  if (version !== applyVersion) return;

const imageData = new ImageData(
  new Uint8ClampedArray(buffer),
  e.data.width,
  e.data.height
);


    // Draw processed image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;

    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imageData, 0, 0);

    // Replace image reference (bakes pixels in)
    image = tempCanvas;
    drawImage();

     maskBuffer = new Uint8Array(maskWidth * maskHeight);

    dirtyMinX = Infinity;
    dirtyMinY = Infinity;
    dirtyMaxX = -Infinity;
    dirtyMaxY = -Infinity;

    // Clear visible mask strokes
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Re-enable Apply button
    isApplying = false;
    applyBtn.disabled = false;
  };

} catch (err) {

  console.error("Worker failed to initialize:", err);

  // Fail gracefully — app still runs without Apply
  pixelWorker = null;
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

  if (image) {
    drawImage();
  }
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);



 // ======================================================
// BUILD KERNEL
// ======================================================

function buildBrushKernel() {

  const radius = Math.floor(brushSize / 2);
  const radiusSq = radius * radius;

  let count = 0;

  // Count pixels inside circle
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

      kernelDX[i] = xx;
      kernelDY[i] = yy;

      // 🔥 Fully opaque, hard brush
      kernelIntensity[i] = 255;

      i++;
    }
  }
}

buildBrushKernel();

function updateBrushCursor() {

  if (mode !== "draw") return;
  if (!image || currentDrawWidth === 0) return;

  // Match preview brush scaling exactly
  const previewRadius = (brushSize / 2) * (currentDrawWidth / image.width);
  const size = Math.max(4, previewRadius * 2); // prevent 0 size

  // Clamp only for browser cursor limits
  const MAX_CURSOR_SIZE = 96;
  const finalSize = Math.min(size, MAX_CURSOR_SIZE);
  const radius = finalSize / 2;

  const cursorCanvas = document.createElement("canvas");
  cursorCanvas.width = finalSize;
  cursorCanvas.height = finalSize;

  const ctx = cursorCanvas.getContext("2d");

  ctx.beginPath();
  ctx.arc(radius, radius, radius - 1, 0, Math.PI * 2);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();

  const dataURL = cursorCanvas.toDataURL();

  maskCanvas.style.cursor = `url(${dataURL}) ${radius} ${radius}, crosshair`;
}



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

  imageDrawX = (baseCanvas.width - drawWidth) / 2 + offsetX;
  imageDrawY = (baseCanvas.height - drawHeight) / 2 + offsetY;

  currentDrawWidth = drawWidth;
  currentDrawHeight = drawHeight;

  baseCtx.drawImage(image, imageDrawX, imageDrawY, drawWidth, drawHeight);

  // 🔥 Re-render mask preview so it follows zoom/move
  renderMaskPreview();
}






// ======================================================
// IMAGE UPLOAD
// ======================================================

if (uploadInput) {

  uploadInput.addEventListener("change", function (e) {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {

      image = new Image();

      image.onload = function () {

resizeCanvas();

offsetX = 0;
offsetY = 0;

drawImage();

        // Store original image pixels for erase restore
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;

        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(image, 0, 0);

        originalImageData = tempCtx.getImageData(
          0,
          0,
          image.width,
          image.height
        );

        maskWidth = image.width;
        maskHeight = image.height;
        maskBuffer = new Uint8Array(maskWidth * maskHeight);

        dirtyMinX = Infinity;
        dirtyMinY = Infinity;
        dirtyMaxX = -Infinity;
        dirtyMaxY = -Infinity;

        // UI updates AFTER image fully loads
        if (typeof setRandomSubhead === "function") {
          setRandomSubhead();
        }

        if (typeof setRandomBanner === "function") {
          setRandomBanner();
        }

        const overlay = document.querySelector(".canvas-overlay");
        if (overlay) overlay.classList.add("hidden");

        if (canvasContainer) {
          canvasContainer.classList.add("photo-loaded");
        }
      };

      image.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });

}



// ======================================================
// POINTER DOWN
// ======================================================

maskCanvas.addEventListener("pointerdown", function (e) {

  if (!image) return;
  if (isApplying) return;

  e.preventDefault();
  maskCanvas.setPointerCapture(e.pointerId);

  isDrawing = true;

  const rect = maskCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // MOVE MODE
  if (mode === "move") {

    startDragX = x;
    startDragY = y;

    startOffsetX = offsetX;
    startOffsetY = offsetY;

    maskCanvas.style.cursor = "grabbing";
    return;
  }

  lastX = x;
  lastY = y;
});


// ======================================================
// POINTER MOVE
// ======================================================

maskCanvas.addEventListener("pointermove", function (e) {

  if (!isDrawing) return;
  if (!image) return;
  if (isApplying) return;

  e.preventDefault();

  const rect = maskCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // MOVE MODE
  if (mode === "move") {

    const dx = x - startDragX;
    const dy = y - startDragY;

    offsetX = startOffsetX + dx;
    offsetY = startOffsetY + dy;

    drawImage();
    return;
  }

  // DRAW MODE
  if (mode === "draw") {

    if (!image || currentDrawWidth === 0 || currentDrawHeight === 0) {
      return;
    }

    if (lastX === null) {
      lastX = x;
      lastY = y;
    }

    const dx = x - lastX;
    const dy = y - lastY;
    const dist = Math.max(Math.abs(dx), Math.abs(dy));

    const previewRadius =
      (brushSize / 2) * (currentDrawWidth / image.width);

    const imageBrushRadius =
      (brushSize / 2) * (image.width / currentDrawWidth);

    const steps = Math.max(1, Math.floor(dist / (previewRadius / 2)));

    const scaleX = image.width / currentDrawWidth;
    const scaleY = image.height / currentDrawHeight;

    for (let s = 0; s <= steps; s++) {

      const t = s / steps;
      const ix = lastX + dx * t;
      const iy = lastY + dy * t;

      for (let i = 0; i < kernelSize; i++) {

        const canvasX =
          ix + kernelDX[i] * (brushSize / (imageBrushRadius * 2));

        const canvasY =
          iy + kernelDY[i] * (brushSize / (imageBrushRadius * 2));

        if (
          canvasX < imageDrawX ||
          canvasY < imageDrawY ||
          canvasX > imageDrawX + currentDrawWidth ||
          canvasY > imageDrawY + currentDrawHeight
        ) continue;

        const imgX = (canvasX - imageDrawX) * scaleX;
        const imgY = (canvasY - imageDrawY) * scaleY;

        const px = Math.floor(imgX);
        const py = Math.floor(imgY);

        if (px < 0 || py < 0 || px >= maskWidth || py >= maskHeight)
          continue;

        const index = py * maskWidth + px;

        maskBuffer[index] = 255;

        dirtyMinX = Math.min(dirtyMinX, px);
        dirtyMinY = Math.min(dirtyMinY, py);
        dirtyMaxX = Math.max(dirtyMaxX, px);
        dirtyMaxY = Math.max(dirtyMaxY, py);
      }
    }

    lastX = x;
    lastY = y;

    drawImage();
  }
});


// ======================================================
// POINTER UP
// ======================================================

maskCanvas.addEventListener("pointerup", function (e) {
  e.preventDefault();
  maskCanvas.releasePointerCapture(e.pointerId);
  stopDrawing();
});



// ======================================================
// STOP DRAWING
// ======================================================

function stopDrawing() {

  isDrawing = false;
  lastX = null;
  lastY = null;



 if (mode === "move") {
  maskCanvas.style.cursor = "grab";
} else if (mode === "draw") {
  updateBrushCursor();
}


  if (previewCtx) {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  }
}


// ======================================================
// MODE BUTTONS
// ======================================================
function setMode(newMode) {

  mode = newMode;

  // Reset all button states
  drawBtn.classList.remove("active");
  moveBtn.classList.remove("active");

  if (newMode === "draw") {
    drawBtn.classList.add("active");
    updateBrushCursor();
  }

  if (newMode === "move") {
    moveBtn.classList.add("active");
    maskCanvas.style.cursor = "grab";
  }

}

drawBtn.addEventListener("click", () => setMode("draw"));
moveBtn.addEventListener("click", () => setMode("move"));

setMode("draw");








  // ======================================================
  // SLIDERS
  // ======================================================

if (brushSlider) {
  brushSlider.addEventListener("input", e => {
    brushSize = parseInt(e.target.value);
    buildBrushKernel();
    updateBrushCursor();
  });
}


pixelSlider.addEventListener("input", e => {
  pixelSize = parseInt(e.target.value);
});


zoomSlider.addEventListener("input", function (e) {
  zoomLevel = parseFloat(e.target.value);

  offsetX = 0;
  offsetY = 0;

  drawImage();
});







 // ======================================================
// APPLY
// ======================================================

function reapplyPixelation() {
  // In additive mode, reapply should just behave like Apply
  // if there's an active mask region.
  if (dirtyMinX === Infinity) return;
  applyBtn.click();
}

applyBtn.addEventListener("click", function () {

  if (!pixelWorker) {
    console.error("Pixel worker unavailable.");
    return;
  }

  if (!image) return;
  if (dirtyMinX === Infinity) return;
  if (isApplying) return;

 
  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

  // Create image-space canvas from CURRENT image (additive)
  const imageCanvas = document.createElement("canvas");
  imageCanvas.width = image.width;
  imageCanvas.height = image.height;

  const imageCtx = imageCanvas.getContext("2d");
  imageCtx.drawImage(image, 0, 0); // ← additive (NOT originalImageData)

const snapshot = imageCtx.getImageData(0, 0, image.width, image.height);

// CLONE the data so worker can't mutate it later
const cloned = new ImageData(
  new Uint8ClampedArray(snapshot.data),
  snapshot.width,
  snapshot.height
);

historyStack.push(cloned);

  if (historyStack.length > MAX_HISTORY) {
    historyStack.shift();
  }

  redoStack = [];

  // Get base image data for worker
  const baseData = imageCtx.getImageData(
    0,
    0,
    image.width,
    image.height
  );



applyVersion++;
const currentVersion = applyVersion;


  applyBtn.disabled = true;
  isApplying = true;

pixelWorker.postMessage(
  {
    buffer: baseData.data.buffer,
    maskBuffer: maskBuffer.buffer,
    width: image.width,
    height: image.height,
    pixelSize: pixelSize,
    dirtyMinX,
    dirtyMinY,
    dirtyMaxX,
    dirtyMaxY,
    version: currentVersion
  },
  [baseData.data.buffer]
);


});






// ======================================================
// UNDO
// ======================================================

function performUndo() {

  if (historyStack.length === 0) return;

  applyVersion++; // invalidate any in-flight worker

  const previous = historyStack.pop();

  // Save current for redo
  const currentCanvas = document.createElement("canvas");
  currentCanvas.width = image.width;
  currentCanvas.height = image.height;

  const currentCtx = currentCanvas.getContext("2d");
  currentCtx.drawImage(image, 0, 0);

  redoStack.push(
    currentCtx.getImageData(0, 0, image.width, image.height)
  );

  // Restore previous state
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = previous.width;
  tempCanvas.height = previous.height;

  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.putImageData(previous, 0, 0);

  image = tempCanvas;

  drawImage();

  maskBuffer = new Uint8Array(maskWidth * maskHeight);
  dirtyMinX = Infinity;
  dirtyMinY = Infinity;
  dirtyMaxX = -Infinity;
  dirtyMaxY = -Infinity;
  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
}

// Keyboard shortcut
document.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    performUndo();
  }
});

// Undo button
if (undoBtn) {
  undoBtn.addEventListener("click", performUndo);
}

});


// end DOMContentLoaded



// ======================================================
// SERVICE WORKER
// ======================================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
}
