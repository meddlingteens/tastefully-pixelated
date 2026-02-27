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
const eraseBtn = document.getElementById("eraseBtn");
const canvasSelectBtn = document.getElementById("canvasSelectBtn");



// 🔎 DEBUG — check button bindings
console.log("drawBtn:", drawBtn);
console.log("moveBtn:", moveBtn);
console.log("eraseBtn:", eraseBtn);



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
  // Preview is drawn live during drawing.
  // No reconstruction from maskBuffer.
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


setRandomSubhead();
setRandomBanner();


  // ======================================================
  // STATE
  // ======================================================

  let image = null;

let originalImageData = null;

let eraseWorkingCanvas = null;
let eraseWorkingCtx = null;
let eraseWorkingImageData = null;

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

  pixelWorker = new Worker("js/pixelWorker.js");

  pixelWorker.onmessage = function (e) {

    const { buffer } = e.data;

    // Rebuild ImageData from worker buffer
const imageData = new ImageData(
  new Uint8ClampedArray(buffer),
  image.width,
  image.height
);

    // Draw processed image
const tempCanvas = document.createElement("canvas");
tempCanvas.width = image.width;
tempCanvas.height = image.height;

const tempCtx = tempCanvas.getContext("2d");
tempCtx.putImageData(imageData, 0, 0);

// Instead of replacing image object,
// draw directly into base canvas and preserve state
image = tempCanvas;
drawImage();



    // Clear mask preview layer
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Reset mask buffer
    maskBuffer = new Uint8Array(maskWidth * maskHeight);

    // Reset dirty bounds (CRITICAL for stable draw behavior)
    dirtyMinX = Infinity;
    dirtyMinY = Infinity;
    dirtyMaxX = -Infinity;
    dirtyMaxY = -Infinity;

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
    renderMaskPreview();
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

      resizeCanvas();
      drawImage();

      // 🔥 Store original image pixels for erase restore
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

  console.log("MOUSEDOWN FIRED");

  if (!image) {
    console.log("EXIT: image is falsy");
    return;
  }

  if (isApplying) {
    console.log("EXIT: isApplying is true");
    return;
  }

  console.log("Mode at mousedown:", mode);

  isDrawing = true;
  console.log("isDrawing set to:", isDrawing);

  const rect = maskCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  console.log("Mouse position:", mouseX, mouseY);

  if (mode === "move") {

    lastX = mouseX - offsetX;
    lastY = mouseY - offsetY;

    console.log("Move start:", lastX, lastY);

    maskCanvas.style.cursor = "grabbing";

  } 

else {

// Reset dirty bounds for new stroke
dirtyMinX = Infinity;
dirtyMinY = Infinity;
dirtyMaxX = -Infinity;
dirtyMaxY = -Infinity;

// Always initialize in canvas space
lastX = mouseX;
lastY = mouseY;


if (mode === "erase") {

  eraseWorkingCanvas = document.createElement("canvas");
  eraseWorkingCanvas.width = image.width;
  eraseWorkingCanvas.height = image.height;

  eraseWorkingCtx = eraseWorkingCanvas.getContext("2d");
  eraseWorkingCtx.drawImage(image, 0, 0);

  eraseWorkingImageData = eraseWorkingCtx.getImageData(
    0,
    0,
    image.width,
    image.height
  );
}



console.log("Draw start:", lastX, lastY);

maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);




  }



});


