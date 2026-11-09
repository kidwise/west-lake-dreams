import * as Phaser from 'phaser';
import { drawPanel } from '../ui/panel';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait, waitForTap } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { makeButton } from '../ui/Button';
import { Dialogue } from '../ui/Dialogue';
import { LOOKS } from '../art/Cyclist';
import { markVisited, getProgress } from '../core/state';
import { TEN_VIEWS } from '../story/chapters';
import { makeSeal } from '../sudi/art';
import { paintPond, School } from './Pond';
import { drawBack } from './HuagangPondScene';
import { KoiBody, inkFishTexture, koiSideTexture, koiTopTexture, VARIETIES } from './koi';
import { hgRun } from './state';

/**
 * Points spread evenly over the strokes of `text`, drawn large across the
 * pond (sampled from an offscreen canvas).
 */
function textPoints(text: string, cx: number, cy: number, width: number, count: number): { x: number; y: number }[] {
  const cw = 1200;
  const ch = 360;
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext('2d');
  if (!ctx) return [];
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold 270px ${FONT_SERIF}`;
  ctx.fillText(text, cw / 2, ch / 2);
  const data = ctx.getImageData(0, 0, cw, ch).data;
  const inside = (x: number, y: number) => data[(Math.round(y) * cw + Math.round(x)) * 4 + 3] > 128;
  // find a grid step that gives about `count` points
  let pts: { x: number; y: number }[] = [];
  for (let step = 30; step >= 8; step -= 1) {
    pts = [];
    for (let y = step / 2; y < ch; y += step) {
      for (let x = (Math.round(y / step) % 2) * (step / 2); x < cw; x += step) if (inside(x, y)) pts.push({ x, y });
    }
    if (pts.length >= count) break;
  }
  // keep `count` of them, evenly through the list
  const keep: { x: number; y: number }[] = [];
  for (let i = 0; i < count && pts.length; i++) keep.push(pts[Math.floor((i * pts.length) / count)]);
  const s = width / cw;
  return keep.map((p) => ({ x: cx + (p.x - cw / 2) * s, y: cy + (p.y - ch / 2) * s }));
}

/** The fish write 花港观鱼; waking up; the 观鱼图卷 scroll. */
export class HuagangEndScene extends Phaser.Scene {
  private pond: { update: (time: number) => void } | null = null;
  private school: School | null = null;
  private goldfish: { body: KoiBody; x: number; dir: number; w: number } | null = null;

  constructor() {
    super('HuagangEnd');
  }

  create(): void {
    music.play('huagangFinale');
    markVisited('huagang');
    this.goldfish = null;
    this.pond = paintPond(this);
    this.school = new School(this, 150, 9);
    for (const f of this.school.fish) f.size = 0.42 + Math.random() * 0.12;
    for (const [who, x] of [['koko', 300], ['gogo', W - 330]] as const) {
      const g = this.add.graphics().setDepth(92).setPosition(x, H - 44);
      drawBack(g, LOOKS[who], 0);
    }
    this.cameras.main.fadeIn(1200, 255, 255, 255);
    void this.play();
  }

  private async play(): Promise<void> {
    const school = this.school!;
    await wait(this, 1200);

    // 魚 leaps out of the pond and flies home to the tablet, its three drops with it
    sfx.bigSplash();
    for (let i = 0; i < 3; i++) school.ripple(W / 2, H / 2, 1.4 + i * 0.6, 58);
    const yu = this.add.text(W / 2, H / 2, '魚', baseStyle({ fontFamily: FONT_SERIF, fontSize: '120px', color: '#1d1b20', fontStyle: 'bold' })).setOrigin(0.5).setDepth(120).setScale(0.3);
    const drops = [0, 1, 2].map(() => this.add.image(W / 2, H / 2, 'hgDrop').setDepth(121).setScale(0.3));
    sfx.whee();
    await new Promise<void>((resolve) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1800,
        ease: 'Sine.easeIn',
        onUpdate: (tw) => {
          const k = tw.getValue() ?? 0;
          yu.setPosition(W / 2 + Math.sin(k * 6) * 60, H / 2 - k * 520).setScale(0.3 + k * 1.2).setAngle(Math.sin(k * 9) * 12);
          drops.forEach((d, i) => {
            const a = k * 14 + (i * Math.PI * 2) / 3;
            d.setPosition(yu.x + Math.cos(a) * 70 * (0.4 + k), yu.y + Math.sin(a) * 40 * (0.4 + k));
          });
        },
        onComplete: () => resolve(),
      });
    });
    yu.destroy();
    drops.forEach((d) => d.destroy());

    // a glimpse of the tablet, whole again
    await this.steleCard();

    // the fish rise and write the four characters
    const dlg = new Dialogue(this);
    await dlg.say('koko', 'hg.e.k1');
    dlg.hide();
    const pts = textPoints('花港观鱼', W / 2, 330, 1160, school.fish.length);
    // the characters glow faintly on the water under the fish
    const glowText = this.add
      .text(W / 2, 330, '花港观鱼', baseStyle({ fontFamily: FONT_SERIF, fontSize: `${Math.round(270 * (1160 / 1200))}px`, color: '#fff6d8', fontStyle: 'bold' }))
      .setOrigin(0.5)
      .setDepth(15)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glowText, alpha: 0.35, delay: 2200, duration: 1800 });
    // greedy: each point takes the nearest free fish
    const free = new Set(school.fish);
    for (const p of pts) {
      let best: (typeof school.fish)[number] | null = null;
      let bd = Infinity;
      for (const f of free) {
        const d = Math.hypot(f.x - p.x, f.y - p.y);
        if (d < bd) {
          bd = d;
          best = f;
        }
      }
      if (best) {
        free.delete(best);
        best.goal = { x: p.x, y: p.y, a: -Math.PI / 2 + (Math.random() - 0.5) * 0.25 };
        best.target = null;
      }
    }
    sfx.shimmer();
    await wait(this, 4200);
    await dlg.say('gogo', 'hg.e.g1');
    await dlg.say('me', 'hg.e.m1');
    dlg.hide();
    await wait(this, 1500);

    // ...and burst apart into a pond full of petals
    sfx.chime();
    this.tweens.add({ targets: glowText, alpha: 0, duration: 600 });
    for (const f of school.fish) {
      f.goal = null;
      f.heading = Math.atan2(f.y - 330, f.x - W / 2) + (Math.random() - 0.5) * 0.6;
      f.speed = 260;
    }
    for (let i = 0; i < 140; i++) {
      const p = this.add.image(W / 2 + (Math.random() - 0.5) * 900, 330 + (Math.random() - 0.5) * 220, Math.random() < 0.5 ? 'hgPetal' : 'hgPetalRed').setDepth(85).setScale(0.2);
      this.tweens.add({ targets: p, scale: 0.8 + Math.random() * 0.6, angle: Math.random() * 720 - 360, x: p.x + (Math.random() - 0.5) * 300, y: p.y + (Math.random() - 0.5) * 200, duration: 1600 + Math.random() * 1200, ease: 'Cubic.easeOut' });
    }
    await wait(this, 3500);
    this.cameras.main.fadeOut(1400, 255, 255, 255);
    await new Promise<void>((res) => this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => res()));
    await this.wake();
    await this.scroll();
    this.invitation();
  }

  private async steleCard(): Promise<void> {
    const card = this.add.container(W / 2, H / 2).setDepth(130).setAlpha(0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(-118, -238, 244, 484, 18);
    g.fillStyle(0xcfc9bc, 1);
    g.fillRoundedRect(-120, -240, 240, 480, 16);
    g.fillStyle(0xe0dbcf, 1);
    g.fillRect(-104, -224, 208, 448);
    g.lineStyle(2, 0xb3ab9c, 1);
    g.strokeRect(-94, -214, 188, 428);
    card.add(g);
    const st = baseStyle({ fontFamily: FONT_SERIF, fontSize: '84px', color: '#2a2224', fontStyle: 'bold' });
    ['花', '港', '觀'].forEach((ch, i) => card.add(this.add.text(0, -160 + i * 100, ch, st).setOrigin(0.5)));
    const yu = this.add.text(0, 140, '魚', st).setOrigin(0.5);
    yu.setCrop(0, 0, yu.width, yu.height * 0.74);
    card.add(yu);
    const dots = this.add.graphics();
    dots.fillStyle(0x2a2224, 1);
    for (const dx of [-23, 0, 23]) {
      dots.fillEllipse(dx, 140 + 30, 13, 16);
      dots.fillTriangle(dx - 5, 165, dx + 5, 162, dx + 5, 177);
    }
    dots.setAlpha(0);
    card.add(dots);
    const glow = this.add.image(0, 170, 'hgGlow').setTint(0xbff4ff).setBlendMode(Phaser.BlendModes.ADD).setScale(1.2).setAlpha(0);
    card.add(glow);
    card.setScale(0.9);
    await tweenP(this, { targets: card, alpha: 1, scale: 1, duration: 500, ease: 'Back.easeOut' });
    sfx.stamp();
    this.tweens.add({ targets: dots, alpha: 1, duration: 300 });
    await tweenP(this, { targets: glow, alpha: 0.9, duration: 300, yoyo: true });
    sfx.shimmer();
    await wait(this, 1300);
    await tweenP(this, { targets: card, alpha: 0, scale: 0.9, duration: 400 });
    card.destroy();
  }

  private async wake(): Promise<void> {
    music.play('morning');
    this.tweens.killAll();
    this.school?.destroy();
    this.school = null;
    this.pond = null;
    this.children.removeAll(true);
    const g = this.add.graphics();
    g.fillGradientStyle(0xf3e7d3, 0xf3e7d3, 0xe2d2bb, 0xe2d2bb, 1);
    g.fillRect(0, 0, W, H);
    // window with a sunny morning outside
    g.fillStyle(0xfff4dc, 1);
    g.fillRect(700, 70, 420, 300);
    g.fillGradientStyle(0x9fd0ef, 0x9fd0ef, 0xe6f3f4, 0xe6f3f4, 1);
    g.fillRect(714, 84, 392, 272);
    g.fillStyle(0x7a9a8e, 1);
    g.fillEllipse(910, 350, 420, 70);
    g.lineStyle(8, 0xfff4dc, 1);
    g.lineBetween(910, 70, 910, 370);
    // the windowsill, with sunshine on it
    g.fillStyle(0xd8c4a2, 1);
    g.fillRect(680, 370, 460, 22);
    g.fillStyle(0xfff2c4, 0.5);
    g.fillEllipse(860, 372, 300, 16);
    // a goldfish bowl on the sill
    const bowl = this.add.graphics().setDepth(5);
    bowl.fillStyle(0x9fd6e0, 0.55);
    bowl.fillCircle(860, 300, 74);
    bowl.fillStyle(0xbfe8ee, 0.35);
    bowl.fillEllipse(860, 248, 120, 18);
    bowl.lineStyle(3, 0xffffff, 0.8);
    bowl.strokeCircle(860, 300, 74);
    bowl.fillStyle(0xd8c4a2, 1);
    bowl.fillEllipse(860, 372, 70, 10);
    bowl.fillStyle(0x6fae5a, 1);
    bowl.fillEllipse(842, 352, 18, 40);
    bowl.fillEllipse(880, 356, 14, 30);
    const gloss = this.add.graphics().setDepth(7);
    gloss.fillStyle(0xffffff, 0.45);
    gloss.fillEllipse(820, 262, 18, 40);
    const fish = new KoiBody(this, koiSideTexture(this, 'higoi', 4242), { side: true });
    fish.setDepth(6);
    this.goldfish = { body: fish, x: 860, dir: 1, w: 0 };
    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        if (!this.goldfish) return;
        const gf = this.goldfish;
        const b = this.add.image(gf.x + gf.dir * 24, 300, 'hgBubble').setDepth(7).setScale(0.5);
        this.tweens.add({ targets: b, y: 238, alpha: 0, duration: 1400, onComplete: () => b.destroy() });
      },
    });
    // bed, pillow and the empty bag of fish food
    g.fillStyle(0x8a6a50, 1);
    g.fillRect(60, 430, 560, 160);
    g.fillStyle(0xfdfaf3, 1);
    g.fillRoundedRect(90, 400, 160, 56, 20);
    g.fillStyle(0x9cc6e0, 1);
    g.fillRoundedRect(210, 410, 410, 90, 24);
    g.fillStyle(0x7a5a40, 1);
    g.fillRect(640, 470, 120, 120);
    this.add.image(700, 446, 'hgBag').setScale(0.7).setAngle(-12);
    this.cameras.main.fadeIn(1200, 255, 255, 255);
    sfx.bubbles();
    await narrate(this, [{ key: 'hg.w1' }, { key: 'hg.w2' }, { key: 'hg.w3' }], { color: '#3a3230', y: 640, size: 28, hintY: H - 20 });
  }

  /** The 观鱼图卷: photos, the koi book and the numbers from the dream. */
  private async scroll(): Promise<void> {
    this.goldfish = null;
    this.add.rectangle(0, 0, W, H, 0x2a2420, 0.55).setOrigin(0).setDepth(100);
    const left = 70;
    const right = W - 70;
    const top = 110;
    const bottom = 610;
    const paper = this.add.graphics().setDepth(101);
    const rollerL = this.add.graphics().setDepth(103);
    const rollerR = this.add.graphics().setDepth(103);
    for (const g of [rollerL, rollerR]) {
      g.fillStyle(0x6b3f26, 1);
      g.fillRoundedRect(-14, top - 24, 28, bottom - top + 48, 10);
      g.fillStyle(0x8a5a3a, 1);
      g.fillRect(-8, top - 20, 6, bottom - top + 40);
      g.fillStyle(0xd9b45a, 1);
      g.fillCircle(0, top - 24, 8);
      g.fillCircle(0, bottom + 24, 8);
      g.x = W / 2;
    }
    type Fadeable = Phaser.GameObjects.GameObject & { x: number; alpha: number; setAlpha: (a: number) => unknown; setDepth: (d: number) => unknown };
    const items: { obj: Fadeable; x: number }[] = [];
    const add = <T extends Fadeable>(obj: T, x = obj.x): T => {
      obj.setAlpha(0);
      obj.setDepth(102);
      items.push({ obj, x });
      return obj;
    };

    // title, written vertically like an inscription, and a seal
    add(this.add.text(right - 66, top + 150, '花\n港\n观\n鱼', baseStyle({ fontFamily: FONT_SERIF, fontSize: '46px', color: '#2f2a26', align: 'center', lineSpacing: 4 })).setOrigin(0.5));
    add(makeSeal(this, right - 66, top + 330, '观鱼', 50).setAngle(-4));
    add(i18nText(this, left + 36, top + 26, () => t('hg.scrollSub'), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#6b5d52' }).setOrigin(0, 0.5));

    // photos from the pond
    for (let i = 0; i < 3; i++) {
      const x = left + 150 + i * 240;
      const y = top + 140;
      add(this.add.rectangle(x, y, 226, 166, 0xfdfaf3).setStrokeStyle(1, 0xc9bfae));
      const key = hgRun.photos[i];
      if (key && this.textures.exists(key)) {
        const img = this.add.image(x, y, key);
        img.setScale(Math.min(210 / img.width, 150 / img.height));
        add(img);
      } else {
        add(i18nText(this, x, y, () => t('hg.photo.none'), { fontSize: '16px', color: '#9a8f84' }).setOrigin(0.5));
      }
    }

    // the koi book
    add(i18nText(this, left + 36, top + 262, () => t('hg.dexTitle'), { fontFamily: FONT_SERIF, fontSize: '20px', color: '#4a4038' }).setOrigin(0, 0.5));
    VARIETIES.forEach((v, i) => {
      const x = left + 90 + i * 100;
      const y = top + 312;
      const key = hgRun.dex[v.id];
      const img = this.add.image(x, y, key ?? koiTopTexture(this, v.id, 1)).setScale(0.62);
      if (!key) img.setTint(0xd8ccb6).setTintMode(Phaser.TintModes.FILL);
      add(img);
      add(i18nText(this, x, y + 36, () => (key ? t(v.name) : t('hg.dexUnknown')), { fontSize: '15px', color: key ? '#2f2a26' : '#a89c90' }).setOrigin(0.5));
    });

    // stats
    const stats: [StrKey, () => string][] = [
      ['hg.stat.handfuls', () => t('hg.stat.unitHandful', { n: hgRun.handfuls })],
      ['hg.stat.mountain', () => t('hg.stat.unitFish', { n: hgRun.mountain })],
      ['hg.stat.eaten', () => t('hg.stat.unitPellet', { n: hgRun.eaten })],
      ['hg.stat.school', () => t('hg.stat.unitFish', { n: hgRun.school })],
    ];
    // label above value, so long English labels never run into the numbers
    stats.forEach(([label, value], i) => {
      const y = top + 62 + i * 70;
      add(i18nText(this, left + 790, y, () => t(label), { fontSize: '16px', color: '#6b5d52' }).setOrigin(0, 0.5), left + 860);
      add(i18nText(this, left + 790, y + 26, () => value(), { fontSize: '22px', color: '#2f2a26', fontStyle: 'bold' }).setOrigin(0, 0.5), left + 860);
    });

    // ink koi swimming along the bottom of the scroll
    for (const [x, y, a, s] of [[left + 260, bottom - 70, Math.PI + 0.15, 0.8], [left + 520, bottom - 50, -0.1, 0.65], [left + 820, bottom - 76, Math.PI - 0.2, 0.7]] as const) {
      const ink = new KoiBody(this, inkFishTexture(this), { side: true, length: 150 });
      ink.pose(x, y, a, 0.4, 1.2, 0.25, s);
      add(ink.rope, x);
    }
    const lines = this.add.graphics();
    lines.lineStyle(1.5, 0x6b5d52, 0.5);
    for (let i = 0; i < 4; i++) {
      lines.beginPath();
      for (let x = left + 60; x < right - 160; x += 12) {
        const y = bottom - 22 - i * 9 + Math.sin(x * 0.02 + i) * 3;
        if (x === left + 60) lines.moveTo(x, y);
        else lines.lineTo(x, y);
      }
      lines.strokePath();
    }
    add(lines as never, W / 2);

    sfx.blip();
    await new Promise<void>((resolve) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1800,
        ease: 'Cubic.easeOut',
        onUpdate: (tw) => {
          const k = tw.getValue() ?? 0;
          const half = ((right - left) / 2) * k;
          paper.clear();
          paper.fillStyle(0xf4ead6, 1);
          paper.fillRect(W / 2 - half, top - 10, half * 2, bottom - top + 20);
          paper.lineStyle(2, 0xb8a78c, 1);
          paper.strokeRect(W / 2 - half + 12, top, half * 2 - 24, bottom - top);
          rollerL.x = W / 2 - half;
          rollerR.x = W / 2 + half;
          for (const it of items) {
            if (Math.abs(it.x - W / 2) < half - 10 && it.obj.alpha === 0) {
              this.tweens.add({ targets: it.obj, alpha: 1, duration: 300 });
              if (it.obj instanceof Phaser.GameObjects.Container) sfx.stamp();
            }
          }
        },
        onComplete: () => resolve(),
      });
    });
    const hint = i18nText(this, W / 2, H - 40, () => t('common.tapToContinue'), { fontSize: '18px', color: CSS.paper }).setOrigin(0.5).setDepth(110);
    await waitForTap(this);
    hint.destroy();
  }

  private invitation(): void {
    sfx.chime();
    const layer = this.add.container(0, 0).setDepth(300).setAlpha(0);
    const bg = this.add.graphics();
    drawPanel(bg, 110, 40, W - 220, H - 80, 30, 0xfbf8f2, 0.98);
    layer.add(bg);
    layer.add(i18nText(this, W / 2, 100, () => t('hg.inviteTitle'), { fontFamily: FONT_SERIF, fontSize: '34px', color: CSS.me }).setOrigin(0.5));
    layer.add(
      i18nText(this, W / 2, 228, () => t('hg.inviteBody'), {
        fontSize: '18px',
        align: 'center',
        lineSpacing: 9,
        wordWrap: { width: W - 320, useAdvancedWrap: true },
      }).setOrigin(0.5),
    );
    const visited = new Set(getProgress().visited);
    TEN_VIEWS.forEach((v, i) => {
      const x = W / 2 - 400 + (i % 2) * 420;
      const y = 380 + Math.floor(i / 2) * 34;
      const done = visited.has(v.id);
      const dot = this.add.graphics();
      dot.fillStyle(v.id === 'huagang' ? 0xf28fb0 : done ? 0xe0628e : 0xc9c3b8, 1);
      dot.fillCircle(x, y, 8);
      layer.add(dot);
      layer.add(i18nText(this, x + 20, y, () => `${t(v.name)}${done ? '  ✓' : ''}`, { fontSize: '19px', color: done ? CSS.ink : '#8d887f' }).setOrigin(0, 0.5));
    });
    const again = makeButton(this, W / 2 - 160, H - 92, () => t('wake.again'), {
      width: 260,
      fill: 0xc0392b,
      stroke: 0x7b241c,
      textColor: '#fff8ee',
      depth: 310,
      onClick: () => this.leave(true),
    });
    const toTitle = makeButton(this, W / 2 + 160, H - 92, () => t('wake.toTitle'), { width: 260, depth: 310, onClick: () => this.leave(false) });
    again.container.setAlpha(0);
    toTitle.container.setAlpha(0);
    this.tweens.add({ targets: [layer, again.container, toTitle.container], alpha: 1, duration: 800 });
  }

  private leave(replay: boolean): void {
    this.cameras.main.fadeOut(700, 20, 30, 40);
    // the photos are still on screen; HuagangIntroScene clears them next time
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(replay ? 'HuagangIntro' : 'Title');
    });
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50);
    this.pond?.update(time);
    this.school?.update(dt, time);
    const gf = this.goldfish;
    if (gf) {
      gf.x += gf.dir * dt * 0.025;
      if (gf.x > 900 || gf.x < 822) gf.dir *= -1;
      gf.w += dt * 0.008;
      gf.body.pose(gf.x + gf.dir * 18, 306 + Math.sin(gf.w * 0.3) * 6, gf.dir > 0 ? 0 : Math.PI, 0, gf.w, 0.25, 0.42);
    }
  }
}
