import type * as Phaser from 'phaser';

/** One play-through of the 平湖秋月 dream. */
export const phRun = {
  /** Which piece of moon we're after (0..2); 3 = all found. */
  level: 0,
  turns: 0,
  hints: 0,
  /** Seconds spent smoothing the water, all three pieces together. */
  calmTime: 0,
  perfect: 0,
  good: 0,
  miss: 0,
  photoMirror: '' as string,
};

let seq = 0;
export function nextPhKey(name: string): string {
  seq += 1;
  return `ph-${name}-${seq}`;
}

/** Called when the chapter starts (the scroll at the end still shows the photo). */
export function resetPinghu(textures: Phaser.Textures.TextureManager): void {
  if (phRun.photoMirror && textures.exists(phRun.photoMirror)) textures.remove(phRun.photoMirror);
  Object.assign(phRun, { level: 0, turns: 0, hints: 0, calmTime: 0, perfect: 0, good: 0, miss: 0, photoMirror: '' });
}
