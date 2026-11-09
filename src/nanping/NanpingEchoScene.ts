import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t } from '../core/i18n';
import { sfx } from '../core/sfx';
import { wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { CAVES } from './art';
import { npRun } from './state';

const HUD = 300;
const ROUNDS = [3, 5, 7];
/** Each cave sings one note of the pentatonic scale, low to high, with its own colour. */
const NOTES = [392, 440, 523.25, 587.33, 659.25];
const COLORS = [0xff8a6a, 0xffc85a, 0x8ae07a, 0x6ac8ff, 0xc89aff];

/** 南屏山's caves echo the bell: listen to the sequence, then sing it back. */
export class NanpingEchoScene extends Phaser.Scene {
  private glows: Phaser.GameObjects.Image[] = [];
  private listening = false;
  private input_: number[] = [];
  private seq: number[] = [];
  private roundText!: Phaser.GameObjects.Text;
  private jigong!: Phaser.GameObjects.Image;
  private resolveRound: ((ok: boolean) => void) | null = null;

  constructor() {
    super('NanpingEcho');
  }

  create(): void {
    music.play('npDusk');
    this.glows = [];
    this.listening = false;
    this.input_ = [];
    this.add.image(0, 0, 'npCliff').setOrigin(0);
    CAVES.forEach((c, i) => {
      const glow = this.add.image(c.x, c.y, 'lfGlow').setScale(c.r / 28).setTint(COLORS[i]).setAlpha(0.12).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
      this.glows.push(glow);
      const zone = this.add.zone(c.x, c.y, c.r * 2.6, c.r * 2.2).setInteractive({ useHandCursor: true }).setDepth(4);
      zone.on('pointerdown', () => this.press(i));
      // a small number under each cave for the keyboard
      this.add.text(c.x, c.y + c.r + 22, `${i + 1}`, baseStyle({ fontSize: '18px', color: '#f4e6f0', fontStyle: 'bold' })).setOrigin(0.5).setDepth(5).setAlpha(0.7);
    });
    const kb = this.input.keyboard;
    (['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const).forEach((k, i) => kb?.on(`keydown-${k}`, () => this.press(i)));
    this.jigong = this.add.image(120, H - 4, 'npJigong').setOrigin(0.5, 1).setDepth(20).setScale(0.52);
    i18nText(this, 36, 38, () => t('np.e.title'), { fontFamily: FONT_SERIF, fontSize: '22px', color: '#fff4e0', stroke: '#2a1e2a', strokeThickness: 5 }).setDepth(HUD);
    this.roundText = this.add.text(36, 76, '', baseStyle({ fontSize: '20px', color: '#fff4e0', stroke: '#2a1e2a', strokeThickness: 4 })).setDepth(HUD);
    this.cameras.main.fadeIn(800, 20, 12, 10);
    void this.play();
  }

  private async play(): Promise<void> {
    const dlg = new Dialogue(this);
    await dlg.say('jigong', 'np.e.j1');
    await dlg.say(null, 'np.e.n1');
    await dlg.say('jigong', 'np.e.j2');
    dlg.hide();
    const touch = this.sys.game.device.input.touch;
    const hint = i18nText(this, W / 2, H - 30, () => t(touch ? 'np.e.hintTouch' : 'np.e.hint'), { fontSize: '20px', color: '#fff4e0', stroke: '#2a1e2a', strokeThickness: 5 }).setOrigin(0.5, 1).setDepth(HUD);
    // the music gets out of the way so the echoes can be heard
    music.stop();
    for (let r = 0; r < ROUNDS.length; r++) {
      this.roundText.setText(t('np.e.round', { n: r + 1, total: ROUNDS.length }));
      this.seq = Array.from({ length: ROUNDS[r] }, (_, i) => (i === 0 ? Math.floor(Math.random() * 5) : 0));
      for (let i = 1; i < this.seq.length; i++) {
        // a singable line: mostly steps, the odd leap, never the same note twice running
        let n = this.seq[i - 1] + (Math.random() < 0.7 ? (Math.random() < 0.5 ? -1 : 1) : Math.random() < 0.5 ? -2 : 2);
        if (n < 0 || n > 4) n = this.seq[i - 1] + (n < 0 ? 1 : -1);
        this.seq[i] = n;
      }
      let ok = false;
      while (!ok) {
        await this.demo();
        ok = await this.listen();
        if (!ok) {
          npRun.echoMiss += 1;
          await wait(this, 900);
        }
      }
      await this.release(r);
    }
    hint.destroy();
    music.play('npDusk');
    await dlg.say('koko', 'np.e.k1');
    await dlg.say('jigong', 'np.e.j3');
    dlg.hide();
    this.cameras.main.fadeOut(800, 20, 12, 10);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('NanpingBell'));
  }

  private flash(i: number, ms = 420): void {
    const g = this.glows[i];
    sfx.stone(NOTES[i]);
    this.tweens.killTweensOf(g);
    g.setAlpha(0.95).setScale((CAVES[i].r / 28) * 1.25);
    this.tweens.add({ targets: g, alpha: 0.12, scale: CAVES[i].r / 28, duration: ms, ease: 'Sine.easeOut' });
    // a ring of sound puffing out of the cave
    const ring = this.add.image(CAVES[i].x, CAVES[i].y, 'npRing').setScale(0.3).setTint(COLORS[i]).setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: ring, scale: 1.1, alpha: 0, duration: 800, onComplete: () => ring.destroy() });
  }

  /** 济公 taps his wooden fish, then the caves sing the sequence. */
  private async demo(): Promise<void> {
    this.listening = false;
    await wait(this, 500);
    for (let k = 0; k < 2; k++) {
      sfx.tock();
      this.tweens.add({ targets: this.jigong, angle: -5, yoyo: true, duration: 90 });
      await wait(this, 300);
    }
    await wait(this, 300);
    for (const i of this.seq) {
      this.flash(i);
      await wait(this, 620);
    }
  }

  private listen(): Promise<boolean> {
    this.input_ = [];
    this.listening = true;
    const cue = this.add.text(W / 2, 110, t('np.e.yourTurn'), baseStyle({ fontSize: '28px', color: '#ffe08a', fontStyle: 'bold', stroke: '#2a1e2a', strokeThickness: 6 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: cue, alpha: 0.4, yoyo: true, repeat: -1, duration: 500 });
    return new Promise((resolve) => {
      this.resolveRound = (ok) => {
        cue.destroy();
        resolve(ok);
      };
    });
  }

  private press(i: number): void {
    if (!this.listening) return;
    this.flash(i, 300);
    const k = this.input_.length;
    if (this.seq[k] !== i) {
      // wrong: the cave answers with a hiccup
      this.listening = false;
      this.time.delayedCall(200, () => sfx.burp());
      const txt = this.add.text(CAVES[i].x, CAVES[i].y - 80, t('np.e.burp'), baseStyle({ fontSize: '30px', color: '#ffd0a0', fontStyle: 'bold', stroke: '#2a1e2a', strokeThickness: 6 })).setOrigin(0.5).setDepth(HUD);
      this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, delay: 400, duration: 800, onComplete: () => txt.destroy() });
      this.resolveRound?.(false);
      return;
    }
    this.input_.push(i);
    if (this.input_.length === this.seq.length) {
      this.listening = false;
      this.resolveRound?.(true);
    }
  }

  /** The lost voices fly out of the caves and back to the bell. */
  private async release(round: number): Promise<void> {
    sfx.shimmer();
    const txt = this.add.text(W / 2, 110, t('np.e.good'), baseStyle({ fontSize: '30px', color: '#ffe08a', fontStyle: 'bold', stroke: '#2a1e2a', strokeThickness: 6 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: txt, alpha: 0, delay: 1000, duration: 500, onComplete: () => txt.destroy() });
    const n = 3 + round * 2;
    for (let k = 0; k < n; k++) {
      const c = CAVES[this.seq[k % this.seq.length]];
      const sp = this.add.image(c.x, c.y, 'npSpirit').setScale(0.4).setDepth(10).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: sp,
        x: W + 60,
        y: -40 + Math.random() * 120,
        scale: 0.9,
        delay: k * 110,
        duration: 1400 + Math.random() * 500,
        ease: 'Sine.easeIn',
        onComplete: () => sp.destroy(),
      });
    }
    await wait(this, 1800);
  }
}
