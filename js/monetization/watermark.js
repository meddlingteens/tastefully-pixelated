import { state } from "../core/state.js";

export function updateWatermark() {
  const wm = document.getElementById("watermarkOverlay");

  if (state.isPro) {
    wm.innerHTML = "";
    return;
  }

  wm.innerHTML = `
    <div class="wm-title">Another Tastefully Pixelated creation</div>
    <div class="wm-url">www.tastefullypixelated.com</div>
  `;
}
