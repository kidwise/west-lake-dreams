import type * as Phaser from 'phaser';
import type { TargetId } from './world';

/** State for one play-through of the 三潭印月 dream. */
export const santanRun = {
  /** Photo texture key for each part of the note that has been found. */
  photos: {} as Partial<Record<TargetId, string>>,
  /** Most pagodas matched to the whole note at once (never more than 2). */
  bestWhole: 0,
};

let seq = 0;

export function nextSantanPhotoKey(id: TargetId): string {
  seq += 1;
  return `santan-${id}-${seq}`;
}

export function resetSantan(textures: Phaser.Textures.TextureManager): void {
  for (const key of Object.values(santanRun.photos)) if (key && textures.exists(key)) textures.remove(key);
  santanRun.photos = {};
  santanRun.bestWhole = 0;
}
