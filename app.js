document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Elements ---------- */

  const photoPickerBtn = document.getElementById('photoPickerBtn');
  const photoInput = document.getElementById('photoInput');

  const baseCanvas = document.getElementById('baseCanvas');
  const maskCanvas = document.getElementById('maskCanvas');
  const outputCanvas = document.getElementById('outputCanvas');
  const canvasContainer = document.getElementById('canvasContainer');

  const moveBtn = document.getElementById('moveBtn');
  const drawBtn = document.getElementById('drawBtn');
  const undoBtn = document.getElementById('undoBtn');
  const clearBtn = document.getElementById('clearMaskBtn');
  const applyBtn = document.getElementById('applyBtn');

  const brushSizeInput = document.getElementById('brushSize');
  const pixelSizeInput = document.getElementById('pixelSize');
  const zoomInput = document.getElementById('zoomLevel');

  const fileInfoBtn = document.getElementById('fileInfoBtn');
  const infoModal = document.getElementById('infoModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  const baseCtx = baseCanvas.getContext('2d');
  const maskCtx = maskCanvas.getContext('2d');
  const outputCtx = outputCanvas.getContext('2d');

  /* ---------- State ---------- */

  let brushSize = parseInt(brushSizeInput.value, 10);
  let pixelSize = parseInt(pixelSizeInput.value, 10);

  let zoom = 1;
  let offsetX = 0;
  let offsetY = 0;

  let drawing = false;
  let isPanning = false;

  let startX = 0;
  let startY = 0;

  let history = [];
  let mode = null;

  /* ---------- Transform (Zoom + Pan) ---------- */

  function applyTransform() {
    const transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;

    baseCanvas.style.transform = transform;
    maskCanvas.style.transform = transform;
    outputCanvas.style.transform = transform;
  }

  zoomInput.addEventListener('input', () => {
    zoom = parseFloat(zoomInput.value);
    applyTransform();
  });

  /* ---------- Mode ---------- */

  function setMode(newMode) {
    mode = newMode;

    moveBtn.classList.remove('active');
    drawBtn.classList.remove('active');

    if (mode === 'position') moveBtn.classList.add('active');
    if (mode === 'draw') drawBtn.classList.add('active');
  }

  moveBtn.addEventListener('click', () => setMode('position'));
  drawBtn.addEventListener('click', () => setMode('draw'));

  /* ---------- File Picker ---------- */

  photoPickerBtn.addEventListener('click', () => photoInput.click());

  photoInput.addEventListener('change', (event) => {

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

      const img = new Image();

      img.onload = function () {

        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 600;

        const scale = Math.min(
          MAX_WIDTH / img.width,
          MAX_HEIGHT / img.height,
          1
        );

        const width = Math.floor(img.width * scale);
        const height = Math.floor(img.height * scale);

        /* Resize canvases */

        baseCanvas.width = width;
        baseCanvas.height = height;
        maskCanvas.width = width;
        maskCanvas.height = height;
        outputCanvas.width = width;
        outputCanvas.height = height;

        /* FIX: Resize container so canvas is visible */
        canvasContainer.style.width = width + "px";
        canvasContainer.style.height = height + "px";

        baseCtx.clearRect(0, 0, width, height);
        baseCtx.drawImage(img, 0, 0, width, height);

        maskCtx.clearRect(0, 0, width, height);

        /* Enable controls */

        moveBtn.disabled = false;
        drawBtn.disabled = false;
        applyBtn.disabled = false;
        clearBtn.disabled = false;
        zoomInput.disabled = false;

        /* Reset transform state */

        zoomInput.value = 1;
        zoom = 1;
        offsetX = 0;
        offsetY = 0;

        applyTransform();
        setMode('draw');
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });

  /* ---------- Sliders ---------- */

  brushSizeInput.addEventListener('input', () => {
    brushSize = parseInt(brushSizeInput.value, 10);
  });

  pixelSizeInput.addEventListener('input', () => {
    pixelSize = parseInt(pixelSizeInput.value, 10);
  });

  /* ---------- Drawing ---------- */

  maskCanvas.addEventListener('mousedown', (e) => {
    if (mode !== 'draw') return;

    drawing = true;
    saveHistory();
    draw(e);
  });

  maskCanvas.addEventListener('mousemove', (e) => {
    if (!drawing || mode !== 'draw') return;
    draw(e);
  });

  window.addEventListener('mouseup', () => {
    drawing = false;
    isPanning = false;
  });

  function draw(e) {

    const rect = maskCanvas.getBoundingClientRect();

    const x = (e.clientX - rect.left - offsetX) / zoom;
    const y = (e.clientY - rect.top - offsetY) / zoom;

    maskCtx.fillStyle = "rgba(255,255,255,1)";
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
    maskCtx.fill();
  }

  /* ---------- Position (Pan) ---------- */

  canvasContainer.addEventListener('mousedown', (e) => {

    if (mode !== 'position') return;
    if (zoom <= 1) return;

    isPanning = true;

    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
  });

  window.addEventListener('mousemove', (e) => {

    if (!isPanning) return;

    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;

    applyTransform();
  });

  /* ---------- Undo ---------- */

  function saveHistory() {
    history.push(maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height));
    if (history.length > 20) history.shift();
    undoBtn.disabled = false;
  }

  undoBtn.addEventListener('click', () => {
    if (!history.length) return;
    maskCtx.putImageData(history.pop(), 0, 0);
    undoBtn.disabled = history.length === 0;
  });

  /* ---------- Clear ---------- */

  clearBtn.addEventListener('click', () => {
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    history = [];
    undoBtn.disabled = true;
  });

  /* ---------- Apply Pixelation ---------- */

  applyBtn.addEventListener('click', () => {

    const width = baseCanvas.width;
    const height = baseCanvas.height;

    const baseData = baseCtx.getImageData(0, 0, width, height);
    const maskData = maskCtx.getImageData(0, 0, width, height);
    const result = outputCtx.createImageData(width, height);

    result.data.set(baseData.data);

    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {

        let r = 0, g = 0, b = 0, count = 0;

        for (let yy = y; yy < y + pixelSize && yy < height; yy++) {
          for (let xx = x; xx < x + pixelSize && xx < width; xx++) {
            const i = (yy * width + xx) * 4;
            if (maskData.data[i + 3] > 0) {
              r += baseData.data[i];
              g += baseData.data[i + 1];
              b += baseData.data[i + 2];
              count++;
            }
          }
        }

        if (count > 0) {
          const avgR = r / count;
          const avgG = g / count;
          const avgB = b / count;

          for (let yy = y; yy < y + pixelSize && yy < height; yy++) {
            for (let xx = x; xx < x + pixelSize && xx < width; xx++) {
              const i = (yy * width + xx) * 4;
              if (maskData.data[i + 3] > 0) {
                result.data[i] = avgR;
                result.data[i + 1] = avgG;
                result.data[i + 2] = avgB;
              }
            }
          }
        }
      }
    }

    outputCtx.putImageData(result, 0, 0);

    outputCanvas.hidden = false;
    baseCanvas.hidden = true;
    maskCanvas.hidden = true;
  });

  /* ---------- Modal ---------- */

  fileInfoBtn.addEventListener('click', () => {
    infoModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    infoModal.classList.add('hidden');
  });

  infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
  });

});
