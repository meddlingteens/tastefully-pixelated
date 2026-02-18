document.addEventListener('DOMContentLoaded', () => {

  /* -------------------- Element References -------------------- */

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

  /* -------------------- Random Prompt -------------------- */

  const randomPrompts = [
    'Show some class and blur your junk.',
    'Hide your shame.',
    "Uh, ain’t no one wanna see that.",
    "Not even your mamma thinks that’s OK.",
    "Seriously dude, that’s gross.",
    'Eeeeuu.',
    "I think I'm going to barf.",
    "Don’t make me sick.",
    'Place a pixel where the good Lord split ya.',
    'Blur the junk in the trunk.',
    'Cover that already.',
    "I can’t unsee that.",
    'Gross, just gross.'
  ];

  function setRandomPrompt() {
    if (!refs.randomPrompt) return;
    const index = Math.floor(Math.random() * randomPrompts.length);
    refs.randomPrompt.textContent = randomPrompts[index];
  }

  setRandomPrompt();

  /* -------------------- Modal Logic -------------------- */

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

  /* -------------------- Canvas Setup -------------------- */

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
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    mode: 'draw',
    drawing: false,
    panning: false,
    imageLoaded: false,
    history: [],
    activePointerId: null
  };

  /* -------------------- Status -------------------- */

  function setStatus(message) {
    if (refs.status) {
      refs.status.textContent = message;
    }
  }

  setStatus('Select a photo to begin.');

  /* -------------------- Brush Controls -------------------- */

  refs.brushSize.addEventListener('input', () => {
    state.brushSize = Number(refs.brushSize.value);
    refs.brushSizeValue.textContent = `${state.brushSize} px`;
  });

  refs.pixelSize.addEventListener('input', () => {
    state.pixelSize = Number(refs.pixelSize.value);
    refs.pixelSizeValue.textContent = `${state.pixelSize} px`;
  });

  /* -------------------- Mode Controls -------------------- */

  refs.drawBtn.addEventListener('click', () => {
    state.mode = 'draw';
    refs.drawBtn.classList.add('active');
    refs.moveBtn.classList.remove('active');
  });

  refs.moveBtn.addEventListener('click', () => {
    state.mode = 'move';
    refs.moveBtn.classList.add('active');
    refs.drawBtn.classList.remove('active');
  });

  /* -------------------- Mask History -------------------- */

  function pushHistory() {
    const snapshot = maskDataCtx.getImageData(0, 0, maskDataCanvas.width, maskDataCanvas.height);
    state.history.push(snapshot);
    if (state.history.length > 10) state.history.shift();
    refs.undoBtn.disabled = false;
  }

  refs.undoBtn.addEventListener('click', () => {
    if (!state.history.length) return;
    const previous = state.history.pop();
    maskDataCtx.putImageData(previous, 0, 0);
    refs.undoBtn.disabled = state.history.length === 0;
    renderMaskOverlay();
  });

  refs.clearMaskBtn.addEventListener('click', () => {
    maskDataCtx.clearRect(0, 0, maskDataCanvas.width, maskDataCanvas.height);
    state.history = [];
    refs.undoBtn.disabled = true;
    renderMaskOverlay();
  });

  /* -------------------- Mask Rendering -------------------- */

  function renderMaskOverlay() {
    maskCtx.clearRect(0, 0, refs.maskCanvas.width, refs.maskCanvas.height);
    maskCtx.drawImage(maskDataCanvas, 0, 0);

    maskCtx.globalCompositeOperation = 'source-in';
    maskCtx.fillStyle = 'rgba(223,115,255,0.35)';
    maskCtx.fillRect(0, 0, refs.maskCanvas.width, refs.maskCanvas.height);
    maskCtx.globalCompositeOperation = 'source-over';
  }

});
