// =============================
// Tastefully Pixelated
// Subhead + Banner Rotation
// =============================

document.addEventListener("DOMContentLoaded", () => {

  /* =============================
     Random Subhead Messages
  ============================= */

  const subheadMessages = [
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

  const subheadEl = document.getElementById("subhead");

  if (subheadEl) {
    const randomSubhead =
      subheadMessages[Math.floor(Math.random() * subheadMessages.length)];
    subheadEl.textContent = randomSubhead;
  }


  /* =============================
     Random Banner Headlines
  ============================= */

  const bannerMessages = [
    "Buy something you really don't need",
    "Shop mofo. Buy, buy, buy",
    "This is where you can advertise your useless crap",
    "What the world really needs is more advertising",
    "Wanna buy one of those endlessly spinning top things?",
    "Sell stuff here, bitches"
  ];

  const bannerHeading = document.getElementById("bannerHeading");

  if (bannerHeading) {
    const randomBanner =
      bannerMessages[Math.floor(Math.random() * bannerMessages.length)];
    bannerHeading.textContent = randomBanner;
  }

});