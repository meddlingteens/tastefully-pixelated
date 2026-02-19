import { exportImage } from "./export.js";

export async function shareImage(baseCanvas) {
  const blob = await new Promise(resolve =>
    baseCanvas.toBlob(resolve, "image/png")
  );

  if (navigator.share && blob) {
    const file = new File([blob], "tastefully-pixelated.png", { type: "image/png" });
    await navigator.share({ files: [file], title: "Tastefully Pixelated" });
  } else {
    exportImage(baseCanvas);
  }
}
