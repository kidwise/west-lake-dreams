import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H } from '../core/config';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait } from '../ui/narrate';
import { Dialogue, type Speaker } from '../ui/Dialogue';
import type { StrKey } from '../core/i18n';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { NightLake, RAIL_Y } from './NightLake';
import { Shimmer } from './Shimmer';
import { drawLantern } from './art';
import { resetPinghu } from './state';

const KIDS: { who: 'koko' | 'gogo' | 'me'; x: number; lamp: 'rabbit' | 'turn' | 'lotus' }[] = [
  { who: 'koko', x: 470, lamp: 'rabbit' },
  { who: 'gogo', x: 600, lamp: 'turn' },
  { who: 'me', x: 730, lamp: 'lotus' },
];

/** Mid-Autumn night: the sky has no moon, and the moon in the lake is broken. */
export class PinghuIntroScene extends Phaser.Scene {
  private lake!: NightLake;
  private shards: Shimmer[] = [];
  private lamps!: Phaser.GameObjects.Graphics;
  private kids: Record<string, Phaser.GameObjects.Graphics> = {};

  constructor() {
    super('PinghuIntro');
  }

  create(): void {
    music.play('phNight');
    resetPinghu(this.textures);
    this.lake = new NightLake(this);
    // the broken moon, scattered across the water
    this.shards = [0, 1, 2].map((i) => {
      const s = new Shimmer(this, 520 + i * 130, 470 + (i % 2) * 30, `phShard${i}`, { depth: -50, strips: 26 });
      s.scaleX = 0.62;
      s.scaleY = 0.34;
      s.alpha = 0.85;
      return s;
    });
    this.kids = {};
    for (const k of KIDS) {
      const g = this.add.graphics().setDepth(50);
      drawPerson(g, LOOKS[k.who], { facing: 1, armUp: true, backpack: k.who === 'me' });
      g.setPosition(k.x, H - 6).setScale(1.1);
      this.kids[k.who] = g;
    }
    this.lamps = this.add.graphics().setDepth(51);
    this.cameras.main.fadeIn(1500, 6, 10, 24);
    void this.play();
  }

  private async speak(dlg: Dialogue, who: Speaker, key: StrKey): Promise<void> {
    const g = who ? this.kids[who] : undefined;
    if (g) this.tweens.add({ targets: g, y: H - 14, yoyo: true, duration: 140, repeat: 1 });
    await dlg.say(who, key);
  }

  private async play(): Promise<void> {
    await narrate(this, [{ key: 'ph.n1' }, { key: 'ph.n2' }], { y: 150, size: 30, depth: 600, hintY: 210 });
    const dlg = new Dialogue(this);
    await this.speak(dlg, 'koko', 'ph.k1');
    await this.speak(dlg, 'gogo', 'ph.g1');
    await this.speak(dlg, 'me', 'ph.m1');
    dlg.hide();
    // the Jade Rabbit hops up onto the railing
    sfx.shimmer();
    const rabbit = this.add.image(W + 60, RAIL_Y - 60, 'phRabbit').setDepth(45).setFlipX(true);
    const glow = this.add.image(rabbit.x, rabbit.y, 'phHalo').setDepth(44).setScale(0.6).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD);
    for (let i = 0; i < 4; i++) {
      await tweenP(this, { targets: rabbit, x: rabbit.x - 80, y: RAIL_Y - 90, duration: 160, yoyo: true, ease: 'Sine.easeOut' });
      rabbit.x -= 80;
      glow.x = rabbit.x;
    }
    this.tweens.add({ targets: glow, x: rabbit.x, alpha: 0.9, yoyo: true, repeat: -1, duration: 900 });
    await wait(this, 300);
    await this.speak(dlg, 'rabbit', 'ph.r1');
    await this.speak(dlg, 'rabbit', 'ph.r2');
    await this.speak(dlg, 'koko', 'ph.k2');
    await this.speak(dlg, 'gogo', 'ph.g2');
    dlg.hide();
    sfx.whee();
    this.cameras.main.fadeOut(1000, 6, 10, 24);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('PinghuBridge'));
  }

  update(time: number): void {
    this.lake.update(time);
    for (const s of this.shards) s.update(time);
    const g = this.lamps;
    g.clear();
    for (const k of KIDS) {
      const kid = this.kids[k.who];
      // hanging from the raised hand
      const x = kid.x + 26;
      const y = kid.y - 99 + Math.sin(time * 0.003 + kid.x) * 2;
      g.fillStyle(0xffd27a, 0.15);
      g.fillCircle(x, y + 14, 34);
      drawLantern(g, k.lamp, x, y, time * 0.002);
    }
  }
}
