import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue, type Speaker } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { drawStorey, drawPagoda } from './art';
import { sfRun } from './state';

const HUD = 300;
const GROUND = 600;
const STOREY_H = 48;
const STOREYS = 7;
const SWING_Y = 210;
const DESIGN = Array.from({ length: STOREYS }, (_, i) => 236 - i * 20);

interface Placed {
  g: Phaser.GameObjects.Graphics;
  x: number;
  w: number;
  y: number;
}

/** 北高峰顶: stack the seven storeys of the Tang pagoda back up, made of the clouds we collected. */
export class ShuangfengTowerScene extends Phaser.Scene {
  private placed: Placed[] = [];
  private swing!: Phaser.GameObjects.Graphics;
  private rope!: Phaser.GameObjects.Graphics;
  private cow!: Phaser.GameObjects.Image;
  private phase = 0;
  private level = 0;
  private swingW = DESIGN[0];
  private swinging = false;
  private dropping = false;
  private sneezeAt = 0;
  private fog: Phaser.GameObjects.Image[] = [];
  private storeyText!: Phaser.GameObjects.Text;
  private neat: number[] = [];

  constructor() {
    super('ShuangfengTower');
  }

  create(): void {
    music.play('sfTower');
    this.placed = [];
    this.level = 0;
    this.phase = 0;
    this.swinging = false;
    this.dropping = false;
    this.fog = [];
    this.neat = [];
    this.paint();
    this.rope = this.add.graphics().setDepth(39);
    this.swing = this.add.graphics().setDepth(40).setVisible(false);
    this.cow = this.add.image(W / 2, 96, 'sfCow').setScale(0.5).setDepth(41);
    this.tweens.add({ targets: this.cow, y: 104, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
    this.storeyText = this.add.text(36, 76, '', baseStyle({ fontSize: '20px', color: '#2f3b3a' })).setDepth(HUD);
    i18nText(this, 36, 38, () => t('sf.t.title'), { fontFamily: FONT_SERIF, fontSize: '22px' }).setDepth(HUD);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => !overGlobalUI(p) && this.drop());
    this.input.keyboard?.on('keydown-SPACE', () => this.drop());
    this.cameras.main.fadeIn(900, 240, 244, 240);
    void this.play();
  }

  private paint(): void {
    this.add.image(0, 0, 'sfSummit').setOrigin(0);
    // the three of us watching
    ([['koko', 190], ['gogo', 270], ['me', 350]] as const).forEach(([who, x]) => {
      const k = this.add.graphics().setDepth(30);
      drawPerson(k, LOOKS[who], { facing: 1, backpack: who === 'me' });
      k.setPosition(x, GROUND + 4).setScale(0.75);
      k.setName(who);
    });
  }

  private async speak(dlg: Dialogue, who: Speaker, key: StrKey): Promise<void> {
    const k = who ? (this.children.getByName(who) as Phaser.GameObjects.Graphics | null) : null;
    if (k) this.tweens.add({ targets: k, y: k.y - 8, yoyo: true, duration: 140, repeat: 1 });
    if (who === 'cow') this.tweens.add({ targets: this.cow, angle: -5, yoyo: true, duration: 200, repeat: 1 });
    await dlg.say(who, key);
  }

  private async play(): Promise<void> {
    const dlg = new Dialogue(this);
    await this.speak(dlg, 'cow', 'sf.t.c1');
    await this.speak(dlg, 'koko', 'sf.t.k0');
    dlg.hide();
    const hint = i18nText(this, W / 2, H - 30, () => t('sf.t.hint'), { fontSize: '20px', color: '#2f3b3a' }).setOrigin(0.5, 1).setDepth(HUD);
    this.nextStorey();
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => this.level >= STOREYS && !this.dropping && (ev.remove(), res()) });
    });
    hint.destroy();
    this.rope.clear();
    this.swing.setVisible(false);
    sfRun.towerNeat = Math.round((this.neat.reduce((a, b) => a + b, 0) / STOREYS) * 100);
    await this.finish();
    await this.speak(dlg, 'cow', 'sf.t.c2');
    await this.speak(dlg, 'gogo', 'sf.t.g1');
    await this.speak(dlg, 'cow', 'sf.t.c3');
    await this.speak(dlg, 'koko', 'sf.t.k1');
    dlg.hide();
    this.cameras.main.fadeOut(900, 240, 244, 240);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('ShuangfengHerd'));
  }

  private topY(): number {
    return this.placed.length ? this.placed[this.placed.length - 1].y - STOREY_H : GROUND - 14;
  }

  private baseX(): number {
    return this.placed.length ? this.placed[this.placed.length - 1].x : W / 2;
  }

  private prevW(): number {
    return this.placed.length ? this.placed[this.placed.length - 1].w : 300;
  }

  private nextStorey(): void {
    if (this.level >= STOREYS) return;
    this.swingW = DESIGN[this.level];
    this.swing.clear();
    drawStorey(this.swing, 0, 0, this.swingW, STOREY_H);
    this.swing.setVisible(true);
    this.swinging = true;
    this.phase = Math.random() < 0.5 ? 0 : Math.PI;
    this.storeyText.setText(t('sf.t.storey', { n: this.level + 1 }));
    // from the fourth storey up, Granny Cow's nose starts to tickle
    this.sneezeAt = this.level >= 3 ? this.time.now + 1600 + Math.random() * 1600 : Infinity;
  }

  private drop(): void {
    if (!this.swinging || this.dropping) return;
    this.swinging = false;
    this.dropping = true;
    const x = this.swing.x;
    const landY = this.topY();
    this.rope.clear();
    sfx.whee();
    this.tweens.add({
      targets: this.swing,
      y: landY,
      duration: 260 + (landY - SWING_Y) * 0.4,
      ease: 'Quad.easeIn',
      onComplete: () => this.land(x, landY),
    });
  }

  private land(x: number, y: number): void {
    const bx = this.baseX();
    const pw = this.prevW();
    const dw = this.swingW;
    let px = x;
    const perfect = Math.abs(x - bx) < 7;
    if (perfect) px = bx;
    // the part that sits on the storey below stays; anything hanging over is trimmed off
    const left = Math.max(px - dw / 2, bx - pw / 2);
    const right = Math.min(px + dw / 2, bx + pw / 2);
    const w = right - left;
    const cx = (left + right) / 2;
    if (w < 26) {
      // it misses altogether: puff, and try again
      sfx.dig();
      this.fallAway(x, y, dw, x > bx ? 1 : -1);
      this.swing.setVisible(false);
      this.swing.y = SWING_Y;
      this.pop(t('sf.t.miss'), x, y - 60, '#7a4a3a');
      this.time.delayedCall(700, () => {
        this.dropping = false;
        this.nextStorey();
      });
      return;
    }
    if (left - (px - dw / 2) > 1) this.fallAway((px - dw / 2 + left) / 2, y, left - (px - dw / 2), -1);
    if (px + dw / 2 - right > 1) this.fallAway((right + px + dw / 2) / 2, y, px + dw / 2 - right, 1);
    if (perfect) {
      sfRun.towerPerfect += 1;
      sfx.stone(music.noteFreq(this.level));
      this.cameras.main.shake(80, 0.002);
      this.pop(t('sf.t.perfect'), cx, y - STOREY_H - 20, '#c0392b');
    } else {
      sfx.stone(music.noteFreq(this.level) * 0.75);
      this.pop(t(w < dw - 2 ? 'sf.t.cut' : 'sf.t.good'), cx, y - STOREY_H - 20, '#2f6a3a');
    }
    const g = this.add.graphics().setDepth(20 + this.level);
    drawStorey(g, 0, 0, w, STOREY_H);
    g.setPosition(cx, y);
    this.placed.push({ g, x: cx, w, y });
    this.neat.push(w / dw);
    for (let i = 0; i < 5; i++) {
      const p = this.add.image(cx + (Math.random() - 0.5) * w, y, 'sfPuff').setScale(0.25).setAlpha(0.8).setDepth(25);
      this.tweens.add({ targets: p, y: y + 10, x: p.x + (Math.random() - 0.5) * 60, alpha: 0, scale: 0.5, duration: 700, onComplete: () => p.destroy() });
    }
    this.swing.setVisible(false);
    this.swing.y = SWING_Y;
    this.level += 1;
    this.time.delayedCall(350, () => {
      this.dropping = false;
      this.nextStorey();
    });
  }

  /** A trimmed-off piece (or a whole missed storey) tumbling down as cloud. */
  private fallAway(x: number, y: number, w: number, side: number): void {
    const g = this.add.graphics().setDepth(19);
    g.fillStyle(0xf1e6d0, 1);
    g.fillRect(-w / 2, -STOREY_H + 10, w, STOREY_H - 10);
    g.fillStyle(0x3d4a4f, 1);
    g.fillRect(-w / 2 - 4, -STOREY_H, w + 8, 12);
    g.setPosition(x, y);
    this.tweens.add({ targets: g, x: x + side * 120, y: GROUND + 80, angle: side * 70, alpha: 0, duration: 900, ease: 'Quad.easeIn', onComplete: () => g.destroy() });
  }

  private pop(s: string, x: number, y: number, color: string): void {
    const txt = this.add.text(x, y, s, baseStyle({ fontSize: '30px', color, fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 6 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
  }

  private sneeze(): void {
    sfx.sneeze();
    this.tweens.add({ targets: this.cow, angle: 10, yoyo: true, duration: 120 });
    this.pop(t('sf.t.sneeze'), this.cow.x - 120, this.cow.y + 10, '#5d8ab0');
    // a cloud of mist blows over the swinging storey for a moment
    for (let i = 0; i < 7; i++) {
      const p = this.add.image(this.cow.x - 60, this.cow.y + 40, 'sfPuff').setScale(0.4).setAlpha(0).setDepth(45);
      this.fog.push(p);
      this.tweens.add({
        targets: p,
        x: this.swing.x + (i - 3) * 50,
        y: SWING_Y - 30 + (i % 3) * 20,
        scale: 1.3,
        alpha: 0.95,
        duration: 300,
        onComplete: () => this.tweens.add({ targets: p, alpha: 0, delay: 900, duration: 700, onComplete: () => p.destroy() }),
      });
    }
  }

  private async finish(): Promise<void> {
    // the finial drops into place, then every doorway lights up
    const top = this.topY();
    const spire = this.add.graphics().setDepth(30);
    spire.fillStyle(0x6b5a3a, 1);
    spire.fillRect(-2, -60, 4, 60);
    spire.fillStyle(0xd9b45a, 1);
    for (let k = 0; k < 4; k++) spire.fillEllipse(0, -14 - k * 10, 14 - k * 2, 4);
    spire.fillCircle(0, -62, 6);
    spire.setPosition(this.baseX(), SWING_Y - 100);
    await tweenP(this, { targets: spire, y: top, duration: 500, ease: 'Bounce.easeOut' });
    sfx.bell();
    await wait(this, 300);
    for (const [i, p] of this.placed.entries()) {
      this.time.delayedCall(i * 140, () => {
        p.g.clear();
        drawStorey(p.g, 0, 0, p.w, STOREY_H, { lit: 1 });
        sfx.petal(i);
      });
    }
    await wait(this, STOREYS * 140 + 200);
    const glow = this.add.image(this.baseX(), top - 60, 'phHalo').setScale(1.6).setDepth(29).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, alpha: 0.9, duration: 800 });
    sfx.shimmer();
    sfx.moo();
    // a little preview: the same pagoda, drawn small on the far South Peak's ridge, as a dotted outline
    const ghost = this.add.graphics().setDepth(5).setAlpha(0);
    drawPagoda(ghost, 110, 384, 70, { alpha: 0.5 });
    this.tweens.add({ targets: ghost, alpha: 0.6, yoyo: true, repeat: 2, duration: 500, onComplete: () => ghost.setAlpha(0) });
    await wait(this, 900);
  }

  update(time: number, delta: number): void {
    if (this.swinging) {
      const speed = 1.5 + this.level * 0.32;
      this.phase += (delta / 1000) * speed;
      const amp = 230 + this.level * 10;
      const x = this.baseX() + Math.sin(this.phase) * amp;
      this.swing.setPosition(x, SWING_Y);
      this.cow.x = x + 20;
      this.rope.clear();
      this.rope.lineStyle(2, 0xffffff, 0.9);
      this.rope.lineBetween(this.cow.x - 30, this.cow.y + 40, x, SWING_Y - STOREY_H);
      if (time > this.sneezeAt) {
        this.sneeze();
        this.sneezeAt = time + 2600 + Math.random() * 2000;
      }
    }
    for (const p of this.fog) if (p.active) p.x += Math.sin(time * 0.002) * 0.3;
    this.fog = this.fog.filter((p) => p.active);
  }
}
