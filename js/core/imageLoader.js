import { state } from "./state.js";
import { applyTransform } from "./transform.js";

export function loadImage(file, baseCanvas, maskCanvas, imageMeta, controls) {
  const reader = new FileReader();

  reader.onload = e => {
    const img = new Image();

    img.onload = () => {
      const container = document.getElementById("canvasContainer");

      const maxW = container.clientWidth;
      const maxH = container.clientHeight;

      const scale = Math.min(maxW / img.width, maxH / img.height, 1);

      const w = Math.floor(img.width * scale);
      const h = Math.floor(img.height * scale);

      baseCanvas.width = maskCanvas.width = w;
      baseCanvas.height = maskCanvas.height = h;

      const ctx = baseCanvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      state.originalWidth = img.width;
      state.originalHeight = img.height;
      state.imageLoaded = true;

      imageMeta.innerHTML =
        `Original: ${img.width} × ${img.height}<br>` +
        `Scaled: ${w} × ${h}`;

      controls.enable();
      applyTransform(baseCanvas, maskCanvas);
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
}
