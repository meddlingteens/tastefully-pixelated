document.addEventListener("DOMContentLoaded", () => {

/* ELEMENTS */

const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
const blurCanvas = document.getElementById("blurCanvas");

const container = document.getElementById("canvasContainer");
const overlay = document.getElementById("canvasOverlay");
const photoInput = document.getElementById("photoInput");
const selectBtn = document.getElementById("canvasSelectBtn");

const subheadEl = document.getElementById("subhead");
const bannerHeadlineEl = document.getElementById("bannerHeadline");

const baseCtx = baseCanvas.getContext("2d");
const blurCtx = blurCanvas.getContext("2d");

/* RANDOM COPY */

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

/* SELECT BUTTON */

if (selectBtn) {
  selectBtn.addEventListener("click", () => {
    photoInput.click();
  });
}

/* IMAGE LOAD */

photoInput.addEventListener("change", () => {

  if (!photoInput.files.length) return;

  const reader = new FileReader();

  reader.onload = e => {

    const img = new Image();

    img.onload = () => {

      const cw = container.clientWidth;
      const ch = container.clientHeight;

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

      const fitScale = Math.min(cw/img.width, ch/img.height, 1);
      const w = img.width * fitScale;
      const h = img.height * fitScale;

      baseCanvas.width = w;
      baseCanvas.height = h;

      baseCtx.drawImage(img,0,0,w,h);

      baseCanvas.style.left = ((cw-w)/2)+"px";
      baseCanvas.style.top  = ((ch-h)/2)+"px";

      overlay.classList.add("hidden");
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(photoInput.files[0]);
});

});