document.addEventListener("DOMContentLoaded", () => {

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

  const baseCtx = baseCanvas.getContext("2d");
  const maskCtx = maskCanvas.getContext("2d");

  let zoom = 1;
  let offsetX = 0;
  let offsetY = 0;
  let drawing = false;
  let mode = "draw";
  let history = [];
  let brushSize = 30;

  /* ================= IMAGE LOAD ================= */

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

        const scale = Math.min(maxW / img.width, maxH / img.height, 1);

        const w = Math.floor(img.width * scale);
        const h = Math.floor(img.height * scale);

        baseCanvas.width = maskCanvas.width = w;
        baseCanvas.height = maskCanvas.height = h;

        baseCtx.clearRect(0,0,w,h);
        baseCtx.drawImage(img, 0, 0, w, h);
        maskCtx.clearRect(0,0,w,h);

        imageMeta.innerHTML =
          `Original: ${img.width} × ${img.height}<br>` +
          `Scaled: ${w} × ${h}`;

        zoomSlider.disabled = false;
        moveBtn.disabled = false;
        drawBtn.disabled = false;
        applyBtn.disabled = false;

        zoom = 1;
        offsetX = 0;
        offsetY = 0;
        applyTransform();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  /* ================= TRANSFORM ================= */

  function applyTransform() {
    const t = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
    baseCanvas.style.transform = t;
    maskCanvas.style.transform = t;
  }

  zoomSlider.oninput = e => {
    zoom = parseFloat(e.target.value);
    applyTransform();
  };

  /* ================= DRAW ================= */

  brushSlider.oninput = e => brushSize = parseInt(e.target.value);

  function getCoords(e) {
    const rect = maskCanvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offsetX) / zoom,
      y: (e.clientY - rect.top - offsetY) / zoom
    };
  }

  maskCanvas.addEventListener("mousedown", e => {
    if (mode !== "draw") return;
    drawing = true;
    history.push(maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height));
    draw(e);
  });

  maskCanvas.addEventListener("mousemove", e => {
    if (!drawing) return;
    draw(e);
  });

  window.addEventListener("mouseup", () => drawing = false);

  function draw(e) {
    const {x,y} = getCoords(e);
    maskCtx.fillStyle = "white";
    maskCtx.beginPath();
    maskCtx.arc(x,y,brushSize,0,Math.PI*2);
    maskCtx.fill();
  }

  /* ================= PAN ================= */

  container.addEventListener("mousedown", e => {
    if (mode !== "position" || zoom <= 1) return;
    drawing = false;
    const startX = e.clientX;
    const startY = e.clientY;

    const move = ev => {
      offsetX += ev.clientX - startX;
      offsetY += ev.clientY - startY;
      applyTransform();
      startX = ev.clientX;
      startY = ev.clientY;
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  });

  moveBtn.onclick = () => mode = "position";
  drawBtn.onclick = () => mode = "draw";

  /* ================= UNDO ================= */

  undoBtn.onclick = () => {
    if (!history.length) return;
    maskCtx.putImageData(history.pop(),0,0);
  };

  /* ================= APPLY PIXELATION ================= */

  applyBtn.onclick = () => {

    const w = baseCanvas.width;
    const h = baseCanvas.height;

    const baseData = baseCtx.getImageData(0,0,w,h);
    const maskData = maskCtx.getImageData(0,0,w,h);
    const result = baseCtx.createImageData(w,h);

    result.data.set(baseData.data);

    const block = 12;

    for (let y=0; y<h; y+=block) {
      for (let x=0; x<w; x+=block) {

        let masked=false;

        for (let yy=y; yy<y+block && yy<h; yy++) {
          for (let xx=x; xx<x+block && xx<w; xx++) {
            const i=(yy*w+xx)*4;
            if (maskData.data[i+3]>0) {
              masked=true;
              break;
            }
          }
          if(masked) break;
        }

        if(!masked) continue;

        let r=0,g=0,b=0,count=0;

        for (let yy=y; yy<y+block && yy<h; yy++) {
          for (let xx=x; xx<x+block && xx<w; xx++) {
            const i=(yy*w+xx)*4;
            r+=baseData.data[i];
            g+=baseData.data[i+1];
            b+=baseData.data[i+2];
            count++;
          }
        }

        r/=count; g/=count; b/=count;

        for (let yy=y; yy<y+block && yy<h; yy++) {
          for (let xx=x; xx<x+block && xx<w; xx++) {
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

});
