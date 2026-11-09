import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { lerpColor, rng } from '../art/paint';
import { KoiBody, inkFishTexture, koiSideTexture, pondMix, type VarietyId } from './koi';
import { hgRun } from './state';

const WORLD_W = 4400;
const SURFACE = 104;
const FLOOR = 640;
const PIERS = [820, 1660, 2500];
const STREAM_X = 3700;
const NEED = 12;
const HUD = 200;
const DROPS: { x: number; y: number; label: StrKey }[] = [
  { x: 1240, y: SURFACE + 46, label: 'hg.u.dLotus' },
  { x: PIERS[2] + 2, y: FLOOR - 40, label: 'hg.u.dPier' },
  { x: 4230, y: 360, label: 'hg.u.dStream' },
];

type Kind = 'me' | 'koko' | 'gogo' | 'wild' | 'follower' | 'yu';

interface Swimmer {
  kind: Kind;
  body: KoiBody;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  turn: number;
  wave: number;
  size: number;
  slot: number;
  wander: number;
  bloom: number;
  petal: Phaser.GameObjects.Image | null;
}

interface Food {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vy: number;
  ph: number;
  gone: boolean;
}

type Stage = 'intro' | 'rain' | 'gather' | 'chase' | 'talk' | 'drops' | 'done';

/** Under the water of 红鱼池: we are koi now. */
export class HuagangUnderScene extends Phaser.Scene {
  private stage: Stage = 'intro';
  private me!: Swimmer;
  private fish: Swimmer[] = [];
  private food: Food[] = [];
  private petals: { img: Phaser.GameObjects.Image; x: number; y: number; vy: number; ph: number; stuck: Swimmer | null }[] = [];
  private ink: Swimmer | null = null;
  private drops: { img: Phaser.GameObjects.Image; got: boolean; x: number; y: number; label: StrKey }[] = [];
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;
  private dashUntil = 0;
  private dashReady = 0;
  private lastTap = 0;
  private surface!: Phaser.GameObjects.Graphics;
  private weeds!: Phaser.GameObjects.Graphics;
  private weedList: { x: number; h: number; ph: number; c: number }[] = [];
  private rays: Phaser.GameObjects.Image[] = [];
  private motes: Phaser.GameObjects.Arc[] = [];
  private hud!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private compass!: Phaser.GameObjects.Graphics;
  private bubblesOn: { box: Phaser.GameObjects.Container; who: Swimmer; until: number }[] = [];
  private nameTags: { txt: Phaser.GameObjects.Text; who: Swimmer }[] = [];
  private chaseStart = 0;
  private blooms = 0;
  private sawCurrent = false;
  private gulpDeg = 3;
  private lastGulp = 0;
  private hand!: Phaser.GameObjects.Image;

  constructor() {
    super('HuagangUnder');
  }

  create(): void {
    music.play('huagangUnder');
    this.stage = 'intro';
    this.fish = [];
    this.food = [];
    this.petals = [];
    this.ink = null;
    this.drops = [];
    this.bubblesOn = [];
    this.nameTags = [];
    this.rays = [];
    this.motes = [];
    this.weedList = [];
    this.blooms = 0;
    this.sawCurrent = false;
    this.dashUntil = 0;
    this.dashReady = 0;

    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.paintWorld();

    // us: three koi, and the wild fish of the pond
    this.me = this.spawn('me', 'kohaku', 11, 300, 300, 0.72);
    const koko = this.spawn('koko', 'ogon', 12, 220, 250, 0.64);
    const gogo = this.spawn('gogo', 'showa', 13, 220, 360, 0.66);
    koko.slot = 0;
    gogo.slot = 1;
    for (const [s, c] of [[koko, CSS.koko], [gogo, CSS.gogo], [this.me, CSS.me]] as const) {
      const txt = this.add.text(s.x, s.y - 40, s === this.me ? t('name.me') : s === koko ? 'KOKO' : 'GOGO', baseStyle({ fontSize: '16px', color: '#ffffff', backgroundColor: c, padding: { x: 6, y: 2 } })).setOrigin(0.5).setDepth(90);
      this.nameTags.push({ txt, who: s });
    }
    const r = rng(31);
    pondMix(34, 77, 1).forEach((v, i) => {
      const x = 500 + r() * (STREAM_X - 700);
      this.spawn('wild', v, 400 + i, x, SURFACE + 80 + r() * (FLOOR - SURFACE - 160), 0.42 + r() * 0.3);
    });

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({ up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', w: 'W', a: 'A', s: 'S', d: 'D' }) as never;
    kb.on('keydown-SPACE', () => this.dash());
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (overGlobalUI(p)) return;
      if (this.time.now - this.lastTap < 300) this.dash();
      this.lastTap = this.time.now;
    });

    this.cameras.main.startFollow(this.me.body.rope, true, 0.08, 0.08, -80, 0);
    this.buildHud();
    this.cameras.main.fadeIn(1000, 40, 120, 120);
    // we've just dived in: a burst of bubbles
    for (let i = 0; i < 40; i++) this.bubble(200 + Math.random() * 200, SURFACE + 40 + Math.random() * 200, true);
    sfx.bubbles();
    void this.script();
  }

  // ---- world ------------------------------------------------------------------

