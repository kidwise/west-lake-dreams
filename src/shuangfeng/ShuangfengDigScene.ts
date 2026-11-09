import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { tweenP, wait, waitForTap } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { rng } from '../art/paint';
import { drawPagoda } from './art';
import { sfRun } from './state';

const HUD = 300;
const DIG = { x: 300, y: 150, w: 560, h: 380 };
const GRID = { cols: 28, rows: 19 };
const TOWER = { x: 1080, ground: 600, h: 430 };
const CAVE = { x: 120, y: 520 };

type Kind = 'base' | 'brick' | 'tile' | 'bell' | 'pearl';
interface Find {
  kind: Kind;
  /** Where it lies in the dig (screen coords). */
  x: number;
  y: number;
  /** Where it belongs on the pagoda. */
  slot: { x: number; y: number };
  found: boolean;
  placed: boolean;
  obj: Phaser.GameObjects.Container | null;
}

/** 南高峰顶: brush away the earth to uncover the pagoda's foundations, then put the pieces back. */
export class ShuangfengDigScene extends Phaser.Scene {
  private soil!: Phaser.GameObjects.RenderTexture;
  private brush!: Phaser.GameObjects.Image;
  private cleared = new Set<number>();
  private brushing = false;
  private canDig = false;
  private finds: Find[] = [];
  private status!: Phaser.GameObjects.Text;
  private startTime = 0;
  private inCave = false;
  private ghost!: Phaser.GameObjects.Graphics;
  private dlg!: Dialogue;
  private lastDust = 0;

  constructor() {
    super('ShuangfengDig');
  }

