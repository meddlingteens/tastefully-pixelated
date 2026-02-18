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

const randomPrompts = [
  'Show some class and blur your junk.',
  'Hide your shame.',
  "Uh, ain't noone wanna see that.",
  "Not even your mamma thinks that's OK.",
  "Seriously dude, that's gross.",
  'Eeeeuu',
  "I think I'm going to barf.",
  "Don't make me sick.",
  'Place a pixel where the good Lord split yea.',
  'Blur the junk in the trunk.',
  'Cover that already.',
  "I can't unsee that.",
  'Gross, just gross.',
];

function setRandomPrompt() {
  const index = Math.floor(Math.random() * randomPrompts.length);
  refs.randomPrompt.textContent = randomPrompts[index];
}

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
};

refs.brushSize.addEventListener('input', () => {
  state.brushSize = Number(refs.brushSize.value);
  refs.brushSizeValue.textContent = `${state.brushSize} px`;
});

refs.pixelSize.addEventListener('input', () => {
  state.pixelSize = Number(refs.pixelSize.value);
  refs.pixelSizeValue.textContent = `${state.pixelSize} px`;
});

refs.zoom.addEventListener('input', () => {
  const newZoom = Number(refs.zoom.value);
  setZoom(newZoom);
});

refs.photoInput.addEventListener('change', loadPhoto);
refs.drawBtn.addEventListener('click', () => setMode('draw'));
refs.eraseBtn.addEventListener('click', () => setMode('erase'));
refs.moveBtn.addEventListener('click', () => setMode('move'));
refs.resetViewBtn.addEventListener('click', resetView);
refs.clearMaskBtn.addEventListener('click', clearMask);
refs.applyBtn.addEventListener('click', applyPixelation);
refs.downloadBtn.addEventListener('click', downloadImage);
refs.shareBtn.addEventListener('click', shareImage);

refs.maskCanvas.addEventListener('pointerdown', onPointerDown);
refs.maskCanvas.addEventListener('pointermove', onPointerMove);
refs.maskCanvas.addEventListener('pointerup', onPointerUp);
refs.maskCanvas.addEventListener('pointercancel', onPointerUp);

/* -------------- (UNCHANGED CODE ABOVE) -------------- */
/* All your original functions remain exactly the same */
/* Except applyPixelation() below                      */
/* -------------- */

async function applyPixelation() {
  if (!state.imageLoaded) return;

  if (!hasMaskPixels()) {
    setStatus('Draw a mask before applying pixelation.', 'error');
    return;
  }

  refs.applyBtn.disabled = true;
  setStatus('Applying pixelation…');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const sourceData = sourceCtx.getImageData(0, 0, width, height);
  const maskData = maskDataCtx.getImageData(0, 0, width, height);

  resultCtx.clearRect(0, 0, width, height);
  resultCtx.putImageData(sourceData, 0, 0);
  const outputData = resultCtx.getImageData(0, 0, width, height);

  const block = state.pixelSize;
  const halfBlock = Math.floor(block / 2);

  for (let y = 0; y < height; y += block) {
    for (let x = 0; x < width; x += block) {

      // 🔥 FAST MASK CHECK (single alpha sample)
      const sampleX = Math.min(x + halfBlock, width - 1);
      const sampleY = Math.min(y + halfBlock, height - 1);
      const sampleIdx = (sampleY * width + sampleX) * 4;

      if (maskData.data[sampleIdx + 3] === 0) continue;

      const yLimit = Math.min(y + block, height);
      const xLimit = Math.min(x + block, width);

      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let yy = y; yy < yLimit; yy++) {
        for (let xx = x; xx < xLimit; xx++) {
          const idx = (yy * width + xx) * 4;
          r += sourceData.data[idx];
          g += sourceData.data[idx + 1];
          b += sourceData.data[idx + 2];
          count++;
        }
      }

      const avgR = (r / count) | 0;
      const avgG = (g / count) | 0;
      const avgB = (b / count) | 0;

      for (let yy = y; yy < yLimit; yy++) {
        for (let xx = x; xx < xLimit; xx++) {
          const idx = (yy * width + xx) * 4;
          outputData.data[idx] = avgR;
          outputData.data[idx + 1] = avgG;
          outputData.data[idx + 2] = avgB;
        }
      }
    }
  }

  resultCtx.putImageData(outputData, 0, 0);
  drawView(outputCtx, resultCanvas);

  refs.outputCanvas.hidden = false;
  refs.baseCanvas.hidden = true;
  refs.maskCanvas.hidden = true;
  state.hasResult = true;
  toggleExportButtons(true);
  refs.applyBtn.disabled = false;
  setStatus('Pixelation applied. Download or share your zoomed/cropped result.');
}

setRandomPrompt();
setStatus('Select a photo to begin.');
