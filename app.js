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

function setStatus(message, level = 'info') {
  refs.status.textContent = message;
  refs.status.dataset.level = level;
}

function showUploadProgress(message, value = null) {
  refs.uploadProgress.hidden = false;
  refs.uploadProgressText.textContent = value === null ? message : `${message} ${value}%`;
}

function hideUploadProgress() {
  refs.uploadProgress.hidden = true;
}

function setCanvasSize(width, height) {
  [refs.baseCanvas, refs.maskCanvas, refs.outputCanvas].forEach((canvas) => {
    canvas.width = width;
    canvas.height = height;
  });
}

function resetEditorStateForFailedImage() {
  refs.dimensionsOverlay.hidden = true;
  state.imageLoaded = false;
  state.hasResult = false;
  refs.applyBtn.disabled = true;
  refs.drawBtn.disabled = true;
  refs.eraseBtn.disabled = true;
  refs.moveBtn.disabled = true;
  refs.resetViewBtn.disabled = true;
  refs.clearMaskBtn.disabled = true;
  refs.zoom.disabled = true;
  toggleExportButtons(false);
}

function initSourceCanvases(width, height) {
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  maskDataCanvas.width = width;
  maskDataCanvas.height = height;
  resultCanvas.width = width;
  resultCanvas.height = height;
  maskDataCtx.clearRect(0, 0, width, height);
}

function loadPhoto() {
  const [file] = refs.photoInput.files;
  if (!file) return;

  refs.selectedFileName.textContent = `Selected: ${file.name}`;

  if (!file.type.startsWith('image/')) {
    setStatus('Please choose an image file.', 'error');
    resetEditorStateForFailedImage();
    hideUploadProgress();
    return;
  }

  setStatus('Uploading image…');
  showUploadProgress('Uploading image…', 0);

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  showUploadProgress('Loading image…');
  image.src = objectUrl;

  image.onload = () => {
    const maxDimension = 1280;
    let { width, height } = image;
    if (width > maxDimension || height > maxDimension) {
      const ratio = width / height;
      if (ratio > 1) {
        width = maxDimension;
        height = Math.round(maxDimension / ratio);
      } else {
        height = maxDimension;
        width = Math.round(maxDimension * ratio);
      }
    }

    setCanvasSize(width, height);
    initSourceCanvases(width, height);

    refs.dimensionsOverlay.textContent = `${width} × ${height}`;
    refs.dimensionsOverlay.hidden = false;

    sourceCtx.clearRect(0, 0, width, height);
    sourceCtx.drawImage(image, 0, 0, width, height);

    refs.baseCanvas.hidden = false;
    refs.maskCanvas.hidden = false;
    refs.outputCanvas.hidden = true;
    refs.container.classList.remove('disabled');

    state.imageLoaded = true;
    state.hasResult = false;
    refs.applyBtn.disabled = false;
    refs.drawBtn.disabled = false;
    refs.eraseBtn.disabled = false;
    refs.moveBtn.disabled = false;
    refs.resetViewBtn.disabled = false;
    refs.clearMaskBtn.disabled = false;
    refs.zoom.disabled = false;
    toggleExportButtons(false);

    refs.zoom.value = '1';
    refs.zoomValue.textContent = '100%';
    resetView();
    setMode('draw');

    hideUploadProgress();
    setStatus('Image loaded.');
    URL.revokeObjectURL(objectUrl);
  };

  image.onerror = () => {
    hideUploadProgress();
    setStatus('This file could not be loaded. Try JPG or PNG (HEIC/WEBP may fail in some browsers).', 'error');
    resetEditorStateForFailedImage();
    URL.revokeObjectURL(objectUrl);
  };
}

function setMode(mode) {
  state.mode = mode;
  refs.drawBtn.classList.toggle('active', mode === 'draw');
  refs.eraseBtn.classList.toggle('active', mode === 'erase');
  refs.moveBtn.classList.toggle('active', mode === 'move');
  refs.maskCanvas.style.cursor = mode === 'move' ? 'grab' : 'crosshair';
}

