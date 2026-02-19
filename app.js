/* ========= BANNER RANDOMIZATION ========= */

const bannerHeadings = [
  "Buy something you really don't need",
  "Shop mofo. Buy, buy, buy",
  "This is where you can advertise your useless crap",
  "What the world really needs is more advertising",
  "Wanna buy one of those endlessly spinning top things?",
  "Sell stuff here, bitches"
];

const bannerHeadingEl = document.getElementById('bannerHeading');

if (bannerHeadingEl) {
  bannerHeadingEl.textContent =
    bannerHeadings[Math.floor(Math.random() * bannerHeadings.length)];
}
