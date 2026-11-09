import type * as Phaser from 'phaser';

export type Route = 'su' | 'yang';

/** One play-through of the 曲院风荷 dream. */
export const qyRun = {
  /** Texture keys of the lotus photos taken during the ride. */
  photoKeys: [] as string[],
  route: 'yang' as Route,
  flights: 0,
};

let seq = 0;
export function nextQyKey(): string {
  seq += 1;
  return `qy-photo-${seq}`;
}

/** Called when the chapter starts (the album at the end still shows the photos until then). */
export function resetQuyuan(textures: Phaser.Textures.TextureManager): void {
  for (const key of qyRun.photoKeys) if (textures.exists(key)) textures.remove(key);
  Object.assign(qyRun, { photoKeys: [], route: 'yang', flights: 0 });
}
