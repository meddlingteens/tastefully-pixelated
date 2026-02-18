document.addEventListener('DOMContentLoaded', () => {

  const randomPrompt = document.getElementById('randomPrompt');
  const photoPickerBtn = document.getElementById('photoPickerBtn');
  const photoInput = document.getElementById('photoInput');
  const baseCanvas = document.getElementById('baseCanvas');
  const baseCtx = baseCanvas.getContext('2d');
  const moveBtn = document.getElementById('moveBtn');
  const drawBtn = document.getElementById('drawBtn');
  const applyBtn = document.getElementById('applyBtn');

  const fileInfoBtn = document.getElementById('fileInfoBtn');
  const infoModal = document.getElementById('infoModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  /* Witty Prompt */

  const prompts = [
    'Show some class and blur your junk.',
    'Hide your shame.',
    'Place a pixel where the good Lord split ya.',
    'Blur the junk in the trunk.',
    'Cover that already.',
    'Gross, just gross.'
  ];

  if (randomPrompt) {
    const index = Math.floor(Math.random() * prompts.length);
    randomPrompt.textContent = prompts[index];
  }

  /* File Picker */

  if (photoPickerBtn && photoInput) {

    photoPickerBtn.addEventListener('click', () => {
      photoInput.click();
    });

    photoInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          baseCanvas.width = img.width;
          baseCanvas.height = img.height;
          baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
          baseCtx.drawImage(img, 0, 0);

          moveBtn.disabled = false;
          drawBtn.disabled = false;
          applyBtn.disabled = false;
        };
        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  }

  /* Modal */

  if (fileInfoBtn && infoModal && closeModalBtn) {

    fileInfoBtn.addEventListener('click', () => {
      infoModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
      infoModal.classList.add('hidden');
    });

    infoModal.addEventListener('click', (event) => {
      if (event.target === infoModal) {
        infoModal.classList.add('hidden');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        infoModal.classList.add('hidden');
      }
    });
  }

});