  private paintWorld(): void {
    const r = rng(19);
    // water: lighter near the surface
    const bg = this.add.graphics().setScrollFactor(0).setDepth(-100);
    bg.fillGradientStyle(0x7cc2bd, 0x7cc2bd, 0x15434d, 0x15434d, 1);
    bg.fillRect(0, SURFACE, W, H - SURFACE);
    // above the surface: bright, wobbly sky and faces looking down
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-99);
    sky.fillGradientStyle(0xe6f6f2, 0xe6f6f2, 0xbfe6e0, 0xbfe6e0, 1);
    sky.fillRect(0, 0, W, SURFACE);
    const people = this.add.graphics().setScrollFactor(0.5, 0).setDepth(-98);
    for (let x = 60; x < W * 0.5 + WORLD_W * 0.5; x += 110 + r() * 160) {
      people.fillStyle(0x5d6f74, 0.35);
      people.fillCircle(x, 30 + r() * 20, 22 + r() * 8);
      people.fillEllipse(x, 92, 80, 60);
      if (r() < 0.4) {
        people.fillStyle(0xd9a441, 0.35);
        people.fillEllipse(x, 22, 60, 16);
      }
    }
    // far background: distant rocks and weed (parallax)
    const far = this.add.graphics().setScrollFactor(0.4, 1).setDepth(-90);
    for (let x = 0; x < WORLD_W * 0.4 + W; x += 60 + r() * 80) {
      far.fillStyle(0x1f5a5f, 0.5);
      far.fillEllipse(x, FLOOR + 10, 120 + r() * 200, 80 + r() * 120);
      far.lineStyle(4, 0x2a6a63, 0.5);
      for (let k = 0; k < 3; k++) far.lineBetween(x + k * 12, FLOOR, x + k * 12 + 10, FLOOR - 120 - r() * 160);
    }

    // light from above
    for (let i = 0; i < 9; i++) {
      const ray = this.add
        .image(i * 180 + r() * 60, SURFACE - 10, 'hgRay')
        .setOrigin(0.5, 0)
        .setScrollFactor(0.7, 1)
        .setDepth(-60)
        .setAlpha(0.18 + r() * 0.12)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(0.8 + r() * 0.8, 1);
      ray.setData('ph', r() * 6);
      this.rays.push(ray);
    }

    // the zig-zag bridge overhead: its deck darkens the surface; stone piers stand on the bottom
    const piers = this.add.graphics().setDepth(-40);
    for (const px of PIERS) {
      piers.fillStyle(0x0f3238, 0.35);
      piers.fillRect(px - 300, 0, 600, SURFACE + 6);
      piers.fillStyle(0x6d7d78, 1);
      piers.fillRect(px - 34, SURFACE - 4, 68, FLOOR - SURFACE + 20);
      piers.fillStyle(0x84958f, 1);
      piers.fillRect(px - 34, SURFACE - 4, 20, FLOOR - SURFACE + 20);
      for (let y = SURFACE + 20; y < FLOOR; y += 46) {
        piers.lineStyle(2, 0x4f5e5a, 0.8);
        piers.lineBetween(px - 34, y, px + 34, y);
      }
      piers.fillStyle(0x3d6b4a, 0.8);
      for (let k = 0; k < 8; k++) piers.fillEllipse(px - 30 + r() * 60, SURFACE + 40 + r() * (FLOOR - SURFACE - 60), 12, 26);
    }
    // a dark crevice in the last pier where a drop hides
    piers.fillStyle(0x0c1c20, 1);
    piers.fillEllipse(PIERS[2], FLOOR - 40, 54, 44);

    // lotus stems and pads overhead
    const lotus = this.add.graphics().setDepth(-30);
    for (let x = 1000; x < 1500; x += 70 + r() * 40) {
      lotus.lineStyle(4, 0x4f7a3a, 0.9);
      lotus.lineBetween(x, FLOOR, x + (r() - 0.5) * 60, SURFACE + 8);
      lotus.fillStyle(0x24503a, 0.95);
      lotus.fillEllipse(x + (r() - 0.5) * 60, SURFACE + 6, 130, 18);
      lotus.fillStyle(0x9fd88a, 0.5);
      lotus.fillEllipse(x + (r() - 0.5) * 60, SURFACE + 2, 136, 6);
    }

    // the pond floor
    const floor = this.add.graphics().setDepth(0);
    floor.fillStyle(0x4a5a48, 1);
    floor.fillRect(0, FLOOR, WORLD_W, H - FLOOR);
    for (let x = 0; x < WORLD_W; x += 8) {
      floor.fillStyle([0x6b7a62, 0x55654f, 0x7d8a6e][Math.floor(r() * 3)], 1);
      floor.fillEllipse(x + r() * 8, FLOOR + 4 + r() * 70, 10 + r() * 16, 6 + r() * 8);
    }
    for (let x = 100; x < WORLD_W; x += 200 + r() * 300) {
      floor.fillStyle(0x7d827a, 1);
      floor.fillEllipse(x, FLOOR - 8, 80 + r() * 90, 50 + r() * 30);
      floor.fillStyle(0x969b92, 1);
      floor.fillEllipse(x - 10, FLOOR - 18, 40 + r() * 40, 20);
    }
    // the stream mouth (溪口) on the right: rocks framing a bright opening
    const mouth = this.add.graphics().setDepth(1);
    mouth.fillStyle(0x8fd0c8, 0.4);
    mouth.fillEllipse(WORLD_W - 20, 380, 260, 380);
    mouth.fillStyle(0x6a706a, 1);
    mouth.fillEllipse(WORLD_W - 60, SURFACE + 60, 260, 160);
    mouth.fillEllipse(WORLD_W - 40, FLOOR - 20, 320, 200);
    mouth.fillStyle(0x80867f, 1);
    mouth.fillEllipse(WORLD_W - 90, SURFACE + 50, 160, 90);

