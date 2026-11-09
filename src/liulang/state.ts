import type * as Phaser from 'phaser';
import type { KiteKind } from './characters';

/** One play-through of the 柳浪闻莺 dream. */
export const llRun = {
  /** Willow whistles: tries (a split bark or a snapped core means another go). */
  whistleTries: 0,
  /** Orioles found among the willows, songs sung back right first time, wrong guesses. */
  orioles: 0,
  songsFirst: 0,
  wrongTrees: 0,
  /** The kite: which one, how high, near-snaps. */
  kite: 'swallow' as KiteKind,
  height: 0,
  strains: 0,
  rescued: false,
  photo: '' as string,
};

let seq = 0;
export function nextLlKey(name: string): string {
  seq += 1;
  return `ll-${name}-${seq}`;
}

export function resetLiulang(textures: Phaser.Textures.TextureManager): void {
  if (llRun.photo && textures.exists(llRun.photo)) textures.remove(llRun.photo);
  Object.assign(llRun, { whistleTries: 0, orioles: 0, songsFirst: 0, wrongTrees: 0, kite: 'swallow', height: 0, strains: 0, rescued: false, photo: '' });
}
