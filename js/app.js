document.addEventListener("DOMContentLoaded", () => {

/* ==========================================
   STATE
========================================== */

const state = {
  imageLoaded: false
};

/* ==========================================
   ELEMENTS
========================================== */

const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
const blurCanvas = document.getElementById("blurCanvas");

if (!baseCanvas || !maskCanvas || !blurCanvas) return;

const baseCtx = baseCanvas.getContext("2d");
const maskCtx = maskCanvas.getContext("2d");
const blurCtx = blurCanvas.getContext("2d");

const container = document.getElementById("canvasContainer");
const overlay = document.getElementById("canvasOverlay");
const photoInput = document.getElementById("photoInput");

const subheadEl = document.getElementById("subhead");
const bannerHeadlineEl = document.getElementById("bannerHeadline");

/* ==========================================
   RANDOM COPY RESTORE
========================================== */

const subheads = [
  "Just, eeuuuuu.",
  "Ain't no one wanna see that.",
  "Hide your shame.",
  "Seriously, that's gross.",
  "I can't unsee that.",
  "Don't be fickle, apply a pixel."
];

const bannerHeadlines = [
  "Buy something you really don't need",
  "Shop mofo. Buy, buy, buy",
  "This is where you can advertise your useless crap",
  "What the world really needs is more advertising"
];

if (subheadEl) {
  subheadEl.textContent =
    subheads[Math.floor(Math.random() * subheads.length)];
}

if (bannerHeadlineEl) {
  bannerHeadlineEl.textContent =
    bannerHeadlines[Math.floor(Math.random() * bannerHeadlines.length)];
}

/* ==========================================
   FADE IN
========================================== */

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

/* ==========================================
   IMAGE LOADING (BLUR + PROPORTIONAL FIT)
========================================== */

photoInput.addEventListener("change", () => {

  if (!photoInput.files.length) return;

  const reader = new FileReader();

  reader.onload = e => {

    const img = new Image();

    img.onload = () => {

      const containerW = container.clientWidth;
      const containerH = container.clientHeight;

      /* ==========================
         BLUR BACKGROUND (COVER)
      ========================== */

      blurCanvas.width = containerW;
      blurCanvas.height = containerH;

      const coverScale = Math.max(
        containerW / img.width,
        containerH / img.height
      );

      const coverW = img.width * coverScale;
      const coverH = img.height * coverScale;

      const coverX = (containerW - coverW) / 2;
      const coverY = (containerH - coverH) / 2;

      blurCtx.clearRect(0, 0, containerW, containerH);
      blurCtx.drawImage(img, coverX, coverY, coverW, coverH);

      /* ==========================
         MAIN IMAGE (FIT)
      ========================== */

      const fitScale = Math.min(
        containerW / img.width,
        containerH / img.height,
        1
      );

      const scaledW = Math.floor(img.width * fitScale);
      const scaledH = Math.floor(img.height * fitScale);

      baseCanvas.width = scaledW;
      baseCanvas.height = scaledH;

      maskCanvas.width = scaledW;
      maskCanvas.height = scaledH;

      baseCtx.clearRect(0, 0, scaledW, scaledH);
      baseCtx.drawImage(img, 0, 0, scaledW, scaledH);

      maskCtx.clearRect(0, 0, scaledW, scaledH);

      /* ==========================
         CENTERING (NO TRANSFORMS)
      ========================== */

      const offsetX = Math.floor((containerW - scaledW) / 2);
      const offsetY = Math.floor((containerH - scaledH) / 2);

      baseCanvas.style.left = offsetX + "px";
      baseCanvas.style.top = offsetY + "px";

      maskCanvas.style.left = offsetX + "px";
      maskCanvas.style.top = offsetY + "px";

      overlay.classList.add("hidden");
      state.imageLoaded = true;
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(photoInput.files[0]);
});

});