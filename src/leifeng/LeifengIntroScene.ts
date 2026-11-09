import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H } from '../core/config';
import type { StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait } from '../ui/narrate';
import { Dialogue, type Speaker } from '../ui/Dialogue';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { drawHill, drawWillow } from './art';
import { Sunset } from './Sunset';
import { resetLeifeng } from './state';

const GROUND = 520;
type Kid = 'me' | 'gogo' | 'koko';

/** Dusk at the foot of 夕照山: the golden pagoda, the lady in white, and 法海. */
export class LeifengIntroScene extends Phaser.Scene {
  private sunset!: Sunset;
  private kids: Partial<Record<Kid, Phaser.GameObjects.Graphics>> = {};
  private lady: Phaser.GameObjects.Image | null = null;
  private fahai: Phaser.GameObjects.Image | null = null;

  constructor() {
    super('LeifengIntro');
  }

  create(): void {
    music.play('lfDusk');
    resetLeifeng(this.textures);
    this.kids = {};
    this.lady = null;
    this.fahai = null;
    this.sunset = new Sunset(this, { horizon: 400, sunX: 1070, sunY: 250 });
    this.paint();
    this.cameras.main.fadeIn(1600, 40, 20, 40);
    void this.play();
  }

  private paint(): void {
    const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
    // 夕照山, with the pagoda glowing on top
    this.add.image(390, 250, 'lfGlow').setScale(5).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    const hill = this.add.graphics().setDepth(4);
    const pts = [V(-40, GROUND + 10), V(-40, 420), V(80, 380), V(200, 334), V(300, 310), V(470, 306), V(560, 334), V(680, 392), V(780, 450), V(860, GROUND + 10)];
    drawHill(this, hill, pts, 12, 4.2);
    this.add.image(388, 314, 'lfPagoda').setOrigin(0.5, 1).setScale(0.34).setDepth(3);
    // the steps and the covered escalator climbing the hill
    const st = this.add.graphics().setDepth(5);
    st.lineStyle(10, 0xc9a07a, 0.9);
    st.lineBetween(700, GROUND, 520, 336);
    st.lineStyle(2, 0x7a5040, 0.8);
    for (let k = 0; k < 24; k++) {
      const x = 700 - k * 7.5;
      const y = GROUND - k * 7.7;
      st.lineBetween(x - 6, y, x + 6, y);
    }
    st.fillStyle(0x9ab8c8, 0.55);
    st.fillPoints([V(740, GROUND - 10), V(560, 330), V(574, 324), V(756, GROUND - 16)], true);
    st.lineStyle(2, 0xe8d0b0, 0.8);
    st.lineBetween(740, GROUND - 10, 560, 330);
    // the lakeside path in front of us
    const path = this.add.graphics().setDepth(6);
    path.fillGradientStyle(0x8a6050, 0x8a6050, 0x4a3038, 0x4a3038, 1);
    path.fillRect(0, GROUND - 6, W, H - GROUND + 6);
    path.fillStyle(0xe8a868, 0.25);
    path.fillRect(0, GROUND - 6, W, 4);
    path.lineStyle(1, 0x3a2430, 0.5);
    for (let y = GROUND + 20; y < H; y += 28) path.lineBetween(0, y, W, y);
    const wl = this.add.graphics().setDepth(7);
    drawWillow(wl, 90, GROUND + 4, 380, 3);
    drawWillow(wl, 1230, GROUND + 4, 420, 8);
    for (const [who, x] of [['koko', 560], ['gogo', 660], ['me', 760]] as const) {
      const g = this.add.graphics().setDepth(20);
      drawPerson(g, LOOKS[who], { facing: -1, backpack: who === 'me' });
      g.setPosition(x, GROUND);
      this.kids[who] = g;
    }
  }

