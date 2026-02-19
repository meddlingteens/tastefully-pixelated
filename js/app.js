import { state } from "./core/state.js";
import { updateWatermark } from "./monetization/watermark.js";
import { exportImage } from "./share/export.js";
import { shareImage } from "./share/share.js";

const baseCanvas = document.getElementById("baseCanvas");
const exportBtn = document.getElementById("exportBtn");
const shareBtn = document.getElementById("shareBtn");

updateWatermark();

exportBtn.onclick = () => exportImage(baseCanvas);
shareBtn.onclick = () => shareImage(baseCanvas);
