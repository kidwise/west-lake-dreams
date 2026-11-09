import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { getProgress } from '../core/state';
import { WELL } from './art';
import { npRun } from './state';

const HUD = 300;
const NEED = 3;
const RISE = 1900;
const SURFACE = 750;
const SINK = 700;

type Kind = 'log' | 'shoe' | 'gourd' | 'crab';
const KEY: Record<Kind, string> = { log: 'npLog', shoe: 'npShoe', gourd: 'npGourd', crab: 'lfCrab' };
const SIZE: Record<Kind, number> = { log: 0.95, shoe: 1.6, gourd: 1.4, crab: 1.2 };

interface Thing {
  kind: Kind;
  img: Phaser.GameObjects.Image;
  born: number;
  done: boolean;
}

/** 运木古井: catch the logs as they float up to the surface — but not 济公's shoe. */
export class NanpingWellScene extends Phaser.Scene {
  private things: Thing[] = [];
  private active = false;
  private nextAt = 0;
  private ripples!: Phaser.GameObjects.Graphics;
  private countText!: Phaser.GameObjects.Text;
  private jigong!: Phaser.GameObjects.Image;
  private sequence: Kind[] = [];

  constructor() {
    super('NanpingWell');
  }

  create(): void {
    music.play('npWell');
    this.things = [];
    this.active = false;
    this.sequence = [];
    this.add.image(0, 0, 'npWell').setOrigin(0);
    this.ripples = this.add.graphics().setDepth(5);
    // the water's surface sheen sits over the rising things
    const sheen = this.add.graphics().setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
    sheen.fillStyle(0xf0a080, 0.07);
    sheen.fillEllipse(WELL.x - 50, WELL.y - 70, 180, 80);
    this.jigong = this.add.image(170, H - 6, 'npJigong').setOrigin(0.5, 1).setDepth(20).setScale(0.55);
    this.tweens.add({ targets: this.jigong, y: H - 12, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut' });
    i18nText(this, 36, 38, () => t('np.w.title'), { fontFamily: FONT_SERIF, fontSize: '22px', color: '#fff4e0', stroke: '#2a1e1a', strokeThickness: 5 }).setDepth(HUD);
    this.countText = this.add.text(36, 76, '', baseStyle({ fontSize: '20px', color: '#fff4e0', stroke: '#2a1e1a', strokeThickness: 4 })).setDepth(HUD);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => !overGlobalUI(p) && this.grab(p.x, p.y));
    this.cameras.main.fadeIn(800, 20, 12, 10);
    void this.play();
  }

  private async play(): Promise<void> {
    const dlg = new Dialogue(this);
    await dlg.say('jigong', 'np.w.j1');
    await dlg.say(null, 'np.w.n1');
    await dlg.say('jigong', 'np.w.j2');
    dlg.hide();
    const hint = i18nText(this, W / 2 + 120, H - 30, () => t('np.w.hint'), { fontSize: '20px', color: '#fff4e0', stroke: '#2a1e1a', strokeThickness: 5 }).setOrigin(0.5, 1).setDepth(HUD);
    this.updateCount();
    this.active = true;
    this.nextAt = this.time.now + 500;
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => !this.active && (ev.remove(), res()) });
    });
    hint.destroy();
    for (const th of this.things) if (!th.done) this.tweens.add({ targets: th.img, alpha: 0, duration: 300 });
    await wait(this, 500);
    await this.choose(dlg);
    this.cameras.main.fadeOut(800, 20, 12, 10);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('NanpingEcho'));
  }

  private updateCount(): void {
    this.countText.setText(t('np.w.count', { n: npRun.logs, total: NEED }));
  }

  /** Logs and junk, shuffled, with at least one log in every three. */
  private nextKind(): Kind {
    if (!this.sequence.length) {
      const junk: Kind[] = ['shoe', 'gourd', 'crab'];
      const j = junk[Math.floor(Math.random() * junk.length)];
      this.sequence = Math.random() < 0.5 ? ['log', j, 'log'] : [j, 'log', 'log'];
      if (Math.random() < 0.4) this.sequence.splice(1, 0, junk[Math.floor(Math.random() * junk.length)]);
    }
    return this.sequence.shift()!;
  }

  private spawn(): void {
    const kind = this.nextKind();
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * WELL.r * 0.45;
    const img = this.add.image(WELL.x + Math.cos(a) * d, WELL.y + Math.sin(a) * d, KEY[kind]).setDepth(4).setAngle(Math.random() * 360).setScale(0.2).setAlpha(0);
    this.things.push({ kind, img, born: this.time.now, done: false });
  }

  private phase(th: Thing, now: number): 'rise' | 'surface' | 'sink' | 'gone' {
    const age = now - th.born;
    if (age < RISE) return 'rise';
    if (age < RISE + SURFACE) return 'surface';
    if (age < RISE + SURFACE + SINK) return 'sink';
    return 'gone';
  }

  private grab(x: number, y: number): void {
    if (!this.active) return;
    const now = this.time.now;
    // the nearest thing under the finger (things are big, so be generous)
    let best: Thing | null = null;
    let bd = 110;
    for (const th of this.things) {
      if (th.done) continue;
      const dd = Math.hypot(th.img.x - x, th.img.y - y);
      if (dd < bd) {
        bd = dd;
        best = th;
      }
    }
    if (!best) return;
    const ph = this.phase(best, now);
    if (ph === 'rise') {
      // too early: it slips through your fingers and bobs back down
      sfx.splash();
      npRun.wellMiss += 1;
      this.pop(t('np.w.early'), x, y - 40, '#c8e0ff');
      best.born = now - RISE * 0.3;
      return;
    }
    if (ph === 'sink' || ph === 'gone') {
      sfx.splash();
      npRun.wellMiss += 1;
      this.pop(t('np.w.late'), x, y - 40, '#c8e0ff');
      return;
    }
    // caught!
    best.done = true;
    sfx.splash();
    const img = best.img;
    if (best.kind === 'log') {
      npRun.logs += 1;
      sfx.chime();
      this.pop(t('np.w.got'), img.x, img.y - 50, '#ffe08a');
      this.tweens.add({ targets: img, x: 1060, y: 420 + npRun.logs * 40, angle: 0, scale: 0.5, duration: 600, ease: 'Cubic.easeOut', onComplete: () => img.setDepth(3) });
      this.updateCount();
      if (npRun.logs >= NEED) this.time.delayedCall(700, () => (this.active = false));
    } else {
      npRun.junk += 1;
      sfx.boing();
      const key: StrKey = best.kind === 'shoe' ? 'np.w.shoe' : best.kind === 'gourd' ? 'np.w.gourd' : getProgress().visited.includes('leifeng') ? 'np.w.crabMet' : 'np.w.crab';
      this.pop(t(key), this.jigong.x + 40, this.jigong.y - 280, '#ffd0a0');
      this.tweens.add({ targets: this.jigong, angle: -8, yoyo: true, duration: 120, repeat: 2 });
      this.tweens.add({ targets: img, x: this.jigong.x + 30, y: this.jigong.y - 120, scale: 0.4, alpha: 0, duration: 600, ease: 'Cubic.easeIn', onComplete: () => img.destroy() });
    }
  }

  private pop(s: string, x: number, y: number, color: string): void {
    const txt = this.add.text(x, y, s, baseStyle({ fontSize: '22px', color, fontStyle: 'bold', stroke: '#2a1e1a', strokeThickness: 5, align: 'center', wordWrap: { width: 360, useAdvancedWrap: true } })).setOrigin(0.5).setDepth(HUD - 5);
    this.tweens.add({ targets: txt, y: y - 36, alpha: 0, delay: 500, duration: 900, onComplete: () => txt.destroy() });
  }

  /** Pick the straightest of three logs for the striker. */
  private async choose(dlg: Dialogue): Promise<void> {
    const shade = this.add.rectangle(0, 0, W, H, 0x1a1210, 0.6).setOrigin(0).setDepth(30);
    const keys = Phaser.Utils.Array.Shuffle(['npLog', 'npLogBent', 'npLogCracked']);
    const logs = keys.map((k, i) => {
      const img = this.add.image(W / 2, 200 + i * 120, k).setDepth(31).setAlpha(0).setInteractive({ useHandCursor: true });
      this.tweens.add({ targets: img, alpha: 1, duration: 400, delay: i * 120 });
      return img;
    });
    await dlg.say('jigong', 'np.w.j3');
    dlg.hide();
    const hint = i18nText(this, W / 2, 600, () => t('np.w.pick'), { fontSize: '22px', color: '#fff4e0' }).setOrigin(0.5).setDepth(32);
    await new Promise<void>((resolve) => {
      for (const img of logs) {
        img.on('pointerover', () => img.setScale(1.06));
        img.on('pointerout', () => img.setScale(1));
        img.on('pointerdown', () => {
          const k = img.texture.key;
          if (k === 'npLog') {
            sfx.chime();
            this.pop(t('np.w.right'), img.x, img.y - 50, '#ffe08a');
            for (const o of logs) if (o !== img) this.tweens.add({ targets: o, alpha: 0, duration: 300 });
            this.tweens.add({ targets: img, scale: 1.2, duration: 400 });
            this.time.delayedCall(900, () => resolve());
          } else {
            sfx.blip();
            this.pop(t(k === 'npLogBent' ? 'np.w.bent' : 'np.w.cracked'), img.x, img.y - 50, '#ffd0a0');
            this.tweens.add({ targets: img, x: img.x + 8, yoyo: true, repeat: 3, duration: 50 });
          }
        });
      }
    });
    hint.destroy();
    await dlg.say('jigong', 'np.w.j4');
    dlg.hide();
    await tweenP(this, { targets: [shade, ...logs], alpha: 0, duration: 400 });
  }

  update(time: number): void {
    if (this.active && time > this.nextAt && this.things.filter((th) => !th.done && this.phase(th, time) !== 'gone').length < 2) {
      this.spawn();
      this.nextAt = time + 1200 + Math.random() * 900;
    }
    const g = this.ripples;
    g.clear();
    for (const th of this.things) {
      if (th.done) continue;
      const ph = this.phase(th, time);
      const age = time - th.born;
      const base = SIZE[th.kind];
      if (ph === 'rise') {
        const k = age / RISE;
        th.img.setScale(base * (0.25 + 0.7 * k)).setAlpha(0.15 + 0.6 * k).setTint(Phaser.Display.Color.GetColor(60 + 140 * k, 80 + 130 * k, 120 + 110 * k));
      } else if (ph === 'surface') {
        const k = (age - RISE) / SURFACE;
        th.img.setScale(base * (0.98 + Math.sin(k * Math.PI * 3) * 0.03)).setAlpha(1).clearTint();
        // rings spreading from it on the surface
        for (let i = 0; i < 2; i++) {
          const rr = 30 + ((k + i * 0.5) % 1) * 80;
          g.lineStyle(2, 0xd8e8ff, 0.5 * (1 - ((k + i * 0.5) % 1)));
          g.strokeEllipse(th.img.x, th.img.y, rr * 2, rr * 1.4);
        }
      } else if (ph === 'sink') {
        const k = (age - RISE - SURFACE) / SINK;
        th.img.setScale(base * (0.95 - 0.5 * k)).setAlpha(1 - k).setTint(Phaser.Display.Color.GetColor(255 - 160 * k, 255 - 150 * k, 255 - 100 * k));
      } else {
        th.done = true;
        th.img.destroy();
      }
    }
    this.things = this.things.filter((th) => !th.done || th.img.active);
  }
}
