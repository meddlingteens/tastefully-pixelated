import { state } from "./core/state.js";
import { loadImage } from "./core/imageLoader.js";
import { applyTransform, resetView } from "./core/transform.js";
import { setupDrawing } from "./core/draw.js";
import { applyPixelation } from "./core/pixelEngine.js";
import { updateWatermark } from "./monetization/watermark.js";
import { exportImage } from "./share/export.js";
import { shareImage } from "./share/share.js";

const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
const imageMeta = document.getElementById("imageMeta");

const photoBtn = document.getElementById("photoPickerBtn");
const photoInput = document.getElementById("photoInput");

const brushSlider = document.getElementById("brushSize");
const zoomSlider = document.getElementById("zoomLevel");

const drawBtn = document.getElementById("drawBtn");
const moveBtn = document.getElementById("moveBtn");
const undoBtn = document.getElementById("undoBtn");
const applyBtn = document.getElementById("applyBtn");
const restoreBtn = document.getElementById("restoreBtn");
const exportBtn = document.getElementById("exportBtn");
const shareBtn = document.getElementById("shareBtn");

updateWatermark();
setupDrawing(maskCanvas);

/* Controls */

const controls = {
  enable() {
    zoomSlider.disabled = false;
    drawBtn.disabled = false;
    moveBtn.disabled = false;
    undoBtn.disabled = false;
    applyBtn.disabled = false;
    exportBtn.disabled = false;
    shareBtn.disabled = false;
  }
};

/* Events */

photoBtn.onclick = () => photoInput.click();

photoInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  loadImage(file, baseCanvas, maskCanvas, imageMeta, controls);
};

brushSlider.oninput = e => {
  state.brushSize = parseInt(e.target.value);
};

zoomSlider.oninput = e => {
  state.zoom = parseFloat(e.target.value);
  applyTransform(baseCanvas, maskCanvas);
};

drawBtn.onclick = () => state.mode = "draw";
moveBtn.onclick = () => state.mode = "move";

applyBtn.onclick = () => applyPixelation(baseCanvas, maskCanvas);

restoreBtn.onclick = () => {
  if (state.applyHistory) {
    baseCanvas.getContext("2d").putImageData(state.applyHistory, 0, 0);
  }
};

exportBtn.onclick = () => exportImage(baseCanvas);
shareBtn.onclick = () => shareImage(baseCanvas);
