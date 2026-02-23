self.onmessage = function (e) {

  const {
    buffer,
    maskBuffer,
    width,
    height,
    pixelSize,
    dirtyMinX,
    dirtyMinY,
    dirtyMaxX,
    dirtyMaxY
  } = e.data;

  const data = new Uint8ClampedArray(buffer);
  const mask = new Uint8Array(maskBuffer);

  const startY = Math.max(0, dirtyMinY - pixelSize);
  const endY   = Math.min(height, dirtyMaxY + pixelSize);

  const startX = Math.max(0, dirtyMinX - pixelSize);
  const endX   = Math.min(width, dirtyMaxX + pixelSize);

  for (let y = startY; y < endY; y += pixelSize) {
    for (let x = startX; x < endX; x += pixelSize) {

      const alpha = mask[y * width + x] / 255;
      if (alpha <= 0) continue;

      const blockWidth = Math.min(pixelSize, width - x);
      const blockHeight = Math.min(pixelSize, height - y);

      let r = 0, g = 0, b = 0, count = 0;

      for (let yy = 0; yy < blockHeight; yy++) {
        const rowIndex = (y + yy) * width;
        for (let xx = 0; xx < blockWidth; xx++) {

          const px = (rowIndex + (x + xx)) * 4;
          r += data[px];
          g += data[px + 1];
          b += data[px + 2];
          count++;
        }
      }

      r /= count;
      g /= count;
      b /= count;

      for (let yy = 0; yy < blockHeight; yy++) {
        const rowIndex = (y + yy) * width;
        for (let xx = 0; xx < blockWidth; xx++) {

          const px = (rowIndex + (x + xx)) * 4;

          data[px]     = data[px]     * (1 - alpha) + r * alpha;
          data[px + 1] = data[px + 1] * (1 - alpha) + g * alpha;
          data[px + 2] = data[px + 2] * (1 - alpha) + b * alpha;
        }
      }
    }
  }

  // Transfer buffer back
  self.postMessage({ buffer }, [buffer]);
};