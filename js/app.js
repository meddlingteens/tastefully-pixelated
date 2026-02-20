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

  const baseCanvas = document.getElementById("baseCanvas");
  const maskCanvas = document.getElementById("maskCanvas");
  const blurCanvas = document.getElementById("blurCanvas");

  const baseCtx = baseCanvas.getContext("2d");
  const maskCtx = maskCanvas.getContext("2d");
  const blurCtx = blurCanvas.getContext("2d");

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
  const restoreBtn = document.getElementById("restoreBtn");
  const revertBtn = document.getElementById("revertBtn");

  let image = null;
  let originalImageData = null;

  let isDrawing = false;
  let mode = "draw";

  let brushSize = parseInt(brushSlider.value);
  let pixelSize = parseInt(pixelSlider.value);
  let zoomLevel = parseFloat(zoomSlider.value);

  let offsetX = 0;
  let offsetY = 0;
  let startX, startY;

  /* ================================
     RESIZE
  ================================= */

  function resizeCanvas() {
    const rect = canvasContainer.getBoundingClientRect();

    [baseCanvas, maskCanvas, blurCanvas].forEach(c => {
      c.width = rect.width;
      c.height = rect.height;
    });

    if (image) drawImage();
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  /* ================================
     IMAGE LOAD
  ================================= */

  selectBtn.addEventListener("click", () => photoInput.click());

  photoInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      image = new Image();
      image.onload = function() {
        overlay.classList.add("hidden");
        offsetX = 0;
        offsetY = 0;
        zoomLevel = 1;
        zoomSlider.value = 1;
        drawImage();
        originalImageData =
          baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
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
     BRUSH PREVIEW + DRAW
  ================================= */

  maskCanvas.addEventListener("mousemove", function(e) {
    if (!image) return;

    const rect = maskCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    maskCtx.strokeStyle = "rgba(255,255,255,0.5)";
    maskCtx.lineWidth = 1;
    maskCtx.stroke();

    if (isDrawing && mode === "draw") {
      maskCtx.beginPath();
      maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      maskCtx.fillStyle = "white";
      maskCtx.fill();
    }

    if (isDrawing && mode === "move") {
      offsetX = e.clientX - startX;
      offsetY = e.clientY - startY;
      drawImage();
    }
  });

  maskCanvas.addEventListener("mousedown", function(e) {
    if (!image) return;

    if (mode === "draw") {
      isDrawing = true;
    } else if (mode === "move") {
      isDrawing = true;
      startX = e.clientX - offsetX;
      startY = e.clientY - offsetY;
      maskCanvas.style.cursor = "grabbing";
    }
  });

  maskCanvas.addEventListener("mouseup", function() {
    isDrawing = false;
    if (mode === "move") maskCanvas.style.cursor = "grab";
  });

  maskCanvas.addEventListener("mouseleave", function() {
    isDrawing = false;
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  });

  /* ================================
     APPLY PIXELATION
  ================================= */

  applyBtn.addEventListener("click", function() {
    if (!image) return;

    const maskData =
      maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const baseData =
      baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);

    for (let y = 0; y < baseCanvas.height; y += pixelSize) {
      for (let x = 0; x < baseCanvas.width; x += pixelSize) {

        const i = (y * baseCanvas.width + x) * 4;

        if (maskData.data[i + 3] > 0) {

          let r = 0, g = 0, b = 0, count = 0;

          for (let yy = 0; yy < pixelSize; yy++) {
            for (let xx = 0; xx < pixelSize; xx++) {
              const px = ((y + yy) * baseCanvas.width + (x + xx)) * 4;
              r += baseData.data[px];
              g += baseData.data[px + 1];
              b += baseData.data[px + 2];
              count++;
            }
          }

          r /= count;
          g /= count;
          b /= count;

          for (let yy = 0; yy < pixelSize; yy++) {
            for (let xx = 0; xx < pixelSize; xx++) {
              const px = ((y + yy) * baseCanvas.width + (x + xx)) * 4;
              baseData.data[px] = r;
              baseData.data[px + 1] = g;
              baseData.data[px + 2] = b;
            }
          }
        }
      }
    }

    baseCtx.putImageData(baseData, 0, 0);
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  });

  /* ================================
     REVERT BUTTON (UPDATED + SAFE)
  ================================= */

  if (revertBtn) {

    revertBtn.addEventListener("click", function() {

      if (!originalImageData) return;

      revertBtn.classList.add("active");

      baseCtx.putImageData(originalImageData, 0, 0);
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

      setTimeout(() => {
        revertBtn.classList.remove("active");
      }, 300);

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

  zoomSlider.addEventListener("input", e => {
    zoomLevel = parseFloat(e.target.value);
    drawImage();
  });

  /* ================================
     MODE BUTTONS
  ================================= */

  drawBtn.addEventListener("click", function() {
    mode = "draw";
    maskCanvas.style.cursor = image ? "crosshair" : "default";
  });

  moveBtn.addEventListener("click", function() {
    mode = "move";
    maskCanvas.style.cursor = image ? "grab" : "default";
  });

});