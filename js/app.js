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
const shareBtn = document.getElementById("shareBtn");

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
   BRUSH CURSOR PREVIEW
===================================================== */

const brushCursor = document.createElement("div");
brushCursor.style.position = "absolute";
brushCursor.style.pointerEvents = "none";
brushCursor.style.border = "1px solid rgba(255,255,255,0.9)";
brushCursor.style.background = "rgba(255,255,255,0.08)";
brushCursor.style.borderRadius = "50%";
brushCursor.style.boxShadow = "0 0 6px rgba(0,0,0,0.6)";
brushCursor.style.zIndex = "20";
brushCursor.style.display = "none";

container.appendChild(brushCursor);

function updateBrushCursor(x, y) {
  const size = brushSize * zoom;
  brushCursor.style.width = size + "px";
  brushCursor.style.height = size + "px";
  brushCursor.style.left = (x - size/2) + "px";
  brushCursor.style.top  = (y - size/2) + "px";
}

/* Cursor Tracking */

container.addEventListener("mousemove", e => {

  if (mode !== "draw") {
    brushCursor.style.display = "none";
    return;
  }

  brushCursor.style.display = "block";

  const rect = container.getBoundingClientRect();

  updateBrushCursor(
    e.clientX - rect.left,
    e.clientY - rect.top
  );
});

container.addEventListener("mouseleave", () => {
  brushCursor.style.display = "none";
});

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

      /* Blur Background */

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

      /* Fit Main */

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

      baseCanvas.style.transformOrigin = "center center";
      maskCanvas.style.transformOrigin = "center center";

      zoom = 1;
      baseCanvas.style.transform = "scale(1)";
      maskCanvas.style.transform = "scale(1)";

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
    maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height);

  const imgData =
    baseCtx.getImageData(0,0,baseCanvas.width,baseCanvas.height);

  for(let y=0; y<baseCanvas.height; y+=pixelSize){
    for(let x=0; x<baseCanvas.width; x+=pixelSize){

      const index = ((y*baseCanvas.width)+x)*4;

      if(maskData.data[index+3] > 0){

        const r = imgData.data[index];
        const g = imgData.data[index+1];
        const b = imgData.data[index+2];

        baseCtx.fillStyle = `rgb(${r},${g},${b})`;
        baseCtx.fillRect(x,y,pixelSize,pixelSize);
      }
    }
  }

  maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);
});

/* =====================================================
   RESTORE
===================================================== */

restoreBtn.addEventListener("click", ()=>{
  if(originalImageData)
    baseCtx.putImageData(originalImageData,0,0);

  maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);
});

/* =====================================================
   UNDO (MASK ONLY)
===================================================== */

undoBtn.addEventListener("click", ()=>{
  if(!maskUndoStack.length) return;
  maskCtx.putImageData(maskUndoStack.pop(),0,0);
});

/* =====================================================
   MODE
===================================================== */

drawBtn.addEventListener("click", ()=>mode="draw");
moveBtn.addEventListener("click", ()=>mode="position");

/* =====================================================
   POSITION MODE
===================================================== */

maskCanvas.addEventListener("mousedown", ()=>{
  if(mode==="position") isDragging=true;
});

window.addEventListener("mouseup", ()=>{
  isDragging=false;
});

window.addEventListener("mousemove", e=>{
  if(!isDragging) return;

  baseCanvas.style.left =
    (parseFloat(baseCanvas.style.left)+e.movementX)+"px";

  maskCanvas.style.left =
    (parseFloat(maskCanvas.style.left)+e.movementX)+"px";

  baseCanvas.style.top =
    (parseFloat(baseCanvas.style.top)+e.movementY)+"px";

  maskCanvas.style.top =
    (parseFloat(maskCanvas.style.top)+e.movementY)+"px";
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
  baseCanvas.style.transform = `scale(${zoom})`;
  maskCanvas.style.transform = `scale(${zoom})`;
});

});