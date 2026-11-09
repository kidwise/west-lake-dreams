import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t } from '../core/i18n';
import { narrate, tweenP, wait } from '../ui/narrate';
import { i18nText } from '../ui/text';
import { makeButton } from '../ui/Button';
import { markVisited, getProgress } from '../core/state';
import { TEN_VIEWS } from '../story/chapters';
import { rng } from '../art/paint';
import { sfx } from '../core/sfx';
import { PAGODA_H, PAGODA_HOLES, PAGODA_W } from './art';
import { OBJECTS, FOCAL, ridge, project, bearingX, elevY, VIEW_W, type Pose } from './world';

const deg = Math.PI / 180;
const POSE: Pose = { x: 0, y: -205, heading: 0 };
const HZ = 380; // horizon for this scene (taller sky for the moon)

/** Night falls: the moon rises and candlelight glows from the pagodas' round openings. */
export class SantanMoonScene extends Phaser.Scene {
  constructor() {
    super('SantanMoon');
  }

  create(): void {
    music.play('moonrise');
    markVisited('santan');
    const yOff = HZ - 300; // world.ts projects with horizon 300

    // night sky and stars
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0b1230, 0x0b1230, 0x2c3c6a, 0x2c3c6a, 1);
    sky.fillRect(0, 0, W, HZ + 2);
    const r = rng(12);
    for (let i = 0; i < 120; i++) {
      const s = this.add.circle(r() * W, r() * HZ * 0.85, 0.6 + r() * 1.4, 0xffffff, 0.3 + r() * 0.6);
      this.tweens.add({ targets: s, alpha: 0.1, yoyo: true, repeat: -1, duration: 800 + r() * 2400, delay: r() * 2000 });
    }

    // the moon rises behind the island
    const moon = this.add.container(W * 0.64, HZ + 60);
    const halo = this.add.graphics();
    for (const [rad, a] of [[150, 0.06], [100, 0.1], [70, 0.16]]) {
      halo.fillStyle(0xfff1c4, a);
      halo.fillCircle(0, 0, rad);
    }
    halo.fillStyle(0xfff6dc, 1);
    halo.fillCircle(0, 0, 46);
    halo.fillStyle(0xe9dfc0, 0.6);
    halo.fillCircle(-12, -8, 9);
    halo.fillCircle(14, 12, 6);
    halo.fillCircle(6, -18, 4);
    moon.add(halo);

