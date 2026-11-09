import type * as Phaser from 'phaser';

/** One play-through of the 双峰插云 dream. */
export const sfRun = {
  /** 三十六弯: bends taken the right way first time, and wrong turns. */
  bendsRight: 0,
  wrongTurns: 0,
  /** Seconds to the top, and whether we beat the porter. */
  climbTime: 0,
  beatPorter: false,
  /** Cloud puffs collected on the way up. */
  puffs: 0,
  /** North Pagoda: how neatly the seven storeys were stacked (0..100), and perfect drops. */
  towerNeat: 0,
  towerPerfect: 0,
  /** Little cloud calves brought across the valley. */
  calves: 0,
  calvesTotal: 12,
  /** South Peak dig: pieces found and put back. */
  finds: 0,
  digTime: 0,
  sawLuohan: false,
  /** The photo from 洪春桥 and how good it was. */
  photo: '' as string,
  photoGrade: '' as '' | 'perfect' | 'low' | 'high',
};

let seq = 0;
export function nextSfKey(name: string): string {
  seq += 1;
  return `sf-${name}-${seq}`;
}

/** Called when the chapter starts (the scroll at the end still shows the photo). */
export function resetShuangfeng(textures: Phaser.Textures.TextureManager): void {
  if (sfRun.photo && textures.exists(sfRun.photo)) textures.remove(sfRun.photo);
  Object.assign(sfRun, {
    bendsRight: 0,
    wrongTurns: 0,
    climbTime: 0,
    beatPorter: false,
    puffs: 0,
    towerNeat: 0,
    towerPerfect: 0,
    calves: 0,
    calvesTotal: 12,
    finds: 0,
    digTime: 0,
    sawLuohan: false,
    photo: '',
    photoGrade: '',
  });
}
