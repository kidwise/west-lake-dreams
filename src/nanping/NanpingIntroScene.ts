import * as Phaser from 'phaser';
import { music } from '../core/music';
import type { StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait } from '../ui/narrate';
import { Dialogue, type Speaker } from '../ui/Dialogue';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { getProgress } from '../core/state';
import { resetNanping } from './state';

type Kid = 'me' | 'gogo' | 'koko';
const GROUND = 560;

/** Dusk at 净慈寺: the great bell has lost its voice — and a scruffy monk turns up. */
export class NanpingIntroScene extends Phaser.Scene {
  private kids: Partial<Record<Kid, Phaser.GameObjects.Graphics>> = {};
  private jigong: Phaser.GameObjects.Image | null = null;

  constructor() {
    super('NanpingIntro');
  }

  create(): void {
    music.play('npDusk');
    resetNanping(this.textures);
    this.kids = {};
    this.jigong = null;
    this.add.image(0, 0, 'npTemple').setOrigin(0);
    // incense smoke curling up from the burner
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        const p = this.add.image(1060 + (Math.random() - 0.5) * 20, 552, 'lfPoof').setScale(0.12).setAlpha(0.35).setTint(0xd8d0e0);
        this.tweens.add({ targets: p, y: 380, x: p.x + 30 + Math.random() * 30, scale: 0.5, alpha: 0, duration: 4200, onComplete: () => p.destroy() });
      },
    });
    for (const [who, x] of [['koko', 300], ['gogo', 400], ['me', 500]] as const) {
      const g = this.add.graphics().setDepth(20);
      drawPerson(g, LOOKS[who], { facing: 1, backpack: who === 'me' });
      g.setPosition(x - 260, GROUND);
      this.kids[who] = g;
    }
    this.cameras.main.fadeIn(1400, 30, 20, 40);
    void this.play();
  }

  private async speak(dlg: Dialogue, who: Speaker, key: StrKey): Promise<void> {
    const g = who && who in this.kids ? this.kids[who as Kid] : undefined;
    if (g) this.tweens.add({ targets: g, y: g.y - 8, yoyo: true, duration: 140, repeat: 1 });
    if (who === 'jigong' && this.jigong) this.tweens.add({ targets: this.jigong, angle: 6, yoyo: true, duration: 160, repeat: 1 });
    await dlg.say(who, key);
  }

  private async play(): Promise<void> {
    // we walk in through the gate
    await Promise.all((['koko', 'gogo', 'me'] as Kid[]).map((k) => tweenP(this, { targets: this.kids[k]!, x: this.kids[k]!.x + 260, duration: 1600, ease: 'Sine.easeOut' })));
    await narrate(this, [{ key: 'np.n1' }, { key: 'np.n2' }], { y: 90, size: 28, depth: 600, hintY: 150 });
    const dlg = new Dialogue(this);
    await this.speak(dlg, 'koko', 'np.i.k1');
    await this.speak(dlg, 'gogo', 'np.i.g1');
    dlg.hide();
    // up into the bell tower
    this.cameras.main.fadeOut(600, 20, 12, 10);
    await new Promise<void>((r) => this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => r()));
    await this.tower();
  }

  private async tower(): Promise<void> {
    this.children.removeAll(true);
    this.kids = {};
    this.add.image(0, 0, 'npTower').setOrigin(0);
    const bell = this.add.image(330, 300, 'npBell').setDepth(5);
    const rope = this.add.graphics().setDepth(6);
    const log = this.add.image(510, 330, 'npLogCracked').setDepth(7).setAngle(180).setScale(0.62, 0.8);
    const drawRope = () => {
      rope.clear();
      rope.lineStyle(3, 0x8a6a3a, 1);
      rope.lineBetween(log.x - 40, 122, log.x - 40, log.y - 12);
      rope.lineBetween(log.x + 40, 122, log.x + 40, log.y - 12);
    };
    drawRope();
    for (const [who, x] of [['koko', 120], ['me', 210], ['gogo', 520]] as const) {
      const g = this.add.graphics().setDepth(20);
      drawPerson(g, LOOKS[who], { facing: who === 'gogo' ? -1 : 1, armUp: who === 'gogo', backpack: who === 'me' });
      g.setPosition(x, 600);
      this.kids[who] = g;
    }
    this.cameras.main.fadeIn(600, 20, 12, 10);
    const dlg = new Dialogue(this);
    await narrate(this, [{ key: 'np.n3' }], { y: 600, size: 26, depth: 600, hintY: 660 });
    await this.speak(dlg, 'koko', 'np.i.k2');
    await this.speak(dlg, 'me', 'np.i.m1');
    await this.speak(dlg, 'gogo', 'np.i.g2');
    dlg.hide();
    // GOGO pulls the striker back… and swings it
    await tweenP(this, { targets: log, x: 600, duration: 600, ease: 'Sine.easeOut', onUpdate: drawRope });
    await tweenP(this, { targets: log, x: 500, duration: 180, ease: 'Quad.easeIn', onUpdate: drawRope });
    // …puff. Not a sound — just a cough of dust, and the old log cracks.
    sfx.poof();
    sfx.dig();
    this.tweens.add({ targets: bell, angle: 1.5, yoyo: true, duration: 90, repeat: 1 });
    for (let i = 0; i < 6; i++) {
      const p = this.add.image(440 + Math.random() * 30, 320 + (Math.random() - 0.5) * 40, 'lfPoof').setScale(0.2).setDepth(8).setTint(0xb8a890);
      this.tweens.add({ targets: p, x: p.x + 40 + Math.random() * 60, y: p.y - 40 - Math.random() * 40, scale: 0.6, alpha: 0, duration: 1200, onComplete: () => p.destroy() });
    }
    await tweenP(this, { targets: log, angle: 200, y: 560, alpha: 0.6, duration: 700, ease: 'Bounce.easeOut' });
    drawRope();
    await wait(this, 300);
    await this.speak(dlg, 'gogo', 'np.i.g3');
    dlg.hide();
    // a scruffy monk pops out from behind the bell, fanning himself
    const jg = (this.jigong = this.add.image(330, 470, 'npJigong').setOrigin(0.5, 1).setDepth(4).setScale(0.45));
    sfx.boing();
    await tweenP(this, { targets: jg, x: 190, y: 600, duration: 500, ease: 'Back.easeOut' });
    jg.setDepth(21);
    this.tweens.add({ targets: jg, y: 594, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.easeInOut' });
    await this.speak(dlg, 'jigong', 'np.i.j1');
    await this.speak(dlg, 'koko', 'np.i.k3');
    await this.speak(dlg, 'jigong', 'np.i.j2');
    await this.speak(dlg, 'jigong', 'np.i.j3');
    // 法海: an old acquaintance if we've met him at Leifeng; a stranger otherwise
    await this.speak(dlg, 'jigong', getProgress().visited.includes('leifeng') ? 'np.i.fMet' : 'np.i.fNew');
    await this.speak(dlg, 'jigong', 'np.i.j4');
    await this.speak(dlg, 'gogo', 'np.i.g4');
    dlg.hide();
    sfx.whee();
    this.cameras.main.fadeOut(800, 20, 12, 10);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('NanpingWell'));
  }
}
