const refs = {
  photoInput: document.getElementById('photoInput'),
  brushSize: document.getElementById('brushSize'),
  brushSizeValue: document.getElementById('brushSizeValue'),
  pixelSize: document.getElementById('pixelSize'),
  pixelSizeValue: document.getElementById('pixelSizeValue'),
  zoom: document.getElementById('zoomLevel'),
  zoomValue: document.getElementById('zoomLevelValue'),
  moveBtn: document.getElementById('moveBtn'),
  resetViewBtn: document.getElementById('resetViewBtn'),
  drawBtn: document.getElementById('drawBtn'),
  eraseBtn: document.getElementById('eraseBtn'),
  clearMaskBtn: document.getElementById('clearMaskBtn'),
  applyBtn: document.getElementById('applyBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  shareBtn: document.getElementById('shareBtn'),
  undoBtn: document.getElementById('undoBtn'),
  status: document.getElementById('statusText'),
  container: document.getElementById('canvasContainer'),
  baseCanvas: document.getElementById('baseCanvas'),
  maskCanvas: document.getElementById('maskCanvas'),
  outputCanvas: document.getElementById('outputCanvas'),
  uploadProgress: document.getElementById('uploadProgress'),
  uploadProgressText: document.getElementById('uploadProgressText'),
  selectedFileName: document.getElementById('selectedFileName'),
  randomPrompt: document.getElementById('randomPrompt'),
  dimensionsOverlay: document.getElementById('dimensionsOverlay'),
};

const baseCtx = refs.baseCanvas.getContext('2d', { willReadFrequently: true });
const maskCtx = refs.maskCanvas.getContext('2d');
const outputCtx = refs.outputCanvas.getContext('2d');

const sourceCanvas = document.createElement('canvas');
const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
const maskDataCanvas = document.createElement('canvas');
const maskDataCtx = maskDataCanvas.getContext('2d', { willReadFrequently: true });
const resultCanvas = document.createElement('canvas');
const resultCtx = resultCanvas.getContext('2d', { willReadFrequently: true });

const state = {
  brushSize: Number(refs.brushSize.value),
  pixelSize: Number(refs.pixelSize.value),
  zoom: Number(refs.zoom.value),
  offsetX: 0,
  offsetY: 0,
  mode: 'draw',
  drawing: false,
  panning: false,
  imageLoaded: false,
  hasResult: false,
  activePointerId: null,
  panStartX: 0,
  panStartY: 0,
  history: [],
  cursorX: 0,
  cursorY: 0,
};

/* -------------------- Brush + Pixel Controls -------------------- */

refs.brushSize.addEventListener('input', () => {
  state.brushSize = Number(refs.brushSize.value);
  refs.brushSizeValue.textContent = `${state.brushSize} px`;
  showEditorFromCurrentView();
});

refs.pixelSize.addEventListener('input', () => {
  state.pixelSize = Number(refs.pixelSize.value);
  refs.pixelSizeValue.textContent = `${state.pixelSize} px`;
});

refs.zoom.addEventListener('input', () => {
  setZoom(Number(refs.zoom.value));
});

refs.undoBtn?.addEventListener('click', undoMask);

/* -------------------- Pointer Events -------------------- */

refs.maskCanvas.addEventListener('pointerdown', onPointerDown);
refs.maskCanvas.addEventListener('pointermove', onPointerMove);
refs.maskCanvas.addEventListener('pointerup', onPointerUp);
refs.maskCanvas.addEventListener('pointercancel', onPointerUp);

function onPointerDown(event) {
  if (!state.imageLoaded) return;

  state.activePointerId = event.pointerId;
  refs.maskCanvas.setPointerCapture(event.pointerId);

  if (state.mode === 'move') {
    state.panning = true;
    state.panStartX = event.clientX;
    state.panStartY = event.clientY;
    refs.maskCanvas.style.cursor = 'grabbing';
    return;
  }

  state.drawing = true;
  pushHistory();
  paint(event);
}

function onPointerMove(event) {
  if (!state.imageLoaded) return;

  state.cursorX = event.clientX;
  state.cursorY = event.clientY;

  if (state.panning && state.mode === 'move') {
    const rect = refs.maskCanvas.getBoundingClientRect();
    const dx = (event.clientX - state.panStartX) * (refs.maskCanvas.width / rect.width);
    const dy = (event.clientY - state.panStartY) * (refs.maskCanvas.height / rect.height);

    state.offsetX += dx;
    state.offsetY += dy;
    state.panStartX = event.clientX;
    state.panStartY = event.clientY;
    clampPan();
    showEditorFromCurrentView();
    return;
  }

  if (state.drawing) paint(event);

  showEditorFromCurrentView();
}

function onPointerUp(event) {
  if (event.pointerId !== state.activePointerId) return;

  state.drawing = false;
  state.panning = false;
  state.activePointerId = null;

  if (refs.maskCanvas.hasPointerCapture(event.pointerId)) {
    refs.maskCanvas.releasePointerCapture(event.pointerId);
  }

  refs.maskCanvas.style.cursor = state.mode === 'move' ? 'grab' : 'crosshair';
}

/* -------------------- History -------------------- */

function pushHistory() {
  const snapshot = maskDataCtx.getImageData(0, 0, maskDataCanvas.width, maskDataCanvas.height);
  state.history.push(snapshot);
  if (state.history.length > 10) state.history.shift();
  refs.undoBtn.disabled = false;
}

function undoMask() {
  if (!state.history.length) return;
  const previous = state.history.pop();
  maskDataCtx.putImageData(previous, 0, 0);
  refs.undoBtn.disabled = state.history.length === 0;
  showEditorFromCurrentView();
}

/* -------------------- Brush Preview -------------------- */

function renderBrushPreview() {
  if (!state.imageLoaded || state.mode === 'move') return;

  const rect = refs.maskCanvas.getBoundingClientRect();
  const x = ((state.cursorX - rect.left) / rect.width) * refs.maskCanvas.width;
  const y = ((state.cursorY - rect.top) / rect.height) * refs.maskCanvas.height;

  const imageX = (x - state.offsetX) / state.zoom;
  const imageY = (y - state.offsetY) / state.zoom;

  maskCtx.save();
  maskCtx.translate(state.offsetX, state.offsetY);
  maskCtx.scale(state.zoom, state.zoom);

  maskCtx.beginPath();
  maskCtx.arc(imageX, imageY, state.brushSize / state.zoom, 0, Math.PI * 2);
  maskCtx.strokeStyle = 'rgba(255,255,255,0.8)';
  maskCtx.lineWidth = 1 / state.zoom;
  maskCtx.stroke();

  maskCtx.restore();
}

/* -------------------- Rendering -------------------- */

function renderMaskOverlay() {
  maskCtx.clearRect(0, 0, refs.maskCanvas.width, refs.maskCanvas.height);

  maskCtx.save();
  maskCtx.translate(state.offsetX, state.offsetY);
  maskCtx.scale(state.zoom, state.zoom);
  maskCtx.drawImage(maskDataCanvas, 0, 0);
  maskCtx.restore();

  maskCtx.globalCompositeOperation = 'source-in';
  maskCtx.fillStyle = 'rgba(223,115,255,0.35)';
  maskCtx.fillRect(0, 0, refs.maskCanvas.width, refs.maskCanvas.height);
  maskCtx.globalCompositeOperation = 'source-over';
}

function showEditorFromCurrentView() {
  if (!state.imageLoaded) return;

  drawView(baseCtx, sourceCanvas);
  renderMaskOverlay();
  renderBrushPreview();
}

/* -------------------- Optimized Pixelation -------------------- */

async function applyPixelation() {
  if (!state.imageLoaded) return;
  if (!hasMaskPixels()) return;

  refs.applyBtn.textContent = 'Processing…';
  refs.applyBtn.disabled = true;

  await new Promise(r => requestAnimationFrame(r));

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const sourceData = sourceCtx.getImageData(0, 0, width, height);
  const maskData = maskDataCtx.getImageData(0, 0, width, height);
  const outputData = resultCtx.createImageData(width, height);
  outputData.data.set(sourceData.data);

  const block = state.pixelSize;
  const half = Math.floor(block / 2);

  for (let y = 0; y < height; y += block) {
    for (let x = 0; x < width; x += block) {

      const sampleX = Math.min(x + half, width - 1);
      const sampleY = Math.min(y + half, height - 1);
      const idxSample = (sampleY * width + sampleX) * 4;

      if (maskData.data[idxSample + 3] === 0) continue;

      let r = 0, g = 0, b = 0, count = 0;
      const yLimit = Math.min(y + block, height);
      const xLimit = Math.min(x + block, width);

      for (let yy = y; yy < yLimit; yy++) {
        for (let xx = x; xx < xLimit; xx++) {
          const i = (yy * width + xx) * 4;
          r += sourceData.data[i];
          g += sourceData.data[i + 1];
          b += sourceData.data[i + 2];
          count++;
        }
      }

      const avgR = (r / c
