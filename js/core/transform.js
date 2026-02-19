import { state } from "./state.js";

export function applyTransform(baseCanvas, maskCanvas) {
  const t = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom})`;
  baseCanvas.style.transform = t;
  maskCanvas.style.transform = t;
}

export function resetView(baseCanvas, maskCanvas, zoomSlider) {
  state.zoom = 1;
  state.offsetX = 0;
  state.offsetY = 0;
  zoomSlider.value = 1;
  applyTransform(baseCanvas, maskCanvas);
}
