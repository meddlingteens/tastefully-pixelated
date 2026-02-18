document.addEventListener('DOMContentLoaded', () => {

  const randomPrompt = document.getElementById('randomPrompt');
  const fileInfoBtn = document.getElementById('fileInfoBtn');
  const infoModal = document.getElementById('infoModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  /* Random Prompt */

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

  /* Modal Logic */

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