  create(): void {
    music.play('sfDig');
    this.cleared = new Set();
    this.brushing = false;
    this.canDig = false;
    this.inCave = false;
    const s = TOWER.h;
    this.finds = [
      { kind: 'base', x: DIG.x + 120, y: DIG.y + 290, slot: { x: TOWER.x, y: TOWER.ground - 8 }, found: false, placed: false, obj: null },
      { kind: 'brick', x: DIG.x + 430, y: DIG.y + 270, slot: { x: TOWER.x, y: TOWER.ground - s * 0.22 }, found: false, placed: false, obj: null },
      { kind: 'tile', x: DIG.x + 300, y: DIG.y + 110, slot: { x: TOWER.x - 44, y: TOWER.ground - s * 0.47 }, found: false, placed: false, obj: null },
      { kind: 'bell', x: DIG.x + 110, y: DIG.y + 90, slot: { x: TOWER.x + 52, y: TOWER.ground - s * 0.6 }, found: false, placed: false, obj: null },
      { kind: 'pearl', x: DIG.x + 480, y: DIG.y + 70, slot: { x: TOWER.x, y: TOWER.ground - s + 6 }, found: false, placed: false, obj: null },
    ];
    this.paint();
    this.soil = this.add.renderTexture(DIG.x, DIG.y, DIG.w, DIG.h).setOrigin(0).setDepth(20);
    this.paintSoil();
    this.brush = new Phaser.GameObjects.Image(this, 0, 0, 'dqBrush').setScale(0.9);
    this.status = this.add.text(36, 76, '', baseStyle({ fontSize: '20px', color: '#3a2e26' })).setDepth(HUD);
    i18nText(this, 36, 38, () => t('sf.d.title'), { fontFamily: FONT_SERIF, fontSize: '22px', color: '#3a2e26' }).setDepth(HUD);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (overGlobalUI(p) || this.inCave) return;
      this.brushing = true;
      this.dig(p.x, p.y);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => (this.brushing || p.isDown) && this.dig(p.x, p.y));
    this.input.on('pointerup', () => (this.brushing = false));
    this.cameras.main.fadeIn(900, 240, 236, 220);
    void this.play();
  }

  // ---- scenery -------------------------------------------------------------------------------

  private paint(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0xf3dcae, 0xf3dcae, 0xe9eef0, 0xe9eef0, 1);
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) this.add.image(150 + i * 330, 130 + (i % 2) * 40, 'sfMist').setScale(1.4, 0.6).setAlpha(0.5);
    // the hilltop
    g.fillStyle(0x8a9a6a, 1);
    g.fillRect(0, 130, W, H - 130);
    g.fillStyle(0x7a8a5a, 1);
    for (let x = 0; x < W; x += 40) g.fillTriangle(x, 132, x + 20, 118, x + 40, 132);
    // a cordoned-off dig, like the archaeologists'
    g.fillStyle(0xa58a64, 1);
    g.fillRect(DIG.x - 12, DIG.y - 12, DIG.w + 24, DIG.h + 24);
    // under the earth: the foundations of the pagoda
    g.fillStyle(0xc7b89c, 1);
    g.fillRect(DIG.x, DIG.y, DIG.w, DIG.h);
    const cx = DIG.x + DIG.w / 2;
    const cy = DIG.y + DIG.h / 2 + 10;
    const oct = (r: number) =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return new Phaser.Math.Vector2(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r);
      });
    g.fillStyle(0x9a8f7a, 1);
    g.fillPoints(oct(150), true);
    g.fillStyle(0xb3a78e, 1);
    g.fillPoints(oct(132), true);
    g.lineStyle(2, 0x857a64, 1);
    g.strokePoints(oct(132), true);
    g.strokePoints(oct(90), true);
    // brick courses
    g.lineStyle(1, 0x857a64, 0.6);
    for (let y = cy - 120; y < cy + 120; y += 16) g.lineBetween(cx - 150, y, cx + 150, y);
    g.fillStyle(0x8a7f6a, 1);
    g.fillCircle(cx, cy, 20);
    // the old paths leading up to it
    g.fillStyle(0xa8997e, 1);
    g.fillRect(DIG.x, cy - 18, 60, 36);
    g.fillRect(DIG.x + DIG.w - 60, cy - 18, 60, 36);
    // string lines and pegs round the dig
    g.lineStyle(2, 0xf6f1e7, 0.9);
    g.strokeRect(DIG.x - 18, DIG.y - 18, DIG.w + 36, DIG.h + 36);
    g.fillStyle(0xc0392b, 1);
    for (const [x, y] of [[DIG.x - 18, DIG.y - 18], [DIG.x + DIG.w + 18, DIG.y - 18], [DIG.x - 18, DIG.y + DIG.h + 18], [DIG.x + DIG.w + 18, DIG.y + DIG.h + 18]]) g.fillRect(x - 4, y - 10, 8, 20);
    // the finds, waiting under the soil
    for (const f of this.finds) {
      const c = this.add.container(f.x, f.y).setDepth(10);
      const fg = this.add.graphics();
      drawFind(fg, f.kind);
      c.add(fg);
      f.obj = c;
    }
    // the tower's ghost outline, where it once stood
    this.ghost = this.add.graphics().setDepth(5).setAlpha(0);
    drawPagoda(this.ghost, TOWER.x, TOWER.ground, TOWER.h, { waist: 0.22, alpha: 0.18 });
    // the cave of 烟霞洞 in the slope
    g.fillStyle(0x6a6050, 1);
    g.fillEllipse(CAVE.x, CAVE.y, 150, 130);
    g.fillStyle(0x1a1612, 1);
    g.fillEllipse(CAVE.x, CAVE.y + 14, 96, 92);
    g.fillStyle(0x8a9a6a, 1);
    g.fillRect(CAVE.x - 80, CAVE.y + 54, 160, 20);
    const lbl = i18nText(this, CAVE.x, CAVE.y - 88, () => t('sf.d.btnCave'), { fontSize: '18px', color: '#3a2e26', fontStyle: 'bold' }).setOrigin(0.5).setDepth(30);
    void lbl;
    const zone = this.add.zone(CAVE.x, CAVE.y, 140, 140).setInteractive({ useHandCursor: true }).setDepth(30);
    zone.on('pointerdown', () => void this.cave());
    // the three of us, and Granny Cow resting
    ([['koko', 980], ['gogo', 1180], ['me', 920]] as const).forEach(([who, x]) => {
      const k = this.add.graphics().setDepth(40);
      drawPerson(k, LOOKS[who], { facing: who === 'gogo' ? -1 : 1, backpack: who === 'me' });
      k.setPosition(x, 690).setScale(0.7);
    });
    const cow = this.add.image(170, 300, 'sfCow').setScale(0.45).setDepth(35).setFlipX(true);
    this.tweens.add({ targets: cow, y: 292, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.easeInOut' });
  }

  private paintSoil(): void {
    const r = rng(41);
    this.soil.fill(0x8a6a48, 1);
    const g = this.add.graphics().setVisible(false);
    for (let i = 0; i < 260; i++) {
      g.fillStyle([0x7a5a3a, 0x9a7a52, 0x6a4a30, 0xa88a60][i % 4], 0.8);
      g.fillCircle(r() * DIG.w, r() * DIG.h, 3 + r() * 12);
    }
    // a few roots and pebbles
    g.lineStyle(3, 0x5a3a22, 0.7);
    for (let i = 0; i < 8; i++) {
      const x = r() * DIG.w;
      const y = r() * DIG.h;
      g.lineBetween(x, y, x + (r() - 0.5) * 120, y + (r() - 0.5) * 60);
    }
    g.fillStyle(0xb9b0a0, 1);
    for (let i = 0; i < 30; i++) g.fillEllipse(r() * DIG.w, r() * DIG.h, 6 + r() * 6, 4 + r() * 4);
    this.soil.draw(g).render();
    g.destroy();
  }

  // ---- story ---------------------------------------------------------------------------------

  private async play(): Promise<void> {
    this.dlg = new Dialogue(this);
    const dlg = this.dlg;
    await dlg.say('cow', 'sf.d.c1');
    await dlg.say(null, 'sf.d.n1');
    await dlg.say('me', 'sf.d.m1');
    dlg.hide();
    const hint = i18nText(this, W / 2, H - 22, () => t('sf.d.hint'), { fontSize: '20px', color: '#3a2e26' }).setOrigin(0.5, 1).setDepth(HUD);
    this.canDig = true;
    this.startTime = this.time.now;
    this.updateStatus();
    // until all five finds are out and most of the foundation is showing
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({
        delay: 200,
        loop: true,
        callback: () => {
          const done = this.finds.every((f) => f.found) && this.cleared.size >= GRID.cols * GRID.rows * 0.62;
          if (done && !this.inCave) {
            ev.remove();
            res();
          }
        },
      });
    });
    this.canDig = false;
    hint.destroy();
    // the last of the soil blows away
    sfx.wind();
    await tweenP(this, { targets: this.soil, alpha: 0, duration: 900 });
    await dlg.say('koko', 'sf.d.k1');
    await dlg.say('me', 'sf.d.m2');
    dlg.hide();
    this.tweens.add({ targets: this.ghost, alpha: 1, duration: 800 });
    await this.placeAll();
    sfRun.digTime = Math.round((this.time.now - this.startTime) / 1000);
    await this.raise();
    await dlg.say('cow', 'sf.d.c2');
    await dlg.say('gogo', 'sf.d.g1');
    await dlg.say('cow', 'sf.d.c3');
    dlg.hide();
    this.cameras.main.fadeOut(1000, 250, 250, 250);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('ShuangfengEnd'));
  }

  private updateStatus(): void {
    const n = this.finds.filter((f) => f.found).length;
    this.status.setText(t('sf.d.progress', { n }));
  }

  // ---- brushing ------------------------------------------------------------------------------

  private dig(x: number, y: number): void {
    if (!this.canDig || this.inCave) return;
    if (x < DIG.x - 30 || x > DIG.x + DIG.w + 30 || y < DIG.y - 30 || y > DIG.y + DIG.h + 30) return;
    this.soil.erase(this.brush, x - DIG.x, y - DIG.y).render();
    const cw = DIG.w / GRID.cols;
    const ch = DIG.h / GRID.rows;
    const rad = 34;
    for (let c = 0; c < GRID.cols; c++) {
      for (let r = 0; r < GRID.rows; r++) {
        const px = DIG.x + (c + 0.5) * cw;
        const py = DIG.y + (r + 0.5) * ch;
        if (Math.hypot(px - x, py - y) < rad) this.cleared.add(r * GRID.cols + c);
      }
    }
    const now = this.time.now;
    if (now - this.lastDust > 140) {
      this.lastDust = now;
      sfx.brush();
      const d = this.add.image(x, y, 'sfPuff').setTint(0xb08a5a).setScale(0.2).setAlpha(0.6).setDepth(25);
      this.tweens.add({ targets: d, x: x + (Math.random() - 0.5) * 60, y: y - 30, alpha: 0, scale: 0.4, duration: 600, onComplete: () => d.destroy() });
    }
    for (const f of this.finds) if (!f.found && this.revealed(f) > 0.6) this.discover(f);
  }

  private revealed(f: Find): number {
    const cw = DIG.w / GRID.cols;
    const ch = DIG.h / GRID.rows;
    let n = 0;
    let got = 0;
    for (let c = 0; c < GRID.cols; c++) {
      for (let r = 0; r < GRID.rows; r++) {
        const px = DIG.x + (c + 0.5) * cw;
        const py = DIG.y + (r + 0.5) * ch;
        if (Math.abs(px - f.x) < 36 && Math.abs(py - f.y) < 28) {
          n += 1;
          if (this.cleared.has(r * GRID.cols + c)) got += 1;
        }
      }
    }
    return n ? got / n : 0;
  }

  private discover(f: Find): void {
    f.found = true;
    sfRun.finds = this.finds.filter((x) => x.found).length;
    sfx.shimmer();
    const obj = f.obj!;
    // lift it up out of the dirt
    obj.setDepth(26);
    this.tweens.add({ targets: obj, scale: 1.25, yoyo: true, duration: 260 });
    const sp = this.add.image(f.x, f.y, 'sfSpark').setScale(3).setDepth(27).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: sp, scale: 6, alpha: 0, duration: 700, onComplete: () => sp.destroy() });
    const name = t(`sf.d.item.${f.kind}` as StrKey);
    const txt = this.add.text(f.x, f.y - 50, t('sf.d.found', { name }), baseStyle({ fontSize: '22px', color: '#ffffff', fontStyle: 'bold', stroke: '#5a3a22', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0, delay: 900, duration: 600, onComplete: () => txt.destroy() });
    this.updateStatus();
  }

  // ---- putting the pieces back ------------------------------------------------------------------

  private async placeAll(): Promise<void> {
    const hint = i18nText(this, W / 2, H - 22, () => t('sf.d.hint2'), { fontSize: '20px', color: '#3a2e26' }).setOrigin(0.5, 1).setDepth(HUD);
    // little glowing slots on the outline
    const slots = this.add.graphics().setDepth(6);
    const drawSlots = (time: number) => {
      slots.clear();
      for (const f of this.finds) {
        if (f.placed) continue;
        slots.lineStyle(3, 0xe0a050, 0.5 + 0.4 * Math.sin(time * 0.005));
        slots.strokeCircle(f.slot.x, f.slot.y, 26);
      }
    };
    const pulse = this.time.addEvent({ delay: 50, loop: true, callback: () => drawSlots(this.time.now) });
    const labels: Phaser.GameObjects.Text[] = [];
    for (const f of this.finds) {
      const obj = f.obj!;
      obj.setDepth(50);
      obj.setSize(80, 60);
      obj.setInteractive({ useHandCursor: true, draggable: true });
      const lbl = i18nText(this, 0, 36, () => t(`sf.d.item.${f.kind}` as StrKey), { fontSize: '15px', color: '#3a2e26', backgroundColor: '#fdf8eecc', padding: { x: 6, y: 2 } }).setOrigin(0.5);
      obj.add(lbl);
      labels.push(lbl);
      obj.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => obj.setPosition(x, y));
      obj.on('dragend', () => {
        // which slot is it nearest?
        let best: Find | null = null;
        let bd = 60;
        for (const g of this.finds) {
          if (g.placed) continue;
          const d = Math.hypot(obj.x - g.slot.x, obj.y - g.slot.y);
          if (d < bd) {
            bd = d;
            best = g;
          }
        }
        if (best === f) {
          f.placed = true;
          obj.disableInteractive();
          lbl.destroy();
          sfx.stamp();
          this.tweens.add({ targets: obj, x: f.slot.x, y: f.slot.y, scale: 0.7, duration: 200 });
        } else {
          if (best) {
            sfx.blip();
            this.flash(t('sf.d.wrongSlot'), obj.x, obj.y - 50);
          }
          this.tweens.add({ targets: obj, x: f.x, y: f.y, duration: 300, ease: 'Back.easeOut' });
        }
      });
    }
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 150, loop: true, callback: () => this.finds.every((f) => f.placed) && (ev.remove(), res()) });
    });
    pulse.remove();
    slots.destroy();
    hint.destroy();
    await wait(this, 400);
  }

  private flash(s: string, x: number, y: number): void {
    const txt = this.add.text(x, y, s, baseStyle({ fontSize: '20px', color: '#7a4a3a', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: txt, y: y - 30, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
  }

  /** The South Peak pagoda grows back up from its foundations. */
  private async raise(): Promise<void> {
    const g = this.add.graphics().setDepth(45);
    drawPagoda(g, 0, 0, TOWER.h, { waist: 0.22, lit: 1 });
    g.setPosition(TOWER.x, TOWER.ground).setScale(1, 0);
    for (const f of this.finds) this.tweens.add({ targets: f.obj, alpha: 0, duration: 600 });
    this.tweens.add({ targets: this.ghost, alpha: 0, duration: 600 });
    sfx.shimmer();
    await tweenP(this, { targets: g, scaleY: 1, duration: 2200, ease: 'Cubic.easeOut' });
    sfx.bell();
    const glow = this.add.image(TOWER.x, TOWER.ground - TOWER.h - 10, 'phHalo').setScale(1.4).setDepth(44).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, alpha: 0.9, duration: 700 });
    sfx.moo();
    await wait(this, 800);
  }

  // ---- easter egg: the arhats of 烟霞洞 ------------------------------------------------------------

  private async cave(): Promise<void> {
    if (this.inCave) return;
    this.inCave = true;
    this.brushing = false;
    sfRun.sawLuohan = true;
    const layer = this.add.container(0, 0).setDepth(800).setAlpha(0);
    const bg = this.add.graphics();
    bg.fillStyle(0x0c0a08, 0.96);
    bg.fillRect(0, 0, W, H);
    layer.add(bg);
    // rough stone wall with carved figures in niches
    const wall = this.add.graphics();
    for (let i = 0; i < 6; i++) {
      const x = 240 + i * 160;
      const y = 300 + (i % 2) * 40;
      // the niche
      wall.fillStyle(0x2a2622, 1);
      wall.fillRoundedRect(x - 66, y - 100, 132, 210, 50);
      const stone = 0x5a544a;
      const shade = 0x3f3a33;
      // crossed legs: a wide base
      wall.fillStyle(shade, 1);
      wall.fillEllipse(x, y + 78, 118, 40);
      wall.fillStyle(stone, 1);
      wall.fillEllipse(x, y + 72, 110, 34);
      // robe over the shoulders, falling in folds
      wall.fillPoints([new Phaser.Math.Vector2(x - 30, y - 30), new Phaser.Math.Vector2(x + 30, y - 30), new Phaser.Math.Vector2(x + 46, y + 70), new Phaser.Math.Vector2(x - 46, y + 70)], true);
      wall.fillCircle(x - 30, y - 22, 12);
      wall.fillCircle(x + 30, y - 22, 12);
      wall.lineStyle(2, shade, 1);
      for (let k = 0; k < 3; k++) {
        wall.beginPath();
        wall.arc(x, y - 30 + k * 18, 22 + k * 8, 0.35 * Math.PI, 0.65 * Math.PI, false);
        wall.strokePath();
      }
      // hands folded in the lap
      wall.fillStyle(0x6a6458, 1);
      wall.fillEllipse(x, y + 46, 34, 16);
      // a shaven head with long ears, eyes closed, smiling
      wall.fillStyle(0x6a6458, 1);
      wall.fillCircle(x, y - 56, 24);
      wall.fillEllipse(x - 24, y - 52, 8, 18);
      wall.fillEllipse(x + 24, y - 52, 8, 18);
      wall.lineStyle(2, shade, 1);
      wall.beginPath();
      wall.arc(x, y - 52, 9, 0.2, Math.PI - 0.2, false);
      wall.strokePath();
      wall.lineBetween(x - 12, y - 60, x - 4, y - 60);
      wall.lineBetween(x + 4, y - 60, x + 12, y - 60);
    }
    layer.add(wall);
    const eyes = this.add.graphics();
    layer.add(eyes);
    const light = this.add.image(W / 2, 320, 'phHalo').setScale(4).setTint(0xffb36b).setAlpha(0.25).setBlendMode(Phaser.BlendModes.ADD);
    layer.add(light);
    const txt = i18nText(this, W / 2, 590, () => t('sf.d.luohan'), {
      fontFamily: FONT_SERIF,
      fontSize: '22px',
      color: '#f4e6c8',
      align: 'center',
      lineSpacing: 8,
      wordWrap: { width: W - 260, useAdvancedWrap: true },
    }).setOrigin(0.5);
    layer.add(txt);
    sfx.stone(220);
    await tweenP(this, { targets: layer, alpha: 1, duration: 500 });
    // the third arhat opens his eyes… and winks
    const x = 240 + 2 * 160;
    const y = 300;
    const open = (wink: boolean) => {
      eyes.clear();
      eyes.fillStyle(0xffe6a8, 1);
      eyes.fillCircle(x - 8, y - 60, 3);
      if (wink) eyes.fillRect(x + 4, y - 60, 9, 2);
      else eyes.fillCircle(x + 8, y - 60, 3);
    };
    await wait(this, 500);
    open(false);
    await wait(this, 700);
    open(true);
    sfx.petal(4);
    await wait(this, 300);
    open(false);
    await wait(this, 500);
    eyes.clear();
    await waitForTap(this);
    await tweenP(this, { targets: layer, alpha: 0, duration: 400 });
    layer.destroy(true);
    // don't let the closing tap start brushing
    this.time.delayedCall(100, () => (this.inCave = false));
  }
}

