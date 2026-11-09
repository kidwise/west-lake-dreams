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
import { Cyclist, LOOKS, drawPerson } from '../art/Cyclist';
import { rng } from '../art/paint';
import { markVisited, getProgress } from '../core/state';
import { TEN_VIEWS } from '../story/chapters';
import { DawnSky } from './DawnSky';
import { makeSeal } from './art';
import { BASE, WATER, BRIDGES } from './causeway';
import { sudiRun } from './state';

/** Morning at the north end: "请下车推行", waking up, and the 春晓 scroll. */
export class SudiEndScene extends Phaser.Scene {
  private skyTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super('SudiEnd');
  }

  create(): void {
    music.play('sudiSunrise');
    markVisited('sudi');
    const sky = new DawnSky(this, W);
    sky.update(1, 0, 0);
    this.skyTimer = this.time.addEvent({ delay: 50, loop: true, callback: () => sky.update(1, 0, this.time.now) });

    // the north end of the causeway in the morning
    const g = this.add.graphics().setDepth(10);
    g.fillStyle(0x6f8a58, 1);
    g.fillRect(0, BASE, W, WATER - BASE);
    g.fillStyle(0xd9ccb4, 1);
    g.fillRect(0, BASE - 2, W, 10);
    g.fillStyle(0x9a8f7c, 1);
    g.fillRect(0, WATER - 6, W, 6);
    const r = rng(5);
    let willow = true;
    for (let x = 40; x < W; x += 150 + r() * 40) {
      this.add.image(x, BASE + 6, willow ? 'willow' : 'peach').setOrigin(0.5, 1).setScale(willow ? 0.74 : 1).setDepth(5);
      willow = !willow;
    }
    this.add.image(W - 160, BASE + 6, 'sudiSpeaker').setOrigin(0.5, 1).setScale(0.8).setDepth(12);

    // people out for their morning walk and exercise
    const walkers: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 4; i++) {
      const p = this.add.graphics().setDepth(20);
      drawPerson(p, { shirt: [0xe8b04a, 0x9bc1a8, 0xd98a8a, 0x8aa6d9][i], pants: 0x3d4250, bike: 0, hair: i % 2 ? 'short' : 'ponytail' }, { facing: i % 2 ? 1 : -1 });
      if (i % 2 === 0) p.setScale(-0.8, 0.8);
      else p.setScale(0.8);
      p.setPosition(200 + i * 260, BASE + 2);
      this.tweens.add({ targets: p, x: p.x + (i % 2 ? 260 : -260), duration: 9000 + i * 900, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: p, y: BASE, yoyo: true, repeat: -1, duration: 260 });
      walkers.push(p);
    }

    // the three of us, stopped at the end of the causeway
    const us = ([['gogo', 470], ['koko', 590], ['me', 720]] as const).map(([who, x]) => {
      const c = new Cyclist(this, LOOKS[who], 0.9);
      c.crank = 0.6;
      c.draw();
      c.g.setPosition(x, BASE).setDepth(30);
      return c;
    });

    this.cameras.main.fadeIn(1200, 255, 246, 226);
    void this.play(us);
  }

  private async play(us: Cyclist[]): Promise<void> {
    await wait(this, 1200);
    // the loudspeaker
    sfx.announce();
    const box = this.add.container(W - 330, 200).setDepth(600);
    const bg = this.add.graphics();
    const txt = i18nText(this, 0, 0, () => t('sudi.end.broadcast'), { fontSize: '22px', color: '#1b2238', wordWrap: { width: 380, useAdvancedWrap: true } }).setOrigin(0.5);
    const w = Math.max(260, txt.width + 40);
    bg.fillStyle(0xffffff, 0.96);
    bg.fillRoundedRect(-w / 2, -txt.height / 2 - 16, w, txt.height + 32, 14);
    bg.fillTriangle(w / 2 - 70, txt.height / 2 + 14, w / 2 - 40, txt.height / 2 + 14, w / 2 - 30, txt.height / 2 + 50);
    box.add([bg, txt]);
    box.setScale(0.6).setAlpha(0);
    await tweenP(this, { targets: box, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });
    await wait(this, 1400);

    const dlg = new Dialogue(this);
    await dlg.say('gogo', 'sudi.end.g');
    await dlg.say('koko', 'sudi.end.k');
    dlg.hide();
    box.destroy();
    // we get off and walk our bikes away along the causeway
    for (const c of us) {
      c.withRider = false;
      c.draw();
    }
    const walkers = us.map((c, i) => {
      const p = this.add.graphics().setDepth(31);
      drawPerson(p, LOOKS[(['gogo', 'koko', 'me'] as const)[i]], { facing: 1, backpack: i === 2 });
      p.setPosition(c.g.x - 40, BASE + 2).setScale(0.85);
      return p;
    });
    this.tweens.add({ targets: [...us.map((c) => c.g), ...walkers], x: '+=700', duration: 4200, ease: 'Sine.easeIn' });
    await wait(this, 1200);
    const dlg2 = new Dialogue(this);
    await dlg2.say(null, 'sudi.end.m');
    dlg2.hide();
    this.cameras.main.fadeOut(1400, 255, 255, 255);
    await new Promise<void>((res) => this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => res()));
    await this.wake();
    await this.scroll();
    this.invitation();
  }

  private async wake(): Promise<void> {
    music.play('morning');
    this.skyTimer?.remove();
    this.skyTimer = null;
    this.tweens.killAll();
    this.children.removeAll(true);
    const g = this.add.graphics();
    g.fillGradientStyle(0xf3e7d3, 0xf3e7d3, 0xe2d2bb, 0xe2d2bb, 1);
    g.fillRect(0, 0, W, H);
    // window with spring morning outside
    g.fillStyle(0xfff4dc, 1);
    g.fillRect(760, 90, 360, 280);
    g.fillGradientStyle(0x9fd0ef, 0x9fd0ef, 0xe6f3f4, 0xe6f3f4, 1);
    g.fillRect(774, 104, 332, 252);
    g.fillStyle(0x7a9a8e, 1);
    g.fillEllipse(940, 356, 360, 60);
    g.lineStyle(8, 0xfff4dc, 1);
    g.lineBetween(940, 90, 940, 370);
    g.lineBetween(760, 230, 1120, 230);
    g.fillStyle(0xd98aa8, 1);
    for (let i = 0; i < 12; i++) g.fillCircle(800 + i * 26, 130 + Math.sin(i) * 10, 9);
    // bed and pillow
    g.fillStyle(0x8a6a50, 1);
    g.fillRect(80, 430, 560, 160);
    g.fillStyle(0xfdfaf3, 1);
    g.fillRoundedRect(110, 400, 160, 56, 20);
    g.fillStyle(0x9cc6e0, 1);
    g.fillRoundedRect(230, 410, 410, 90, 24);
    // a peach petal on the pillow
    this.add.image(190, 410, 'sudiPetal').setScale(1.6).setAngle(30);
    for (let i = 0; i < 3; i++) {
      const e = this.add.image(800 + i * 90, 160 + i * 20, 'egret1').setScale(0.5);
      this.tweens.add({ targets: e, x: e.x + 260, duration: 7000, repeat: -1 });
    }
    this.cameras.main.fadeIn(1200, 255, 255, 255);
    sfx.bird();
    await narrate(this, [{ key: 'sudi.w1' }, { key: 'sudi.w2' }], { color: '#3a3230', y: 620, size: 28, hintY: H - 24 });
  }

  /** The 春晓长卷: a scroll that unrolls to show the seals, photos and stats. */
  private async scroll(): Promise<void> {
    const shade = this.add.rectangle(0, 0, W, H, 0x2a2420, 0.55).setOrigin(0).setDepth(100);
    void shade;
    const left = 70;
    const right = W - 70;
    const top = 120;
    const bottom = 600;
    const paper = this.add.graphics().setDepth(101);
    const rollerL = this.add.graphics().setDepth(103);
    const rollerR = this.add.graphics().setDepth(103);
    const drawRoller = (g: Phaser.GameObjects.Graphics) => {
      g.clear();
      g.fillStyle(0x6b3f26, 1);
      g.fillRoundedRect(-14, top - 24, 28, bottom - top + 48, 10);
      g.fillStyle(0x8a5a3a, 1);
      g.fillRect(-8, top - 20, 6, bottom - top + 40);
      g.fillStyle(0xd9b45a, 1);
      g.fillCircle(0, top - 24, 8);
      g.fillCircle(0, bottom + 24, 8);
    };
    drawRoller(rollerL);
    drawRoller(rollerR);
    rollerL.x = W / 2;
    rollerR.x = W / 2;

    // the contents, revealed as the scroll unrolls
    const items: { obj: Phaser.GameObjects.GameObject & { x: number; setAlpha: (a: number) => unknown }; x: number }[] = [];
    const add = <T extends Phaser.GameObjects.GameObject & { x: number; setAlpha: (a: number) => unknown }>(obj: T): T => {
      obj.setAlpha(0);
      (obj as unknown as { setDepth: (d: number) => void }).setDepth(102);
      items.push({ obj, x: obj.x });
      return obj;
    };

    // title, written vertically on the right like a painting's inscription
    add(this.add.text(right - 70, top + 150, '苏\n堤\n春\n晓', baseStyle({ fontFamily: FONT_SERIF, fontSize: '46px', color: '#2f2a26', align: 'center', lineSpacing: 4 })).setOrigin(0.5));
    add(makeSeal(this, right - 70, top + 330, '春晓', 50).setAngle(-4));
    add(i18nText(this, left + 620, top + 22, () => t('sudi.scrollSub'), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#6b5d52' }).setOrigin(0, 0.5));

    // ink painting of the causeway and its six arches along the bottom
    const ink = this.add.graphics();
    ink.lineStyle(3, 0x3d3a36, 0.85);
    const by = bottom - 70;
    ink.lineBetween(left + 40, by, right - 170, by);
    const span = (right - 210 - left) / 6;
    BRIDGES.forEach((_, i) => {
      const cx = left + 60 + span * (i + 0.5);
      ink.beginPath();
      ink.arc(cx, by, 26, Math.PI, 0, false);
      ink.strokePath();
      ink.lineStyle(2, 0x3d3a36, 0.5);
      ink.beginPath();
      ink.arc(cx, by, 26, 0, Math.PI, false);
      ink.strokePath();
      ink.lineStyle(3, 0x3d3a36, 0.85);
    });
    const archXs = BRIDGES.map((_, i) => left + 60 + span * (i + 0.5));
    for (let x = left + 50; x < right - 180; x += 46) {
      if (archXs.some((ax) => Math.abs(ax - x) < 44)) continue;
      ink.lineStyle(1.5, 0x5b7a4a, 0.7);
      ink.lineBetween(x, by - 4, x - 6, by - 40);
      ink.lineBetween(x + 3, by - 4, x + 8, by - 34);
    }
    ink.setPosition(0, 0);
    items.push({ obj: ink as never, x: (left + right) / 2 });
    ink.setAlpha(0).setDepth(102);

    // the six seals, one per bridge
    BRIDGES.forEach((b, i) => {
      const cx = left + 60 + span * (i + 0.5);
      add(makeSeal(this, cx, by - 90, b.seal, 54).setAngle((i % 2 ? 4 : -4) * (i % 3 === 0 ? 1 : 0.5)));
    });

    // two photos from the dream
    const photo = (x: number, key: string, label: StrKey) => {
      const frame = this.add.rectangle(x, top + 120, 230, 170, 0xfdfaf3).setStrokeStyle(1, 0xc9bfae);
      add(frame);
      if (key && this.textures.exists(key)) {
        const img = this.add.image(x, top + 112, key);
        img.setScale(Math.min(214 / img.width, 140 / img.height));
        add(img);
      } else {
        add(i18nText(this, x, top + 112, () => t('sudi.photo.none'), { fontSize: '16px', color: '#9a8f84' }).setOrigin(0.5));
      }
      add(i18nText(this, x, top + 196, () => t(label), { fontFamily: FONT_SERIF, fontSize: '17px', color: '#4a4038' }).setOrigin(0.5));
    };
    photo(left + 180, sudiRun.photoReflect, 'sudi.photo.reflect');
    photo(left + 440, sudiRun.photoHills, 'sudi.photo.hills');

    // stats
    const stats: [StrKey, () => string][] = [
      ['sudi.stat.petals', () => String(sudiRun.petals)],
      ['sudi.stat.perfect', () => t('sudi.stat.unitTimes', { n: sudiRun.perfect })],
      ['sudi.stat.air', () => t('sudi.stat.unitSec', { n: sudiRun.airTime.toFixed(1) })],
      [
        'sudi.stat.race',
        () => (sudiRun.rank ? t(sudiRun.rank === 1 ? 'sudi.rank1' : sudiRun.rank === 2 ? 'sudi.rank2' : 'sudi.rank3') : t('sudi.stat.raceNone')),
      ],
    ];
    stats.forEach(([label, value], i) => {
      const y = top + 60 + i * 40;
      add(i18nText(this, left + 620, y, () => t(label), { fontSize: '19px', color: '#6b5d52' }).setOrigin(0, 0.5));
      add(i18nText(this, left + 860, y, () => value(), { fontSize: '21px', color: '#2f2a26', fontStyle: 'bold' }).setOrigin(1, 0.5));
    });

    // unroll from the middle outwards
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
            if (Math.abs(it.x - W / 2) < half - 10 && (it.obj as unknown as { alpha: number }).alpha === 0) {
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
    drawPanel(bg, 110, 50, W - 220, H - 100, 30, 0xfbf8f2, 0.98);
    layer.add(bg);
    layer.add(i18nText(this, W / 2, 112, () => t('sudi.inviteTitle'), { fontFamily: FONT_SERIF, fontSize: '38px', color: CSS.me }).setOrigin(0.5));
    layer.add(
      i18nText(this, W / 2, 218, () => t('sudi.inviteBody'), {
        fontSize: '20px',
        align: 'center',
        lineSpacing: 10,
        wordWrap: { width: W - 330, useAdvancedWrap: true },
      }).setOrigin(0.5),
    );
    const visited = new Set(getProgress().visited);
    TEN_VIEWS.forEach((v, i) => {
      const x = W / 2 - 400 + (i % 2) * 420;
      const y = 345 + Math.floor(i / 2) * 38;
      const done = visited.has(v.id);
      const dot = this.add.graphics();
      dot.fillStyle(v.id === 'sudi' ? 0xf28fb0 : done ? 0xe0628e : 0xc9c3b8, 1);
      dot.fillCircle(x, y, 8);
      layer.add(dot);
      layer.add(i18nText(this, x + 20, y, () => `${t(v.name)}${done ? '  ✓' : ''}`, { fontSize: '20px', color: done ? CSS.ink : '#8d887f' }).setOrigin(0, 0.5));
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
    // Don't remove the dream photos here: the scroll is still showing them this
    // frame. SudiIntroScene clears them when the chapter is played again.
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(replay ? 'SudiIntro' : 'Title');
    });
  }
}
