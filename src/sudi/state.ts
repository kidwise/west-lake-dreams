import type * as Phaser from 'phaser';

/** One play-through of the 苏堤春晓 dream. */
export const sudiRun = {
  seals: 0,
  petals: 0,
  perfect: 0,
  airTime: 0,
  /** Final race position (1-3), or 0 if the race never finished. */
  rank: 0,
  photoReflect: '' as string,
  photoHills: '' as string,
};

let seq = 0;
export function nextSudiKey(name: string): string {
  seq += 1;
  return `sudi-${name}-${seq}`;
}

export function resetSudi(textures: Phaser.Textures.TextureManager): void {
  for (const k of [sudiRun.photoReflect, sudiRun.photoHills]) if (k && textures.exists(k)) textures.remove(k);
  Object.assign(sudiRun, { seals: 0, petals: 0, perfect: 0, airTime: 0, rank: 0, photoReflect: '', photoHills: '' });
}
