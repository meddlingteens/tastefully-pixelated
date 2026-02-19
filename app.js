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
    const randomLine = taglines[Math.floor(Math.random() * taglines.length)];
    randomPrompt.textContent = randomLine;
  }

  /* ========= APP LOGIC ========= */

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

  const downloadBtn = document.getElementById('downloadBtn');
  const shareBtn = document.getElementById('shareBtn');

  const brushSizeInput = document.getElementById('brushSize');
  const pixelSizeInput = document.getElementById('pixelSize');
  const zoomInput = document.getElementById('zoomLevel');

  const fileInfoBtn = document.getElementById('fileInfoBtn');
  const infoModal = document.getElementById('infoModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  const baseCtx = baseCanvas.getContext('2d');
  const maskCtx = maskCanvas.getContext('2d');

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

  function setMode(newMode) {
    mode = newMode;

    moveBtn.classList.remove('active');
    drawBtn.classList.remove('active');

    if (mode === 'position') moveBtn.classList.add('active');
    if (mode === 'draw') drawBtn.classList.add('active');
  }

  moveBtn.addEventListener('click', () => setMode('position'));
  drawBtn.addEventListener('click', () => setMode('draw'));

  function enableEditing() {
    moveBtn.disabled = false;
    drawBtn.disabled = false;
    clearBtn.disabled = false;
    applyBtn.disabled = false;
    zoomInput.disabled = false;
    setMode('draw');
  }

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

        baseCanvas.width = width;
        baseCanvas.height = height;
        maskCanvas.width = width;
        maskCanvas.height = height;
        outputCanvas.width = width;
        outputCanvas.height = height;

        canvasContainer.style.width = width + "px";
        canvasContainer.style.height = height + "px";

        baseCtx.clearRect(0, 0, width, height);
        baseCtx.drawImage(img, 0, 0, width, height);

        maskCtx.clearRect(0, 0, width, height);

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

  brushSizeInput.addEventListener('input', () => {
    brushSize = parseInt(brushSizeInput.value, 10);
  });

  pixelSizeInput.addEventListener('input', () => {
    pixelSize = parseInt(pixelSizeInput.value, 10);
  });

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
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    maskCtx.fillStyle = "rgba(255,255,255,1)";
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
    maskCtx.fill();
  }

  canvasContainer.addEventListener('mousedown', (e) => {
    if (mode !== 'position') return;
    if (zoom <= 1) return;

    isPanning = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;

    offsetX
