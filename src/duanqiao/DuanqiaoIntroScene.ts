import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t } from '../core/i18n';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { rng } from '../art/paint';
import { drawKid } from './art';
import { resetDuanqiao } from './state';

/** The window: x, y, width, height. */
const WIN = { x: 420, y: 70, w: 640, h: 380 };
const GRID = { cols: 16, rows: 10 };

/** 下雪了: a fogged-up window on a snowy morning. */
export class DuanqiaoIntroScene extends Phaser.Scene {
  private fog!: Phaser.GameObjects.RenderTexture;
  private brush!: Phaser.GameObjects.Image;
  private wiped = new Set<number>();
  private wiping = false;
  private canWipe = false;
  private flakes: { x: number; y: number; v: number; r: number }[] = [];
  private snowG!: Phaser.GameObjects.Graphics;

  constructor() {
    super('DuanqiaoIntro');
  }

  create(): void {
    music.play('dqMorning');
    resetDuanqiao(this.textures);
    this.wiped = new Set();
    this.wiping = false;
    this.canWipe = false;

    this.paintOutside();
    this.paintRoom();

    // the fogged-up glass
    this.fog = this.add.renderTexture(WIN.x, WIN.y, WIN.w, WIN.h).setOrigin(0).setDepth(20);
    this.fog.fill(0xdde4e8, 0.94).render();
    // not added to the display list: only used as a brush for erasing
    this.brush = new Phaser.GameObjects.Image(this, 0, 0, 'dqBrush');
    this.paintFrame();

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!overGlobalUI(p)) {
        this.wiping = true;
        this.wipe(p.x, p.y);
      }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.wiping || p.isDown) this.wipe(p.x, p.y);
    });
    this.input.on('pointerup', () => (this.wiping = false));

    this.cameras.main.fadeIn(1500, 20, 24, 30);
    void this.play();
  }

  private paintOutside(): void {
    const r = rng(3);
    const g = this.add.graphics().setDepth(1);
    g.fillGradientStyle(0xe8eef2, 0xe8eef2, 0xcfd8de, 0xcfd8de, 1);
    g.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    // roofs across the street, white with snow
    for (let i = 0; i < 5; i++) {
      const x = WIN.x + 10 + i * 124 + r() * 10;
      const top = WIN.y + 150 + r() * 60;
      g.fillStyle(0x9aa4aa, 1);
      g.fillRect(x, top + 24, 110, WIN.y + WIN.h - (top + 24));
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(Math.max(WIN.x, x - 10), top + 28, Math.min(WIN.x + WIN.w, x + 120), top + 28, x + 55, top - 14);
      g.fillStyle(0x6b7378, 1);
      for (let k = 0; k < 2; k++) g.fillRect(x + 18 + k * 50, top + 50, 22, 28);
    }
    // the street below, with GOGO waving a snowball
    g.fillStyle(0xf6f8fa, 1);
    g.fillRect(WIN.x, WIN.y + WIN.h - 70, WIN.w, 70);
    const tree = this.add.image(WIN.x + 120, WIN.y + WIN.h - 20, 'dqPlane').setOrigin(0.5, 1).setScale(0.62).setDepth(2);
    void tree;
    const gogo = this.add.graphics().setDepth(3);
    drawKid(gogo, 'gogo', { facing: -1, armUp: true });
    gogo.setPosition(WIN.x + WIN.w - 170, WIN.y + WIN.h - 18).setScale(0.62);
    this.tweens.add({ targets: gogo, angle: { from: -4, to: 4 }, yoyo: true, repeat: -1, duration: 300 });
    this.add.image(WIN.x + WIN.w - 156, WIN.y + WIN.h - 100, 'dqSnowball').setDepth(4).setScale(0.8);
    this.snowG = this.add.graphics().setDepth(5);
    for (let i = 0; i < 90; i++) this.flakes.push({ x: Math.random() * WIN.w, y: Math.random() * WIN.h, v: 20 + Math.random() * 50, r: 1 + Math.random() * 2.5 });
  }

  private paintRoom(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xe9dcc4, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0xd8c8ac, 1);
    g.fillRect(0, 520, W, H - 520);
    // a warm wall lamp glow
    const glow = this.add.image(170, 180, 'hgGlow').setScale(3).setTint(0xffd9a0).setAlpha(0.35).setDepth(0.5);
    void glow;
    // floorboards and a skirting board
    g.fillStyle(0xbfa888, 1);
    g.fillRect(0, 512, W, 10);
    g.lineStyle(1, 0xb09a7a, 0.8);
    for (let y = 540; y < H; y += 26) g.lineBetween(0, y, W, y);
    // bed with a thick winter quilt, curtains by the window
    this.add.image(-60, 660, 'roomBedRed').setOrigin(0, 1).setScale(0.85).setDepth(30);
    this.add.image(WIN.x - 40, WIN.y - 26, 'roomCurtainCream').setOrigin(0.5, 0).setScale(1.25).setDepth(27);
    this.add.image(WIN.x + WIN.w + 40, WIN.y - 26, 'roomCurtainCream').setOrigin(0.5, 0).setScale(1.25).setFlipX(true).setDepth(27);
    const bed = this.add.graphics().setDepth(26);
    // windowsill, and a cast-iron radiator under it
    bed.fillStyle(0xcfc2a8, 1);
    bed.fillRect(WIN.x - 30, WIN.y + WIN.h + 10, WIN.w + 60, 20);
    bed.fillStyle(0xe0d4bc, 1);
    bed.fillRect(WIN.x - 30, WIN.y + WIN.h + 10, WIN.w + 60, 4);
    for (let i = 0; i < 12; i++) {
      const x = WIN.x + 60 + i * 42;
      bed.fillStyle(0x8a8478, 1);
      bed.fillRoundedRect(x - 1, WIN.y + WIN.h + 49, 32, 82, 9);
      bed.fillGradientStyle(0xe8e2d6, 0xc8c0b0, 0xe8e2d6, 0xc8c0b0, 1);
      bed.fillRoundedRect(x, WIN.y + WIN.h + 50, 30, 80, 8);
    }
    // a cup of hot tea steaming on the sill
    bed.fillStyle(0xffffff, 1);
    bed.fillRoundedRect(WIN.x + WIN.w - 60, WIN.y + WIN.h - 16, 26, 26, 5);
    bed.lineStyle(3, 0xffffff, 1);
    bed.strokeCircle(WIN.x + WIN.w - 30, WIN.y + WIN.h - 2, 6);
    bed.fillStyle(0x7ab0d0, 1);
    bed.fillRect(WIN.x + WIN.w - 58, WIN.y + WIN.h - 6, 22, 4);
  }

  private paintFrame(): void {
    const f = this.add.graphics().setDepth(25);
    f.lineStyle(18, 0xf4efe6, 1);
    f.strokeRect(WIN.x - 9, WIN.y - 9, WIN.w + 18, WIN.h + 18);
    f.lineStyle(10, 0xf4efe6, 1);
    f.lineBetween(WIN.x + WIN.w / 2, WIN.y, WIN.x + WIN.w / 2, WIN.y + WIN.h);
    f.lineStyle(2, 0xb8ad9a, 1);
    f.strokeRect(WIN.x - 18, WIN.y - 18, WIN.w + 36, WIN.h + 36);
  }

  private wipe(x: number, y: number): void {
    if (!this.canWipe) return;
    if (x < WIN.x - 20 || x > WIN.x + WIN.w + 20 || y < WIN.y - 20 || y > WIN.y + WIN.h + 20) return;
    this.fog.erase(this.brush, x - WIN.x, y - WIN.y).render();
    // track how much of the glass is clear
    const cw = WIN.w / GRID.cols;
    const ch = WIN.h / GRID.rows;
    for (let c = 0; c < GRID.cols; c++) {
      for (let r = 0; r < GRID.rows; r++) {
        const cx = WIN.x + (c + 0.5) * cw;
        const cy = WIN.y + (r + 0.5) * ch;
        if (Math.hypot(cx - x, cy - y) < 40) this.wiped.add(r * GRID.cols + c);
      }
    }
    if (Math.random() < 0.12) sfx.blip();
  }

  private async play(): Promise<void> {
    const band = this.add.rectangle(W / 2, 612, W, 92, 0xf6efe2, 0.88).setDepth(590);
    await narrate(this, [{ key: 'dq.n1' }, { key: 'dq.n2' }, { key: 'dq.n3' }], { y: 600, size: 28, color: '#3a3230', hintY: H - 24, depth: 600 });
    band.destroy();
    this.canWipe = true;
    const hintBand = this.add.rectangle(W / 2, 620, W, 70, 0xf6efe2, 0.88).setDepth(590);
    const hint = i18nText(this, W / 2, 620, () => t('dq.wipeHint'), { fontFamily: FONT_SERIF, fontSize: '28px', color: '#3a3230' }).setOrigin(0.5).setDepth(600);
    this.tweens.add({ targets: hint, alpha: 0.5, yoyo: true, repeat: -1, duration: 800 });
    // a hand-shaped hint swiping across the glass
    const hand = this.add.image(WIN.x + 160, WIN.y + 200, 'dqBrush').setScale(0.5).setAlpha(0.6).setDepth(26);
    this.tweens.add({ targets: hand, x: WIN.x + WIN.w - 160, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.easeInOut' });
    await new Promise<void>((resolve) => {
      const ev = this.time.addEvent({
        delay: 150,
        loop: true,
        callback: () => {
          if (this.wiped.size > 0) hand.setVisible(false);
          if (this.wiped.size >= GRID.cols * GRID.rows * 0.42) {
            ev.remove();
            resolve();
          }
        },
      });
    });
    this.canWipe = false;
    hint.destroy();
    hintBand.destroy();
    hand.destroy();
    await tweenP(this, { targets: this.fog, alpha: 0, duration: 900 });
    sfx.chime();
    const wow = this.add.text(WIN.x + WIN.w / 2, WIN.y + WIN.h / 2, t('dq.wow'), baseStyle({ fontFamily: FONT_SERIF, fontSize: '72px', color: '#ffffff', stroke: '#3a5a7a', strokeThickness: 8 })).setOrigin(0.5).setDepth(40).setScale(0.4);
    await tweenP(this, { targets: wow, scale: 1, duration: 500, ease: 'Back.easeOut' });
    await wait(this, 900);
    this.tweens.add({ targets: wow, alpha: 0, duration: 400 });
    const dlg = new Dialogue(this);
    await dlg.say('gogo', 'dq.g1');
    await dlg.say('mom', 'dq.mom1');
    await dlg.say('me', 'dq.m1');
    dlg.hide();
    sfx.whee();
    this.cameras.main.fadeOut(900, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('DuanqiaoStreet'));
  }

  update(_time: number, delta: number): void {
    const g = this.snowG;
    g.clear();
    g.fillStyle(0xffffff, 0.95);
    for (const f of this.flakes) {
      f.y += (f.v * delta) / 1000;
      f.x += Math.sin(f.y * 0.03) * 0.3;
      if (f.y > WIN.h) {
        f.y = 0;
        f.x = Math.random() * WIN.w;
      }
      g.fillCircle(WIN.x + f.x, WIN.y + f.y, f.r);
    }
  }
}
