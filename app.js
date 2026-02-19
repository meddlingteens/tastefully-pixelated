document.addEventListener("DOMContentLoaded", () => {

const taglines = [
  "Just, eeuuuuu.",
  "Hide your shame.",
  "I can't unsee that.",
  "Don't be fickle, apply a pixel."
];

const banners = [
  "Buy something you really don't need",
  "Shop mofo. Buy, buy, buy",
  "This is where you can advertise your useless crap",
  "What the world really needs is more advertising",
  "Wanna buy one of those endlessly spinning top things?",
  "Sell stuff here, bitches"
];

document.getElementById("randomPrompt").textContent =
  taglines[Math.floor(Math.random()*taglines.length)];

document.getElementById("bannerHeadline").textContent =
  banners[Math.floor(Math.random()*banners.length)];

const photoBtn = document.getElementById("photoPickerBtn");
const photoInput = document.getElementById("photoInput");
const baseCanvas = document.getElementById("baseCanvas");
const maskCanvas = document.getElementById("maskCanvas");
const container = document.getElementById("canvasContainer");
const imageMeta = document.getElementById("imageMeta");

const zoomSlider = document.getElementById("zoomLevel");
const brushSlider = document.getElementById("brushSize");

const moveBtn = document.getElementById("moveBtn");
const drawBtn = document.getElementById("drawBtn");
const undoBtn = document.getElementById("undoBtn");
const applyBtn = document.getElementById("applyBtn");
const restoreBtn = document.getElementById("restoreBtn");
const exportBtn = document.getElementById("exportBtn");
const shareBtn = document.getElementById("shareBtn");

const baseCtx = baseCanvas.getContext("2d");
const maskCtx = maskCanvas.getContext("2d");

let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let drawing = false;
let mode = "draw";
let history = [];
let applyHistory = null;
let brushSize = 30;
let previewMode = false;
let lastTap = 0;

/* ---------- Utility ---------- */

function applyTransform() {
  const t = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
  baseCanvas.style.transform = t;
  maskCanvas.style.transform = t;
}

function resetView() {
  zoom = 1;
  offsetX = 0;
  offsetY = 0;
  zoomSlider.value = 1;
  applyTransform();
}

/* ---------- Double Tap Reset ---------- */

container.addEventListener("dblclick", resetView);

container.addEventListener("touchend", e => {
  const now = Date.now();
  if (now - lastTap < 300) resetView();
  lastTap = now;
});

/* ---------- Keyboard Shortcuts ---------- */

document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;

  switch (e.key.toLowerCase()) {
    case "d": mode="draw"; break;
    case "v": mode="position"; break;
    case "z": undoBtn.click(); break;
    case "a": applyBtn.click(); break;
    case "r": restoreBtn.click(); break;
    case "0": resetView(); break;
    case "+": zoomSlider.value = Math.min(4, zoom+0.1); zoom=+zoomSlider.value; applyTransform(); break;
    case "-": zoomSlider.value = Math.max(1, zoom-0.1); zoom=+zoomSlider.value; applyTransform(); break;
    case "p": togglePreview(); break;
  }
});

/* ---------- Mask Preview ---------- */

function togglePreview() {
  previewMode = !previewMode;
  if (previewMode) {
    maskCtx.globalCompositeOperation = "source-over";
    maskCtx.fillStyle = "rgba(255,0,0,0.4)";
  } else {
    maskCtx.globalCompositeOperation = "source-over";
  }
}

/* ---------- Load Image ---------- */

photoBtn.onclick = () => photoInput.click();

photoInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {

      const maxW = container.clientWidth;
      const maxH = container.clientHeight;
      const scale = Math.min(maxW/img.width, maxH/img.height, 1);

      const w = Math.floor(img.width*scale);
      const h = Math.floor(img.height*scale);

      baseCanvas.width = maskCanvas.width = w;
      baseCanvas.height = maskCanvas.height = h;

      baseCtx.drawImage(img,0,0,w,h);
      maskCtx.clearRect(0,0,w,h);

      imageMeta.innerHTML =
        `Original: ${img.width} × ${img.height}<br>` +
        `Scaled: ${w} × ${h}`;

      zoomSlider.disabled=false;
      moveBtn.disabled=false;
      drawBtn.disabled=false;
      applyBtn.disabled=false;
      exportBtn.disabled=false;
      shareBtn.disabled=false;

      resetView();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

/* ---------- Drawing ---------- */

brushSlider.oninput = e => brushSize = parseInt(e.target.value);

function getCoords(e) {
  const rect = maskCanvas.getBoundingClientRect();
  const clientX = e.touches?e.touches[0].clientX:e.clientX;
  const clientY = e.touches?e.touches[0].clientY:e.clientY;
  return {
    x:(clientX-rect.left-offsetX)/zoom,
    y:(clientY-rect.top-offsetY)/zoom
  };
}

function draw(e) {
  const {x,y}=getCoords(e);
  maskCtx.fillStyle="white";
  maskCtx.beginPath();
  maskCtx.arc(x,y,brushSize,0,Math.PI*2);
  maskCtx.fill();
}

maskCanvas.addEventListener("mousedown",e=>{
  if(mode!=="draw")return;
  drawing=true;
  history.push(maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height));
  draw(e);
});

maskCanvas.addEventListener("mousemove",e=>{
  if(!drawing)return;
  draw(e);
});

window.addEventListener("mouseup",()=>drawing=false);

/* ---------- Pan ---------- */

container.addEventListener("mousedown",e=>{
  if(mode!=="position")return;
  let startX=e.clientX;
  let startY=e.clientY;

  function move(ev){
    offsetX+=ev.clientX-startX;
    offsetY+=ev.clientY-startY;
    startX=ev.clientX;
    startY=ev.clientY;
    applyTransform();
  }

  function up(){
    window.removeEventListener("mousemove",move);
    window.removeEventListener("mouseup",up);
  }

  window.addEventListener("mousemove",move);
  window.addEventListener("mouseup",up);
});

/* ---------- Apply ---------- */

applyBtn.onclick=()=>{
  applyBtn.classList.add("active");
  setTimeout(()=>applyBtn.classList.remove("active"),300);
  applyHistory=baseCtx.getImageData(0,0,baseCanvas.width,baseCanvas.height);
  restoreBtn.disabled=false;

  const w=baseCanvas.width;
  const h=baseCanvas.height;
  const baseData=baseCtx.getImageData(0,0,w,h);
  const maskData=maskCtx.getImageData(0,0,w,h);
  const result=baseCtx.createImageData(w,h);
  result.data.set(baseData.data);

  const block=12;

  for(let y=0;y<h;y+=block){
    for(let x=0;x<w;x+=block){
      let masked=false;
      for(let yy=y;yy<y+block&&yy<h;yy++){
        for(let xx=x;xx<x+block&&xx<w;xx++){
          if(maskData.data[(yy*w+xx)*4+3]>0){masked=true;break;}
        }
        if(masked)break;
      }
      if(!masked)continue;

      let r=0,g=0,b=0,count=0;
      for(let yy=y;yy<y+block&&yy<h;yy++){
        for(let xx=x;xx<x+block&&xx<w;xx++){
          const i=(yy*w+xx)*4;
          r+=baseData.data[i];
          g+=baseData.data[i+1];
          b+=baseData.data[i+2];
          count++;
        }
      }
      r/=count;g/=count;b/=count;

      for(let yy=y;yy<y+block&&yy<h;yy++){
        for(let xx=x;xx<x+block&&xx<w;xx++){
          const i=(yy*w+xx)*4;
          if(maskData.data[i+3]>0){
            result.data[i]=r;
            result.data[i+1]=g;
            result.data[i+2]=b;
          }
        }
      }
    }
  }

  baseCtx.putImageData(result,0,0);
  maskCtx.clearRect(0,0,w,h);
};

/* ---------- Restore ---------- */

restoreBtn.onclick=()=>{
  if(!applyHistory)return;
  baseCtx.putImageData(applyHistory,0,0);
};

/* ---------- Export ---------- */

exportBtn.onclick=()=>{
  const link=document.createElement("a");
  link.download="tastefully-pixelated.png";
  link.href=baseCanvas.toDataURL();
  link.click();
};

/* ---------- Share ---------- */

shareBtn.onclick=async()=>{
  const blob=await new Promise(resolve=>baseCanvas.toBlob(resolve,"image/png"));
  if(navigator.share && blob){
    const file=new File([blob],"tastefully-pixelated.png",{type:"image/png"});
    await navigator.share({files:[file],title:"Tastefully Pixelated"});
  }else{
    exportBtn.click();
  }
};

});
