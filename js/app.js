document.addEventListener("DOMContentLoaded", () => {

const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
const blurCanvas = document.getElementById("blurCanvas");

if (!baseCanvas || !maskCanvas || !blurCanvas) return;

const baseCtx = baseCanvas.getContext("2d");
const maskCtx = maskCanvas.getContext("2d");
const blurCtx = blurCanvas.getContext("2d");

const canvasContainer = document.getElementById("canvasContainer");
const canvasOverlay = document.getElementById("canvasOverlay");
const photoInput = document.getElementById("photoInput");

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

photoInput.addEventListener("change", () => {
  if (!photoInput.files.length) return;

  const reader = new FileReader();

  reader.onload = e => {
    const img = new Image();

    img.onload = () => {

      const containerWidth = canvasContainer.clientWidth;
      const containerHeight = canvasContainer.clientHeight;

      /* =============================
         BLUR BACKGROUND (COVER)
      ============================= */

      blurCanvas.width = containerWidth;
      blurCanvas.height = containerHeight;

      const coverScale = Math.max(
        containerWidth / img.width,
        containerHeight / img.height
      );

      const coverWidth = img.width * coverScale;
      const coverHeight = img.height * coverScale;

      const coverX = (containerWidth - coverWidth) / 2;
      const coverY = (containerHeight - coverHeight) / 2;

      blurCtx.clearRect(0, 0, containerWidth, containerHeight);
      blurCtx.drawImage(img, coverX, coverY, coverWidth, coverHeight);

      /* =============================
         MAIN IMAGE (FIT + CENTER)
      ============================= */

      const fitScale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height,
        1
      );

      const scaledWidth = Math.floor(img.width * fitScale);
      const scaledHeight = Math.floor(img.height * fitScale);

      baseCanvas.width = scaledWidth;
      baseCanvas.height = scaledHeight;

      maskCanvas.width = scaledWidth;
      maskCanvas.height = scaledHeight;

      baseCtx.clearRect(0, 0, scaledWidth, scaledHeight);
      baseCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      maskCtx.clearRect(0, 0, scaledWidth, scaledHeight);

      /* Proper centering via absolute positioning */

      const offsetX = (containerWidth - scaledWidth) / 2;
      const offsetY = (containerHeight - scaledHeight) / 2;

      baseCanvas.style.left = offsetX + "px";
      baseCanvas.style.top = offsetY + "px";

      maskCanvas.style.left = offsetX + "px";
      maskCanvas.style.top = offsetY + "px";

      canvasOverlay.classList.add("hidden");
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(photoInput.files[0]);
});

});