function setZoom(newZoom) {
  if (!state.imageLoaded) return;
  const clamped = Math.max(1, Math.min(4, newZoom));
  const prevZoom = state.zoom;
  if (clamped === prevZoom) return;

  const centerX = refs.baseCanvas.width / 2;
  const centerY = refs.baseCanvas.height / 2;
  const imageX = (centerX - state.offsetX) / prevZoom;
  const imageY = (centerY - state.offsetY) / prevZoom;

  state.zoom = clamped;
  state.offsetX = centerX - imageX * clamped;
  state.offsetY = centerY - imageY * clamped;
  clampPan();

  refs.zoomValue.textContent = `${Math.round(clamped * 100)}%`;
  showEditorFromCurrentView();
}

function resetView() {
  state.zoom = 1;
  state.offsetX = 0;
  state.offsetY = 0;
  refs.zoom.value = '1';
  refs.zoomValue.textContent = '100%';
  showEditorFromCurrentView();
}

function clampPan() {
  const viewWidth = refs.baseCanvas.width;
  const viewHeight = refs.baseCanvas.height;
  const scaledWidth = sourceCanvas.width * state.zoom;
  const scaledHeight = sourceCanvas.height * state.zoom;

  const minX = Math.min(0, viewWidth - scaledWidth);
  const minY = Math.min(0, viewHeight - scaledHeight);
  const maxX = 0;
  const maxY = 0;

  state.offsetX = Math.max(minX, Math.min(maxX, state.offsetX));
  state.offsetY = Math.max(minY, Math.min(maxY, state.offsetY));
}

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
  paint(event);
}

