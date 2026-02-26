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

  if (!maskCtx || !maskBuffer || !image) return;

  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = maskWidth;
  tempCanvas.height = maskHeight;

  const tempCtx = tempCanvas.getContext("2d");
  const imageData = tempCtx.createImageData(maskWidth, maskHeight);
  const data = imageData.data;

  for (let i = 0; i < maskBuffer.length; i++) {
    const alpha = maskBuffer[i];
    const idx = i * 4;

    data[idx]     = 255;
    data[idx + 1] = 255;
    data[idx + 2] = 255;
    data[idx + 3] = alpha;
  }

  tempCtx.putImageData(imageData, 0, 0);

 
  
maskCtx.drawImage(
  tempCanvas,
  imageDrawX,
  imageDrawY,
  currentDrawWidth,
  currentDrawHeight
);


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

  pixelWorker = new Worker("pixelWorker.js");

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
  zoomLevel = 1;
  offsetX = 0;
  offsetY = 0;


maskWidth = image.width;
maskHeight = image.height;
maskBuffer = new Uint8Array(maskWidth * maskHeight);

dirtyMinX = Infinity;
dirtyMinY = Infinity;
dirtyMaxX = -Infinity;
dirtyMaxY = -Infinity;






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

  } else {

    // Always initialize in canvas space
    lastX = mouseX;
    lastY = mouseY;

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

  console.log("DRAW BLOCK RUNNING");

  if (!image || currentDrawWidth === 0 || currentDrawHeight === 0) {
    console.log("Guard exit:",
      "image:", !!image,
      "currentDrawWidth:", currentDrawWidth,
      "currentDrawHeight:", currentDrawHeight
    );
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

  for (let s = 0; s <= steps; s++) {

    const t = s / steps;
    const ix = lastX + dx * t;
    const iy = lastY + dy * t;

    for (let i = 0; i < kernelSize; i++) {

      const px = Math.floor(ix + kernelDX[i]);
      const py = Math.floor(iy + kernelDY[i]);

      if (px < 0 || py < 0 || px >= maskWidth || py >= maskHeight)
        continue;

      dirtyMinX = Math.min(dirtyMinX, px);
      dirtyMinY = Math.min(dirtyMinY, py);
      dirtyMaxX = Math.max(dirtyMaxX, px);
      dirtyMaxY = Math.max(dirtyMaxY, py);

      const index = py * maskWidth + px;
      const value = kernelIntensity[i];

      if (mode === "erase") {
        maskBuffer[index] = Math.max(0, maskBuffer[index] - value);
      } else {
        maskBuffer[index] = Math.min(255, maskBuffer[index] + value);
      }
    }
  }

  console.log("dirtyMinX:", dirtyMinX);

  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  renderMaskPreview();

  lastX = x;
  lastY = y;
}

});

function stopDrawing() {
  isDrawing = false;
  lastX = null;
  lastY = null;

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