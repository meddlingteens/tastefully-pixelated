import { state } from "../core/state.js";

export function exportImage(baseCanvas) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = baseCanvas.width;
  tempCanvas.height = baseCanvas.height;
  const ctx = tempCanvas.getContext("2d");

  ctx.drawImage(baseCanvas, 0, 0);

  if (!state.isPro) {
    ctx.font = "14px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "right";
    ctx.fillText(
      "Another Tastefully Pixelated creation",
      tempCanvas.width - 10,
      tempCanvas.height - 25
    );
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(
      "www.tastefullypixelated.com",
      tempCanvas.width - 10,
      tempCanvas.height - 10
    );
  }

  const link = document.createElement("a");
  link.download = "tastefully-pixelated.png";
  link.href = tempCanvas.toDataURL();
  link.click();
}
