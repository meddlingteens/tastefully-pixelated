document.addEventListener("DOMContentLoaded", () => {

/* =====================================================
   ELEMENTS
===================================================== */

const baseCanvas = document.getElementById("baseCanvas");
const blurCanvas = document.getElementById("blurCanvas");
const container = document.getElementById("canvasContainer");
const overlay = document.getElementById("canvasOverlay");
const photoInput = document.getElementById("photoInput");
const selectBtn = document.getElementById("canvasSelectBtn");

const subheadEl = document.getElementById("subhead");
const bannerHeadlineEl = document.getElementById("bannerHeadline");

const drawBtn = document.getElementById("drawBtn");
const moveBtn = document.getElementById("moveBtn");
const undoBtn = document.getElementById("undoBtn");
const applyBtn = document.getElementById("applyBtn");
const restoreBtn = document.getElementById("restoreBtn");
const exportBtn = document.getElementById("exportBtn");
const shareBtn = document.getElementById("shareBtn");

const brushSlider = document.getElementById("brushSlider");
const pixelSlider = document.getElementById("pixelSlider");
const zoomSlider = document.getElementById("zoomSlider");

const baseCtx = baseCanvas.getContext("2d");
const blurCtx = blurCanvas.getContext("2d");

/* =====================================================
   STATE
===================================================== */

let mode = "draw";
let brushSize = parseInt(brushSlider.value);
let pixelSize = parseInt(pixelSlider.value);
let zoom = 1;
let isDragging = false;
let undoStack = [];
let originalImageData = null;

/* =====================================================
   RANDOM COPY (UNCHANGED UX)
===================================================== */

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

if (subheadEl)
  subheadEl.textContent =
    subheads[Math.floor(Math.random() * subheads.length)];

if (bannerHeadlineEl)
  bannerHeadlineEl.textContent =
    bannerHeadlines[Math.floor(Math.random() * bannerHeadlines.length)];

/* =====================================================
   SELECT BUTTON
===================================================== */

if (selectBtn)
  selectBtn.addEventListener("click", () => {
    photoInput.click();
  });

/* =====================================================
   IMAGE LOAD
===================================================== */

photoInput.addEventListener("change", () => {

  if (!photoInput.files.length) return;

  const reader = new FileReader();

  reader.onload = e => {

    const img = new Image();

    img.onload = () => {

      const cw = container.clientWidth;
      const ch = container.clientHeight;

      /* ---- Blur Cover ---- */

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

      /* ---- Fit Main ---- */

      const fitScale = Math.min(cw/img.width, ch/img.height, 1);
      const w = Math.floor(img.width * fitScale);
      const h = Math.floor(img.height * fitScale);

      baseCanvas.width = w;
      baseCanvas.height = h;

      baseCtx.drawImage(img,0,0,w,h);

      originalImageData =
        baseCtx.getImageData(0,0,w,h);

      baseCanvas.style.left = ((cw-w)/2)+"px";
      baseCanvas.style.top  = ((ch-h)/2)+"px";

      baseCanvas.style.transformOrigin = "center center";
      baseCanvas.style.transform = "scale(1)";
      zoom = 1;

      overlay.classList.add("hidden");
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(photoInput.files[0]);
});

/* =====================================================
   PIXELATE FUNCTION
===================================================== */

function pixelate(x,y){

  const size = brushSize;
  const px = pixelSize;

  const startX = x - size/2;
  const startY = y - size/2;

  const imgData =
    baseCtx.getImageData(startX,startY,size,size);

  for(let yy=0; yy<size; yy+=px){
    for(let xx=0; xx<size; xx+=px){

      const i = ((yy*size)+xx)*4;
      const r = imgData.data[i];
      const g = imgData.data[i+1];
      const b = imgData.data[i+2];

      baseCtx.fillStyle = `rgb(${r},${g},${b})`;
      baseCtx.fillRect(
        startX+xx,
        startY+yy,
        px,
        px
      );
    }
  }
}

/* =====================================================
   DRAW MODE
===================================================== */

baseCanvas.addEventListener("mousedown", e=>{
  if(mode!=="draw") return;

  undoStack.push(
    baseCtx.getImageData(0,0,baseCanvas.width,baseCanvas.height)
  );

  const rect = baseCanvas.getBoundingClientRect();

  pixelate(
    (e.clientX-rect.left)/zoom,
    (e.clientY-rect.top)/zoom
  );
});

baseCanvas.addEventListener("mousemove", e=>{
  if(e.buttons!==1 || mode!=="draw") return;

  const rect = baseCanvas.getBoundingClientRect();

  pixelate(
    (e.clientX-rect.left)/zoom,
    (e.clientY-rect.top)/zoom
  );
});

/* =====================================================
   POSITION MODE
===================================================== */

baseCanvas.addEventListener("mousedown", ()=>{
  if(mode==="position") isDragging=true;
});

window.addEventListener("mouseup", ()=>{
  isDragging=false;
});

window.addEventListener("mousemove", e=>{
  if(!isDragging) return;

  baseCanvas.style.left =
    (parseFloat(baseCanvas.style.left)+e.movementX)+"px";

  baseCanvas.style.top =
    (parseFloat(baseCanvas.style.top)+e.movementY)+"px";
});

/* =====================================================
   BUTTONS
===================================================== */

drawBtn.addEventListener("click", ()=> mode="draw");
moveBtn.addEventListener("click", ()=> mode="position");

undoBtn.addEventListener("click", ()=>{
  if(!undoStack.length) return;
  baseCtx.putImageData(undoStack.pop(),0,0);
});

applyBtn.addEventListener("click", ()=>{
  undoStack=[];
});

restoreBtn.addEventListener("click", ()=>{
  if(originalImageData)
    baseCtx.putImageData(originalImageData,0,0);
});

exportBtn.addEventListener("click", ()=>{
  const link=document.createElement("a");
  link.download="pixelated.png";
  link.href=baseCanvas.toDataURL();
  link.click();
});

shareBtn.addEventListener("click", async ()=>{
  if(!navigator.share) return;

  const blob = await (await fetch(
    baseCanvas.toDataURL()
  )).blob();

  const file=new File(
    [blob],
    "pixelated.png",
    {type:"image/png"}
  );

  navigator.share({ files:[file] });
});

/* =====================================================
   SLIDERS
===================================================== */

brushSlider.addEventListener("input",
  e=>brushSize=parseInt(e.target.value));

pixelSlider.addEventListener("input",
  e=>pixelSize=parseInt(e.target.value));

zoomSlider.addEventListener("input", e=>{

  zoom=parseFloat(e.target.value);

  baseCanvas.style.transformOrigin="center center";
  baseCanvas.style.transform=`scale(${zoom})`;

});

});