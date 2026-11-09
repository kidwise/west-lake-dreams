import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H } from '../core/config';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait } from '../ui/narrate';
import { Dialogue } from '../ui/Dialogue';
import { paintBackdrop, type Backdrop } from '../art/backdrop';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { rng } from '../art/paint';
import { drawPeony, PEONY } from './art';
import { resetHuagang } from './state';

const GROUND = 560;

/** 少年之梦: a bag of fish food, and a run through the peony garden (牡丹园). */
export class HuagangIntroScene extends Phaser.Scene {
  private backdrop!: Backdrop;
  private kids: Record<'me' | 'gogo' | 'koko', Phaser.GameObjects.Graphics> = {} as never;

  constructor() {
    super('HuagangIntro');
  }

  create(): void {
    music.play('huagang');
    resetHuagang(this.textures);
    this.backdrop = paintBackdrop(this, { horizon: 330, skyTop: 0x9fd0ef, skyBottom: 0xf6efe0 });
    this.paintGarden();

    // the three of us, waiting just off the left edge
    (['koko', 'gogo', 'me'] as const).forEach((who, i) => {
      const g = this.add.graphics().setDepth(45 + i);
      drawPerson(g, LOOKS[who], { facing: 1, backpack: who === 'me' });
      g.setPosition(-80 - i * 90, GROUND + 6).setScale(1.15);
      this.kids[who] = g;
    });

    // petals drifting across the garden
    const r = rng(9);
    this.time.addEvent({
      delay: 420,
      loop: true,
      callback: () => {
        const p = this.add.image(-20 + r() * W * 0.6, -20, r() < 0.5 ? 'hgPetal' : 'hgPetalRed').setDepth(60).setScale(0.6 + r() * 0.5);
        this.tweens.add({ targets: p, x: p.x + 300 + r() * 300, y: H + 30, angle: 360 * (r() < 0.5 ? 1 : -1), duration: 7000 + r() * 3000, onComplete: () => p.destroy() });
      },
    });

    this.cameras.main.fadeIn(1400, 255, 248, 236);
    void this.play();
  }

  private paintGarden(): void {
    const r = rng(41);
    const g = this.add.graphics().setDepth(5);
    // lawn and a stone path through the garden
    g.fillStyle(0x86b064, 1);
    g.fillRect(0, 420, W, H - 420);
    g.fillStyle(0x9cc274, 1);
    g.fillRect(0, 420, W, 30);
    g.fillStyle(0xd9ccb4, 1);
    g.fillRect(0, GROUND - 8, W, 40);
    g.fillStyle(0xb8a88c, 1);
    for (let x = 0; x < W; x += 54) g.fillRoundedRect(x + 2, GROUND - 4, 50, 30, 6);
    g.fillStyle(0xd9ccb4, 1);
    for (let x = 0; x < W; x += 54) g.fillRoundedRect(x + 4, GROUND - 6, 46, 26, 6);
    // trees behind: cedars (雪松) and round camphor crowns
    for (let x = 30; x < W; x += 140 + r() * 80) {
      const cedar = r() < 0.5;
      this.add.image(x, 452, cedar ? 'hgCedar' : 'hgCamphor').setOrigin(0.5, 1).setScale(cedar ? 0.95 + r() * 0.2 : 1 + r() * 0.2).setDepth(4).setFlipX(r() < 0.5);
    }
    // peony bushes: big leaves, bigger flowers
    const bushes = this.add.graphics().setDepth(40);
    const bush = (cx: number, cy: number, w: number, blooms: number, big = false) => {
      for (let i = 0; i < 26; i++) {
        bushes.fillStyle([0x3f7a3a, 0x4f8f4a, 0x5f9f50][i % 3], 1);
        bushes.fillEllipse(cx + (r() - 0.5) * w, cy + (r() - 0.6) * 60, 40 + r() * 24, 24 + r() * 12);
      }
      for (let i = 0; i < blooms; i++) {
        const col = PEONY[Math.floor(r() * PEONY.length)];
        drawPeony(bushes, cx + (r() - 0.5) * w * 0.85, cy - 20 - r() * 40, big && i === 0 ? 48 : 20 + r() * 12, col, 100 + i + cx);
      }
    };
    bush(140, 470, 220, 4);
    bush(420, 476, 260, 5);
    bush(760, 466, 230, 3, true);
    bush(1080, 474, 280, 5);
    // front row, overlapping the path's lower edge
    const front = this.add.graphics().setDepth(50);
    for (let x = -20; x < W + 40; x += 120) {
      for (let i = 0; i < 10; i++) {
        front.fillStyle([0x3f7a3a, 0x4f8f4a][i % 2], 1);
        front.fillEllipse(x + (r() - 0.5) * 110, H - 40 + (r() - 0.5) * 50, 50, 28);
      }
      drawPeony(front, x + (r() - 0.5) * 60, H - 70, 22 + r() * 10, PEONY[Math.floor(r() * PEONY.length)], x + 7);
    }
  }

  private walk(g: Phaser.GameObjects.Graphics, toX: number, ms: number): Promise<void> {
    const bob = this.tweens.add({ targets: g, y: GROUND + 2, yoyo: true, repeat: -1, duration: 150 });
    return tweenP(this, { targets: g, x: toX, duration: ms, ease: 'Sine.easeInOut' }).then(() => {
      bob.remove();
      g.y = GROUND + 6;
    });
  }

  private async play(): Promise<void> {
    const shade = this.add.rectangle(0, 0, W, H, 0x1f2a3a, 0.55).setOrigin(0).setDepth(400);
    await narrate(this, [{ key: 'hg.n1' }, { key: 'hg.n2' }, { key: 'hg.n3' }, { key: 'hg.n4' }], { y: 300, size: 32, depth: 500 });
    await tweenP(this, { targets: shade, alpha: 0, duration: 900 });
    shade.destroy();

    // run in; GOGO stops at the giant peony
    void this.walk(this.kids.koko, 980, 2600);
    void this.walk(this.kids.me, 860, 2700);
    await this.walk(this.kids.gogo, 720, 2400);
    const dlg = new Dialogue(this);
    this.tweens.add({ targets: this.kids.gogo, y: GROUND - 6, yoyo: true, duration: 140, repeat: 1 });
    await dlg.say('gogo', 'hg.g1');
    await dlg.say('koko', 'hg.k1');
    await dlg.say('me', 'hg.m1');
    dlg.hide();
    sfx.whee();
    void this.walk(this.kids.gogo, W + 200, 1500);
    void this.walk(this.kids.me, W + 120, 1300);
    void this.walk(this.kids.koko, W + 160, 1100);
    await wait(this, 900);
    this.cameras.main.fadeOut(900, 255, 248, 236);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('HuagangPond'));
  }

  update(time: number): void {
    this.backdrop.update(time, 0);
  }
}
