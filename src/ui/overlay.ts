import type * as Phaser from 'phaser';
import { W } from '../core/config';

/** Screen areas used by the always-on-top overlay buttons (UIScene). */
export const LANG_BTN = { x: W - 54, y: 36, w: 68, h: 44 };
export const MUSIC_BTN = { x: W - 130, y: 36, w: 52, h: 44 };
export const HOME_BTN = { x: W - 192, y: 36, w: 52, h: 44 };

const within = (p: Phaser.Input.Pointer, b: { x: number; y: number; w: number; h: number }) =>
  Math.abs(p.x - b.x) <= b.w / 2 + 6 && Math.abs(p.y - b.y) <= b.h / 2 + 6;

let homeShown = false;
/** UIScene says whether the Home button is on screen (it's hidden on the title). */
export function setHomeShown(on: boolean): void {
  homeShown = on;
}

/** True if a pointer is over the global overlay, so scenes can ignore that click. */
export function overGlobalUI(p: Phaser.Input.Pointer): boolean {
  return within(p, LANG_BTN) || within(p, MUSIC_BTN) || (homeShown && within(p, HOME_BTN));
}
