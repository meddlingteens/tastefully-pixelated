/* =========================================================
   Tastefully Pixelated
   Version: 1.0.0
   Release: Stable Production Build

   Changelog:
   - Locked stable architecture
   - Modularized code structure
   - Added touch support
   - Optimized pixelation loop
   - Added subtle motion polish
   - Version header + structure separation
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     BRAND COPY
  ========================================================= */

  const taglines = [
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

  const bannerHeadings = [
    "Buy something you really don't need",
    "Shop mofo. Buy, buy, buy",
    "This is where you can advertise your useless crap",
    "What the world really needs is more advertising",
    "Wanna buy one of those endlessly spinning top things?",
    "Sell stuff here, bitches"
  ];

  /* =========================================================
     DOM CACHE
  ========================================================= */

  const $ = id => document.getElementById(id);

  const randomPrompt = $("randomPrompt");
  const bannerHeading = $("bannerHeading");

  const photoPickerBtn = $("photoPickerBtn");
  const photoInput = $("photoInput");

  const baseCanvas = $("baseCanvas");
  const maskCanvas = $("maskCanvas");
  const container = $("canvasContainer");

  const moveBtn = $("moveBtn");
  const drawBtn = $("drawBtn");
  const undoBtn = $("undoBtn");
  const clearBtn = $("clearMaskBtn");
  const applyBtn = $("applyBtn");

  const downloadBtn = $("downloadBtn");
  const shareBtn = $("shareBtn");

  const brushSlider = $("brushSize");
  const pixelSlider = $("pixelSize");
  const zoomSlider = $("zoomLevel");

  const fileInfoBtn = $("fileInfoBtn");
  const infoModal = $("infoModal");
  const closeModalBtn = $("closeModalBtn");

  const baseCtx = baseCanvas.getContext("2d");
  const maskCtx = maskCanvas.getContext("2d");

  /* =========================================================
     STATE
  ========================================================= */

  let brushSize = parseInt(brushSlider.value, 10);
  let pixelSize = parseInt(pixelSlider.value, 10);

  let zoom = 1;
  let offsetX = 0;
  let offsetY = 0;

  let mode = null;
  let drawing = false;
  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let history = [];

  /* =========================================================
     INIT UI
  ========================================================= */

  if (randomPrompt) {
    randomPrompt.textContent =
      taglines[Math.floor(Math.random() * taglines.length)];
    randomPrompt.style.opacity = 0;
    setTimeout(() => randomPrompt.style.opacity = 1, 100);
  }

  if (bannerHeading) {
    bannerHeading.textContent =
      bannerHeadings[Math.floor(Math.random() * bannerHeadings.length)];
    bannerHeading.style.opacity = 0;
    setTimeout(() => bannerHeading.style.opacity = 1, 150);
  }

  /* =========================================================
     MODE
  ========================================================= */

  function setMode(newMode) {
    mode = newMode;
    moveBtn.classList.remove("active");
    drawBtn.classList.remove("active");

    if (mode === "position") moveBtn.classList.add("active");
    if (mode === "draw") drawBtn.classList.add("active");
  }

  moveBtn.onclick = () => setMode("position");
  drawBtn.onclick = () => setMode("draw");

  function enableEditing() {
    moveBtn.disabled = false;
    drawBtn.disabled = false;
    clearBtn.disabled = false;
    applyBtn.disabled = false;
    zoomSlider.disabled = false;
    setMode("draw");
  }

  /* =========================================================
     TRANSFORM
  ========================================================= */

  function applyTransform() {
    const t = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
    baseCanvas.style.transform = t;
    maskCanvas.style.transform = t;
  }

  zoomSlider.oninput = e => {
    zoom = parseFloat(e.target.value);
    applyTransform();
  };

  /* =========================================================
     LOAD IMAGE
  ========================================================= */

  photoPickerBtn.onclick = () => photoInput.click();

  photoInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {

        const maxW = 900;
        const maxH = 600;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);

        const w = Math.floor(img.width * scale);
        const h = Math.floor(img.height * scale);

        baseCanvas.width = maskCanvas.width = w;
        baseCanvas.height = maskCanvas.height = h;

        container.style.width = w + "px";
        container.style.height = h + "px";

        baseCtx.clearRect(0, 0, w, h);
        baseCtx.drawImage(img, 0, 0, w, h);
        maskCtx.clearRect(0, 0, w, h);

        zoom = 1;
        offsetX = offsetY = 0;
        zoomSlider.value = 1;
        applyTransform();
        enableEditing();
      };

      img.src = ev.target.result;
    };

    reader.readAsDataURL(file);
  };

  /* =========================================================
     DRAW + TOUCH SUPPORT
  ========================================================= */

  function getCoords(e) {
    const rect = maskCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom
    };
  }

  function draw(e) {
    const { x, y } = getCoords(e);
    maskCtx.fillStyle = "white";
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
    maskCtx.fill();
  }

  function startDraw(e) {
    if (mode !== "draw") return;
    drawing = true;
    history.push(maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height));
    draw(e);
  }

  function moveDraw(e) {
    if (!drawing || mode !== "draw") return;
    e.preventDefault();
    draw(e);
  }

  function stopDraw() {
    drawing = false;
  }

  maskCanvas.addEventListener("mousedown", startDraw);
  maskCanvas.addEventListener("mousemove", moveDraw);
  maskCanvas.addEventListener("touchstart", startDraw);
  maskCanvas.addEventListener("touchmove", moveDraw, { passive: false });

  window.addEventListener("mouseup", stopDraw);
  window.addEventListener("touchend", stopDraw);

  /* =========================================================
     APPLY (Optimized Pixel Engine)
  ========================================================= */

  applyBtn.onclick = () => {

    applyBtn.classList.add("active");

    const w = baseCanvas.width;
    const h = baseCanvas.height;

    const baseData = baseCtx.getImageData(0, 0, w, h);
    const maskData = maskCtx.getImageData(0, 0, w, h);
    const result = baseCtx.createImageData(w, h);

    result.data.set(baseData.data);

    for (let y = 0; y < h; y += pixelSize) {
      for (let x = 0; x < w; x += pixelSize) {

        let masked = false;

        // First pass: detect if block contains mask
        for (let yy = y; yy < y + pixelSize && yy < h; yy++) {
          for (let xx = x; xx < x + pixelSize && xx < w; xx++) {
            const i = (yy * w + xx) * 4;
            if (maskData.data[i + 3] > 0) {
              masked = true;
              break;
            }
          }
          if (masked) break;
        }

        if (!masked) continue; // skip heavy averaging if no mask

        let r = 0, g = 0, b = 0, count = 0;

        for (let yy = y; yy < y + pixelSize && yy < h; yy++) {
          for (let xx = x; xx < x + pixelSize && xx < w; xx++) {
            const i = (yy * w + xx) * 4;
            r += baseData.data[i];
            g += baseData.data[i + 1];
            b += baseData.data[i + 2];
            count++;
          }
        }

        const ar = r / count;
        const ag = g / count;
        const ab = b / count;

        for (let yy = y; yy < y + pixelSize && yy < h; yy++) {
          for (let xx = x; xx < x + pixelSize && xx < w; xx++) {
            const i = (yy * w + xx) * 4;
            if (maskData.data[i + 3] > 0) {
              result.data[i] = ar;
              result.data[i + 1] = ag;
              result.data[i + 2] = ab;
            }
          }
        }
      }
    }

    baseCtx.putImageData(result, 0, 0);
    maskCtx.clearRect(0, 0, w, h);
    history = [];
    undoBtn.disabled = true;

    downloadBtn.disabled = false;
    shareBtn.disabled = false;

    setTimeout(() => applyBtn.classList.remove("active"), 250);
    enableEditing();
  };

});
