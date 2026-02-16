const refs = {
  photoInput: document.getElementById('photoInput'),
  brushSize: document.getElementById('brushSize'),
  brushSizeValue: document.getElementById('brushSizeValue'),
  pixelSize: document.getElementById('pixelSize'),
  pixelSizeValue: document.getElementById('pixelSizeValue'),
  drawBtn: document.getElementById('drawBtn'),
  eraseBtn: document.getElementById('eraseBtn'),
  clearMaskBtn: document.getElementById('clearMaskBtn'),
  applyBtn: document.getElementById('applyBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  shareBtn: document.getElementById('shareBtn'),
  smsShare: document.getElementById('smsShare'),
  whatsAppShare: document.getElementById('whatsAppShare'),
  container: document.getElementById('canvasContainer'),
  baseCanvas: document.getElementById('baseCanvas'),
  maskCanvas: document.getElementById('maskCanvas'),
  outputCanvas: document.getElementById('outputCanvas'),
};

const baseCtx = refs.baseCanvas.getContext('2d', { willReadFrequently: true });
const maskCtx = refs.maskCanvas.getContext('2d', { willReadFrequently: true });
const outputCtx = refs.outputCanvas.getContext('2d');

const state = {
  brushSize: Number(refs.brushSize.value),
  pixelSize: Number(refs.pixelSize.value),
  mode: 'draw',
  drawing: false,
  imageLoaded: false,
  hasResult: false,
};

refs.brushSize.addEventListener('input', () => {
  state.brushSize = Number(refs.brushSize.value);
  refs.brushSizeValue.textContent = `${state.brushSize} px`;
});

refs.pixelSize.addEventListener('input', () => {
  state.pixelSize = Number(refs.pixelSize.value);
  refs.pixelSizeValue.textContent = `${state.pixelSize} px`;
});

refs.photoInput.addEventListener('change', loadPhoto);
refs.drawBtn.addEventListener('click', () => setMode('draw'));
refs.eraseBtn.addEventListener('click', () => setMode('erase'));
refs.clearMaskBtn.addEventListener('click', clearMask);
refs.applyBtn.addEventListener('click', applyPixelation);
refs.downloadBtn.addEventListener('click', downloadImage);
refs.shareBtn.addEventListener('click', shareImage);

refs.maskCanvas.addEventListener('pointerdown', (event) => {
  if (!state.imageLoaded) return;
  state.drawing = true;
  refs.maskCanvas.setPointerCapture(event.pointerId);
  paint(event);
});

refs.maskCanvas.addEventListener('pointermove', (event) => {
  if (!state.drawing || !state.imageLoaded) return;
  paint(event);
});

refs.maskCanvas.addEventListener('pointerup', (event) => {
  state.drawing = false;
  refs.maskCanvas.releasePointerCapture(event.pointerId);
});

refs.maskCanvas.addEventListener('pointercancel', () => {
  state.drawing = false;
});

function loadPhoto() {
  const [file] = refs.photoInput.files;
  if (!file) return;

  const url = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    const maxDimension = 1600;
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

    [refs.baseCanvas, refs.maskCanvas, refs.outputCanvas].forEach((canvas) => {
      canvas.width = width;
      canvas.height = height;
    });

    baseCtx.clearRect(0, 0, width, height);
    baseCtx.drawImage(image, 0, 0, width, height);

    clearMask();
    refs.baseCanvas.hidden = false;
    refs.maskCanvas.hidden = false;
    refs.container.classList.remove('disabled');
    state.imageLoaded = true;
    state.hasResult = false;
    refs.outputCanvas.hidden = true;
    refs.applyBtn.disabled = false;
    refs.drawBtn.disabled = false;
    refs.eraseBtn.disabled = false;
    refs.clearMaskBtn.disabled = false;
    setMode('draw');
    toggleExportButtons(false);

    URL.revokeObjectURL(url);
  };

  image.src = url;
}

function setMode(mode) {
  state.mode = mode;
  refs.drawBtn.classList.toggle('active', mode === 'draw');
  refs.eraseBtn.classList.toggle('active', mode === 'erase');
}

function clearMask() {
  maskCtx.clearRect(0, 0, refs.maskCanvas.width, refs.maskCanvas.height);
  renderMaskOverlay();
}

