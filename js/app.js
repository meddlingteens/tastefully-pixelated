document.addEventListener("DOMContentLoaded", () => {

const state = {
  originalImageData: null
};

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

      /* ----- BLUR COVER ----- */

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
      blurCtx.drawImage(
        img,
        coverX,
        coverY,
        coverWidth,
        coverHeight
      );

      /* ----- MAIN FIT ----- */

      const fitScale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height,
        1
      );

      const scaledWidth = Math.floor(img.width * fitScale);
      const scaledHeight = Math.floor(img.height * fitScale);

      baseCanvas.width = maskCanvas.width = scaledWidth;
      baseCanvas.height = maskCanvas.height = scaledHeight;

      baseCtx.clearRect(0, 0, scaledWidth, scaledHeight);
      baseCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      state.originalImageData =
        baseCtx.getImageData(0, 0, scaledWidth, scaledHeight);

      maskCtx.clearRect(0, 0, scaledWidth, scaledHeight);

      canvasOverlay.classList.add("hidden");
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(photoInput.files[0]);
});

});