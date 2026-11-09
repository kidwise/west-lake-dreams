import * as Phaser from 'phaser';
import { music } from '../core/music';
import type { StrKey } from '../core/i18n';
import { narrate, tweenP, wait } from '../ui/narrate';
import { Dialogue, type Speaker } from '../ui/Dialogue';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { Willow, Wind } from './Willows';
import { resetLiulang } from './state';

type Who = 'me' | 'gogo' | 'koko';
const FEET = 524;
export const TREES = [180, 520, 860, 1180];

/** An early-spring morning at 柳浪闻莺: bare willows, no birdsong — and Mum remembering. */
export class LiulangIntroScene extends Phaser.Scene {
  private wind = new Wind();
  private willows: Willow[] = [];
  private mom!: Phaser.GameObjects.Image;
  private kids: Partial<Record<Who, Phaser.GameObjects.Graphics>> = {};

  constructor() {
    super('LiulangIntro');
  }

  create(): void {
    music.play('llEarly');
    resetLiulang(this.textures);
    this.wind = new Wind();
    this.wind.base = 0.6;
    this.kids = {};
    this.add.image(0, 0, 'llParkBare').setOrigin(0);
    this.willows = TREES.map((x, i) => new Willow(this, x, 478, [0.74, 0.66, 0.78, 0.7][i], 5 + i * 0.01, 10 + i, this.wind));
    // Mum, holding my hand, and KOKO and GOGO behind
    this.mom = this.add.image(-120, FEET + 4, 'llMom').setOrigin(0.5, 1).setScale(0.34).setDepth(20);
    for (const [who, dx] of [['me', 70], ['koko', -90], ['gogo', -170]] as const) {
      const g = this.add.graphics().setDepth(20);
      drawPerson(g, LOOKS[who], { facing: 1, backpack: who === 'me' });
      g.setPosition(-120 + dx, FEET).setScale(0.9);
      this.kids[who] = g;
    }
    this.cameras.main.fadeIn(1600, 200, 206, 214);
    void this.play();
  }

  private async speak(dlg: Dialogue, who: Speaker, key: StrKey): Promise<void> {
    const g = who && who in this.kids ? this.kids[who as Who] : undefined;
    if (g) this.tweens.add({ targets: g, y: FEET - 8, yoyo: true, duration: 140, repeat: 1 });
    if (who === 'mom') this.tweens.add({ targets: this.mom, y: FEET - 2, yoyo: true, duration: 200 });
    await dlg.say(who, key);
  }

  private async play(): Promise<void> {
    // we walk in along the lake
    const targets: [Phaser.GameObjects.Components.Transform, number][] = [[this.mom, 560], [this.kids.me!, 630], [this.kids.koko!, 470], [this.kids.gogo!, 390]];
    await Promise.all(targets.map(([o, x]) => tweenP(this, { targets: o, x, duration: 2600, ease: 'Sine.easeOut' })));
    await narrate(this, [{ key: 'll.n1' }, { key: 'll.n2' }], { color: '#3a4448', y: 120, size: 28, depth: 600, hintY: 180 });
    const dlg = new Dialogue(this);
    await this.speak(dlg, 'koko', 'll.i.k1');
    await this.speak(dlg, 'mom', 'll.i.mom1');
    await this.speak(dlg, 'gogo', 'll.i.g1');
    await this.speak(dlg, 'mom', 'll.i.mom2');
    await this.speak(dlg, 'mom', 'll.i.mom3');
    await this.speak(dlg, 'me', 'll.i.m1');
    await this.speak(dlg, 'mom', 'll.i.mom4');
    dlg.hide();
    await wait(this, 200);
    this.cameras.main.fadeOut(900, 220, 230, 230);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('LiulangWhistle'));
  }

  update(time: number, delta: number): void {
    for (const w of this.willows) w.update(time, delta / 1000);
    this.wind.prune(time);
  }
}
