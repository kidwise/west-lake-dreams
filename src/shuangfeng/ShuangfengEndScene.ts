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
import { overGlobalUI } from '../ui/overlay';
import { markVisited, getProgress } from '../core/state';
import { TEN_VIEWS } from '../story/chapters';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { makeSeal } from '../sudi/art';
import { drawTwinPeaks, drawPagoda, drawStelePavilion } from './art';
import { drawMilkBottle } from './ShuangfengIntroScene';
import { sfRun, nextSfKey } from './state';

const BASE = 560;
const SHOTS = 3;
/** The cloud top must sit between these to bury both peaks but leave the pagoda tips showing. */
// (the puffs along the cloud's top edge reach ~35px above seaY)
const BAND = { top: 280, bottom: 336 };

type Grade = 'perfect' | 'low' | 'high';

/** Back at 洪春桥: the cloud sea rises, and we try to catch the moment the two pagodas pierce it. */
export class ShuangfengEndScene extends Phaser.Scene {
  private sea!: Phaser.GameObjects.Container;
  private seaY = 640;
  private phase = 0;
  private shooting = false;
  private shots = SHOTS;
  private bestDist = Infinity;
  private hud: Phaser.GameObjects.GameObject[] = [];
  private shotText: Phaser.GameObjects.Text | null = null;
  private settle: number | null = null;

  constructor() {
    super('ShuangfengEnd');
  }

  create(): void {
    music.play('sfFinale');
    markVisited('shuangfeng');
    this.seaY = 640;
    this.phase = 0;
    this.shooting = false;
    this.shots = SHOTS;
    this.bestDist = Infinity;
    this.hud = [];
    this.shotText = null;
    this.settle = null;
    void this.play();
  }

