const refs = {
  photoInput: document.getElementById('photoInput'),
  brushSize: document.getElementById('brushSize'),
  brushSizeValue: document.getElementById('brushSizeValue'),
  pixelSize: document.getElementById('pixelSize'),
  pixelSizeValue: document.getElementById('pixelSizeValue'),
  zoom: document.getElementById('zoomLevel'),
  zoomValue: document.getElementById('zoomLevelValue'),
  moveBtn: document.getElementById('moveBtn'),
  drawBtn: document.getElementById('drawBtn'),
  clearMaskBtn: document.getElementById('clearMaskBtn'),
  applyBtn: document.getElementById('applyBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  shareBtn: document.getElementById('shareBtn'),
  undoBtn: document.getElementById('undoBtn'),
  fileInfoBtn: document.getElementById('fileInfoBtn'),
  infoModal: document.getElementById('infoModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
};

/* Modal */

refs.fileInfoBtn.addEventListener('click', () => {
  refs.infoModal.classList.remove('hidden');
});

refs.closeModalBtn.addEventListener('click', () => {
  refs.infoModal.classList.add('hidden');
});

refs.infoModal.addEventListener('click', (e) => {
  if (e.target === refs.infoModal) {
    refs.infoModal.classList.add('hidden');
  }
});
