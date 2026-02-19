import { state } from "./state.js";

export function setupDrawing(maskCanvas) {
  const ctx = maskCanvas.getContext("2d");

  function getCoords(e) {
    const rect = maskCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - state.offsetX) / state.zoom;
    const y = (e.clientY - rect.top - state.offsetY) / state.zoom;
    return { x, y };
  }

  maskCanvas.addEventListener("mousedown", e => {
    if (state.mode !== "draw") return;

    state.history.push(
      ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    );

    draw(e);
    maskCanvas.onmousemove = draw;
  });

  window.addEventListener("mouseup", () => {
    maskCanvas.onmousemove = null;
  });

  function draw(e) {
    const { x, y } = getCoords(e);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, state.brushSize, 0, Math.PI * 2);
    ctx.fill();
  }
}
