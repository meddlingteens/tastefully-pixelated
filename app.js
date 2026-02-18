document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- Elements ---------------- */

  const randomPrompt = document.getElementById('randomPrompt');
  const photoPickerBtn = document.getElementById('photoPickerBtn');
  const photoInput = document.getElementById('photoInput');

  const baseCanvas = document.getElementById('baseCanvas');
  const maskCanvas = document.getElementById('maskCanvas');
  const outputCanvas = document.getElementById('outputCanvas');

  const moveBtn = document.getElementById('moveBtn');
  const drawBtn = document.getElementById('drawBtn');
  const undoBtn = document.getElementById('undoBtn');
  const clearBtn = document.getElementById('clearMaskBtn');
  const applyBtn = document.getElementById('applyBtn');

  const brushSizeInput = document.getElementById('brushSize');
  const pixelSizeInput = document.getElementById('pixelSize');

  const fileInfoBtn = document.getElementById('fileInfoBtn');
  const infoModal = document.getElementById('infoModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  const baseCtx = baseCanvas.getContext('2d');
  const maskCtx = maskCanvas.getContext('2d');
  const outputCtx = outputCanvas.getContext('2d');

  let brushSize = parseInt(brushSizeInput.value, 10);
  let pixelSize = parseInt(pixelSizeInput.value, 10);

  let drawing = false;
  let history = [];
  let mode = 'position'; // FIXED: mode control

  /* ---------------- Mode Switching ---------------- */

  function setMode(newMode) {
    mode = newMode;

    moveBtn.classList.remove('active');
    drawBtn.classList.remove('active');

    if (mode === 'position') {
      moveBtn.classList.add('active');
      maskCanvas.style.pointerEvents = 'none';
    } else {
      drawBtn.classList.add('active');
      maskCanvas.style.pointerEvents = 'auto';
    }
  }

  moveBtn.addEventListener('click', () => setMode('position'));
  drawBtn.addEventListener('click', () => setMode('draw'));

  /* ---------------- Witty Prompt ---------------- */

  const prompts = [
    'Show some class and blur your junk.',
    'Hide your shame.',
    'Blur the junk in the trunk.',
    'Place a pixel where the good Lord split ya.',
    'Cover that already.',
    'Gross, just gross.'
  ];

  randomPrompt.textContent =
    prompts[Math.floor(Math.random() * prompts.length)];

  /* ---------------- File Picker ---------------- */

  photoPickerBtn.addEventListener('click', () => photoInput.click());

  photoInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {

        baseCanvas.width = img.width;
        baseCanvas.height = img.height;
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        outputCanvas.width = img.width;
        outputCanvas.height = img.height;

        baseCtx.clearRect(0, 0, img.width, img.height);
        baseCtx.drawImage(img, 0, 0);

        maskCtx.clearRect(0, 0, img.width, img.height);

        moveBtn.disabled = false;
        drawBtn.disabled = false;
        applyBtn.disabled = false;
        clearBtn.disabled = false;

        setMode('position'); // default
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* ---------------- Brush Size ---------------- */

  brushSizeInput.addEventListener('input', () => {
    brushSize = parseInt(brushSizeInput.value, 10);
  });

  pixelSizeInput.addEventListener('input', () => {
    pixelSize = parseInt(pixelSizeInput.value, 10);
  });

  /* ---------------- Drawing ---------------- */

  maskCanvas.addEventListener('mousedown', startDraw);
  maskCanvas.addEventListener('mousemove', draw);
  maskCanvas.addEventListener('mouseup', stopDraw);
  maskCanvas.addEventListener('mouseleave', stopDraw);

  function startDraw(e) {
    if (mode !== 'draw') return; // FIXED
    drawing = true;
    saveHistory();
    draw(e);
  }

  function draw(e) {
    if (!drawing || mode !== 'draw') return;

    const rect = maskCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (maskCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (maskCanvas.height / rect.height);

    maskCtx.fillStyle = "rgba(255,255,255,1)";
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
    maskCtx.fill();
  }

  function stopDraw() {
    drawing = false;
  }

  /* ---------------- Undo ---------------- */

  function saveHistory() {
    history.push(maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height));
    if (history.length > 20) history.shift();
    undoBtn.disabled = false;
  }

  undoBtn.addEventListener('click', () => {
    if (!history.length) return;
    const last = history.pop();
    maskCtx.putImageData(last, 0, 0);
    undoBtn.disabled = history.length === 0;
  });

  /* ---------------- Clear ---------------- */

  clearBtn.addEventListener('click', () => {
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    history = [];
    undoBtn.disabled = true;
  });

  /* ---------------- Apply Pixelation ---------------- */

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

  /* ---------------- Modal ---------------- */

  fileInfoBtn.addEventListener('click', () => {
    infoModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    infoModal.classList.add('hidden');
  });

  infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) {
      infoModal.classList.add('hidden');
    }
  });

});
