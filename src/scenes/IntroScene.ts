import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H } from '../core/config';
import { narrate } from '../ui/narrate';
import { rng } from '../art/paint';

/** "我今天做了一个梦……" — the dream opens over a night sky. */
export class IntroScene extends Phaser.Scene {
  constructor() {
    super('Intro');
  }

  create(): void {
    music.play('dream');
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1b2738, 0x1b2738, 0x3d4f6b, 0x3d4f6b, 1);
    bg.fillRect(0, 0, W, H);
    const r = rng(5);
    for (let i = 0; i < 90; i++) {
      const s = this.add.circle(r() * W, r() * H * 0.8, 0.8 + r() * 1.6, 0xffffff, 0.3 + r() * 0.6);
      this.tweens.add({ targets: s, alpha: 0.1, yoyo: true, repeat: -1, duration: 900 + r() * 2200, delay: r() * 2000 });
    }
    // drifting dream bubbles
    for (let i = 0; i < 14; i++) {
      const b = this.add.circle(r() * W, H + r() * 200, 6 + r() * 20, 0xfbe3ec, 0.12);
      this.tweens.add({ targets: b, y: -60, x: `+=${(r() - 0.5) * 200}`, duration: 9000 + r() * 8000, repeat: -1, delay: r() * 6000 });
    }

    this.cameras.main.fadeIn(1000, 20, 30, 40);
    void this.play();
  }

  private async play(): Promise<void> {
    await narrate(this, [
      { key: 'intro.1' },
      { key: 'intro.2' },
      { key: 'intro.3' },
      { key: 'intro.poem', sub: 'intro.poemBy', poem: true },
      { key: 'intro.4' },
    ]);
    this.cameras.main.fadeOut(900, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Ride'));
  }
}
