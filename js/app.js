import { state } from "./core/state.js";
import { loadImage } from "./core/imageLoader.js";
import { applyTransform } from "./core/transform.js";
import { setupDrawing } from "./core/draw.js";
import { applyPixelation } from "./core/pixelEngine.js";
import { updateWatermark } from "./monetization/watermark.js";
import { exportImage } from "./share/export.js";
import { shareImage } from "./share/share.js";

/* =========================
   DOM References
========================= */

const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
const imageMeta = document.getElementById("imageMeta");

const canvasContainer = document.getElementById("canvasContainer");
const canvasOverlay = document.getElementById("canvasOverlay");
const canvasSelectBtn = document.getElementById("canvasSelectBtn");
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

/* =========================
   Init
========================= */

updateWatermark();
setupDrawing(maskCanvas);

if (canvasContainer) canvasContainer.classList.add("empty");

/* =========================
   Active Button System
========================= */

function setActiveButton(activeBtn) {
  const buttons = document.querySelectorAll(".button-row button");
  buttons.forEach(btn => btn.classList.remove("active"));
  if (activeBtn) activeBtn.classList.add("active");
}

function flashButton(btn) {
  if (!btn) return;
  btn.classList.add("active");
  setTimeout(() => {
    btn.classList.remove("active");
  }, 300);
}

/* =========================
   Enable Controls
========================= */

const controls = {
  enable() {
    if (zoomSlider) zoomSlider.disabled = false;
    if (drawBtn) drawBtn.disabled = false;
    if (moveBtn) moveBtn.disabled = false;
    if (undoBtn) undoBtn.disabled = false;
    if (applyBtn) applyBtn.disabled = false;
    if (restoreBtn) restoreBtn.disabled = false;
    if (exportBtn) exportBtn.disabled = false;
    if (shareBtn) shareBtn.disabled = false;

    // Default mode
    state.mode = "draw";
    setActiveButton(drawBtn);
  }
};

/* =========================
   Canvas Click (Before Load)
========================= */

if (canvasContainer && photoInput) {
  canvasContainer.onclick = () => {
    if (!state.imageLoaded) {
      photoInput.click();
    }
  };
}

if (canvasSelectBtn && photoInput) {
  canvasSelectBtn.onclick = (e) => {
    e.stopPropagation();
    photoInput.click();
  };
}

/* =========================
   Image Load
========================= */

if (photoInput) {
  photoInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    loadImage(file, baseCanvas, maskCanvas, imageMeta, controls);

    if (canvasOverlay) canvasOverlay.classList.add("hidden");
    if (canvasContainer) {
      canvasContainer.classList.remove("empty");
      canvasContainer.classList.add("editing");
    }
  };
}

/* =========================
   Sliders
========================= */

if (brushSlider) {
  brushSlider.oninput = (e) => {
    state.brushSize = parseInt(e.target.value);
  };
}

if (zoomSlider) {
  zoomSlider.oninput = (e) => {
    state.zoom = parseFloat(e.target.value);
    applyTransform(baseCanvas, maskCanvas);
  };
}

/* =========================
   Mode Buttons
========================= */

if (drawBtn) {
  drawBtn.onclick = () => {
    state.mode = "draw";
    setActiveButton(drawBtn);
  };
}

if (moveBtn) {
  moveBtn.onclick = () => {
    state.mode = "move";
    setActiveButton(moveBtn);
  };
}

/* =========================
   Action Buttons
========================= */

if (undoBtn) {
  undoBtn.onclick = () => {
    if (state.history.length > 0) {
      const ctx = maskCanvas.getContext("2d");
      ctx.putImageData(state.history.pop(), 0, 0);
      flashButton(undoBtn);
    }
  };
}

if (applyBtn) {
  applyBtn.onclick = () => {
    applyPixelation(baseCanvas, maskCanvas);
    flashButton(applyBtn);
  };
}

if (restoreBtn) {
  restoreBtn.onclick = () => {
    if (state.applyHistory) {
      baseCanvas
        .getContext("2d")
        .putImageData(state.applyHistory, 0, 0);
      flashButton(restoreBtn);
    }
  };
}

if (exportBtn) {
  exportBtn.onclick = () => {
    exportImage(baseCanvas);
    flashButton(exportBtn);
  };
}

if (shareBtn) {
  shareBtn.onclick = () => {
    shareImage(baseCanvas);
    flashButton(shareBtn);
  };
}
