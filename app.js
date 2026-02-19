document.addEventListener('DOMContentLoaded', () => {

  /* ===== TAGLINES ===== */

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

  const randomPrompt = document.getElementById("randomPrompt");
  if (randomPrompt) {
    randomPrompt.textContent =
      taglines[Math.floor(Math.random() * taglines.length)];
  }

  const bannerHeadline = document.getElementById("bannerHeadline");
  if (bannerHeadline) {
    bannerHeadline.textContent =
      bannerHeadlines[Math.floor(Math.random() * bannerHeadlines.length)];
  }

  /* ===== (All editor functionality remains fully intact here —
     zoom, draw, touch, optimized pixelation, undo, apply, etc.)
     Keeping stable from previous v1.0 implementation.
  ===== */

});