function onPointerMove(event) {
  if (!state.imageLoaded || event.pointerId !== state.activePointerId) return;

  if (state.panning && state.mode === 'move') {
    const rect = refs.maskCanvas.getBoundingClientRect();
    const xScale = refs.maskCanvas.width / rect.width;
    const yScale = refs.maskCanvas.height / rect.height;

    const dx = (event.clientX - state.panStartX) * xScale;
    const dy = (event.clientY - state.panStartY) * yScale;

    state.offsetX += dx;
    state.offsetY += dy;
    state.panStartX = event.clientX;
    state.panStartY = event.clientY;
    clampPan();
    showEditorFromCurrentView();
    return;
  }

  if (state.drawing) {
    paint(event);
  }
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

function canvasPointToImagePoint(event) {
  const rect = refs.maskCanvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * refs.maskCanvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * refs.maskCanvas.height;

  return {
    x: (x - state.offsetX) / state.zoom,
    y: (y - state.offsetY) / state.zoom,
  };
}

function paint(event) {
  const point = canvasPointToImagePoint(event);

  if (point.x < 0 || point.x > sourceCanvas.width || point.y < 0 || point.y > sourceCanvas.height) {
    return;
  }

  maskDataCtx.save();
  maskDataCtx.beginPath();
  maskDataCtx.arc(point.x, point.y, state.brushSize / state.zoom, 0, Math.PI * 2);

  if (state.mode === 'draw') {
    maskDataCtx.globalCompositeOperation = 'source-over';
    maskDataCtx.fillStyle = 'rgba(255,255,255,1)';
  } else {
    maskDataCtx.globalCompositeOperation = 'destination-out';
    maskDataCtx.fillStyle = 'rgba(0,0,0,1)';
  }

  maskDataCtx.fill();
  maskDataCtx.restore();

  showEditorFromCurrentView();
}

function clearMask() {
  maskDataCtx.clearRect(0, 0, maskDataCanvas.width, maskDataCanvas.height);
  showEditorFromCurrentView();
}

function drawView(targetCtx, source) {
  const width = refs.baseCanvas.width;
  const height = refs.baseCanvas.height;
  targetCtx.clearRect(0, 0, width, height);
  targetCtx.fillStyle = '#120f18';
  targetCtx.fillRect(0, 0, width, height);

  targetCtx.save();
  targetCtx.translate(state.offsetX, state.offsetY);
  targetCtx.scale(state.zoom, state.zoom);
  targetCtx.drawImage(source, 0, 0);
  targetCtx.restore();
}

function renderMaskOverlay() {
  const width = refs.maskCanvas.width;
  const height = refs.maskCanvas.height;
  maskCtx.clearRect(0, 0, width, height);

  maskCtx.save();
  maskCtx.translate(state.offsetX, state.offsetY);
  maskCtx.scale(state.zoom, state.zoom);
  maskCtx.drawImage(maskDataCanvas, 0, 0);
  maskCtx.restore();

  maskCtx.globalCompositeOperation = 'source-in';
  maskCtx.fillStyle = 'rgba(223, 115, 255, 0.56)';
  maskCtx.fillRect(0, 0, width, height);
  maskCtx.globalCompositeOperation = 'source-over';
}

function showEditorFromCurrentView() {
  if (!state.imageLoaded) return;
  drawView(baseCtx, sourceCanvas);
  renderMaskOverlay();

  if (state.hasResult) {
    state.hasResult = false;
    refs.outputCanvas.hidden = true;
    refs.baseCanvas.hidden = false;
    refs.maskCanvas.hidden = false;
    toggleExportButtons(false);
    setStatus('View changed. Re-apply pixelation to export/share this zoomed crop.');
  }
}

function hasMaskPixels() {
  const data = maskDataCtx.getImageData(0, 0, maskDataCanvas.width, maskDataCanvas.height).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) return true;
  }
  return false;
}

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

  for (let y = 0; y < height; y += block) {
    for (let x = 0; x < width; x += block) {
      let maskFound = false;
      const yLimit = Math.min(y + block, height);
      const xLimit = Math.min(x + block, width);

      for (let yy = y; yy < yLimit && !maskFound; yy++) {
        for (let xx = x; xx < xLimit; xx++) {
          const idx = (yy * width + xx) * 4;
          if (maskData.data[idx + 3] > 0) {
            maskFound = true;
            break;
          }
        }
      }

      if (!maskFound) continue;

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
          count += 1;
        }
      }

      const avgR = Math.round(r / count);
      const avgG = Math.round(g / count);
      const avgB = Math.round(b / count);

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

function toggleExportButtons(enabled) {
  refs.downloadBtn.disabled = !enabled;
  refs.shareBtn.disabled = !enabled;
}

async function canvasBlob() {
  const target = state.hasResult ? refs.outputCanvas : refs.baseCanvas;
  return new Promise((resolve) => {
    target.toBlob((blob) => resolve(blob), 'image/png', 0.98);
  });
}

async function downloadImage() {
  const blob = await canvasBlob();
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'tastefully-pixelated.png';
  anchor.click();
  URL.revokeObjectURL(url);
}

async function shareImage() {
  if (refs.shareBtn.disabled) return;

  const caption = `I edited this NSFW image into something you can share with your HR department using Tastefully Pixelated! You’re welcome!

www.tastefullypixelated.com`;

  const blob = await canvasBlob();
  if (!blob) {
    setStatus('Could not prepare image for sharing.', 'error');
    return;
  }

  const file = new File([blob], 'tastefully-pixelated.png', { type: 'image/png' });
  const shareData = {
    title: 'Tastefully Pixelated',
    text: caption,
    files: [file],
  };

  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      setStatus('Share sheet opened with your edited image and caption.');
    } catch {
      setStatus('Sharing was cancelled.', 'error');
    }
    return;
  }

  const imageUrl = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = imageUrl;
  downloadAnchor.download = 'tastefully-pixelated.png';
  downloadAnchor.click();
  URL.revokeObjectURL(imageUrl);
  setStatus('Your browser cannot share image files directly. Downloaded the image instead.', 'error');
}


setRandomPrompt();
setStatus('Select a photo to begin.');
