import * as Phaser from 'phaser';

/**
 * The game's modern card surface: a layered soft shadow, warm paper white,
 * a faint top highlight and a hairline edge. Used for dialogs, the end-of-chapter
 * invitations and the ten-scenes map, so every panel reads as one family.
 */
export function drawPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 28,
  fill = 0xfbf8f2,
  alpha = 0.97,
): Phaser.GameObjects.Graphics {
  g.fillStyle(0x1e2a28, 0.06);
  g.fillRoundedRect(x - 6, y + 4, w + 12, h + 14, r + 6);
  g.fillStyle(0x1e2a28, 0.1);
  g.fillRoundedRect(x - 2, y + 4, w + 4, h + 6, r + 2);
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, w, h, r);
  g.fillStyle(0xffffff, 0.22);
  g.fillRoundedRect(x + 4, y + 3, w - 8, Math.min(28, h / 4), { tl: r - 3, tr: r - 3, bl: 0, br: 0 });
  g.lineStyle(1, 0x2f3b3a, 0.12);
  g.strokeRoundedRect(x, y, w, h, r);
  return g;
}
