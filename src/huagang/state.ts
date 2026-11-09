import type * as Phaser from 'phaser';
import type { VarietyId } from './koi';

/** One play-through of the 花港观鱼 dream. */
export const hgRun = {
  /** Photos from the pond (texture keys), at most three. */
  photos: [] as string[],
  /** Koi book: variety → the texture of the first fish photographed. */
  dex: {} as Partial<Record<VarietyId, string>>,
  handfuls: 0,
  mountain: 0,
  eaten: 0,
  school: 0,
};

let seq = 0;
export function nextHgKey(name: string): string {
  seq += 1;
  return `hg-${name}-${seq}`;
}

/** Called when the chapter starts (not when it ends: the scroll still shows the photos). */
export function resetHuagang(textures: Phaser.Textures.TextureManager): void {
  for (const k of hgRun.photos) if (textures.exists(k)) textures.remove(k);
  Object.assign(hgRun, { photos: [], dex: {}, handfuls: 0, mountain: 0, eaten: 0, school: 0 });
}
