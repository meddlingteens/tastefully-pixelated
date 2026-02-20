document.addEventListener("DOMContentLoaded", () => {

/* =====================================================
   STATE
===================================================== */

const state = {
  imageLoaded: false,
  mode: "draw",
  brushSize: 40,
  pixelSize: 12,
  zoom: 1,
  isDragging: false,
  undoStack: [],
  originalImageData: null,
  lastPaintTime: 0
};

const PAINT_THROTTLE = 16; // ~60fps max

/* =====================================================
   ELEMENTS
===================================================== */

const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
const blurCanvas = document.getElementById("blurCanvas");
const container = document.getElementById("canvasContainer");

const drawBtn = document.getElementById("drawBtn");
const moveBtn = document.getElementById("moveBtn");
const undoBtn = document.getElementById("undoBtn");

const brushSlider = document.getElementById("brushSlider");
const pixelSlider = document.getElementById("pixelSlider");
const zoomSlider = document.getElementById("zoomSlider");

const baseCtx = baseCanvas.getContext("2d");
const maskCtx = maskCanvas.getContext("2d");
const blurCtx = blurCanvas.getContext("2d");

/* =====================================================
   BRUSH PREVIEW
===================================================== */

const brushPreview = document.createElement("div");
brushPreview.style.position = "absolute";
brushPreview.style.border = "2px solid rgba(255,255,255,0.8)";
brushPreview.style.borderRadius = "50%";
brushPreview.style.pointerEvents = "none";
brushPreview.style.transition = "transform 0.08s ease";
brushPreview.style.zIndex = "5";
container.appendChild(brushPreview);

function updateBrushPreview(x, y) {
  const size = state.brushSize * state.zoom;
  brushPreview.style.width = size + "px";
  brushPreview.style.height = size + "px";
  brushPreview.style.left = (x - size/2) + "px";
  brushPreview.style.top = (y - size/2) + "px";
}

/* =====================================================
   IMAGE LOADING
===================================================== */

document.getElementById("photoInput").addEventListener("change", e => {

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = evt => {

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
      maskCanvas.width = w;
      maskCanvas.height = h;

      baseCtx.drawImage(img,0,0,w,h);

      state.originalImageData =
        baseCtx.getImageData(0,0,w,h);

      baseCanvas.style.left = ((cw-w)/2)+"px";
      baseCanvas.style.top  = ((ch-h)/2)+"px";
      maskCanvas.style.left = baseCanvas.style.left;
      maskCanvas.style.top  = baseCanvas.style.top;

      baseCanvas.style.opacity = 0;
      requestAnimationFrame(()=>{
        baseCanvas.style.transition="opacity 0.4s ease";
        baseCanvas.style.opacity=1;
      });

      state.imageLoaded = true;
    };

    img.src = evt.target.result;
  };

  reader.readAsDataURL(file);
});

/* =====================================================
   SOFT PIXEL BRUSH
===================================================== */

function softPixelate(x,y){

  const size = state.brushSize;
  const px = state.pixelSize;

  const startX = x - size/2;
  const startY = y - size/2;

  const imgData = baseCtx.getImageData(
    startX,startY,size,size
  );

  for(let yy=0; yy<size; yy+=px){
    for(let xx=0; xx<size; xx+=px){

      const dx = xx-size/2;
      const dy = yy-size/2;
      const dist = Math.sqrt(dx*dx+dy*dy);
      const falloff = 1 - (dist/(size/2));

      if(falloff <= 0) continue;

      const i = ((yy*size)+xx)*4;
      const r = imgData.data[i];
      const g = imgData.data[i+1];
      const b = imgData.data[i+2];

      baseCtx.fillStyle =
        `rgba(${r},${g},${b},${falloff})`;

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
   DRAWING + THROTTLE
===================================================== */

baseCanvas.addEventListener("mousemove", e=>{
  if(!state.imageLoaded) return;

  const rect = baseCanvas.getBoundingClientRect();
  const x = (e.clientX-rect.left)/state.zoom;
  const y = (e.clientY-rect.top)/state.zoom;

  updateBrushPreview(
    e.clientX-container.getBoundingClientRect().left,
    e.clientY-container.getBoundingClientRect().top
  );

  if(state.mode==="draw" && e.buttons===1){

    const now = performance.now();
    if(now - state.lastPaintTime < PAINT_THROTTLE)
      return;

    state.lastPaintTime = now;
    softPixelate(x,y);
  }
});

/* =====================================================
   MOVE MODE
===================================================== */

baseCanvas.addEventListener("mousedown", ()=>{
  if(state.mode==="position")
    state.isDragging=true;
});

window.addEventListener("mouseup", ()=>{
  state.isDragging=false;
});

window.addEventListener("mousemove", e=>{
  if(!state.isDragging) return;

  const currentLeft=parseFloat(baseCanvas.style.left);
  const currentTop=parseFloat(baseCanvas.style.top);

  baseCanvas.style.left=currentLeft+e.movementX+"px";
  baseCanvas.style.top=currentTop+e.movementY+"px";
  maskCanvas.style.left=baseCanvas.style.left;
  maskCanvas.style.top=baseCanvas.style.top;
});

/* =====================================================
   SMOOTH ZOOM (CENTERED)
===================================================== */

zoomSlider.addEventListener("input", e=>{
  state.zoom=parseFloat(e.target.value);

  baseCanvas.style.transition="transform 0.25s ease";
  maskCanvas.style.transition="transform 0.25s ease";

  baseCanvas.style.transform=`scale(${state.zoom})`;
  maskCanvas.style.transform=`scale(${state.zoom})`;
});

/* =====================================================
   ACTIVE BUTTON GLOW
===================================================== */

function setActive(btn){
  [drawBtn,moveBtn].forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}

drawBtn.addEventListener("click",()=>{
  state.mode="draw";
  setActive(drawBtn);
});

moveBtn.addEventListener("click",()=>{
  state.mode="position";
  setActive(moveBtn);
});

/* =====================================================
   UNDO
===================================================== */

undoBtn.addEventListener("click",()=>{
  if(!state.originalImageData) return;
  baseCtx.putImageData(state.originalImageData,0,0);
});

/* =====================================================
   ANIMATED BLUR PULSE
===================================================== */

let pulse=0;
function animateBlur(){
  pulse+=0.02;
  const brightness = 1.05 + Math.sin(pulse)*0.05;
  blurCanvas.style.filter=
    `blur(30px) brightness(${brightness})`;
  requestAnimationFrame(animateBlur);
}
animateBlur();

});