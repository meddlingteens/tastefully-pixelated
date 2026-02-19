document.addEventListener("DOMContentLoaded", () => {

  /* Taglines */

  const taglines = [
    "Just, eeuuuuu.",
    "Ain't no one wanna see that.",
    "Hide your shame.",
    "Seriously, that's gross.",
    "I can't unsee that.",
    "WTF?",
    "Place a pixel where the good lord split yea.",
    "Leave everything for your imagination.",
    "Uh, really?",
    "Yeah, nah, yeah, nah, nah, nah.",
    "I think I just puked a little in my mouth.",
    "Don't be fickle, apply a pixel."
  ];

  const bannerHeadlines = [
    "Buy something you really don't need",
    "Shop mofo. Buy, buy, buy",
    "This is where you can advertise your useless crap",
    "What the world really needs is more advertising",
    "Wanna buy one of those endlessly spinning top things?",
    "Sell stuff here, bitches"
  ];

  document.getElementById("randomPrompt").textContent =
    taglines[Math.floor(Math.random() * taglines.length)];

  document.getElementById("bannerHeadline").textContent =
    bannerHeadlines[Math.floor(Math.random() * bannerHeadlines.length)];

  const photoPickerBtn = document.getElementById("photoPickerBtn");
  const photoInput = document.getElementById("photoInput");
  const baseCanvas = document.getElementById("baseCanvas");
  const maskCanvas = document.getElementById("maskCanvas");
  const container = document.getElementById("canvasContainer");
  const imageMeta = document.getElementById("imageMeta");
  const zoomSlider = document.getElementById("zoomLevel");

  const baseCtx = baseCanvas.getContext("2d");
  const maskCtx = maskCanvas.getContext("2d");

  let zoom = 1;

  photoPickerBtn.addEventListener("click", () => {
    photoInput.click();
  });

  photoInput.addEventListener("change", (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = ev => {
      const img = new Image();

      img.onload = () => {

        const maxW = container.clientWidth;
        const maxH = container.clientHeight;

        const scale = Math.min(maxW / img.width, maxH / img.height, 1);

        const w = Math.floor(img.width * scale);
        const h = Math.floor(img.height * scale);

        baseCanvas.width = w;
        baseCanvas.height = h;
        maskCanvas.width = w;
        maskCanvas.height = h;

        baseCtx.clearRect(0,0,w,h);
        baseCtx.drawImage(img, 0, 0, w, h);

        maskCtx.clearRect(0,0,w,h);

        imageMeta.textContent = `${img.width} × ${img.height}`;

        zoomSlider.disabled = false;
        zoomSlider.value = 1;
        zoom = 1;
        applyZoom();
      };

      img.src = ev.target.result;
    };

    reader.readAsDataURL(file);
  });

  function applyZoom() {
    const transform = `scale(${zoom})`;
    baseCanvas.style.transform = transform;
    maskCanvas.style.transform = transform;
  }

  zoomSlider.addEventListener("input", (e) => {
    zoom = parseFloat(e.target.value);
    applyZoom();
  });

});
