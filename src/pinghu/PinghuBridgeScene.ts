import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { makeButton } from '../ui/Button';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { rng } from '../art/paint';
import { phRun } from './state';

const CELL = 96;
const COLS = 9;
const ROWS = 6;
const OX = (W - COLS * CELL) / 2 + 40;
const OY = 116;
const HUD = 300;

// sides of a cell, as bits
const N = 1;
const E = 2;
const S = 4;
const WEST = 8;
const DIRS: [number, number, number, number][] = [
  [N, 0, -1, S],
  [E, 1, 0, WEST],
  [S, 0, 1, N],
  [WEST, -1, 0, E],
];
const rot = (m: number) => ((m << 1) | (m >> 3)) & 15;

/** Each level: the path from the shore (left of the first cell) to the pavilion, plus decoy cells. */
const LEVELS: { path: [number, number][]; goal: [number, number]; decoys: [number, number][]; title: StrKey }[] = [
  {
    path: [[0, 3], [1, 3], [1, 2], [2, 2], [3, 2], [3, 3], [4, 3]],
    goal: [5, 3],
    decoys: [[2, 3], [2, 1], [4, 2]],
    title: 'ph.b.title1',
  },
  {
    path: [[0, 1], [1, 1], [2, 1], [2, 2], [2, 3], [3, 3], [4, 3], [4, 2], [5, 2], [6, 2]],
    goal: [7, 2],
    decoys: [[1, 2], [3, 2], [5, 3], [6, 1], [3, 4]],
    title: 'ph.b.title2',
  },
  {
    path: [[0, 4], [1, 4], [1, 3], [1, 2], [2, 2], [3, 2], [3, 1], [4, 1], [5, 1], [5, 2], [5, 3], [6, 3], [6, 4], [7, 4]],
    goal: [8, 4],
    decoys: [[2, 3], [0, 3], [2, 1], [4, 2], [6, 2], [4, 3], [7, 3], [6, 5]],
    title: 'ph.b.title3',
  },
];

interface Tile {
  c: number;
  r: number;
  mask: number;
  solved: number;
  view: Phaser.GameObjects.Container;
  turning: boolean;
  onPath: boolean;
}

const cx = (c: number) => OX + c * CELL + CELL / 2;
const cy = (r: number) => OY + r * CELL + CELL / 2;

/** Draw a bridge section (in the cell's own coordinates) for the open sides in `mask`. */
function drawSection(g: Phaser.GameObjects.Graphics, mask: number): void {
  const half = CELL / 2;
  const w = 40;
  g.fillStyle(0x05101e, 0.35);
  // deck pieces from the centre to each open side
  const arms: [number, number, number, number][] = [];
  if (mask & N) arms.push([-w / 2, -half, w, half + w / 2]);
  if (mask & S) arms.push([-w / 2, -w / 2, w, half + w / 2]);
  if (mask & E) arms.push([-w / 2, -w / 2, half + w / 2, w]);
  if (mask & WEST) arms.push([-half, -w / 2, half + w / 2, w]);
  for (const [x, y, ww, hh] of arms) g.fillRect(x + 5, y + 7, ww, hh);
  for (const [x, y, ww, hh] of arms) {
    g.fillStyle(0xb9bcc4, 1);
    g.fillRect(x, y, ww, hh);
  }
  // slab joints
  g.lineStyle(1, 0x8c909a, 0.8);
  for (let k = -half; k <= half; k += 16) {
    if (mask & (N | S)) g.lineBetween(-w / 2, k, w / 2, k);
    if (mask & (E | WEST)) g.lineBetween(k, -w / 2, k, w / 2);
  }
  // white stone railings along the edges, with posts
  g.lineStyle(3, 0xe8eaf0, 1);
  const edge = (x1: number, y1: number, x2: number, y2: number) => {
    g.lineBetween(x1, y1, x2, y2);
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 16));
    for (let i = 0; i <= n; i++) {
      g.fillStyle(0xf6f7fa, 1);
      g.fillCircle(x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n, 2.6);
    }
  };
  const a = w / 2;
  // walk round the centre square: each side is either an open arm (rail along both sides of it) or closed (rail across)
  if (mask & N) {
    edge(-a, -a, -a, -half);
    edge(a, -a, a, -half);
  } else edge(-a, -a, a, -a);
  if (mask & S) {
    edge(-a, a, -a, half);
    edge(a, a, a, half);
  } else edge(-a, a, a, a);
  if (mask & E) {
    edge(a, -a, half, -a);
    edge(a, a, half, a);
  } else edge(a, -a, a, a);
  if (mask & WEST) {
    edge(-a, -a, -half, -a);
    edge(-a, a, -half, a);
  } else edge(-a, -a, -a, a);
}