  private async speak(dlg: Dialogue, who: Speaker, key: StrKey): Promise<void> {
    const g = who && who in this.kids ? this.kids[who as Kid] : undefined;
    if (g) this.tweens.add({ targets: g, y: GROUND - 8, yoyo: true, duration: 140, repeat: 1 });
    if (who === 'white' && this.lady) this.tweens.add({ targets: this.lady, angle: 3, yoyo: true, duration: 260 });
    if (who === 'fahai' && this.fahai) this.tweens.add({ targets: this.fahai, y: this.fahai.y - 10, yoyo: true, duration: 120, repeat: 1 });
    await dlg.say(who, key);
  }

  private async play(): Promise<void> {
    await narrate(this, [{ key: 'lf.n1' }, { key: 'lf.n2' }], { y: 120, size: 28, depth: 600, hintY: 184 });
    const dlg = new Dialogue(this);
    await this.speak(dlg, 'gogo', 'lf.i.g1');
    await this.speak(dlg, 'koko', 'lf.i.k1');
    await this.speak(dlg, 'gogo', 'lf.i.g2');
    dlg.hide();
    // the lady in white comes along the lake path
    const lady = (this.lady = this.add.image(W + 80, GROUND + 6, 'lfLady').setOrigin(0.5, 1).setDepth(19).setFlipX(true).setScale(0.62));
    this.tweens.add({ targets: lady, y: GROUND + 2, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.easeInOut' });
    sfx.shimmer();
    await tweenP(this, { targets: lady, x: 960, duration: 2600, ease: 'Sine.easeOut' });
    for (const who of ['me', 'gogo', 'koko'] as Kid[]) drawPerson(this.kids[who]!, LOOKS[who], { facing: 1, backpack: who === 'me' });
    await this.speak(dlg, 'me', 'lf.i.m1');
    await this.speak(dlg, 'white', 'lf.i.w1');
    await this.speak(dlg, 'koko', 'lf.i.k2');
    await this.speak(dlg, 'white', 'lf.i.w2');
    await this.speak(dlg, 'koko', 'lf.i.k3');
    await this.speak(dlg, 'white', 'lf.i.w3');
    await this.speak(dlg, 'white', 'lf.i.w4');
    await this.speak(dlg, 'me', 'lf.i.m2');
    dlg.hide();
    // …and out from behind the willow jumps 法海
    sfx.tock();
    const fh = (this.fahai = this.add.image(120, GROUND + 4, 'lfFahai').setOrigin(0.5, 1).setDepth(21).setScale(0.7).setAlpha(0));
    this.tweens.add({ targets: fh, alpha: 1, duration: 200 });
    await tweenP(this, { targets: fh, x: 300, y: GROUND - 30, duration: 300, ease: 'Quad.easeOut' });
    await tweenP(this, { targets: fh, y: GROUND + 4, duration: 220, ease: 'Bounce.easeOut' });
    this.cameras.main.shake(200, 0.006);
    await this.speak(dlg, 'fahai', 'lf.i.f1');
    await this.speak(dlg, 'gogo', 'lf.i.g3');
    await this.speak(dlg, 'fahai', 'lf.i.f2');
    dlg.hide();
    // off he runs, up the steps
    for (let i = 0; i < 4; i++) setTimeout(() => sfx.tock(), i * 120);
    await tweenP(this, { targets: fh, x: 620, y: 420, scale: 0.35, duration: 900, ease: 'Sine.easeIn' });
    await tweenP(this, { targets: fh, x: 520, y: 336, scale: 0.18, alpha: 0, duration: 700 });
    await this.speak(dlg, 'white', 'lf.i.w5');
    await this.speak(dlg, 'koko', 'lf.i.k4');
    await this.speak(dlg, 'gogo', 'lf.i.g4');
    dlg.hide();
    await wait(this, 200);
    sfx.whee();
    this.cameras.main.fadeOut(900, 40, 20, 40);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('LeifengStairs'));
  }

  update(time: number): void {
    this.sunset.update(time);
  }
}
