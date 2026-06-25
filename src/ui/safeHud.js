/**
 * Crop insets when Phaser.Scale.EXPAND hides edges of the game canvas.
 * @param {Phaser.Scale.ScaleManager} scale
 */
export function getExpandCropInsets(scale) {
  const gw = scale.gameSize.width;
  const gh = scale.gameSize.height;
  const dw = scale.displaySize.width;
  const dh = scale.displaySize.height;
  const r = Math.max(dw / gw, dh / gh);
  const cropX = Math.max(0, (gw - dw / r) / 2);
  const cropY = Math.max(0, (gh - dh / r) / 2);
  return { top: cropY, bottom: cropY, left: cropX, right: cropX };
}

/**
 * @param {number} y
 * @param {{ top: number }} insets
 */
export function safeTop(y, insets) {
  return y + insets.top;
}

/**
 * @param {number} margin
 * @param {number} w
 * @param {{ right: number }} insets
 */
export function safeRightX(margin, w, insets) {
  return w - insets.right - margin;
}