function paint(event) {
  const rect = refs.maskCanvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * refs.maskCanvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * refs.maskCanvas.height;

  maskCtx.save();
  maskCtx.beginPath();
  maskCtx.arc(x, y, state.brushSize, 0, Math.PI * 2);

  if (state.mode === 'draw') {
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.fillStyle = 'rgba(255, 255, 255, 1)';
  } else {
    maskCtx.globalCompositeOperation = 'destination-out';
    maskCtx.fillStyle = 'rgba(0, 0, 0, 1)';
  }

  maskCtx.fill();
  maskCtx.restore();
  renderMaskOverlay();
}

function renderMaskOverlay() {
  const maskImage = maskCtx.getImageData(0, 0, refs.maskCanvas.width, refs.maskCanvas.height);
  for (let i = 3; i < maskImage.data.length; i += 4) {
    if (maskImage.data[i] > 0) {
      maskImage.data[i - 3] = 223;
      maskImage.data[i - 2] = 115;
      maskImage.data[i - 1] = 255;
      maskImage.data[i] = 135;
    }
  }
  const overlay = document.createElement('canvas');
  overlay.width = refs.maskCanvas.width;
  overlay.height = refs.maskCanvas.height;
  const overlayCtx = overlay.getContext('2d');
  overlayCtx.putImageData(maskImage, 0, 0);

  refs.maskCanvas.style.backgroundImage = `url(${overlay.toDataURL('image/png')})`;
  refs.maskCanvas.style.backgroundSize = '100% 100%';
}

function applyPixelation() {
  if (!state.imageLoaded) return;

  const width = refs.baseCanvas.width;
  const height = refs.baseCanvas.height;

  const sourceData = baseCtx.getImageData(0, 0, width, height);
  const maskData = maskCtx.getImageData(0, 0, width, height);

  outputCtx.clearRect(0, 0, width, height);
  outputCtx.putImageData(sourceData, 0, 0);

  const outputData = outputCtx.getImageData(0, 0, width, height);
  const block = state.pixelSize;

  for (let y = 0; y < height; y += block) {
    for (let x = 0; x < width; x += block) {
      let maskFound = false;
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let yy = y; yy < Math.min(y + block, height); yy++) {
        for (let xx = x; xx < Math.min(x + block, width); xx++) {
          const index = (yy * width + xx) * 4;
          if (maskData.data[index + 3] > 0) {
            maskFound = true;
          }
          r += sourceData.data[index];
          g += sourceData.data[index + 1];
          b += sourceData.data[index + 2];
          count++;
        }
      }

      if (!maskFound) continue;
      const avgR = Math.round(r / count);
      const avgG = Math.round(g / count);
      const avgB = Math.round(b / count);

      for (let yy = y; yy < Math.min(y + block, height); yy++) {
        for (let xx = x; xx < Math.min(x + block, width); xx++) {
          const index = (yy * width + xx) * 4;
          outputData.data[index] = avgR;
          outputData.data[index + 1] = avgG;
          outputData.data[index + 2] = avgB;
        }
      }
    }
  }

  outputCtx.putImageData(outputData, 0, 0);
  refs.outputCanvas.hidden = false;
  refs.baseCanvas.hidden = true;
  refs.maskCanvas.hidden = true;
  state.hasResult = true;
  toggleExportButtons(true);
  updateShareLinks();
}

function toggleExportButtons(enabled) {
  refs.downloadBtn.disabled = !enabled;
  refs.shareBtn.disabled = !enabled;
  refs.smsShare.classList.toggle('disabled', !enabled);
  refs.smsShare.setAttribute('aria-disabled', String(!enabled));
  refs.whatsAppShare.classList.toggle('disabled', !enabled);
  refs.whatsAppShare.setAttribute('aria-disabled', String(!enabled));
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
  const blob = await canvasBlob();
  if (!blob) return;

  const file = new File([blob], 'tastefully-pixelated.png', { type: 'image/png' });
  const shareData = {
    title: 'Tastefully Pixelated',
    text: 'I added a custom pixelated bikini layer to this photo.',
    files: [file],
  };

  if (navigator.canShare?.(shareData) && navigator.share) {
    await navigator.share(shareData);
    return;
  }

  alert('Web Share with files is not supported on this device. Use Download then share manually.');
}

function updateShareLinks() {
  const message = encodeURIComponent('Check out my tastefully pixelated photo!');
  refs.smsShare.href = `sms:?&body=${message}`;
  refs.whatsAppShare.href = `https://wa.me/?text=${message}`;
}