maskCanvas.addEventListener("mousemove", function (e) {

console.log("MOUSEMOVE", mode);
  if (!image) return;
  if (isApplying) return;

  const rect = maskCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Clear brush preview
  if (previewCtx) {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  }




  // Draw brush outline when not drawing
  if (!isDrawing && mode !== "move" && previewCtx) {
    previewCtx.beginPath();
    previewCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    previewCtx.strokeStyle = "rgba(255,255,255,0.6)";
    previewCtx.lineWidth = 1;
    previewCtx.stroke();
  }

  // MOVE MODE
  if (isDrawing && mode === "move") {

    const mouseX = x;
    const mouseY = y;

    offsetX = mouseX - lastX;
    offsetY = mouseY - lastY;

    drawImage();
    renderMaskPreview();

    return;
  }

 





// DRAW / ERASE MODE
if (isDrawing && (mode === "draw" || mode === "erase")) {

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
  const steps = Math.max(1, Math.floor(dist / (brushSize / 4)));

  const scaleX = image.width / currentDrawWidth;
  const scaleY = image.height / currentDrawHeight;

  for (let s = 0; s <= steps; s++) {

    const t = s / steps;
    const ix = lastX + dx * t;
    const iy = lastY + dy * t;

    // ---- Preview (always white brush) ----
    maskCtx.globalCompositeOperation = (mode === "erase")
      ? "destination-out"
      : "source-over";

    maskCtx.fillStyle = "white";
    maskCtx.beginPath();
    maskCtx.arc(ix, iy, brushSize / 2, 0, Math.PI * 2);
    maskCtx.fill();

    maskCtx.globalCompositeOperation = "source-over";

    for (let i = 0; i < kernelSize; i++) {

      const canvasX = ix + kernelDX[i];
      const canvasY = iy + kernelDY[i];

      if (
        canvasX < imageDrawX ||
        canvasY < imageDrawY ||
        canvasX > imageDrawX + currentDrawWidth ||
        canvasY > imageDrawY + currentDrawHeight
      ) {
        continue;
      }

      const imgX = (canvasX - imageDrawX) * scaleX;
      const imgY = (canvasY - imageDrawY) * scaleY;

      const px = Math.floor(imgX);
      const py = Math.floor(imgY);

      if (px < 0 || py < 0 || px >= maskWidth || py >= maskHeight)
        continue;

      const index = py * maskWidth + px;

      if (mode === "erase") {

  maskBuffer[index] = 0;




  const pixelIndex = (py * image.width + px) * 4;

eraseWorkingImageData.data[pixelIndex]     = originalImageData.data[pixelIndex];
eraseWorkingImageData.data[pixelIndex + 1] = originalImageData.data[pixelIndex + 1];
eraseWorkingImageData.data[pixelIndex + 2] = originalImageData.data[pixelIndex + 2];
eraseWorkingImageData.data[pixelIndex + 3] = 255;

}






		else {

        maskBuffer[index] = 255;

        dirtyMinX = Math.min(dirtyMinX, px);
        dirtyMinY = Math.min(dirtyMinY, py);
        dirtyMaxX = Math.max(dirtyMaxX, px);
        dirtyMaxY = Math.max(dirtyMaxY, py);
      }
    }
  }

  // Commit erase changes once per stroke
  if (mode === "erase" && eraseWorkingImageData) {
  eraseWorkingCtx.putImageData(eraseWorkingImageData, 0, 0);
  image = eraseWorkingCanvas;
  drawImage();
}

});

function stopDrawing() {
  isDrawing = false;
  lastX = null;
  lastY = null;

eraseWorkingCanvas = null;
eraseWorkingCtx = null;
eraseWorkingImageData = null;

  if (mode === "move") {
    maskCanvas.style.cursor = "grab";
  }

  if (previewCtx) {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  }
}

maskCanvas.addEventListener("mouseup", stopDrawing);
maskCanvas.addEventListener("mouseleave", stopDrawing);

// 🔥 Critical addition
document.addEventListener("mouseup", stopDrawing);




// ======================================================
// MODE BUTTONS
// ======================================================

function setMode(newMode) {
  console.log("SET MODE CALLED:", newMode);

  mode = newMode;

  drawBtn.classList.remove("active");
  moveBtn.classList.remove("active");
  eraseBtn.classList.remove("active");

  if (newMode === "draw") drawBtn.classList.add("active");
  if (newMode === "move") moveBtn.classList.add("active");
  if (newMode === "erase") eraseBtn.classList.add("active");
}

// Set default mode on load
setMode("draw");

// 🔥 Attach listeners
drawBtn.addEventListener("click", () => setMode("draw"));
moveBtn.addEventListener("click", () => setMode("move"));
eraseBtn.addEventListener("click", () => setMode("erase"));




  // ======================================================
  // SLIDERS
  // ======================================================

  brushSlider.addEventListener("input", e => {
    brushSize = parseInt(e.target.value);
    buildBrushKernel();
  });

 zoomSlider.addEventListener("input", function (e) {
  zoomLevel = parseFloat(e.target.value);
  drawImage();
  renderMaskPreview();
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

  // Create image-space canvas ONCE
  const imageCanvas = document.createElement("canvas");
  imageCanvas.width = image.width;
  imageCanvas.height = image.height;

  const imageCtx = imageCanvas.getContext("2d");
  imageCtx.drawImage(image, 0, 0);

  // Save history (image-space)
  historyStack.push(
    imageCtx.getImageData(0, 0, image.width, image.height)
  );

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

  applyBtn.disabled = true;
  isApplying = true;

  pixelWorker.postMessage(
    {
      buffer: baseData.data.buffer,
      maskBuffer: maskBuffer.buffer,
      width: image.width,
      height: image.height,
      pixelSize: 20,
      dirtyMinX,
      dirtyMinY,
      dirtyMaxX,
      dirtyMaxY
    },
    [
      baseData.data.buffer
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

// Store redo in image-space
const imageCanvas = document.createElement("canvas");
imageCanvas.width = image.width;
imageCanvas.height = image.height;

const imageCtx = imageCanvas.getContext("2d");
imageCtx.drawImage(image, 0, 0);

redoStack.push(
  imageCtx.getImageData(0, 0, image.width, image.height)
);






const tempCanvas = document.createElement("canvas");
tempCanvas.width = image.width;
tempCanvas.height = image.height;

const tempCtx = tempCanvas.getContext("2d");
tempCtx.putImageData(previous, 0, 0);

image = tempCanvas;
drawImage();



    }
  });

});