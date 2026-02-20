document.addEventListener("DOMContentLoaded", () => {

/* =====================================================
   ELEMENTS
===================================================== */

const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
const blurCanvas = document.getElementById("blurCanvas");
const container = document.getElementById("canvasContainer");
const overlay = document.getElementById("canvasOverlay");
const photoInput = document.getElementById("photoInput");
const selectBtn = document.getElementById("canvasSelectBtn");

const drawBtn = document.getElementById("drawBtn");
const moveBtn = document.getElementById("moveBtn");
const undoBtn = document.getElementById("undoBtn");
const applyBtn = document.getElementById("applyBtn");
const restoreBtn = document.getElementById("restoreBtn");
const exportBtn = document.getElementById("exportBtn");

const brushSlider = document.getElementById("brushSlider");
const pixelSlider = document.getElementById("pixelSlider");
const zoomSlider = document.getElementById("zoomSlider");

const baseCtx = baseCanvas.getContext("2d");
const maskCtx = maskCanvas.getContext("2d");
const blurCtx = blurCanvas.getContext("2d");

/* =====================================================
   STATE
===================================================== */

let mode = "draw";
let brushSize = parseInt(brushSlider.value);
let pixelSize = parseInt(pixelSlider.value);
let zoom = 1;
let isDragging = false;
let originalImageData = null;
let maskUndoStack = [];

/* =====================================================
   SELECT BUTTON
===================================================== */

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

      /* ---- Blur ---- */

      blurCanvas.width = cw;
      blurCanvas.height = ch;

      const coverScale = Math.max(cw/img.width, ch/img.height);
      const coverW = img.width * coverScale;
      const coverH = img.height * coverScale;

      blurCtx.drawImage(
        img,
        (cw-coverW)/2,
        (ch-coverH)/2,
        coverW,
        coverH
      );

      /* ---- Fit ---- */

      const fitScale = Math.min(cw/img.width, ch/img.height, 1);
      const w = Math.floor(img.width * fitScale);
      const h = Math.floor(img.height * fitScale);

      baseCanvas.width = w;
      baseCanvas.height = h;
      maskCanvas.width = w;
      maskCanvas.height = h;

      baseCtx.drawImage(img,0,0,w,h);

      originalImageData =
        baseCtx.getImageData(0,0,w,h);

      const left = (cw-w)/2;
      const top = (ch-h)/2;

      baseCanvas.style.left = left+"px";
      baseCanvas.style.top  = top+"px";
      maskCanvas.style.left = left+"px";
      maskCanvas.style.top  = top+"px";

      overlay.classList.add("hidden");
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(photoInput.files[0]);
});

/* =====================================================
   MASK PAINTING
===================================================== */

function paintMask(x,y){

  maskCtx.fillStyle = "rgba(255,0,0,0.4)";
  maskCtx.beginPath();
  maskCtx.arc(x,y,brushSize/2,0,Math.PI*2);
  maskCtx.fill();
}

maskCanvas.addEventListener("mousedown", e=>{
  if(mode!=="draw") return;

  maskUndoStack.push(
    maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height)
  );

  const rect = maskCanvas.getBoundingClientRect();

  paintMask(
    (e.clientX-rect.left)/zoom,
    (e.clientY-rect.top)/zoom
  );
});

maskCanvas.addEventListener("mousemove", e=>{
  if(e.buttons!==1 || mode!=="draw") return;

  const rect = maskCanvas.getBoundingClientRect();

  paintMask(
    (e.clientX-rect.left)/zoom,
    (e.clientY-rect.top)/zoom
  );
});

/* =====================================================
   APPLY PIXELATION
===================================================== */

applyBtn.addEventListener("click", ()=>{

  const maskData =
    maskCtx.getImageData(
      0,0,
      maskCanvas.width,
      maskCanvas.height
    );

  const imgData =
    baseCtx.getImageData(
      0,0,
      baseCanvas.width,
      baseCanvas.height
    );

  for(let y=0; y<baseCanvas.height; y+=pixelSize){
    for(let x=0; x<baseCanvas.width; x+=pixelSize){

      const index =
        ((y*baseCanvas.width)+x)*4;

      if(maskData.data[index+3] > 0){

        const r = imgData.data[index];
        const g = imgData.data[index+1];
        const b = imgData.data[index+2];

        baseCtx.fillStyle =
          `rgb(${r},${g},${b})`;

        baseCtx.fillRect(
          x,y,
          pixelSize,pixelSize
        );
      }
    }
  }

  maskCtx.clearRect(
    0,0,
    maskCanvas.width,
    maskCanvas.height
  );
});

/* =====================================================
   RESTORE
===================================================== */

restoreBtn.addEventListener("click", ()=>{
  if(originalImageData)
    baseCtx.putImageData(
      originalImageData,0,0
    );

  maskCtx.clearRect(
    0,0,
    maskCanvas.width,
    maskCanvas.height
  );
});

/* =====================================================
   UNDO (MASK ONLY)
===================================================== */

undoBtn.addEventListener("click", ()=>{
  if(!maskUndoStack.length) return;
  maskCtx.putImageData(
    maskUndoStack.pop(),
    0,0
  );
});

/* =====================================================
   MODE
===================================================== */

drawBtn.addEventListener("click", ()=>mode="draw");
moveBtn.addEventListener("click", ()=>mode="position");

/* =====================================================
   ZOOM
===================================================== */

zoomSlider.addEventListener("input", e=>{
  zoom=parseFloat(e.target.value);
  baseCanvas.style.transform =
    `scale(${zoom})`;
  maskCanvas.style.transform =
    `scale(${zoom})`;
});

});