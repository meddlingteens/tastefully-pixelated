document.addEventListener('DOMContentLoaded', () => {

  /* ========= BRAND COPY ========= */

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

  const randomPrompt = document.getElementById('randomPrompt');
  if (randomPrompt) {
    randomPrompt.textContent =
      taglines[Math.floor(Math.random() * taglines.length)];
  }

  /* ========= ELEMENTS ========= */

  const photoPickerBtn = document.getElementById('photoPickerBtn');
  const photoInput = document.getElementById('photoInput');

  const baseCanvas = document.getElementById('baseCanvas');
  const maskCanvas = document.getElementById('maskCanvas');
  const canvasContainer = document.getElementById('canvasContainer');

  const moveBtn = document.getElementById('moveBtn');
  const drawBtn = document.getElementById('drawBtn');
  const undoBtn = document.getElementById('undoBtn');
  const clearBtn = document.getElementById('clearMaskBtn');
  const applyBtn = document.getElementById('applyBtn');

  const downloadBtn = document.getElementById('downloadBtn');
  const shareBtn = document.getElementById('shareBtn');

  const brushSizeInput = document.getElementById('brushSize');
  const pixelSizeInput = document.getElementById('pixelSize');
  const zoomInput = document.getElementById('zoomLevel');

  const baseCtx = baseCanvas.getContext('2d');
  const maskCtx = maskCanvas.getContext('2d');

  /* ========= STATE ========= */

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

  /* ========= MODE HANDLING ========= */

  function setMode(newMode) {
    mode = newMode;

    moveBtn.classList.remove('active');
    drawBtn.classList.remove('active');

    if (mode === 'position') moveBtn.classList.add('active');
    if (mode === 'draw') drawBtn.classList.add('active');
  }

  moveBtn.addEventListener('click', () => setMode('position'));
  drawBtn.addEventListener('click', () => setMode('draw'));

  /* ========= ENABLE EDITING ========= */

  function enableEditing() {
    moveBtn.disabled = false;
    drawBtn.disabled = false;
    clearBtn.disabled = false;
    applyBtn.disabled = false;
    zoomInput.disabled = false;
    setMode('draw');
  }

  /* ========= TRANSFORM ========= */

  function applyTransform() {
    const transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
    baseCanvas.style.transform = transform;
    maskCanvas.style.transform = transform;
  }

  zoomInput.addEventListener('input', () => {
    zoom = parseFloat(zoomInput.value);
    applyTransform();
  });

  /* ========= LOAD IMAGE ========= */

  photoPickerBtn.addEventListener('click', () => photoInput.click());

  photoInput.addEventListener('change', (event) => {

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

      const img = new Image();

      img.onload = function () {

        const maxW = 900;
        const maxH = 600;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);

        const w = Math.floor(img.width * scale);
        const h = Math.floor(img.height * scale);

        baseCanvas.width = w;
        baseCanvas.height = h;
        maskCanvas.width = w;
        maskCanvas.height = h;

        canvasContainer.style.width = w + "px";
        canvasContainer.style.height = h + "px";

        baseCtx.clearRect(0, 0, w, h);
        baseCtx.drawImage(img, 0, 0, w, h);

        maskCtx.clearRect(0, 0, w, h);

        zoom = 1;
        offsetX = 0;
        offsetY = 0;
        zoomInput.value = 1;

        applyTransform();
        enableEditing();
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });

  /* ========= SLIDERS ========= */

  brushSizeInput.addEventListener('input', e => {
    brushSize = parseInt(e.target.value, 10);
  });

  pixelSizeInput.addEventListener('input', e => {
    pixelSize = parseInt(e.target.value, 10);
  });

  /* ========= DRAW ========= */

  maskCanvas.addEventListener('mousedown', e => {
    if (mode !== 'draw') return;
    drawing = true;
    saveHistory();
    draw(e);
  });

  maskCanvas.addEventListener('mousemove', e => {
    if (!drawing || mode !== 'draw') return;
    draw(e);
  });

  window.addEventListener('mouseup', () => {
    drawing = false;
    isPanning = false;
  });

  function draw(e) {
    const rect = maskCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    maskCtx.fillStyle = "white";
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
    maskCtx.fill();
  }

  /* ========= PAN ========= */

  canvasContainer.addEventListener('mousedown', e => {
    if (mode !== 'position') return;
    if (zoom <= 1) return;

    isPanning = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
  });

  window.addEventListener('mousemove', e => {
    if (!isPanning) return;

    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;

    applyTransform();
  });

  /* ========= UNDO / CLEAR ========= */

  function saveHistory() {
    history.push(maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height));
    undoBtn.disabled = false;
  }

  undoBtn.addEventListener('click', () => {
    if (!history.length) return;
    maskCtx.putImageData(history.pop(), 0, 0);
  });

  clearBtn.addEventListener('click', () => {
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    history = [];
    undoBtn.disabled = true;
  });

  /* ========= APPLY ========= */

  applyBtn.addEventListener('click', () => {

    applyBtn.classList.add('active');

    const w = baseCanvas.width;
    const h = baseCanvas.height;

    const baseData = baseCtx.getImageData(0, 0, w, h);
    const maskData = maskCtx.getImageData(0, 0, w, h);
    const result = baseCtx.createImageData(w, h);

    result.data.set(baseData.data);

    for (let y = 0; y < h; y += pixelSize) {
      for (let x = 0; x < w; x += pixelSize) {

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

        if (count === 0) continue;

        const avgR = r / count;
        const avgG = g / count;
        const avgB = b / count;

        for (let yy = y; yy < y + pixelSize && yy < h; yy++) {
          for (let xx = x; xx < x + pixelSize && xx < w; xx++) {
            const i = (yy * w + xx) * 4;
            if (maskData.data[i + 3] > 0) {
              result.data[i] = avgR;
              result.data[i + 1] = avgG;
              result.data[i + 2] = avgB;
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

    setTimeout(() => {
      applyBtn.classList.remove('active');
    }, 300);

    enableEditing();
  });

});
