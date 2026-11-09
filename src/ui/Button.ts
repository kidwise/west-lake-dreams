import * as Phaser from 'phaser';
import { CSS } from '../core/config';
import { i18nText, onLang } from './text';

export interface ButtonOptions {
  width?: number;
  height?: number;
  fill?: number;
  fillAlpha?: number;
  stroke?: number;
  textColor?: string;
  fontSize?: number;
  /** Pin to the screen (ignore camera scroll) — for HUD buttons in scrolling scenes. */
  fixed?: boolean;
  depth?: number;
  /** Fires on press (pointerdown) — used for hold-style buttons. */
  onDown?: () => void;
  /** Fires on release (pointerup / pointer leaving). */
  onUp?: () => void;
  /** Fires on a click (release over the button). */
  onClick?: () => void;
}

export interface Button {
  container: Phaser.GameObjects.Container;
  zone: Phaser.GameObjects.Zone;
  label: Phaser.GameObjects.Text;
  isDown: () => boolean;
  /** Re-read the label (for labels that depend on game state, not just language). */
  refresh: () => void;
  setEnabled: (on: boolean) => void;
  destroy: () => void;
}

/**
 * A rounded, ink-and-paper style button. The label is a translated string and
 * the width grows to fit the text when the language changes.
 */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  labelFn: () => string,
  opts: ButtonOptions = {},
): Button {
  const h = opts.height ?? 64;
  const minW = opts.width ?? 220;
  const fill = opts.fill ?? 0xf6f1e7;
  const fillAlpha = opts.fillAlpha ?? 0.95;
  const stroke = opts.stroke ?? 0x2f3b3a;

  const container = scene.add.container(x, y);
  const bg = scene.add.graphics();
  const label = i18nText(scene, 0, 0, labelFn, {
    fontSize: `${opts.fontSize ?? 26}px`,
    color: opts.textColor ?? CSS.ink,
  }).setOrigin(0.5);
  container.add([bg, label]);

  const zone = scene.add.zone(x, y, minW, h).setInteractive({ useHandCursor: true });
  if (opts.fixed) {
    container.setScrollFactor(0);
    zone.setScrollFactor(0);
  }
  if (opts.depth !== undefined) {
    container.setDepth(opts.depth);
    zone.setDepth(opts.depth);
  }
  let down = false;
  let enabled = true;
  let w = minW;

  // a modern pill: soft layered shadow, no heavy outline, a faint top highlight
  const draw = (pressed: boolean) => {
    w = Math.max(minW, label.width + 48);
    zone.setSize(w, h);
    if (zone.input?.hitArea instanceof Phaser.Geom.Rectangle) zone.input.hitArea.setTo(0, 0, w, h);
    const r = Math.min(h / 2, 28);
    bg.clear();
    if (!pressed) {
      bg.fillStyle(0x1e2a28, 0.06);
      bg.fillRoundedRect(-w / 2 - 1, -h / 2 + 5, w + 2, h + 2, r);
      bg.fillStyle(0x1e2a28, 0.1);
      bg.fillRoundedRect(-w / 2, -h / 2 + 3, w, h, r);
    }
    const base = pressed ? Phaser.Display.Color.IntegerToColor(fill).darken(8).color : fill;
    bg.fillStyle(base, fillAlpha);
    bg.fillRoundedRect(-w / 2, -h / 2 + (pressed ? 2 : 0), w, h, r);
    bg.fillStyle(0xffffff, pressed ? 0 : 0.12);
    bg.fillRoundedRect(-w / 2 + 3, -h / 2 + 2, w - 6, h * 0.45, { tl: r - 2, tr: r - 2, bl: 6, br: 6 });
    bg.lineStyle(1, stroke, 0.18);
    bg.strokeRoundedRect(-w / 2, -h / 2 + (pressed ? 2 : 0), w, h, r);
  };
  draw(false);
  onLang(scene, () => draw(down));

  const release = (click: boolean) => {
    if (!down) return;
    down = false;
    draw(false);
    container.setScale(1);
    opts.onUp?.();
    if (click) opts.onClick?.();
  };

  zone.on('pointerdown', () => {
    if (!enabled) return;
    down = true;
    draw(true);
    container.setScale(0.96);
    opts.onDown?.();
  });
  zone.on('pointerup', () => release(true));
  zone.on('pointerout', () => release(false));
  zone.on('pointerover', () => enabled && !down && container.setScale(1.04));
  zone.on('pointerout', () => !down && container.setScale(1));

  return {
    container,
    zone,
    label,
    isDown: () => down,
    refresh() {
      label.setText(labelFn());
      draw(down);
    },
    setEnabled(on) {
      enabled = on;
      container.setAlpha(on ? 1 : 0.45);
      if (!on) release(false);
    },
    destroy() {
      zone.destroy();
      container.destroy();
    },
  };
}