/** 曲桥 at night: turn the bridge sections to reach the pavilion where the moon piece fell. */
export class PinghuBridgeScene extends Phaser.Scene {
  private tiles: Tile[] = [];
  private level = 0;
  private solved = false;
  private dark!: Phaser.GameObjects.RenderTexture;
  private light!: Phaser.GameObjects.Image;
  private kids!: Phaser.GameObjects.Container;
  private ghost!: Phaser.GameObjects.Graphics;
  private stepsText!: Phaser.GameObjects.Text;
  private lastHint = -99999;

  constructor() {
    super('PinghuBridge');
  }

  create(): void {
    music.play('phNight');
    this.level = Math.min(2, phRun.level);
    this.tiles = [];
    this.solved = false;
    const L = LEVELS[this.level];
    const r = rng(17 + this.level);

    // the water at night
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x0d1838, 0x0d1838, 0x070d22, 0x070d22, 1);
    g.fillRect(0, 0, W, H);
    this.add.tileSprite(0, 0, W, H, 'ripples').setOrigin(0).setDepth(1).setAlpha(0.12);
    for (let i = 0; i < 14; i++) {
      const x = OX + r() * COLS * CELL;
      const y = OY + r() * ROWS * CELL;
      this.add.image(x, y, 'hgPad').setScale(0.5 + r() * 0.4).setAngle(r() * 360).setDepth(2).setTint(0x6f8f9a).setAlpha(0.6);
    }
    // the stone terrace on the left, where we start
    const shore = this.add.graphics().setDepth(3);
    shore.fillStyle(0x3a3f50, 1);
    shore.fillRect(0, 0, OX, H);
    shore.fillStyle(0x8b8f9a, 1);
    shore.fillRect(OX - 14, 0, 14, H);
    for (let y = 0; y < H; y += 26) shore.fillStyle(0xc6cad2, 1).fillRect(OX - 16, y, 18, 8);

    // the pavilion where the moon piece lies, glowing in the water beside it
    const [gc, gr] = L.goal;
    const shard = this.add.image(cx(gc) + 10, cy(gr) + CELL * 0.75, `phShard${this.level}`).setScale(0.28).setDepth(4).setAlpha(0.9);
    this.tweens.add({ targets: shard, alpha: 0.55, scale: 0.3, yoyo: true, repeat: -1, duration: 900 });
    this.add.image(shard.x, shard.y, 'phHalo').setScale(0.7).setDepth(4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7);
    this.add.image(cx(gc), cy(gr), 'phPavTop').setDepth(30).setScale(0.78);
    const rabbit = this.add.image(cx(gc) - 40, cy(gr) - 50, 'phRabbit').setDepth(31).setScale(0.6);
    this.tweens.add({ targets: rabbit, y: rabbit.y - 10, yoyo: true, repeat: -1, duration: 400, ease: 'Sine.easeOut' });

    // bridge sections: the path (scrambled) and a few decoys
    const path = L.path;
    path.forEach(([c, row], i) => {
      const prev = i === 0 ? [c - 1, row] : path[i - 1];
      const next = i === path.length - 1 ? L.goal : path[i + 1];
      let mask = 0;
      for (const [bit, dx, dy] of DIRS) {
        if ((prev[0] === c + dx && prev[1] === row + dy) || (next[0] === c + dx && next[1] === row + dy)) mask |= bit;
      }
      this.addTile(c, row, mask, true, 1 + Math.floor(r() * 3));
    });
    for (const [c, row] of L.decoys) {
      const masks = [E | WEST, N | E, E | S];
      this.addTile(c, row, masks[Math.floor(r() * masks.length)], false, Math.floor(r() * 4));
    }

