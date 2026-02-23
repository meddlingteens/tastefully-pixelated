document.addEventListener("DOMContentLoaded", function () {

  /* ================================
     TEXT ROTATION
  ================================= */

  const subhead = document.getElementById("subhead");
  const bannerHeadline = document.getElementById("bannerHeadline");

  const subheadLines = [
    "Seriously, that's gross.",
    "Don't be fickle, apply a pixel.",
    "Ain't no one wanna see that."
  ];

  const bannerLines = [
    "Shop mofo. Buy, buy, buy",
    "This is where you can advertise your useless crap",
    "What the world really needs is more advertising"
  ];

  if (subhead) {
    subhead.textContent =
      subheadLines[Math.floor(Math.random() * subheadLines.length)];
  }

  if (bannerHeadline) {
    bannerHeadline.textContent =
      bannerLines[Math.floor(Math.random() * bannerLines.length)];
  }

  /* ================================
     CANVAS SETUP
  ================================= */

  const previewCanvas = document.getElementById("blurCanvas");
  const previewCtx = previewCanvas.getContext("2d");

  const baseCanvas = document.getElementById("baseCanvas");
  const maskCanvas = document.getElementById("maskCanvas");

  const baseCtx = baseCanvas.getContext("2d");
  const maskCtx = maskCanvas.getContext("2d");

  const canvasContainer = document.getElementById("canvasContainer");
  const overlay = document.getElementById("canvasOverlay");
  const selectBtn = document.getElementById("canvasSelectBtn");
  const photoInput = document.getElementById("photoInput");

  const brushSlider = document.getElementById("brushSlider");
  const pixelSlider = document.getElementById("pixelSlider");
  const zoomSlider = document.getElementById("zoomSlider");

  const drawBtn = document.getElementById("drawBtn");
  const moveBtn = document.getElementById("moveBtn");
  const applyBtn = document.getElementById("applyBtn");
  const revertBtn = document.getElementById("revertBtn");

  let image = null;
  let originalImage = null;

  let isDrawing = false;
  let mode = "draw";

  let brushSize = parseInt(brushSlider.value);


	let brushOpacity = 1;      // 0–1
	let brushHardness = 1;     // 0–1




  let pixelSize = parseInt(pixelSlider.value);
  let zoomLevel = parseFloat(zoomSlider.value);

  let offsetX = 0;
  let offsetY = 0;
  let startX = 0;
  let startY = 0;

/* NEW STATE */
let lastX = null;
let lastY = null;
let historyStack = [];
let redoStack = [];
const MAX_HISTORY = 20;

let maskBuffer = null;
let maskWidth = 0;
let maskHeight = 0;


function undo() {
  if (historyStack.length === 0) return;

  const current = baseCtx.getImageData(
    0, 0, baseCanvas.width, baseCanvas.height
  );

  redoStack.push(current);

  const previous = historyStack.pop();
  baseCtx.putImageData(previous, 0, 0);
}



function redo() {
  if (redoStack.length === 0) return;

  const current = baseCtx.getImageData(
    0, 0, baseCanvas.width, baseCanvas.height
  );

  historyStack.push(current);

  const next = redoStack.pop();
  baseCtx.putImageData(next, 0, 0);
}




document.addEventListener("keydown", function (e) {

  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
    undo();
  }

  if ((e.ctrlKey || e.metaKey) &&
      (e.key === "Z" || (e.shiftKey && e.key === "z"))) {
    redo();
  }
});





  /* ================================
   RESIZE
================================ */

function resizeCanvas() {
  const rect = canvasContainer.getBoundingClientRect();

  baseCanvas.width = rect.width;
  baseCanvas.height = rect.height;

maskWidth = rect.width;
maskHeight = rect.height;
maskBuffer = new Float32Array(maskWidth * maskHeight);

  maskCanvas.width = rect.width;
  maskCanvas.height = rect.height;




  previewCanvas.width = rect.width;
  previewCanvas.height = rect.height;

  if (image) drawImage();
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);



  /* ================================
     IMAGE LOAD
  ================================= */

  selectBtn.addEventListener("click", () => photoInput.click());

  photoInput.addEventListener("change", function (e) {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (evt) {

      image = new Image();

image.onload = function () {

  overlay.classList.add("hidden");
  canvasContainer.classList.add("photo-loaded");

  offsetX = 0;
  offsetY = 0;
  zoomLevel = 1;
  zoomSlider.value = 1;

  originalImage = image;
  drawImage();
};





      image.src = evt.target.result;
    };

    reader.readAsDataURL(file);
  });

  function drawImage() {

    baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);

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







/* ================================
   DRAW / MOVE
================================ */

maskCanvas.addEventListener("mousemove", function (e) {

  if (!image) return;

  const rect = maskCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // --- PREVIEW LAYER ---
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  if (!isDrawing && mode === "draw") {
    previewCtx.beginPath();
    previewCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    previewCtx.strokeStyle = "rgba(255,255,255,0.6)";
    previewCtx.lineWidth = 1;
    previewCtx.stroke();
  }

  // --- SMOOTH DRAW ---
  if (isDrawing && (mode === "draw" || mode === "erase")) {

    if (lastX === null) {
      lastX = x;
      lastY = y;
    }

    const deltaX = x - lastX;
    const deltaY = y - lastY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const steps = Math.max(1, Math.floor(distance / (brushSize / 4)));

    for (let i = 0; i <= steps; i++) {

      const t = i / steps;
      const ix = lastX + deltaX * t;
      const iy = lastY + deltaY * t;

      const radius = Math.floor(brushSize / 2);

      for (let yy = -radius; yy <= radius; yy++) {
        for (let xx = -radius; xx <= radius; xx++) {

          const dist = Math.sqrt(xx * xx + yy * yy);
          if (dist > radius) continue;

          const px = Math.floor(ix + xx);
          const py = Math.floor(iy + yy);

          if (px < 0 || py < 0 || px >= maskWidth || py >= maskHeight)
            continue;

          const index = py * maskWidth + px;

          const falloff = 1 - (dist / radius);
          const hardness = Math.min(0.99, Math.max(0.01, brushHardness));
          const intensity =
            brushOpacity * Math.pow(falloff, 1 - hardness);

          if (mode === "erase") {
            maskBuffer[index] =
              Math.max(0, maskBuffer[index] - intensity);
          } else {
            maskBuffer[index] =
              Math.min(1, maskBuffer[index] + intensity);
          }
        }
      }
    }

    lastX = x;
    lastY = y;
  }

  // --- MOVE MODE ---
  if (isDrawing && mode === "move") {
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    drawImage();
  }

}); 



/* ================================
   APPLY PIXELATION (Optimized + Buffer)
================================ */

applyBtn.addEventListener("click", function () {

  if (!image) return;

  // --- Save history BEFORE modifying ---
  historyStack.push(
    baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height)
  );

  if (historyStack.length > MAX_HISTORY) {
    historyStack.shift();
  }

  redoStack = [];

  const width = baseCanvas.width;
  const height = baseCanvas.height;

  const baseData = baseCtx.getImageData(0, 0, width, height);
  const data = baseData.data;

  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {

      const blockWidth = Math.min(pixelSize, width - x);
      const blockHeight = Math.min(pixelSize, height - y);

      const alpha = maskBuffer[y * width + x];
      if (alpha <= 0) continue;

      let r = 0, g = 0, b = 0, count = 0;

      // --- Average block ---
      for (let yy = 0; yy < blockHeight; yy++) {

        const rowIndex = (y + yy) * width * 4;

        for (let xx = 0; xx < blockWidth; xx++) {

          const px = rowIndex + (x + xx) * 4;

          r += data[px];
          g += data[px + 1];
          b += data[px + 2];
          count++;
        }
      }

      r /= count;
      g /= count;
      b /= count;

      // --- Blend block ---
      for (let yy = 0; yy < blockHeight; yy++) {

        const rowIndex = (y + yy) * width * 4;

        for (let xx = 0; xx < blockWidth; xx++) {

          const px = rowIndex + (x + xx) * 4;

          data[px]     = data[px]     * (1 - alpha) + r * alpha;
          data[px + 1] = data[px + 1] * (1 - alpha) + g * alpha;
          data[px + 2] = data[px + 2] * (1 - alpha) + b * alpha;
        }
      }
    }
  }

  baseCtx.putImageData(baseData, 0, 0);

  // Clear mask buffer
  maskBuffer.fill(0);

});


  /* ================================
     REVERT (FIXED + STABLE)
  ================================= */

  if (revertBtn) {

    revertBtn.addEventListener("click", function () {

      if (!originalImage) return;

      offsetX = 0;
      offsetY = 0;
      zoomLevel = 1;
      zoomSlider.value = 1;

      image = originalImage;

      drawImage();

      revertBtn.classList.add("active");
      setTimeout(() => revertBtn.classList.remove("active"), 300);
    });
  }

  /* ================================
     SLIDERS
  ================================= */

  brushSlider.addEventListener("input", e => {
    brushSize = parseInt(e.target.value);
  });

  pixelSlider.addEventListener("input", e => {
    pixelSize = parseInt(e.target.value);
  });





let targetZoom = zoomLevel;
let zoomAnimating = false;



zoomSlider.addEventListener("input", function (e) {

  if (!image) return;

  targetZoom = parseFloat(e.target.value);

  if (!zoomAnimating) {
    zoomAnimating = true;
    requestAnimationFrame(animateZoom);
  }
});






function animateZoom() {
  const diff = targetZoom - zoomLevel;

  if (Math.abs(diff) < 0.001) {
    zoomLevel = targetZoom;
    zoomAnimating = false;
    drawImage();
    return;
  }

  zoomLevel += diff * 0.15; // smoothing factor
  drawImage();
  requestAnimationFrame(animateZoom);
}






  /* ================================
     MODE
  ================================= */





  drawBtn.addEventListener("click", function () {
  mode = "draw";

  drawBtn.classList.add("active");
  moveBtn.classList.remove("active");

  maskCanvas.style.cursor = image ? "crosshair" : "default";
});

moveBtn.addEventListener("click", function () {
  mode = "move";

  moveBtn.classList.add("active");
  drawBtn.classList.remove("active");

  maskCanvas.style.cursor = image ? "grab" : "default";
});

});