  private async play(): Promise<void> {
    await this.cloudSea();
    this.cameras.main.fadeOut(1400, 255, 255, 255);
    await new Promise<void>((res) => this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => res()));
    await this.wakeUp();
    await this.scroll();
    this.invitation();
  }

  // ---- the cloud sea -----------------------------------------------------------------------------

  private async cloudSea(): Promise<void> {
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0xf6c890, 0xf6c890, 0xdfeaf2, 0xdfeaf2, 1);
    g.fillRect(0, 0, W, H);
    this.add.image(1100, 120, 'phHalo').setScale(2.4).setTint(0xffd08a).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(0);
    const peaks = this.add.graphics().setDepth(1);
    const { south, north } = drawTwinPeaks(peaks, BASE);
    drawPagoda(peaks, south.x, south.y + 4, 110, { waist: 0.22, lit: 1 });
    drawPagoda(peaks, north.x, north.y + 4, 124, { lit: 1 });
    // the sea of cloud: a puffy top edge over a white body
    this.sea = this.add.container(0, this.seaY).setDepth(2);
    const body = this.add.graphics();
    body.fillGradientStyle(0xfffaf2, 0xfffaf2, 0xdfe6f0, 0xdfe6f0, 0.98);
    body.fillRect(0, 10, W, 420);
    body.fillStyle(0xdfe6f0, 0.98);
    body.fillRect(0, 428, W, H);
    this.sea.add(body);
    // rolling rows of cloud, sunlit on top, cooler further down
    const rows: [number, number, number, number][] = [[110, 0xe4eaf3, 1.1, 70], [60, 0xf1f4f9, 0.95, 58], [8, 0xfff8ee, 0.78, 46]];
    for (const [y, tint, sc, step] of rows) {
      for (let x = -40 + (y % 30); x < W + 60; x += step) {
        this.sea.add(this.add.image(x, y + Math.sin(x * 0.05 + y) * 6, 'sfPuff').setScale(sc + Math.sin(x) * 0.15).setTint(tint));
      }
    }
    // the foreground: the stele pavilion by the bridge, and the three of us
    const fg = this.add.graphics().setDepth(10);
    fg.fillStyle(0x7f9a6a, 1);
    fg.fillRect(0, 610, W, H - 610);
    drawStelePavilion(this, fg, 150, 640).setDepth(11);
    ([['koko', 960], ['gogo', 1060], ['me', 1160]] as const).forEach(([who, x]) => {
      const k = this.add.graphics().setDepth(12);
      drawPerson(k, LOOKS[who], { facing: -1, armUp: who === 'me', backpack: who === 'me' });
      k.setPosition(x, 700).setScale(0.9);
    });
    const cow = this.add.image(640, 150, 'sfCow').setScale(0.42).setDepth(3);
    this.tweens.add({ targets: cow, y: 140, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.easeInOut' });
    this.cameras.main.fadeIn(1200, 250, 250, 250);

    const dlg = new Dialogue(this);
    await narrate(this, [{ key: 'sf.e.n1' }], { color: '#3a4a48', y: 60, size: 26, depth: 600, hintY: 104 });
    sfx.moo();
    await dlg.say('cow', 'sf.e.c1');
    dlg.hide();
    // she breathes out, and the cloud starts to rise
    await tweenP(this, { targets: this, seaY: 440, duration: 2400, ease: 'Sine.easeOut', onUpdate: () => this.sea.setY(this.seaY) });
    await this.photoGame();
    await dlg.say('koko', 'sf.e.k1');
    await dlg.say('gogo', 'sf.e.g1');
    await dlg.say('cow', 'sf.e.c2');
    dlg.hide();
    // far away, a bell
    for (let i = 0; i < 3; i++) {
      sfx.stone(110);
      await wait(this, 1400);
    }
    await dlg.say('cow', 'sf.e.c3');
    dlg.hide();
  }

  private async photoGame(): Promise<void> {
    const touch = this.sys.game.device.input.touch;
    const hint = i18nText(this, W / 2, 30, () => t(touch ? 'sf.e.hintTouch' : 'sf.e.hint'), {
      fontSize: '19px',
      color: '#2f3b3a',
      align: 'center',
      backgroundColor: '#fdf8eecc',
      padding: { x: 12, y: 6 },
      wordWrap: { width: W - 600, useAdvancedWrap: true },
    }).setOrigin(0.5, 0).setDepth(300);
    this.shotText = i18nText(this, W - 160, 110, () => t('sf.e.shots', { n: this.shots }), { fontSize: '20px', color: '#2f3b3a' }).setOrigin(0.5).setDepth(300);
    // a little gauge on the right: where the cloud top is, and the band that makes 插云
    const gauge = this.add.graphics().setDepth(300);
    this.hud = [hint, this.shotText, gauge];
    gauge.setData('draw', true);
    this.shooting = true;
    const kb = this.input.keyboard;
    const shoot = () => void this.shoot();
    kb?.on('keydown-SPACE', shoot);
    const onPtr = (p: Phaser.Input.Pointer) => !overGlobalUI(p) && shoot();
    this.input.on('pointerdown', onPtr);
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => !this.shooting && (ev.remove(), res()) });
    });
    kb?.off('keydown-SPACE', shoot);
    this.input.off('pointerdown', onPtr);
    for (const o of this.hud) o.destroy();
    this.hud = [];
    this.shotText = null;
    if (sfRun.photoGrade !== 'perfect') {
      // Granny Cow holds the cloud still for us, just at the right height
      const dlg = new Dialogue(this);
      await dlg.say('cow', 'sf.e.cHelp');
      dlg.hide();
      this.settle = (BAND.top + BAND.bottom) / 2;
      await wait(this, 2000);
    } else {
      this.settle = this.seaY;
    }
  }

  private grade(y: number): Grade {
    if (y < BAND.top) return 'high';
    if (y > BAND.bottom) return 'low';
    return 'perfect';
  }

  private async shoot(): Promise<void> {
    if (!this.shooting || this.shots <= 0) return;
    this.shots -= 1;
    this.shotText?.setText(t('sf.e.shots', { n: this.shots }));
    const y = this.seaY;
    const grade = this.grade(y);
    const dist = Math.abs(y - (BAND.top + BAND.bottom) / 2);
    sfx.shutter();
    const better = grade === 'perfect' ? sfRun.photoGrade !== 'perfect' || dist < this.bestDist : sfRun.photoGrade !== 'perfect' && dist < this.bestDist;
    if (better) {
      this.bestDist = dist;
      sfRun.photoGrade = grade;
      // take the picture first, so the flash and the verdict aren't in it
      await new Promise<void>((res) => this.snapshot(res));
    }
    // flash, then say how it came out
    const flash = this.add.rectangle(0, 0, W, H, 0xffffff, 0.9).setOrigin(0).setDepth(500);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
    const key: StrKey = grade === 'perfect' ? 'sf.e.perfect' : grade === 'low' ? 'sf.e.low' : 'sf.e.high';
    const txt = this.add.text(W / 2, 260, t(key), baseStyle({ fontSize: grade === 'perfect' ? '40px' : '28px', color: grade === 'perfect' ? '#c0392b' : '#2f3b3a', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 6 })).setOrigin(0.5).setDepth(400);
    this.tweens.add({ targets: txt, y: 230, alpha: 0, delay: 1000, duration: 600, onComplete: () => txt.destroy() });
    if (grade === 'perfect') {
      sfx.chime();
      this.shooting = false;
    } else if (this.shots <= 0) {
      await wait(this, 1200);
      this.shooting = false;
    }
  }

  private snapshot(done: () => void): void {
    const key = nextSfKey('photo');
    const old = sfRun.photo;
    // keep the HUD and the music / language buttons out of the photo
    for (const o of this.hud) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(false);
    this.scene.setVisible(false, 'UI');
    this.game.renderer.snapshotArea(0, 0, W, H, (img) => {
      this.scene.setVisible(true, 'UI');
      for (const o of this.hud) if (o.active) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(true);
      if (img instanceof HTMLImageElement) {
        const add = () => {
          if (!this.textures.exists(key)) this.textures.addImage(key, img);
          if (old && old !== key && this.textures.exists(old)) this.textures.remove(old);
          sfRun.photo = key;
        };
        if (img.complete) add();
        else img.onload = add;
      }
      done();
    });
  }

  // ---- waking up -----------------------------------------------------------------------------------

  private async wakeUp(): Promise<void> {
    music.play('morning');
    this.tweens.killAll();
    this.children.removeAll(true);
    this.hud = [];
    const g = this.add.graphics();
    g.fillStyle(0xf2ede2, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0x4a5358, 1);
    g.fillRect(0, 0, W, 54);
    g.fillStyle(0x3a2a20, 1);
    g.fillRect(840, 170, 260, H - 210);
    g.fillStyle(0x6b3f26, 1);
    g.fillRect(852, 182, 114, H - 222);
    g.fillRect(974, 182, 114, H - 222);
    g.fillStyle(0xb9b0a0, 1);
    g.fillRect(780, H - 46, 380, 22);
    g.fillStyle(0xa8a294, 1);
    g.fillRect(0, H - 40, W, 40);
    // the three of us, dozing on the doorstep
    ([['koko', 820], ['gogo', 930], ['me', 1040]] as const).forEach(([who, x]) => {
      const k = this.add.graphics();
      drawPerson(k, LOOKS[who], { facing: -1, backpack: who === 'me' });
      k.setPosition(x, H - 40).setScale(1.05);
      k.fillStyle(0xffffff, 1);
      k.fillEllipse(-9, -110, 10, 5);
      k.fillEllipse(-1, -110, 10, 5);
    });
    // the empty bottle on the step — with a tiny cloud still inside
    const b = this.add.graphics();
    drawMilkBottle(b, 0, 34, 80);
    b.setPosition(700, H - 46);
    const puff = this.add.image(700, H - 82, 'sfPuff').setScale(0.22).setAlpha(0.9);
    this.tweens.add({ targets: puff, y: H - 88, scale: 0.25, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
    this.cameras.main.fadeIn(1400, 255, 255, 255);
    await narrate(this, [{ key: 'sf.w1' }], { color: '#4a4038', y: 120, size: 28, hintY: 180 });
    const dlg = new Dialogue(this);
    await dlg.say('mom', 'sf.w.mom');
    await dlg.say('koko', 'sf.w.k');
    await dlg.say('gogo', 'sf.w.g');
    dlg.hide();
    await narrate(this, [{ key: 'sf.w2' }], { color: '#4a4038', y: 120, size: 28, hintY: 180 });
  }

  // ---- the 双峰插云 scroll ---------------------------------------------------------------------------

  private async scroll(): Promise<void> {
    this.add.rectangle(0, 0, W, H, 0x101420, 0.55).setOrigin(0).setDepth(100);
    const left = 70;
    const right = W - 70;
    const top = 110;
    const bottom = 610;
    const paper = this.add.graphics().setDepth(101);
    const rollers = [this.add.graphics().setDepth(103), this.add.graphics().setDepth(103)];
    for (const g of rollers) {
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
    add(this.add.text(right - 66, top + 150, '双\n峰\n插\n云', baseStyle({ fontFamily: FONT_SERIF, fontSize: '46px', color: '#2f2a26', align: 'center', lineSpacing: 4 })).setOrigin(0.5));
    add(makeSeal(this, right - 66, top + 330, '插云', 50).setAngle(-4));
    add(i18nText(this, left + 36, top + 26, () => t('sf.scrollSub'), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#6b5d52' }).setOrigin(0, 0.5));

    const px = left + 330;
    const py = top + 200;
    add(this.add.rectangle(px, py, 540, 320, 0xfdfaf3).setStrokeStyle(1, 0xc9bfae));
    if (sfRun.photo && this.textures.exists(sfRun.photo)) {
      const img = this.add.image(px, py, sfRun.photo);
      img.setScale(Math.min(520 / img.width, 300 / img.height));
      add(img);
    } else add(i18nText(this, px, py, () => t('sf.photo.none'), { fontSize: '16px', color: '#9a8f84' }).setOrigin(0.5));
    const cap: StrKey = sfRun.photoGrade === 'perfect' ? 'sf.photo.perfect' : sfRun.photoGrade === 'high' ? 'sf.photo.high' : 'sf.photo.low';
    add(i18nText(this, px, py + 186, () => t(cap), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#4a4038' }).setOrigin(0.5));

    const stats: [StrKey, () => string][] = [
      ['sf.stat.climb', () => t('sf.stat.climbVal', { t: sfRun.climbTime, w: sfRun.wrongTurns })],
      ['sf.stat.race', () => t(sfRun.beatPorter ? 'sf.stat.raceWin' : 'sf.stat.raceLose')],
      ['sf.stat.tower', () => t('sf.stat.towerVal', { p: sfRun.towerNeat, n: sfRun.towerPerfect })],
      ['sf.stat.calves', () => t('sf.stat.calvesVal', { n: sfRun.calves, total: sfRun.calvesTotal })],
      ['sf.stat.dig', () => t(sfRun.sawLuohan ? 'sf.stat.digValL' : 'sf.stat.digVal', { n: sfRun.finds, t: sfRun.digTime })],
    ];
    stats.forEach(([label, value], i) => {
      const y = top + 50 + i * 72;
      add(i18nText(this, left + 680, y, () => t(label), { fontSize: '16px', color: '#6b5d52' }).setOrigin(0, 0.5), left + 760);
      add(i18nText(this, left + 680, y + 27, () => value(), { fontSize: '20px', color: '#2f2a26', fontStyle: 'bold' }).setOrigin(0, 0.5), left + 760);
    });

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
          rollers[0].x = W / 2 - half;
          rollers[1].x = W / 2 + half;
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
    // sits below the top-right controls; content shifts down with the layer
    const layer = this.add.container(0, 22).setDepth(300).setAlpha(0);
    const bg = this.add.graphics();
    drawPanel(bg, 110, 54, W - 220, H - 108, 30, 0xfbf8f2, 0.98);
    layer.add(bg);
    layer.add(i18nText(this, W / 2, 96, () => t('sf.inviteTitle'), { fontFamily: FONT_SERIF, fontSize: '32px', color: CSS.me }).setOrigin(0.5));
    layer.add(
      i18nText(this, W / 2, 234, () => t('sf.inviteBody'), {
        fontSize: '17px',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: W - 320, useAdvancedWrap: true },
      }).setOrigin(0.5),
    );
    const visited = new Set(getProgress().visited);
    TEN_VIEWS.forEach((v, i) => {
      const x = W / 2 - 400 + (i % 2) * 420;
      const y = 396 + Math.floor(i / 2) * 32;
      const done = visited.has(v.id);
      const dot = this.add.graphics();
      dot.fillStyle(v.id === 'shuangfeng' ? 0xf28fb0 : done ? 0xe0628e : 0xc9c3b8, 1);
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
    // the photo is still on screen; ShuangfengIntroScene clears it next time
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(replay ? 'ShuangfengIntro' : 'Title');
    });
  }

  update(_time: number, delta: number): void {
    if (!this.sea || !this.sea.active) return;
    if (this.shooting) {
      // the cloud breathes up and down: slow swells with a little wobble
      this.phase += delta / 1000;
      this.seaY = 322 + Math.sin(this.phase * 0.55) * 105 + Math.sin(this.phase * 1.7) * 14;
      this.sea.setY(this.seaY);
    } else if (this.settle !== null) {
      this.seaY += (this.settle - this.seaY) * Math.min(1, (delta / 1000) * 1.5);
      this.sea.setY(this.seaY);
    }
    const gauge = this.hud[2] as Phaser.GameObjects.Graphics | undefined;
    if (gauge && gauge.active && gauge.visible) {
      gauge.clear();
      const x = W - 40;
      gauge.fillStyle(0x2f3b3a, 0.25);
      gauge.fillRoundedRect(x - 8, 150, 16, 380, 8);
      gauge.fillStyle(0xe0628e, 0.6);
      gauge.fillRect(x - 8, BAND.top, 16, BAND.bottom - BAND.top);
      gauge.fillStyle(0xffffff, 1);
      gauge.fillCircle(x, Phaser.Math.Clamp(this.seaY, 150, 530), 10);
      gauge.lineStyle(2, 0x2f3b3a, 1);
      gauge.strokeCircle(x, Phaser.Math.Clamp(this.seaY, 150, 530), 10);
    }
  }
}