    // us, with our lanterns, on the terrace
    this.kids = this.add.container(OX - 50, cy(path[0][1])).setDepth(40);
    const kg = this.add.graphics();
    for (const [i, col] of [[0, 0xf1948a], [1, 0x5dade2], [2, 0xf5f0e1]] as const) {
      kg.fillStyle(col, 1);
      kg.fillEllipse(-12 + i * 12, -14 + i * 14, 22, 16);
      kg.fillStyle(0x2b2522, 1);
      kg.fillCircle(-12 + i * 12, -16 + i * 14, 7);
    }
    kg.fillStyle(0xffd27a, 1);
    kg.fillCircle(14, -18, 5);
    kg.fillCircle(20, 2, 5);
    kg.fillCircle(10, 20, 5);
    this.kids.add(kg);

    // the dark, with lantern light around us (and the moon piece)
    this.dark = this.add.renderTexture(0, 0, W, H).setOrigin(0).setDepth(60);
    this.light = new Phaser.GameObjects.Image(this, 0, 0, 'dqBrush');
    this.ghost = this.add.graphics().setDepth(55);

    this.buildHud(L.title);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onTap(p));
    this.cameras.main.fadeIn(800, 6, 10, 24);
    void this.intro();
  }

  private addTile(c: number, row: number, solved: number, onPath: boolean, turns: number): void {
    let mask = solved;
    for (let i = 0; i < turns; i++) mask = rot(mask);
    const view = this.add.container(cx(c), cy(row)).setDepth(10);
    const g = this.add.graphics();
    drawSection(g, solved);
    view.add(g);
    // the graphic is drawn in the solved orientation, then turned to match `mask`
    let k = 0;
    let m = solved;
    while (m !== mask && k < 4) {
      m = rot(m);
      k++;
    }
    view.setAngle(k * 90);
    this.tiles.push({ c, r: row, mask, solved, view, turning: false, onPath });
  }

  private buildHud(title: StrKey): void {
    const panel = this.add.graphics().setDepth(HUD);
    panel.fillStyle(0x0b1430, 0.75);
    panel.fillRoundedRect(14, 10, 560, 84, 16);
    i18nText(this, 30, 34, () => t(title), { fontFamily: FONT_SERIF, fontSize: '24px', color: '#fff3c4' }).setOrigin(0, 0.5).setDepth(HUD + 1);
    i18nText(this, 30, 70, () => t('ph.b.hint'), { fontSize: '15px', color: '#dfe6f2', wordWrap: { width: 530, useAdvancedWrap: true } }).setOrigin(0, 0.5).setDepth(HUD + 1);
    this.stepsText = this.add.text(W - 40, H - 30, '', baseStyle({ fontSize: '18px', color: '#dfe6f2' })).setOrigin(1, 0.5).setDepth(HUD);
    makeButton(this, W - 110, H - 86, () => t('ph.b.btnLamp'), { width: 160, height: 58, fontSize: 22, depth: HUD + 2, fill: 0xffe6a8, onClick: () => this.hint() });
    this.refresh();
  }

  private refresh(): void {
    this.stepsText.setText(t('ph.b.steps', { n: phRun.turns }));
  }

  private async intro(): Promise<void> {
    if (this.level > 0) return;
    await wait(this, 600);
  }

  private onTap(p: Phaser.Input.Pointer): void {
    if (this.solved || overGlobalUI(p)) return;
    if (p.x > W - 200 && p.y > H - 130) return;
    const c = Math.floor((p.x - OX) / CELL);
    const row = Math.floor((p.y - OY) / CELL);
    const tile = this.tiles.find((q) => q.c === c && q.r === row);
    if (!tile || tile.turning) return;
    tile.turning = true;
    tile.mask = rot(tile.mask);
    phRun.turns += 1;
    this.refresh();
    sfx.dig();
    this.tweens.add({
      targets: tile.view,
      angle: tile.view.angle + 90,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        tile.turning = false;
        if (this.connected()) void this.win();
      },
    });
  }

  /** Is there a path of matching openings from the terrace to the pavilion? */
  private connected(): boolean {
    const L = LEVELS[this.level];
    const at = (c: number, row: number) => this.tiles.find((q) => q.c === c && q.r === row);
    const start = at(L.path[0][0], L.path[0][1]);
    if (!start || !(start.mask & WEST)) return false;
    const seen = new Set<Tile>([start]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const [bit, dx, dy, opp] of DIRS) {
        if (!(cur.mask & bit)) continue;
        if (cur.c + dx === L.goal[0] && cur.r + dy === L.goal[1]) return true;
        const nb = at(cur.c + dx, cur.r + dy);
        if (nb && !seen.has(nb) && nb.mask & opp) {
          seen.add(nb);
          queue.push(nb);
        }
      }
    }
    return false;
  }

  /** GOGO's revolving lantern throws the bridge's true shape onto the water for a moment. */
  private hint(): void {
    if (this.solved || this.time.now - this.lastHint < 4000) return;
    this.lastHint = this.time.now;
    phRun.hints += 1;
    sfx.shimmer();
    const toast = this.add.text(W / 2, 110, t('ph.b.lamp'), baseStyle({ fontSize: '22px', color: '#fff3c4', stroke: '#0b1430', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD + 5);
    this.tweens.add({ targets: toast, alpha: 0, delay: 1600, duration: 500, onComplete: () => toast.destroy() });
    const g = this.ghost;
    g.clear();
    for (const tile of this.tiles.filter((q) => q.onPath)) {
      g.lineStyle(4, 0xffd27a, 0.9);
      const x = cx(tile.c);
      const y = cy(tile.r);
      for (const [bit, dx, dy] of DIRS) if (tile.solved & bit) g.lineBetween(x, y, x + dx * CELL * 0.5, y + dy * CELL * 0.5);
      g.fillStyle(0xffd27a, 0.9);
      g.fillCircle(x, y, 5);
    }
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 0.85, yoyo: true, hold: 1200, duration: 400 });
  }

  private async win(): Promise<void> {
    this.solved = true;
    sfx.chime();
    const L = LEVELS[this.level];
    const done = this.add.text(W / 2, 110, t('ph.b.done'), baseStyle({ fontSize: '30px', color: '#fff3c4', fontStyle: 'bold', stroke: '#0b1430', strokeThickness: 6 })).setOrigin(0.5).setDepth(HUD + 5);
    this.tweens.add({ targets: done, alpha: 0, delay: 1400, duration: 500 });
    // walk the bridge, section by section
    for (const [c, row] of [...L.path, L.goal]) {
      await new Promise<void>((res) => this.tweens.add({ targets: this.kids, x: cx(c), y: cy(row), duration: 260, onComplete: () => res() }));
    }
    if (this.level === 0) {
      const dlg = new Dialogue(this);
      await dlg.say('rabbit', 'ph.b.r1');
      dlg.hide();
    }
    this.cameras.main.fadeOut(700, 6, 10, 24);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('PinghuCalm'));
  }

  update(time: number): void {
    // darkness, with a warm circle of lantern light around us and a glow at the pavilion
    const L = LEVELS[this.level];
    this.dark.clear();
    this.dark.fill(0x02050f, 0.55);
    const flicker = 1 + Math.sin(time * 0.01) * 0.03;
    this.light.setScale(5.2 * flicker);
    this.dark.erase(this.light, this.kids.x, this.kids.y);
    this.light.setScale(3);
    this.dark.erase(this.light, cx(L.goal[0]), cy(L.goal[1]) + 30);
    this.dark.render();
  }
}
