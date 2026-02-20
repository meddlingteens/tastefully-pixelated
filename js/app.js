document.addEventListener("DOMContentLoaded", () => {

/* STATE */

const state = {
  imageLoaded: false
};

/* ELEMENTS */

const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
const blurCanvas = document.getElementById("blurCanvas");

const container = document.getElementById("canvasContainer");
const overlay = document.getElementById("canvasOverlay");
const photoInput = document.getElementById("photoInput");
const selectBtn = document.getElementById("canvasSelectBtn");

const baseCtx = baseCanvas.getContext("2d");
const blurCtx = blurCanvas.getContext("2d");

/* SELECT BUTTON FIX */

if (selectBtn) {
  selectBtn.addEventListener("click", () => {
    photoInput.click();
  });
}

/* FADE IN */

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

/* IMAGE LOADING */

photoInput.addEventListener("change", () => {

  if (!photoInput.files.length) return;

  const reader = new FileReader();

  reader.onload = e => {

    const img = new Image();

    img.onload = () => {

      const cw = container.clientWidth;
      const ch = container.clientHeight;

      /* Blur background */

      blurCanvas.width = cw;
      blurCanvas.height = ch;

      const coverScale = Math.max(cw/img.width, ch/img.height);
      const coverW = img.width * coverScale;
      const coverH = img.height * coverScale;

      blurCtx.clearRect(0,0,cw,ch);
      blurCtx.drawImage(
        img,
        (cw-coverW)/2,
        (ch-coverH)/2,
        coverW,
        coverH
      );

      /* Fit main */

      const fitScale = Math.min(cw/img.width, ch/img.height, 1);
      const w = Math.floor(img.width * fitScale);
      const h = Math.floor(img.height * fitScale);

      baseCanvas.width = w;
      baseCanvas.height = h;

      baseCtx.clearRect(0,0,w,h);
      baseCtx.drawImage(img,0,0,w,h);

      baseCanvas.style.left = ((cw-w)/2)+"px";
      baseCanvas.style.top  = ((ch-h)/2)+"px";

      overlay.classList.add("hidden");
      state.imageLoaded = true;
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(photoInput.files[0]);
});

});