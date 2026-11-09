import type * as Phaser from 'phaser';

/** One play-through of the 南屏晚钟 dream. */
export const npRun = {
  /** The well: logs hauled up, 济公's things fished out by mistake, grabs too early or too late. */
  logs: 0,
  junk: 0,
  wellMiss: 0,
  /** The echo caves: wrong notes sung back. */
  echoMiss: 0,
  /** The bell: all strikes, and the good ones ("当——"). */
  strikes: 0,
  good: 0,
  /** Old friends who answered the bell (chapters the player has already visited). */
  friends: 0,
  photo: '' as string,
};

let seq = 0;
export function nextNpKey(name: string): string {
  seq += 1;
  return `np-${name}-${seq}`;
}

export function resetNanping(textures: Phaser.Textures.TextureManager): void {
  if (npRun.photo && textures.exists(npRun.photo)) textures.remove(npRun.photo);
  Object.assign(npRun, { logs: 0, junk: 0, wellMiss: 0, echoMiss: 0, strikes: 0, good: 0, friends: 0, photo: '' });
}
