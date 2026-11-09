import type * as Phaser from 'phaser';

/** One play-through of the 断桥残雪 dream. */
export const dqRun = {
  hits: 0,
  blocks: 0,
  ouch: 0,
  snow: 0,
  /** Seconds it took to find KOKO and GOGO in the crowd. */
  findTime: 0,
  photoSnowmen: '' as string,
  photoBridge: '' as string,
};

let seq = 0;
export function nextDqKey(name: string): string {
  seq += 1;
  return `dq-${name}-${seq}`;
}

/** Called when the chapter starts (the scroll at the end still shows the photos). */
export function resetDuanqiao(textures: Phaser.Textures.TextureManager): void {
  for (const k of [dqRun.photoSnowmen, dqRun.photoBridge]) if (k && textures.exists(k)) textures.remove(k);
  Object.assign(dqRun, { hits: 0, blocks: 0, ouch: 0, snow: 0, findTime: 0, photoSnowmen: '', photoBridge: '' });
}
