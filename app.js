document.addEventListener('DOMContentLoaded', () => {

  const refs = {
    photoInput: document.getElementById('photoInput'),
    brushSize: document.getElementById('brushSize'),
    brushSizeValue: document.getElementById('brushSizeValue'),
    pixelSize: document.getElementById('pixelSize'),
    pixelSizeValue: document.getElementById('pixelSizeValue'),
    zoom: document.getElementById('zoomLevel'),
    zoomValue: document.getElementById('zoomLevelValue'),
    moveBtn: document.getElementById('moveBtn'),
    drawBtn: document.getElementById('drawBtn'),
    clearMaskBtn: document.getElementById('clearMaskBtn'),
    applyBtn: document.getElementById('applyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    shareBtn: document.getElementById('shareBtn'),
    undoBtn: document.getElementById('undoBtn'),
    fileInfoBtn: document.getElementById('fileInfoBtn'),
    infoModal: document.getElementById('infoModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    status: document.getElementById('statusText'),
    container: document.getElementById('canvasContainer'),
    baseCanvas: document.getElementById('baseCanvas'),
    maskCanvas: document.getElementById('maskCanvas'),
    outputCanvas: document.getElementById('outputCanvas'),
    uploadProgress: document.getElementById('uploadProgress'),
    uploadProgressText: document.getElementById('uploadProgressText'),
    dimensionsOverlay: document.getElementById('dimensionsOverlay'),
    randomPrompt: document.getElementById('randomPrompt')
  };

  /* ---------------- Modal Logic (Fixed) ---------------- */

  if (refs.fileInfoBtn && refs.infoModal && refs.closeModalBtn) {

    refs.fileInfoBtn.addEventListener('click', () => {
      refs.infoModal.classList.remove('hidden');
    });

    refs.closeModalBtn.addEventListener('click', () => {
      refs.infoModal.classList.add('hidden');
    });

    refs.infoModal.addEventListener('click', (event) => {
      if (event.target === refs.infoModal) {
        refs.infoModal.classList.add('hidden');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        refs.infoModal.classList.add('hidden');
      }
    });
  }

  /* ---------------- Canvas Setup ---------------- */

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
    cursorY: 0
  };

  /* ---------------- Basic Controls ---------------- */

  refs.brushSize.addEventListener('input', () => {
    state.brushSize = Number(refs.brushSize.value);
    refs.brushSizeValue.textContent = `${state.brushSize} px`;
  });

  refs.pixelSize.addEventListener('input', () => {
    state.pixelSize = Number(refs.pixelSize.value);
    refs.pixelSizeValue.textContent = `${state.pixelSize} px`;
  });

  refs.drawBtn.addEventListener('click', () => setMode('draw'));
  refs.moveBtn.addEventListener('click', () => setMode('move'));
  refs.clearMaskBtn.addEventListener('click', clearMask);
  refs.undoBtn.addEventListener('click', undoMask);

  function setMode(mode) {
    state.mode = mode;
    refs.drawBtn.classList.toggle('active', mode === 'draw');
    refs.moveBtn.classList.toggle('active', mode === 'move');
    refs.maskCanvas.style.cursor = mode === 'move' ? 'grab' : 'crosshair';
  }

  /* ---------------- Undo ---------------- */

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
    renderMaskOverlay();
  }

  function clearMask() {
    maskDataCtx.clearRect(0, 0, maskDataCanvas.width, maskDataCanvas.height);
    state.history = [];
    refs.undoBtn.disabled = true;
    renderMaskOverlay();
  }

  /* ---------------- Mask Rendering ---------------- */

  function renderMaskOverlay() {
    maskCtx.clearRect(0, 0, refs.maskCanvas.width, refs.maskCanvas.height);

    maskCtx.drawImage(maskDataCanvas, 0, 0);

    maskCtx.globalCompositeOperation = 'source-in';
    maskCtx.fillStyle = 'rgba(223,115,255,0.35)';
    maskCtx.fillRect(0, 0, refs.maskCanvas.width, refs.maskCanvas.height);
    maskCtx.globalCompositeOperation = 'source-over';
  }

  /* ---------------- Status ---------------- */

  function setStatus(message) {
    if (refs.status) {
      refs.status.textContent = message;
    }
  }

  setStatus('Select a photo to begin.');
});