    // hills silhouette
    const hills = this.add.graphics();
    const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, HZ + 2)];
    for (let x = 0; x <= W; x += 8) {
      const b = POSE.heading + Math.atan((x - VIEW_W / 2) / FOCAL) / deg;
      pts.push(new Phaser.Math.Vector2(x, elevY(ridge(b)) + yOff));
    }
    pts.push(new Phaser.Math.Vector2(W, HZ + 2));
    hills.fillStyle(0x18223e, 1);
    hills.fillPoints(pts, true);
    const bx = bearingX(POSE, 6);
    if (!Number.isNaN(bx)) {
      hills.fillStyle(0x18223e, 1);
      hills.fillRect(bx - 3, elevY(4.6) + yOff, 6, elevY(ridge(6)) - elevY(4.6) + 2);
    }

    // water
    const water = this.add.graphics();
    water.fillGradientStyle(0x223156, 0x223156, 0x0c1328, 0x0c1328, 1);
    water.fillRect(0, HZ, W, H - HZ);
    const moonPath = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);

    // island trees and pavilion as dark silhouettes, pagodas lit
    const glows: Phaser.GameObjects.Graphics[] = [];
    const sorted = OBJECTS.map((o) => ({ o, pr: project(POSE, o) }))
      .filter((e) => e.pr.z > 0 && e.pr.sx > -300 && e.pr.sx < W + 300)
      .sort((a, b) => b.pr.z - a.pr.z);
    // island bank
    const bank = this.add.graphics();
    bank.fillStyle(0x111a2e, 1);
    bank.fillEllipse(W / 2 + 10, HZ + 14, W * 0.9, 40);
    for (const { o, pr } of sorted) {
      const lit = o.tex === 'santanPagoda';
      const tex = lit ? 'santanPagodaLit' : o.tex;
      const scale = pr.size / (lit ? PAGODA_H : this.textures.getFrame(o.tex).height);
      const y = pr.baseY + yOff;
      const img = this.add.image(pr.sx, y, tex).setOrigin(0.5, 1).setScale(scale);
      const refl = this.add.image(pr.sx, y, tex).setOrigin(0.5, 0).setFlipY(true).setScale(scale, scale * 0.9).setAlpha(lit ? 0.55 : 0.25);
      if (!lit) {
        img.setTint(0x1a2540);
        refl.setTint(0x1a2540);
        continue;
      }
      // candle glow in each round opening, and in its reflection
      const glow = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      for (const hole of PAGODA_HOLES) {
        const hx = pr.sx + (hole.x - PAGODA_W / 2) * scale;
        const hy = y - (PAGODA_H - hole.y) * scale;
        const ry = y + (PAGODA_H - hole.y) * scale * 0.9;
        for (const [rr, a] of [[34, 0.08], [20, 0.16], [10, 0.4]]) {
          glow.fillStyle(0xffc766, a);
          glow.fillCircle(hx, hy, rr * scale * 2.2);
          glow.fillStyle(0xffc766, a * 0.7);
          glow.fillEllipse(hx, ry, rr * scale * 4, rr * scale * 2.4);
        }
      }
      glows.push(glow);
      this.tweens.add({ targets: refl, scaleX: scale * 1.04, yoyo: true, repeat: -1, duration: 900 + glows.length * 200, ease: 'Sine.easeInOut' });
    }

    this.cameras.main.fadeIn(1600, 10, 16, 40);
    void this.play(moon, moonPath, glows);
  }

  private drawMoonPath(g: Phaser.GameObjects.Graphics, x: number, strength: number): void {
    g.clear();
    const r = rng(Math.floor(this.time.now / 160));
    for (let y = HZ + 6; y < H; y += 6) {
      const w = 16 + (y - HZ) * 0.5;
      g.fillStyle(0xfff1c4, (0.12 + r() * 0.25) * strength);
      g.fillRect(x - w / 2 + (r() - 0.5) * w * 0.5, y, w * (0.3 + r() * 0.6), 2.5);
    }
  }

  private async play(moon: Phaser.GameObjects.Container, moonPath: Phaser.GameObjects.Graphics, glows: Phaser.GameObjects.Graphics[]): Promise<void> {
    let pathStrength = 0;
    const ticker = this.time.addEvent({ delay: 80, loop: true, callback: () => this.drawMoonPath(moonPath, moon.x, pathStrength) });

    await wait(this, 600);
    void tweenP(this, { targets: moon, y: 140, duration: 7000, ease: 'Sine.easeOut' });
    this.tweens.addCounter({ from: 0, to: 1, duration: 6000, onUpdate: (tw) => (pathStrength = tw.getValue() ?? 0) });
    await narrate(this, [{ key: 'santan.m1' }], { y: H - 92, depth: 200, size: 28, hintY: H - 26 });

    // candles light up one pagoda after another
    for (const g of glows) {
      sfx.bell();
      await tweenP(this, { targets: g, alpha: 1, duration: 700 });
      this.tweens.add({ targets: g, alpha: { from: 1, to: 0.75 }, yoyo: true, repeat: -1, duration: 260 + Math.random() * 200 });
    }
    await narrate(this, [{ key: 'santan.m2' }, { key: 'santan.m3' }], { y: H - 92, depth: 200, size: 28, hintY: H - 26 });

    // ...and then I woke up
    const dark = this.add.rectangle(0, 0, W, H, 0x05070d, 0).setOrigin(0).setDepth(150);
    await tweenP(this, { targets: dark, fillAlpha: 0.85, duration: 1800 });
    ticker.remove();
    await narrate(this, [{ key: 'santan.m4' }, { key: 'santan.m5' }], { depth: 200, size: 32 });
    this.showInvitation();
  }

  private showInvitation(): void {
    sfx.chime();
    const layer = this.add.container(0, 0).setDepth(300).setAlpha(0);
    const bg = this.add.graphics();
    bg.fillStyle(0xf6f1e7, 0.97);
    bg.fillRoundedRect(110, 50, W - 220, H - 100, 30);
    bg.lineStyle(2, 0x2f3b3a, 0.5);
    bg.strokeRoundedRect(124, 64, W - 248, H - 128, 24);
    layer.add(bg);
    layer.add(i18nText(this, W / 2, 116, () => t('santan.inviteTitle'), { fontFamily: FONT_SERIF, fontSize: '40px', color: CSS.me }).setOrigin(0.5));
    layer.add(
      i18nText(this, W / 2, 222, () => t('santan.inviteBody'), {
        fontSize: '22px',
        align: 'center',
        lineSpacing: 12,
        wordWrap: { width: W - 340, useAdvancedWrap: true },
      }).setOrigin(0.5),
    );
    const visited = new Set(getProgress().visited);
    TEN_VIEWS.forEach((v, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = W / 2 - 400 + col * 420;
      const y = 345 + row * 38;
      const done = visited.has(v.id);
      const dot = this.add.graphics();
      dot.fillStyle(v.id === 'santan' ? 0xffb347 : done ? 0xe0628e : 0xc9c3b8, 1);
      dot.fillCircle(x, y, 8);
      layer.add(dot);
      layer.add(
        i18nText(this, x + 20, y, () => `${t(v.name)}${done ? '  ✓' : ''}`, {
          fontSize: '20px',
          color: done ? CSS.ink : '#8d887f',
        }).setOrigin(0, 0.5),
      );
    });
    const again = makeButton(this, W / 2 - 160, H - 110, () => t('wake.again'), {
      width: 260,
      fill: 0xc0392b,
      stroke: 0x7b241c,
      textColor: '#fff8ee',
      depth: 310,
      onClick: () => this.leave(true),
    });
    const toTitle = makeButton(this, W / 2 + 160, H - 110, () => t('wake.toTitle'), { width: 260, depth: 310, onClick: () => this.leave(false) });
    again.container.setAlpha(0);
    toTitle.container.setAlpha(0);
    this.tweens.add({ targets: [layer, again.container, toTitle.container], alpha: 1, duration: 800 });
  }

  private leave(replay: boolean): void {
    this.cameras.main.fadeOut(700, 20, 30, 40);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // photos are cleared by SantanIntroScene when the chapter is played again
      this.scene.start(replay ? 'SantanIntro' : 'Title');
    });
  }
}
