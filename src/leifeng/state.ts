import type * as Phaser from 'phaser';

/** One play-through of the 雷峰夕照 dream. */
export const lfRun = {
  /** The steps: seconds to the top, stumbles, hits, and whether we beat GOGO on the escalator. */
  stairsTime: 0,
  stumbles: 0,
  hits: 0,
  beatGogo: false,
  /** The ruins: bricks saved from the crabs, bricks lost, crabs shooed. */
  bricksSaved: 0,
  bricksLost: 0,
  crabs: 0,
  /** The sunset photo: how many times we pushed 法海 out of the frame, and the best shot. */
  shoos: 0,
  photo: '' as string,
  photoGrade: '' as '' | 'perfect' | 'fahai' | 'early' | 'late',
};

let seq = 0;
export function nextLfKey(name: string): string {
  seq += 1;
  return `lf-${name}-${seq}`;
}

/** Called when the chapter starts (the scroll at the end still shows the photo). */
export function resetLeifeng(textures: Phaser.Textures.TextureManager): void {
  if (lfRun.photo && textures.exists(lfRun.photo)) textures.remove(lfRun.photo);
  Object.assign(lfRun, { stairsTime: 0, stumbles: 0, hits: 0, beatGogo: false, bricksSaved: 0, bricksLost: 0, crabs: 0, shoos: 0, photo: '', photoGrade: '' });
}
