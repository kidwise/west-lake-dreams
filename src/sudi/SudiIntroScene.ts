import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t } from '../core/i18n';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { makeButton, type Button } from '../ui/Button';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { Cyclist, LOOKS } from '../art/Cyclist';
import { DawnSky } from './DawnSky';
import { drawElder } from './art';
import { BASE, WATER } from './causeway';
import { resetSudi } from './state';

const GAP_L = 400;
const GAP_R = 940;
const NEED = 16; // scoops of mud to close the gap

/** Prologue: a gap in the causeway, and an old man with a shovel in the mist. */
export class SudiIntroScene extends Phaser.Scene {
  private sky!: DawnSky;
  private fill = 0;
  private fillG!: Phaser.GameObjects.Graphics;
  private murk!: Phaser.GameObjects.Rectangle;
  private elder!: Phaser.GameObjects.Graphics;
  private elderPhase = 0;
  private meter!: Phaser.GameObjects.Graphics;
  private meterT = 0;
  private digging = false;
  private canDig = false;
  private lastDig = 0;
  private digBtn: Button | null = null;
  private fish: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('SudiIntro');
  }

  create(): void {
    music.play('sudiDawn');
    resetSudi(this.textures);
    this.fill = 0;
    this.digging = false;
    this.canDig = false;
    this.fish = [];
    this.digBtn = null;

    this.sky = new DawnSky(this, W);
    this.sky.update(0.06, 0, 0);
    this.paintCauseway();

    // lantern with a warm glow (above the darkness overlay)
    this.add.image(GAP_L - 60, BASE + 4, 'sudiLantern').setOrigin(0.5, 1).setDepth(20);
    const glow = this.add.graphics().setDepth(510).setBlendMode(Phaser.BlendModes.ADD);
    for (const [r, a] of [[90, 0.06], [50, 0.12], [24, 0.3]]) {
      glow.fillStyle(0xffb36b, a);
      glow.fillCircle(GAP_L - 60 + 16, BASE - 126, r);
    }
    this.tweens.add({ targets: glow, alpha: 0.75, yoyo: true, repeat: -1, duration: 900 });

    // the three of us waiting with our bikes on the south end
    const riders: [number, keyof typeof LOOKS, number][] = [
      [110, 'gogo', 0.82],
      [205, 'koko', 0.8],
      [300, 'me', 0.86],
    ];
    for (const [x, who, sc] of riders) {
      const c = new Cyclist(this, LOOKS[who], sc);
      c.crank = 1.2;
      c.draw();
      c.g.setPosition(x, BASE).setDepth(30);
      this.tweens.add({ targets: c.g, y: BASE - 2, yoyo: true, repeat: -1, duration: 1300 + x });
    }

    this.elder = this.add.graphics().setDepth(32);
    this.elder.setPosition(GAP_L + 70, WATER + 14);
    drawElder(this.elder, 0.3);

    this.cameras.main.fadeIn(1500, 8, 12, 30);
    void this.play();
  }

  private paintCauseway(): void {
    const g = this.add.graphics().setDepth(10);
    const bank = (x0: number, x1: number) => {
      g.fillStyle(0x6f8a58, 1);
      g.fillRect(x0, BASE, x1 - x0, WATER - BASE);
      g.fillStyle(0xd9ccb4, 1);
      g.fillRect(x0, BASE - 2, x1 - x0, 10);
      g.fillStyle(0x9a8f7c, 1);
      g.fillRect(x0, WATER - 8, x1 - x0, 8);
    };
    bank(-10, GAP_L);
    bank(GAP_R, W + 10);
    // trees on both sides: 杨柳 and 桃
    for (const [x, key] of [[40, 'willow'], [180, 'peach'], [GAP_R + 40, 'willow'], [GAP_R + 180, 'peach'], [GAP_R + 300, 'willow']] as const) {
      this.add.image(x, BASE + 4, key).setOrigin(0.5, 1).setScale(key === 'willow' ? 0.72 : 0.9).setDepth(5);
    }
    this.fillG = this.add.graphics().setDepth(11);
    // murky water in front of the gap — it clears as the mud is dug out
    this.murk = this.add.rectangle(GAP_L - 80, WATER, GAP_R - GAP_L + 160, H - WATER, 0x5a4a30, 0.55).setOrigin(0).setDepth(41);
  }

  private drawFill(): void {
    const g = this.fillG;
    g.clear();
    const k = this.fill / NEED;
    const edge = GAP_L + (GAP_R - GAP_L) * k;
    if (k <= 0) return;
    // fresh mud, turning to grass once the causeway is complete
    const mud = k >= 1 ? 0x6f8a58 : 0x5a4632;
    g.fillStyle(mud, 1);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(GAP_L - 2, WATER),
        new Phaser.Math.Vector2(GAP_L - 2, BASE + 4),
        new Phaser.Math.Vector2(edge - 20, BASE + 4),
        new Phaser.Math.Vector2(edge, BASE + 22),
        new Phaser.Math.Vector2(edge + 14, WATER),
      ],
      true,
    );
    g.fillStyle(k >= 1 ? 0xd9ccb4 : 0x7a6248, 1);
    g.fillRect(GAP_L - 2, BASE - 2, Math.max(0, edge - 20 - GAP_L), 8);
  }

  private async play(): Promise<void> {
    await narrate(this, [{ key: 'sudi.n1' }, { key: 'sudi.n2' }, { key: 'sudi.n3' }, { key: 'sudi.n4' }], { y: 150, size: 30, depth: 600, hintY: 230 });
    await this.digGame();

    // the causeway is whole again
    sfx.chime();
    const dlg = new Dialogue(this);
    await dlg.say('elder', 'sudi.e1');
    // he looks out over the lake and recites
    const poem = this.add
      .text(W / 2 + 280, 200, '欲\n把\n西\n湖\n比\n西\n子', baseStyle({ fontFamily: FONT_SERIF, fontSize: '30px', color: '#f6ead2', align: 'center', lineSpacing: 2 }))
      .setOrigin(0.5)
      .setDepth(620)
      .setAlpha(0);
    const poem2 = this.add
      .text(W / 2 + 230, 200, '淡\n妆\n浓\n抹\n总\n相\n宜', baseStyle({ fontFamily: FONT_SERIF, fontSize: '30px', color: '#f6ead2', align: 'center', lineSpacing: 2 }))
      .setOrigin(0.5)
      .setDepth(620)
      .setAlpha(0);
    this.tweens.add({ targets: [poem, poem2], alpha: 0.9, duration: 1200 });
    await dlg.say('elder', 'sudi.e2');
    // ...and fades into the mist
    this.tweens.add({ targets: [poem, poem2], alpha: 0, duration: 1600 });
    await tweenP(this, { targets: this.elder, alpha: 0, duration: 1600 });
    await dlg.say('koko', 'sudi.k1');
    await dlg.say('gogo', 'sudi.g1');
    await dlg.say(null, 'sudi.m1');
    await dlg.say('gogo', 'sudi.g2');
    dlg.hide();
    sfx.whee();
    this.cameras.main.fadeOut(1000, 20, 28, 60);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('SudiRide'));
  }

  /** The dredging mini-game. Resolves when the gap is filled. */
  private digGame(): Promise<void> {
    const title = i18nText(this, W / 2, 64, () => t('sudi.digTitle'), { fontFamily: FONT_SERIF, fontSize: '30px', color: CSS.paper })
      .setOrigin(0.5)
      .setDepth(620);
    const touch = this.sys.game.device.input.touch;
    const hint = i18nText(this, W / 2, 106, () => t(touch ? 'sudi.digHintTouch' : 'sudi.digHintKeys'), {
      fontSize: '19px',
      color: '#e8e2f2',
    })
      .setOrigin(0.5)
      .setDepth(620);
    this.meter = this.add.graphics().setDepth(620);
    this.digBtn = makeButton(this, W - 140, H - 80, () => t('sudi.digBtn'), {
      width: 160,
      height: 80,
      fontSize: 32,
      depth: 630,
      fill: 0xf3e2c4,
      onDown: () => this.dig(),
    });
    this.canDig = true;
    const onKey = () => this.dig();
    this.input.keyboard?.on('keydown-SPACE', onKey);
    const onPointer = (p: Phaser.Input.Pointer) => {
      if (!overGlobalUI(p) && p.y < H - 140) this.dig();
    };
    this.input.on('pointerdown', onPointer);

    return new Promise((resolve) => {
      const check = this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
          if (this.fill < NEED || this.digging) return;
          check.remove();
          this.canDig = false;
          this.input.keyboard?.off('keydown-SPACE', onKey);
          this.input.off('pointerdown', onPointer);
          this.digBtn?.destroy();
          this.meter.destroy();
          this.tweens.add({ targets: [title, hint], alpha: 0, duration: 500 });
          void wait(this, 600).then(resolve);
        },
      });
    });
  }

  /** The shovel swings up and down; the green zone is near the bottom of the swing. */
  private inGreen(): boolean {
    return Math.sin(this.meterT) > 0.72;
  }

  private dig(): void {
    if (!this.canDig || this.digging || this.fill >= NEED) return;
    const now = this.time.now;
    if (now - this.lastDig < 230) return;
    this.lastDig = now;
    this.digging = true;
    const big = this.inGreen();
    const amount = big ? 2 : 1;
    sfx.dig();
    const ex = this.elder.x;
    const ey = this.elder.y;
    // bend, scoop, lift, toss
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 320,
      ease: 'Quad.easeOut',
      onUpdate: (tw) => {
        this.elderPhase = tw.getValue() ?? 0;
        drawElder(this.elder, this.elderPhase);
      },
      onComplete: () => {
        // a clump of mud flies onto the causeway
        const target = GAP_L + (GAP_R - GAP_L) * Math.min(1, (this.fill + amount) / NEED) - 30;
        const clump = this.add.circle(ex + 40, ey - 120, big ? 13 : 9, 0x5a4632).setDepth(33);
        this.tweens.add({ targets: clump, x: target, duration: 380, ease: 'Linear' });
        this.tweens.add({
          targets: clump,
          y: { from: ey - 120, to: BASE + 6 },
          duration: 380,
          ease: (k: number) => k * k * 1.6 - k * 0.6,
          onComplete: () => {
            clump.destroy();
            this.fill = Math.min(NEED, this.fill + amount);
            this.drawFill();
            sfx.splash();
            this.murk.setAlpha(0.55 * (1 - this.fill / NEED) ** 1.2);
            // the old man wades along the growing causeway
            const edge = GAP_L + (GAP_R - GAP_L) * (this.fill / NEED);
            this.tweens.add({ targets: this.elder, x: Math.min(GAP_R - 40, edge + 70), duration: 300 });
            if (this.fill >= NEED * 0.6 && this.fish.length === 0) this.releaseFish();
            this.digging = false;
            drawElder(this.elder, 0.3);
          },
        });
        if (big) this.pop(t('sudi.digGood'), ex, ey - 190, '#ffd27a');
        if (this.fill + amount >= NEED * 0.5 && this.fill < NEED * 0.5) this.pop(t('sudi.digClear'), W / 2, WATER + 50, '#bfe8ff');
      },
    });
  }

  private releaseFish(): void {
    for (let i = 0; i < 4; i++) {
      const f = this.add.image(GAP_L + Math.random() * (GAP_R - GAP_L), WATER + 40 + Math.random() * 90, 'sudiFish').setDepth(42).setAlpha(0);
      this.tweens.add({ targets: f, alpha: 0.9, duration: 600 });
      this.tweens.add({ targets: f, x: f.x - 160 - Math.random() * 200, duration: 4000 + Math.random() * 2000, yoyo: true, repeat: -1, flipX: true });
      this.fish.push(f);
    }
  }

  private pop(text: string, x: number, y: number, color: string): void {
    const txt = this.add
      .text(x, y, text, baseStyle({ fontSize: '26px', color, fontStyle: 'bold', stroke: '#1b2238', strokeThickness: 5 }))
      .setOrigin(0.5)
      .setDepth(640);
    this.tweens.add({ targets: txt, y: y - 50, alpha: 0, duration: 1100, onComplete: () => txt.destroy() });
  }

  update(time: number, delta: number): void {
    this.sky.update(0.06 + Math.min(0.06, this.fill / NEED / 16), 0, time);
    if (this.canDig && this.meter.active) {
      this.meterT += (delta / 1000) * 4.2;
      const g = this.meter;
      g.clear();
      const x = this.elder.x + 70;
      const top = WATER - 210;
      const h = 150;
      g.fillStyle(0x10162c, 0.7);
      g.fillRoundedRect(x - 10, top - 6, 20, h + 12, 8);
      g.fillStyle(0x6fd18a, 0.9);
      g.fillRoundedRect(x - 7, top + h * 0.86 - 2, 14, h * 0.14 + 4, 5);
      const k = (Math.sin(this.meterT) + 1) / 2;
      g.fillStyle(this.inGreen() ? 0xffffff : 0xffd27a, 1);
      g.fillCircle(x, top + k * h, 9);
      g.lineStyle(2, 0xffffff, 0.6);
      g.strokeRoundedRect(x - 10, top - 6, 20, h + 12, 8);
    }
  }
}