    for (let x = 30; x < WORLD_W; x += 40 + r() * 80) this.weedList.push({ x, h: 80 + r() * 200, ph: r() * 6, c: r() < 0.5 ? 0x3f7a4a : 0x2f6a44 });
    this.weeds = this.add.graphics().setDepth(5);
    this.surface = this.add.graphics().setScrollFactor(0).setDepth(-50);

    for (let i = 0; i < 50; i++) {
      const m = this.add.circle(r() * W, SURFACE + r() * (FLOOR - SURFACE), 1 + r() * 1.5, 0xe8fbff, 0.35).setScrollFactor(0).setDepth(70);
      m.setData('ph', r() * 6);
      this.motes.push(m);
    }

    // the giant hand above the water (hidden until the food rain)
    this.hand = this.add.image(0, -40, 'hgHand').setScrollFactor(0).setDepth(-97).setAlpha(0).setScale(1.3);
  }

  private spawn(kind: Kind, v: VarietyId, seed: number, x: number, y: number, size: number): Swimmer {
    const body = new KoiBody(this, koiSideTexture(this, v, seed), { side: true });
    const s: Swimmer = { kind, body, x, y, vx: 0, vy: 0, heading: Math.random() < 0.5 ? 0 : Math.PI, turn: 0, wave: Math.random() * 6, size, slot: 0, wander: Math.random() * 6, bloom: 0, petal: null };
    body.setDepth(kind === 'me' ? 30 : kind === 'wild' ? 10 + size : 20);
    this.fish.push(s);
    return s;
  }

  // ---- HUD & speech ----------------------------------------------------------------

  private buildHud(): void {
    const panel = this.add.graphics().setScrollFactor(0).setDepth(HUD);
    panel.fillStyle(0x0f2f34, 0.55);
    panel.fillRoundedRect(16, 12, 420, 50, 14);
    this.hud = this.add.text(36, 37, '', baseStyle({ fontSize: '22px', color: '#ffffff', fontStyle: 'bold' })).setOrigin(0, 0.5).setScrollFactor(0).setDepth(HUD + 1);
    const touch = this.sys.game.device.input.touch;
    this.hint = i18nText(this, W / 2, H - 30, () => t(touch ? 'hg.u.hintTouch' : 'hg.u.hintKeys'), { fontSize: '18px', color: '#e8fbff', stroke: '#0f2f34', strokeThickness: 4 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(HUD);
    this.compass = this.add.graphics().setScrollFactor(0).setDepth(HUD);
  }

  private setHint(key: StrKey): void {
    const touch = this.sys.game.device.input.touch;
    this.hint.setText(t(key === 'hg.u.hintKeys' && touch ? 'hg.u.hintTouch' : key));
  }

  private refreshHud(): void {
    const followers = this.fish.filter((f) => f.kind === 'follower').length;
    let s = '';
    if (this.stage === 'rain') s = `${t('hg.u.rain')}  ${t('hg.u.eaten', { n: hgRun.eaten })}`;
    else if (this.stage === 'gather') s = t('hg.u.school', { n: followers, need: NEED });
    else if (this.stage === 'chase') s = `${t('hg.u.school', { n: followers, need: NEED })}`;
    else if (this.stage === 'drops' || this.stage === 'done') s = t('hg.u.drops', { n: this.drops.filter((d) => d.got).length });
    this.hud.setText(s);
  }

  /** A speech bubble that follows a fish for a while (doesn't stop the game). */
  private say(who: Swimmer, key: StrKey, ms = 3200): void {
    const color = who.kind === 'koko' ? CSS.koko : who.kind === 'gogo' ? CSS.gogo : who.kind === 'yu' ? '#1d1b20' : CSS.me;
    const txt = i18nText(this, 0, 0, () => t(key), { fontSize: '20px', color: CSS.ink, wordWrap: { width: 360, useAdvancedWrap: true } }).setOrigin(0.5);
    const bg = this.add.graphics();
    const w = txt.width + 30;
    const h = txt.height + 20;
    bg.fillStyle(0xffffff, 0.95);
    bg.lineStyle(3, Phaser.Display.Color.HexStringToColor(color).color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.fillTriangle(-10, h / 2 - 1, 10, h / 2 - 1, 0, h / 2 + 16);
    const box = this.add.container(who.x, who.y - 70, [bg, txt]).setDepth(150);
    box.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    this.bubblesOn = this.bubblesOn.filter((b) => {
      if (b.who === who) {
        b.box.destroy();
        return false;
      }
      return true;
    });
    this.bubblesOn.push({ box, who, until: this.time.now + ms });
  }

  private toast(text: string, color = '#ffffff', size = 34): void {
    const txt = this.add
      .text(W / 2, H / 2 - 120, text, baseStyle({ fontFamily: FONT_SERIF, fontSize: `${size}px`, color, stroke: '#0f2f34', strokeThickness: 6 }))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(HUD + 20)
      .setAlpha(0);
    this.tweens.add({ targets: txt, alpha: 1, y: H / 2 - 140, duration: 400 });
    this.tweens.add({ targets: txt, alpha: 0, delay: 2000, duration: 600, onComplete: () => txt.destroy() });
  }

  private bubble(x: number, y: number, big = false): void {
    const b = this.add.image(x, y, 'hgBubble').setDepth(60).setScale(big ? 0.6 + Math.random() * 0.8 : 0.4 + Math.random() * 0.4).setAlpha(0.85);
    this.tweens.add({ targets: b, y: SURFACE + 4, x: x + (Math.random() - 0.5) * 40, duration: ((y - SURFACE) / 120) * 1000 + 300, ease: 'Sine.easeIn', onComplete: () => b.destroy() });
  }

  // ---- control ------------------------------------------------------------------------

  private dash(): void {
    if (this.stage === 'intro' || this.stage === 'talk' || this.time.now < this.dashReady) return;
    this.dashUntil = this.time.now + 450;
    this.dashReady = this.time.now + 1200;
    sfx.bubbles();
    for (let i = 0; i < 8; i++) this.bubble(this.me.x - Math.cos(this.me.heading) * 40, this.me.y + (Math.random() - 0.5) * 20);
  }

  private controlMe(sec: number): void {
    const m = this.me;
    let dx = 0;
    let dy = 0;
    const k = this.keys;
    const free = this.stage !== 'intro' && this.stage !== 'talk' && this.stage !== 'done';
    if (free) {
      if (k.left.isDown || k.a.isDown) dx -= 1;
      if (k.right.isDown || k.d.isDown) dx += 1;
      if (k.up.isDown || k.w.isDown) dy -= 1;
      if (k.down.isDown || k.s.isDown) dy += 1;
      const p = this.input.activePointer;
      if (p.isDown && !overGlobalUI(p) && dx === 0 && dy === 0) {
        const wp = this.cameras.main.getWorldPoint(p.x, p.y);
        const ddx = wp.x - m.x;
        const ddy = wp.y - m.y;
        const d = Math.hypot(ddx, ddy);
        if (d > 16) {
          const sp = Math.min(1, d / 140);
          dx = (ddx / d) * sp;
          dy = (ddy / d) * sp;
        }
      }
    }
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    const max = this.time.now < this.dashUntil ? 560 : 250;
    m.vx += (dx * max - m.vx) * Math.min(1, sec * 5);
    m.vy += (dy * max - m.vy) * Math.min(1, sec * 5);
    // the stream pushes back near its mouth
    if (m.x > STREAM_X) {
      const c = Math.min(1, (m.x - STREAM_X) / 400);
      m.vx -= 300 * c * sec * 4;
      if (!this.sawCurrent && free) {
        this.sawCurrent = true;
        this.say(this.fish.find((f) => f.kind === 'koko')!, 'hg.u.current', 3000);
      }
    }
  }

  // ---- simulation ---------------------------------------------------------------------

  private steer(f: Swimmer, tx: number, ty: number, max: number, sec: number, accel = 3): void {
    const dx = tx - f.x;
    const dy = ty - f.y;
    const d = Math.hypot(dx, dy) || 1;
    const sp = Math.min(max, d * 2.2);
    f.vx += ((dx / d) * sp - f.vx) * Math.min(1, sec * accel);
    f.vy += ((dy / d) * sp - f.vy) * Math.min(1, sec * accel);
  }

  private simulate(sec: number, time: number): void {
    const me = this.me;
    const followers = this.fish.filter((f) => f.kind === 'follower');
    for (const f of this.fish) {
      if (f === me) continue;
      if (f.kind === 'wild') {
        // seek food during the rain; otherwise wander
        const food = this.nearestFood(f, 420);
        if (food) this.steer(f, food.x, food.y, 230, sec, 3);
        else {
          f.wander += sec * 0.4 * (Math.sin(time * 0.0003 + f.slot) + 0.3);
          const a = Math.sin(f.wander) * Math.PI;
          f.vx += (Math.cos(a) * 55 - f.vx) * sec;
          f.vy += (Math.sin(a) * 18 - f.vy) * sec;
        }
        // join my school when I swim close (only once the gathering starts)
        if ((this.stage === 'gather' || this.stage === 'chase' || this.stage === 'drops') && Math.hypot(f.x - me.x, f.y - me.y) < 120) {
          f.kind = 'follower';
          f.slot = followers.length + 2;
          f.body.setDepth(20);
          followers.push(f);
          hgRun.school = Math.max(hgRun.school, followers.length);
          sfx.gulp(music.noteFreq(Math.min(9, followers.length % 10)));
          this.refreshHud();
        }
      } else if (f.kind === 'yu') {
        if (this.stage === 'chase') this.inkFlee(f, followers, sec, time);
        else this.steer(f, me.x - Math.cos(me.heading) * 70, me.y - 50, 330, sec, 2.5);
      } else {
        // friends and followers: swim in formation around me, or close in on 魚
        const food = this.stage === 'rain' ? this.nearestFood(f, 260) : null;
        const ink = this.ink;
        const n = f.slot;
        if (food) {
          this.steer(f, food.x, food.y, 300, sec, 3);
        } else if (this.stage === 'chase' && ink && Math.hypot(ink.x - me.x, ink.y - me.y) < 420 && f.kind === 'follower') {
          const a = (n / Math.max(1, followers.length)) * Math.PI * 2 + time * 0.0008;
          this.steer(f, ink.x + Math.cos(a) * 95, ink.y + Math.sin(a) * 75, 340, sec, 3);
        } else {
          const back = 60 + (n % 4) * 34;
          const side = ((n % 2 ? 1 : -1) * (30 + Math.floor(n / 2) * 18)) % 150;
          const hx = Math.cos(me.heading);
          const hy = Math.sin(me.heading);
          this.steer(f, me.x - hx * back - hy * side, me.y - hy * back + hx * side, 340, sec, 2.6);
        }
      }
    }
    // separation, so the school doesn't collapse into one fish
    for (const a of this.fish) {
      if (a.kind === 'wild' && this.stage !== 'rain') continue;
      for (const b of this.fish) {
        if (a === b) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const rr = 46 * (a.size + b.size);
        const d2 = dx * dx + dy * dy;
        if (d2 > rr * rr || d2 < 0.01) continue;
        const d = Math.sqrt(d2);
        const push = (rr - d) / rr;
        a.vx += (dx / d) * push * 300 * sec;
        a.vy += (dy / d) * push * 300 * sec;
      }
    }
    // move, keep in the water, eat, animate
    for (const f of this.fish) {
      f.x += f.vx * sec;
      f.y += f.vy * sec;
      const top = SURFACE + 26;
      const bottom = FLOOR - 24;
      if (f.y < top) {
        f.y = top;
        f.vy = Math.abs(f.vy) * 0.3;
      }
      if (f.y > bottom) {
        f.y = bottom;
        f.vy = -Math.abs(f.vy) * 0.3;
      }
      const maxX = f === me ? WORLD_W - 70 : f.kind === 'wild' ? STREAM_X - 100 : WORLD_W - 70;
      if (f.x < 60) {
        f.x = 60;
        f.vx = Math.abs(f.vx);
      }
      if (f.x > maxX) {
        f.x = maxX;
        f.vx = -Math.abs(f.vx);
      }
      const sp = Math.hypot(f.vx, f.vy);
      if (sp > 18) {
        const want = Math.atan2(f.vy, f.vx);
        const diff = Phaser.Math.Angle.Wrap(want - f.heading);
        const step = Phaser.Math.Clamp(diff, -6 * sec, 6 * sec);
        f.heading = Phaser.Math.Angle.Wrap(f.heading + step);
        f.turn += (step / Math.max(sec, 0.001) - f.turn) * 0.15;
      } else {
        // level out gently when idle
        const level = Math.cos(f.heading) >= 0 ? 0 : Math.PI;
        f.heading = Phaser.Math.Angle.RotateTo(f.heading, level, sec * 1.5);
        f.turn *= 0.9;
      }
      f.wave += sec * (3 + sp * 0.04);
      const amp = 0.1 + Math.min(0.3, sp * 0.001);
      // the side view stays readable: tilt only part of the swimming angle
      const level = Math.cos(f.heading) >= 0 ? 0 : Math.PI;
      const shown = level + Phaser.Math.Angle.Wrap(f.heading - level) * 0.7;
      f.body.pose(f.x, f.y, shown, Phaser.Math.Clamp(-f.turn * 0.2, -0.6, 0.6), f.wave, amp, f.size);
      // bloom: petals stuck on the fish tint it pink (花著鱼身)
      if (f.bloom > 0) {
        f.bloom = Math.max(0, f.bloom - sec * 0.05);
        f.body.tint(lerpColor(0xffffff, 0xffa8c8, f.bloom * 0.7));
        if (f.petal) {
          f.petal.setPosition(f.x - Math.cos(shown) * 20 * f.size, f.y - 14 * f.size);
          f.petal.setAlpha(Math.min(1, f.bloom * 2));
          if (f.bloom <= 0) {
            f.petal.destroy();
            f.petal = null;
            f.body.tint(0xffffff);
          }
        }
      }
      // eating
      for (const food of this.food) {
        if (food.gone) continue;
        const hx = f.x + Math.cos(f.heading) * 40 * f.size;
        const hy = f.y + Math.sin(f.heading) * 40 * f.size;
        if (Math.abs(food.x - hx) < 26 * f.size + 6 && Math.abs(food.y - hy) < 22 * f.size + 6) {
          food.gone = true;
          food.img.destroy();
          if (f === me) {
            hgRun.eaten += 1;
            this.refreshHud();
            this.gulp(true);
          } else this.gulp(false);
          for (let i = 0; i < 2; i++) this.bubble(hx, hy);
        }
      }
    }
  }

  private gulp(mine: boolean): void {
    const now = this.time.now;
    if (!mine && now - this.lastGulp < 90) return;
    this.lastGulp = now;
    this.gulpDeg = Phaser.Math.Clamp(this.gulpDeg + Phaser.Math.Between(-2, 2), 0, 8);
    sfx.gulp(music.noteFreq(this.gulpDeg) * (mine ? 1 : 0.5));
  }

  private nearestFood(f: Swimmer, range: number): Food | null {
    let best: Food | null = null;
    let bd = range;
    for (const food of this.food) {
      if (food.gone) continue;
      const d = Math.hypot(food.x - f.x, food.y - f.y);
      if (d < bd) {
        bd = d;
        best = food;
      }
    }
    return best;
  }

  /** 魚 runs from me and my school; surrounded, it slows down. It tires as the chase goes on. */
  private inkFlee(f: Swimmer, followers: Swimmer[], sec: number, time: number): void {
    let fx = 0;
    let fy = 0;
    const threat = (tx: number, ty: number, w: number) => {
      const dx = f.x - tx;
      const dy = f.y - ty;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 300) return;
      const k = (1 - d / 300) * w;
      fx += (dx / d) * k;
      fy += (dy / d) * k;
    };
    threat(this.me.x, this.me.y, 1.6);
    for (const o of followers) threat(o.x, o.y, 0.55);
    // walls of the pond
    if (f.x < 400) fx += (400 - f.x) / 200;
    if (f.x > STREAM_X - 300) fx -= (f.x - (STREAM_X - 300)) / 200;
    if (f.y < SURFACE + 90) fy += 0.8;
    if (f.y > FLOOR - 90) fy -= 0.8;
    const mag = Math.hypot(fx, fy);
    const tired = Phaser.Math.Clamp((time - this.chaseStart) / 40000, 0, 1);
    // surrounded = pushes from all sides cancel out
    const max = (380 - 170 * tired) * Phaser.Math.Clamp(mag, 0.15, 1);
    let dx = mag > 0.05 ? fx / mag : Math.cos(time * 0.001);
    let dy = mag > 0.05 ? fy / mag : Math.sin(time * 0.0013) * 0.4;
    dx += Math.sin(time * 0.003) * 0.25;
    dy += Math.cos(time * 0.0027) * 0.25;
    f.vx += (dx * max - f.vx) * Math.min(1, sec * 3.2);
    f.vy += (dy * max - f.vy) * Math.min(1, sec * 3.2);
  }

  // ---- story ------------------------------------------------------------------------------

  private async script(): Promise<void> {
    const koko = this.fish.find((f) => f.kind === 'koko')!;
    const gogo = this.fish.find((f) => f.kind === 'gogo')!;
    await wait(this, 1400);
    const dlg = new Dialogue(this);
    await dlg.say('koko', 'hg.u.k1');
    await dlg.say('gogo', 'hg.u.g1');
    await dlg.say('koko', 'hg.u.k2');
    await dlg.say('me', 'hg.u.m1');
    dlg.hide();

    // ---- food rain: seen from below, the hand is huge
    this.stage = 'rain';
    this.refreshHud();
    this.say(gogo, 'hg.u.g2', 2600);
    await wait(this, 1200);
    for (let i = 0; i < 3; i++) {
      await this.handThrow();
      await wait(this, 2600);
    }
    await this.until(() => this.food.every((f) => f.gone), 7000);
    this.stage = 'talk';
    this.hud.setText('');
    await dlg.say('koko', 'hg.u.k3');
    await dlg.say('gogo', 'hg.u.g3');
    dlg.hide();

    // ---- gather a school (petals drifting down tint the fish)
    this.stage = 'gather';
    this.setHint('hg.u.schoolHint');
    this.refreshHud();
    this.time.addEvent({ delay: 700, loop: true, callback: () => this.spawnPetal() });
    await this.until(() => this.fish.filter((f) => f.kind === 'follower').length >= NEED, Infinity);
    await wait(this, 800);

    // ---- 魚 appears
    this.stage = 'chase';
    this.chaseStart = this.time.now;
    const ink = this.spawnInk();
    this.say(koko, 'hg.u.ink', 2800);
    this.setHint('hg.u.chaseHint');
    this.refreshHud();
    await this.until(() => {
      const d = Math.hypot(ink.x - this.me.x, ink.y - this.me.y);
      return d < 70 * this.me.size + 20;
    }, Infinity);
    this.stage = 'talk';
    ink.vx *= 0.1;
    ink.vy *= 0.1;
    sfx.chime();
    this.toast(t('hg.u.caught'), '#ffe9a8');
    this.hint.setText('');
    await wait(this, 900);
    await dlg.say('yu', 'hg.u.yu1');
    await dlg.say('me', 'hg.u.m2');
    await dlg.say('me', 'hg.u.m3');
    await dlg.say('yu', 'hg.u.yu2');
    await dlg.say('yu', 'hg.u.yu3');
    await dlg.say('gogo', 'hg.u.g4');
    await dlg.say('koko', 'hg.u.k5');
    dlg.hide();

    // ---- three drops of water
    this.stage = 'drops';
    this.spawnDrops();
    this.setHint('hg.u.hintKeys');
    this.refreshHud();
    await this.until(() => this.drops.every((d) => d.got), Infinity);
    await wait(this, 1200);
    this.stage = 'done';
    await dlg.say('yu', 'hg.u.yu4');
    dlg.hide();
    hgRun.school = Math.max(hgRun.school, this.fish.filter((f) => f.kind === 'follower').length);
    // everyone rises to the surface
    sfx.shimmer();
    for (const f of this.fish) if (f.kind !== 'wild') this.tweens.add({ targets: f, y: SURFACE + 20, duration: 1600, ease: 'Sine.easeIn' });
    await wait(this, 1200);
    this.cameras.main.fadeOut(1200, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('HuagangEnd'));
  }

  private until(cond: () => boolean, timeout: number): Promise<void> {
    const t0 = this.time.now;
    return new Promise((resolve) => {
      const ev = this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
          if (cond() || this.time.now - t0 > timeout) {
            ev.remove();
            resolve();
          }
        },
      });
    });
  }

  private async handThrow(): Promise<void> {
    const h = this.hand;
    const cx = W / 2 + 120 + (Math.random() - 0.5) * 300;
    h.setPosition(cx, -120).setAlpha(0.85);
    await tweenP(this, { targets: h, y: -40, duration: 500, ease: 'Sine.easeOut' });
    // the fingers open: food rains down
    sfx.plop(14);
    const wx = this.cameras.main.scrollX + cx;
    for (let i = 0; i < 16; i++) {
      const x = wx + (Math.random() - 0.5) * 260;
      const img = this.add.image(x, SURFACE + 4, 'hgPellet').setDepth(40).setScale(1.2);
      this.food.push({ img, x, y: SURFACE + 4, vy: 30 + Math.random() * 45, ph: Math.random() * 6, gone: false });
      this.bubble(x, SURFACE + 10);
    }
    this.cameras.main.shake(200, 0.004);
    await tweenP(this, { targets: h, y: -140, alpha: 0, duration: 700, delay: 300, ease: 'Sine.easeIn' });
  }

  private spawnPetal(): void {
    if (this.stage !== 'gather' && this.stage !== 'chase' && this.stage !== 'drops') return;
    if (this.petals.length > 26) return;
    const cam = this.cameras.main;
    const x = cam.scrollX + Math.random() * W;
    const img = this.add.image(x, SURFACE + 6, Math.random() < 0.6 ? 'hgPetal' : 'hgPetalRed').setDepth(41).setScale(0.9);
    this.petals.push({ img, x, y: SURFACE + 6, vy: 18 + Math.random() * 22, ph: Math.random() * 6, stuck: null });
  }

  private spawnInk(): Swimmer {
    const body = new KoiBody(this, inkFishTexture(this), { side: true, length: 150 });
    body.setDepth(35);
    const x = Phaser.Math.Clamp(this.me.x + 520, 500, STREAM_X - 400);
    const s: Swimmer = { kind: 'yu', body, x, y: 300, vx: 0, vy: 0, heading: 0, turn: 0, wave: 0, size: 1.05, slot: 0, wander: 0, bloom: 0, petal: null };
    this.fish.push(s);
    this.ink = s;
    body.setAlpha(0);
    this.tweens.add({ targets: body.rope, alpha: 1, duration: 600 });
    sfx.whee();
    // a trail of ink as it swims
    this.time.addEvent({
      delay: 70,
      loop: true,
      callback: () => {
        const w = this.add.image(s.x - Math.cos(s.heading) * 50, s.y, 'hgInk').setDepth(34).setScale(0.3 + Math.random() * 0.3).setAlpha(0.55);
        this.tweens.add({ targets: w, alpha: 0, scale: w.scale * 2, duration: 1000, onComplete: () => w.destroy() });
      },
    });
    return s;
  }

  private spawnDrops(): void {
    for (const d of DROPS) {
      const img = this.add.image(d.x, d.y, 'hgDrop').setDepth(42).setScale(0.6);
      this.tweens.add({ targets: img, y: d.y - 8, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: img, scale: 0.7, yoyo: true, repeat: -1, duration: 600 });
      this.drops.push({ img, got: false, x: d.x, y: d.y, label: d.label });
    }
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50);
    const sec = dt / 1000;
    this.controlMe(sec);
    this.simulate(sec, time);

    // food sinking and swaying
    for (const f of this.food) {
      if (f.gone) continue;
      f.y += f.vy * sec;
      f.x += Math.sin(time * 0.003 + f.ph) * 20 * sec;
      f.img.setPosition(f.x, f.y);
      if (f.y > FLOOR - 4) {
        f.gone = true;
        f.img.destroy();
      }
    }
    this.food = this.food.filter((f) => !f.gone);

    // petals sinking; fish that touch one wear it for a while
    for (const p of this.petals) {
      if (p.stuck) continue;
      p.y += p.vy * sec;
      p.x += Math.sin(time * 0.002 + p.ph) * 30 * sec;
      p.img.setPosition(p.x, p.y).setAngle(Math.sin(time * 0.003 + p.ph) * 50);
      for (const f of this.fish) {
        if (f.kind === 'wild' || f.kind === 'yu' || f.petal) continue;
        if (Math.abs(f.x - p.x) < 40 * f.size + 8 && Math.abs(f.y - p.y) < 26 * f.size + 8) {
          p.stuck = f;
          f.petal = p.img;
          f.bloom = 1;
          p.img.setDepth(f.body.rope.depth + 0.5).setScale(0.7);
          this.blooms += 1;
          sfx.petal(this.blooms);
          if (this.blooms === 1) this.toast(t('hg.u.poem'), '#ffd6e6', 36);
          if (this.blooms === 6) this.say(this.fish.find((s) => s.kind === 'koko')!, 'hg.u.k4', 3000);
          break;
        }
      }
      if (p.y > FLOOR) p.stuck = null;
    }
    this.petals = this.petals.filter((p) => {
      if (p.stuck && !p.stuck.petal) return false;
      if (!p.stuck && p.y > FLOOR) {
        p.img.destroy();
        return false;
      }
      return true;
    });

    // the drops: pick up, then they orbit 魚
    let gotN = 0;
    this.drops.forEach((d, i) => {
      if (!d.got) {
        if (Math.hypot(d.x - this.me.x, d.y - this.me.y) < 60) {
          d.got = true;
          this.tweens.killTweensOf(d.img);
          sfx.chime();
          this.toast(`${t('hg.u.got')}  ${t(d.label)}`, '#bff4ff', 30);
          this.refreshHud();
        }
      }
      if (d.got) {
        gotN++;
        const ink = this.ink ?? this.me;
        const a = time * 0.003 + (i * Math.PI * 2) / 3;
        d.img.setPosition(ink.x + Math.cos(a) * 60, ink.y + Math.sin(a) * 30).setScale(0.35);
      }
    });
    void gotN;

    // compass arrows to drops that are off screen
    const cam = this.cameras.main;
    this.compass.clear();
    if (this.stage === 'drops') {
      for (const d of this.drops) {
        if (d.got) continue;
        const sx = d.x - cam.scrollX;
        const sy = d.y - cam.scrollY;
        if (sx > 0 && sx < W && sy > 0 && sy < H) continue;
        const ax = Phaser.Math.Clamp(sx, 40, W - 40);
        const ay = Phaser.Math.Clamp(sy, 90, H - 70);
        const ang = Math.atan2(sy - H / 2, sx - W / 2);
        this.compass.fillStyle(0xbff4ff, 0.9);
        this.compass.fillTriangle(
          ax + Math.cos(ang) * 18,
          ay + Math.sin(ang) * 18,
          ax + Math.cos(ang + 2.5) * 14,
          ay + Math.sin(ang + 2.5) * 14,
          ax + Math.cos(ang - 2.5) * 14,
          ay + Math.sin(ang - 2.5) * 14,
        );
      }
    }

    // speech bubbles and name tags follow their fish
    this.bubblesOn = this.bubblesOn.filter((b) => {
      if (this.time.now > b.until) {
        this.tweens.add({ targets: b.box, alpha: 0, duration: 250, onComplete: () => b.box.destroy() });
        return false;
      }
      b.box.setPosition(b.who.x, Math.max(SURFACE + 40, b.who.y - 70));
      return true;
    });
    for (const n of this.nameTags) n.txt.setPosition(n.who.x, n.who.y - 38);
    // KOKO and GOGO's tags fade once we know who's who; mine stays so I can find myself in the school
    if (time > 20000) for (const n of this.nameTags) if (n.who !== this.me) n.txt.setAlpha(Math.max(0, n.txt.alpha - sec));

    // water: the wavy bright surface, swaying light, drifting motes, weeds
    const s = this.surface;
    s.clear();
    s.fillStyle(0xf2fffb, 0.85);
    s.beginPath();
    s.moveTo(0, SURFACE - 6);
    for (let x = 0; x <= W; x += 16) s.lineTo(x, SURFACE + Math.sin(x * 0.03 + time * 0.003) * 3 + Math.sin(x * 0.011 - time * 0.002) * 2);
    s.lineTo(W, SURFACE - 6);
    s.closePath();
    s.fillPath();
    s.lineStyle(3, 0xffffff, 0.6);
    s.beginPath();
    for (let x = 0; x <= W; x += 16) {
      const y = SURFACE + 3 + Math.sin(x * 0.03 + time * 0.003) * 3 + Math.sin(x * 0.011 - time * 0.002) * 2;
      if (x === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.strokePath();
    for (const r of this.rays) r.setAngle(Math.sin(time * 0.0004 + (r.getData('ph') as number)) * 6);
    for (const m of this.motes) {
      m.y -= sec * 6;
      m.x += Math.sin(time * 0.001 + (m.getData('ph') as number)) * sec * 8;
      if (m.y < SURFACE) m.y = FLOOR;
    }
    const w = this.weeds;
    w.clear();
    for (const wd of this.weedList) {
      if (wd.x < cam.scrollX - 60 || wd.x > cam.scrollX + W + 60) continue;
      w.lineStyle(6, wd.c, 0.95);
      w.beginPath();
      w.moveTo(wd.x, FLOOR + 6);
      for (let k = 1; k <= 7; k++) {
        const q = k / 7;
        w.lineTo(wd.x + Math.sin(time * 0.0012 + wd.ph + q * 2) * 18 * q, FLOOR + 6 - wd.h * q);
      }
      w.strokePath();
    }
  }
}
