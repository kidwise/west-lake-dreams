import type * as Phaser from 'phaser';
import { W } from '../core/config';

/** Screen areas used by the always-on-top overlay buttons (UIScene). */
export const LANG_BTN = { x: W - 70, y: 38, w: 104, h: 48 };
export const MUSIC_BTN = { x: W - 200, y: 38, w: 132, h: 48 };

const within = (p: Phaser.Input.Pointer, b: { x: number; y: number; w: number; h: number }) =>
  Math.abs(p.x - b.x) <= b.w / 2 + 6 && Math.abs(p.y - b.y) <= b.h / 2 + 6;

/** True if a pointer is over the global overlay, so scenes can ignore that click. */
export function overGlobalUI(p: Phaser.Input.Pointer): boolean {
  return within(p, LANG_BTN) || within(p, MUSIC_BTN);
}