/** The five finds, drawn small, centred on (0, 0). */
function drawFind(g: Phaser.GameObjects.Graphics, kind: Kind): void {
  if (kind === 'base') {
    // a lotus-petal stone base
    g.fillStyle(0x9a9284, 1);
    g.fillRect(-34, 4, 68, 14);
    for (let i = 0; i < 6; i++) {
      g.fillStyle(i % 2 ? 0xb9b0a0 : 0xc9c0b0, 1);
      g.fillEllipse(-28 + i * 11.2, 0, 14, 22);
    }
  } else if (kind === 'brick') {
    g.fillStyle(0x9a5a3a, 1);
    g.fillRect(-30, -12, 60, 24);
    g.fillStyle(0xb06a48, 1);
    g.fillRect(-30, -12, 60, 6);
    g.lineStyle(1, 0x6a3a22, 1);
    g.strokeRect(-30, -12, 60, 24);
    // an inscription stamped in the brick
    g.fillStyle(0x6a3a22, 1);
    for (let i = 0; i < 3; i++) g.fillRect(-14 + i * 10, -4, 6, 10);
  } else if (kind === 'tile') {
    // a round eave-tile end (瓦当) with a lotus pattern
    g.fillStyle(0x5b6a70, 1);
    g.fillCircle(0, 0, 22);
    g.fillStyle(0x7a8a90, 1);
    g.fillCircle(0, 0, 17);
    g.fillStyle(0x5b6a70, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillEllipse(Math.cos(a) * 9, Math.sin(a) * 9, 7, 7);
    }
    g.fillCircle(0, 0, 4);
  } else if (kind === 'bell') {
    // a bronze wind-bell (风铎), green with age
    g.lineStyle(2, 0x3a6a5a, 1);
    g.lineBetween(0, -24, 0, -14);
    g.fillStyle(0x4f8a74, 1);
    g.fillPoints([new Phaser.Math.Vector2(-8, -14), new Phaser.Math.Vector2(8, -14), new Phaser.Math.Vector2(16, 12), new Phaser.Math.Vector2(-16, 12)], true);
    g.fillStyle(0x6aa88e, 1);
    g.fillRect(-16, 10, 32, 4);
    g.fillStyle(0x3a6a5a, 1);
    g.fillCircle(0, 18, 4);
  } else {
    // the gilded pearl from the top of the spire
    g.fillStyle(0xb08a2a, 1);
    g.fillEllipse(0, 12, 34, 10);
    g.fillStyle(0xd9b45a, 1);
    g.fillCircle(0, -2, 16);
    g.fillStyle(0xfff0b0, 1);
    g.fillCircle(-5, -8, 5);
  }
}
