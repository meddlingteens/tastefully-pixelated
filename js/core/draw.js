import { state } from "./state.js";

export function applyPixelation(baseCanvas, maskCanvas) {
  const baseCtx = baseCanvas.getContext("2d");
  const maskCtx = maskCanvas.getContext("2d");

  const w = baseCanvas.width;
  const h = baseCanvas.height;

  const baseData = baseCtx.getImageData(0, 0, w, h);
  const maskData = maskCtx.getImageData(0, 0, w, h);

  state.applyHistory = baseCtx.getImageData(0, 0, w, h);

  const result = baseCtx.createImageData(w, h);
  result.data.set(baseData.data);

  const block = 12;

  for (let y = 0; y < h; y += block) {
    for (let x = 0; x < w; x += block) {

      let masked = false;

      for (let yy = y; yy < y + block && yy < h; yy++) {
        for (let xx = x; xx < x + block && xx < w; xx++) {
          if (maskData.data[(yy * w + xx) * 4 + 3] > 0) {
            masked = true;
            break;
          }
        }
        if (masked) break;
      }

      if (!masked) continue;

      let r = 0, g = 0, b = 0, count = 0;

      for (let yy = y; yy < y + block && yy < h; yy++) {
        for (let xx = x; xx < x + block && xx < w; xx++) {
          const i = (yy * w + xx) * 4;
          r += baseData.data[i];
          g += baseData.data[i + 1];
          b += baseData.data[i + 2];
          count++;
        }
      }

      r /= count; g /= count; b /= count;

      for (let yy = y; yy < y + block && yy < h; yy++) {
        for (let xx = x; xx < x + block && xx < w; xx++) {
          const i = (yy * w + xx) * 4;
          if (maskData.data[i + 3] > 0) {
            result.data[i] = r;
            result.data[i + 1] = g;
            result.data[i + 2] = b;
          }
        }
      }
    }
  }

  baseCtx.putImageData(result, 0, 0);
  maskCtx.clearRect(0, 0, w, h);
}
