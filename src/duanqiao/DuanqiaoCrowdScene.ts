import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { makeButton, type Button } from '../ui/Button';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { rng } from '../art/paint';
import { hatTexture, Snowfall, umbrellaTexture, type Pattern } from './art';
import { dqRun } from './state';

const WORLD = { w: 2600, h: 1400 };
const DECK = { x0: 520, x1: 2080, y: 700, half: 78 };
const CAUSEWAY = { x0: 0, x1: 520, half: 66 };
const PLAZA = { x0: 2080, x1: 2600, y0: 520, y1: 880 };
const HUD = 300;
const ME = { x: 2240, y: 700 };

type Role = 'crowd' | 'koko' | 'gogo' | 'fakeK' | 'fakeG';

interface Person {
  img: Phaser.GameObjects.Image;
  extra: Phaser.GameObjects.Graphics | null;
  role: Role;
  vx: number;
  ph: number;
  found: boolean;
}

/** Inside the walkable area of the bridge, causeway and plaza? */
function walkable(x: number, y: number): boolean {
  if (x >= DECK.x0 && x <= DECK.x1) return Math.abs(y - DECK.y) < DECK.half - 18;
  if (x < DECK.x0) return x > 30 && Math.abs(y - DECK.y) < CAUSEWAY.half - 18;
  return x < PLAZA.x1 - 30 && y > PLAZA.y0 + 30 && y < PLAZA.y1 - 30;
}

/** The bridge in the snow, packed with umbrellas: find KOKO and GOGO. */
export class DuanqiaoCrowdScene extends Phaser.Scene {
  private people: Person[] = [];
  private finding = false;
  private dragFrom: { x: number; y: number; sx: number; sy: number } | null = null;
  private dragged = false;
  private found = { koko: false, gogo: false };
  private startTime = 0;
  private snow!: Snowfall;
  private hud: Phaser.GameObjects.Text[] = [];
  private hintBtn: Button | null = null;
  private lastShout = -99999;
  private keys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private meImg!: Phaser.GameObjects.Image;

  constructor() {
    super('DuanqiaoCrowd');
  }

  create(): void {
    music.play('dqMorning');
    this.people = [];
    this.finding = false;
    this.found = { koko: false, gogo: false };
    this.hud = [];
    this.dragFrom = null;

    this.cameras.main.setBounds(0, 0, WORLD.w, WORLD.h);
    this.paintWorld();
    this.spawnCrowd();
    this.meImg = this.add.image(ME.x, ME.y, hatTexture(this, 'dqHatMe', '#3b6ea5', '#c0392b', true, 1)).setDepth(30);
    this.meImg.setData('label', this.add.text(ME.x, ME.y - 40, t('name.me'), baseStyle({ fontSize: '16px', color: '#ffffff', backgroundColor: CSS.me, padding: { x: 6, y: 2 } })).setOrigin(0.5).setDepth(60));
    this.cameras.main.centerOn(ME.x - 200, ME.y);

    this.snow = new Snowfall(this, { count: 140, depth: 200, front: 210 });
    this.snow.wind = 30;
    this.keys = this.input.keyboard!.createCursorKeys();

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (overGlobalUI(p)) return;
      this.dragFrom = { x: p.x, y: p.y, sx: this.cameras.main.scrollX, sy: this.cameras.main.scrollY };
      this.dragged = false;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragFrom || !p.isDown || !this.finding) return;
      const dx = p.x - this.dragFrom.x;
      const dy = p.y - this.dragFrom.y;
      if (Math.hypot(dx, dy) > 8) this.dragged = true;
      this.cameras.main.setScroll(this.dragFrom.sx - dx, this.dragFrom.sy - dy);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.dragFrom && !this.dragged && this.finding && !overGlobalUI(p)) this.tap(p);
      this.dragFrom = null;
    });

    this.cameras.main.fadeIn(900, 255, 255, 255);
    void this.script();
  }

  // ---- the bridge from above ---------------------------------------------------------

  private paintWorld(): void {
    const r = rng(61);
    const g = this.add.graphics().setDepth(0);
    // the lake, grey and still, with a skin of snow near the banks
    g.fillGradientStyle(0x9fb2bc, 0x9fb2bc, 0x8ea2ad, 0x8ea2ad, 1);
    g.fillRect(0, 0, WORLD.w, WORLD.h);
    for (let i = 0; i < 60; i++) {
      g.fillStyle(0xffffff, 0.06 + r() * 0.08);
      g.fillEllipse(r() * WORLD.w, r() * WORLD.h, 120 + r() * 300, 20 + r() * 40);
    }
    this.add.tileSprite(0, 0, WORLD.w, WORLD.h, 'ripples').setOrigin(0).setDepth(1).setAlpha(0.25);
    // the causeway (白堤) coming in from the left, lined with snowy willows
    g.fillStyle(0xf3f5f6, 1);
    g.fillRect(CAUSEWAY.x0, DECK.y - CAUSEWAY.half - 40, CAUSEWAY.x1 - CAUSEWAY.x0 + 20, (CAUSEWAY.half + 40) * 2);
    for (let x = 30; x < CAUSEWAY.x1; x += 90) {
      for (const s of [-1, 1]) this.add.image(x, DECK.y + s * (CAUSEWAY.half + 22), 'dqWillowTop').setDepth(50).setAngle(r() * 360).setScale(0.9);
    }
    // the plaza on the city side
    g.fillStyle(0xeef1f3, 1);
    g.fillRect(PLAZA.x0 - 10, PLAZA.y0, PLAZA.x1 - PLAZA.x0 + 10, PLAZA.y1 - PLAZA.y0);
    // the bridge itself: stone deck (snow trodden into slush in the middle) and balustrades
    const b = this.add.graphics().setDepth(2);
    b.fillStyle(0x0b2a33, 0.25);
    b.fillRect(DECK.x0, DECK.y - DECK.half + 14, DECK.x1 - DECK.x0, DECK.half * 2);
    b.fillStyle(0xd8dcdc, 1);
    b.fillRect(DECK.x0, DECK.y - DECK.half, DECK.x1 - DECK.x0, DECK.half * 2);
    b.fillStyle(0xb9bdbd, 1);
    b.fillRect(DECK.x0, DECK.y - 36, DECK.x1 - DECK.x0, 72);
    // the hump of the arch catches the light
    const mid = (DECK.x0 + DECK.x1) / 2;
    b.fillStyle(0xffffff, 0.35);
    b.fillEllipse(mid, DECK.y, 600, DECK.half * 2);
    for (const s of [-1, 1]) {
      b.fillStyle(0xa9a39a, 1);
      b.fillRect(DECK.x0, DECK.y + s * DECK.half - 6, DECK.x1 - DECK.x0, 12);
      b.fillStyle(0xffffff, 1);
      b.fillRect(DECK.x0, DECK.y + s * DECK.half - 6, DECK.x1 - DECK.x0, 5);
      for (let x = DECK.x0; x <= DECK.x1; x += 60) {
        b.fillStyle(0x8f897f, 1);
        b.fillRect(x - 7, DECK.y + s * DECK.half - 8, 14, 16);
        b.fillStyle(0xffffff, 1);
        b.fillCircle(x, DECK.y + s * DECK.half - 2, 6);
      }
    }
    // the tablet pavilion (碑亭) at the east end: a hipped roof seen from above, under snow
    const px = PLAZA.x0 + 160;
    const py = PLAZA.y0 - 50;
    this.add.image(px, py, 'dqPavTop').setDepth(55);
    // footprints wandering across the snowy plaza
    const fp = this.add.graphics().setDepth(1.5);
    for (let k = 0; k < 140; k++) {
      const t = k / 140;
      const x = PLAZA.x0 + 40 + t * (PLAZA.x1 - PLAZA.x0 - 80) + Math.sin(t * 12) * 30;
      const y = PLAZA.y0 + 60 + ((k * 37) % (PLAZA.y1 - PLAZA.y0 - 120));
      fp.fillStyle(0xb8c2ca, 0.55);
      fp.fillEllipse(x + (k % 2 ? 5 : -5), y, 5, 8);
    }
  }

  private spawnCrowd(): void {
    const r = rng(7);
    const colors = ['#2e86c1', '#27ae60', '#8e44ad', '#34495e', '#16a085', '#d35400', '#7f8c8d', '#2c3e50', '#e67e22', '#5d6d7e', '#a04000', '#1abc9c'];
    const patterns: Pattern[] = ['solid', 'panels', 'dots', 'ring', 'clear', 'check'];
    const spot = (): [number, number] => {
      for (let k = 0; k < 200; k++) {
        const x = 40 + r() * (PLAZA.x1 - 80);
        const y = DECK.y - 200 + r() * 400;
        if (walkable(x, y)) return [x, y];
      }
      return [mid(), DECK.y];
    };
    const mid = () => (DECK.x0 + DECK.x1) / 2;
    const add = (key: string, role: Role, x: number, y: number) => {
      const img = this.add.image(x, y, key).setDepth(20 + r() * 5).setAngle(r() * 360);
      this.people.push({ img, extra: null, role, vx: (r() - 0.5) * 30, ph: r() * 6, found: false });
      return this.people[this.people.length - 1];
    };
    for (let i = 0; i < 220; i++) {
      const [x, y] = spot();
      if (r() < 0.75) {
        const key = umbrellaTexture(this, `dqU${i % 40}`, colors[i % colors.length], patterns[(i * 7) % patterns.length], i);
        add(key, 'crowd', x, y);
      } else {
        const hat = ['#34495e', '#c0392b', '#ecf0f1', '#8e44ad', '#2c3e50', '#16a085'][i % 6];
        add(hatTexture(this, `dqH${i % 20}`, colors[(i * 3) % colors.length], hat, i % 3 === 0, i), 'crowd', x, y);
      }
    }
    // decoys: red umbrellas without the pink scarf, yellow hats without a bobble
    for (let i = 0; i < 12; i++) {
      const [x, y] = spot();
      const p = add(umbrellaTexture(this, 'dqURed', '#d0312d', 'solid', 99), 'fakeK', x, y);
      if (i % 3 === 0) p.extra = this.scarf(p.img, 0x3b6ea5);
    }
    for (let i = 0; i < 9; i++) {
      const [x, y] = spot();
      add(hatTexture(this, `dqHY${i % 3}`, ['#7f8c8d', '#2c3e50', '#a04000'][i % 3], '#f4d03f', false, 50 + i), 'fakeG', x, y);
    }
    // KOKO: red umbrella with a pink scarf peeking out; GOGO: yellow bobble hat
    const koko = add(umbrellaTexture(this, 'dqURed', '#d0312d', 'solid', 99), 'koko', 1180, DECK.y - 40);
    koko.extra = this.scarf(koko.img, 0xf7a8c4);
    // red umbrellas and yellow hats (real and fake) sit on top, so the clues aren't buried
    for (const p of this.people) {
      if (p.role === 'crowd') continue;
      p.img.setDepth(27);
      p.extra?.setDepth(26.9);
    }
    add(hatTexture(this, 'dqHatGogo', '#2e8b57', '#f4d03f', true, 77), 'gogo', 260, DECK.y + 26);
    // nobody stands on top of each other right where KOKO and GOGO are
    for (const p of this.people) {
      if (p.role !== 'crowd') continue;
      for (const q of this.people.filter((o) => o.role === 'koko' || o.role === 'gogo')) {
        if (Math.hypot(p.img.x - q.img.x, p.img.y - q.img.y) < 50) p.img.x += 80;
      }
    }
  }

  /** The tail of a scarf peeking out from under an umbrella. */
  private scarf(under: Phaser.GameObjects.Image, color: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setDepth(under.depth - 0.1);
    g.fillStyle(color, 1);
    g.fillRoundedRect(20, 22, 26, 9, 4);
    g.fillRoundedRect(36, 22, 9, 22, 4);
    g.lineStyle(1, 0xffffff, 0.6);
    for (let x = 24; x < 44; x += 5) g.lineBetween(x, 23, x + 2, 30);
    g.setPosition(under.x, under.y);
    return g;
  }

  // ---- HUD, tapping, shouting --------------------------------------------------------------

  private buildHud(): void {
    const panel = this.add.graphics().setScrollFactor(0).setDepth(HUD);
    panel.fillStyle(0xf6f1e7, 0.92);
    panel.fillRoundedRect(14, 10, 640, 92, 16);
    const line = (y: number, key: StrKey, who: 'koko' | 'gogo') =>
      i18nText(this, 30, y, () => `${this.found[who] ? '✔' : '○'} ${t(key)}`, { fontSize: '19px', color: CSS.ink }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(HUD + 1);
    this.hud = [line(36, 'dq.cr.findK', 'koko'), line(74, 'dq.cr.findG', 'gogo')];
    i18nText(this, W / 2, H - 26, () => t('dq.cr.hint'), { fontSize: '18px', color: '#2f3b48', stroke: '#ffffff', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(HUD);
    this.hintBtn = makeButton(this, W - 110, H - 70, () => t('dq.cr.btnHint'), { width: 150, height: 60, fontSize: 24, fixed: true, depth: HUD + 2, onClick: () => this.shout() });
  }

  private refreshHud(): void {
    this.hud[0].setText(`${this.found.koko ? '✔' : '○'} ${t('dq.cr.findK')}`);
    this.hud[1].setText(`${this.found.gogo ? '✔' : '○'} ${t('dq.cr.findG')}`);
  }

  private toast(text: string, color = '#ffffff'): void {
    const txt = this.add.text(W / 2, 160, text, baseStyle({ fontSize: '26px', color, fontStyle: 'bold', stroke: '#2f3b48', strokeThickness: 6 })).setOrigin(0.5).setScrollFactor(0).setDepth(HUD + 5);
    this.tweens.add({ targets: txt, y: 130, alpha: 0, delay: 1000, duration: 700, onComplete: () => txt.destroy() });
  }

  private ring(x: number, y: number, color: number, times = 1): void {
    for (let i = 0; i < times; i++) {
      const c = this.add.circle(x, y, 20, color, 0).setStrokeStyle(5, color, 0.9).setDepth(80);
      this.tweens.add({ targets: c, radius: 70, alpha: 0, delay: i * 300, duration: 900, onComplete: () => c.destroy() });
    }
  }

  private tap(p: Phaser.Input.Pointer): void {
    if (this.hintBtn && p.x > W - 200 && p.y > H - 110) return;
    const wp = this.cameras.main.getWorldPoint(p.x, p.y);
    let best: Person | null = null;
    let bd = 40;
    for (const q of this.people) {
      const d = Math.hypot(q.img.x - wp.x, q.img.y - wp.y);
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
    if (!best) return;
    if (best.role === 'koko' || best.role === 'gogo') {
      if (this.found[best.role]) return;
      this.found[best.role] = true;
      best.found = true;
      sfx.chime();
      this.ring(best.img.x, best.img.y, best.role === 'koko' ? 0xc2185b : 0x2471a3, 2);
      const tag = this.add.text(best.img.x, best.img.y - 44, best.role.toUpperCase(), baseStyle({ fontSize: '16px', color: '#ffffff', backgroundColor: best.role === 'koko' ? CSS.koko : CSS.gogo, padding: { x: 6, y: 2 } })).setOrigin(0.5).setDepth(60);
      best.img.setData('tag', tag);
      this.toast(t(best.role === 'koko' ? 'dq.cr.foundK' : 'dq.cr.foundG'), '#ffe08a');
      this.refreshHud();
    } else {
      sfx.blip();
      this.tweens.add({ targets: best.img, angle: best.img.angle + 25, yoyo: true, duration: 120 });
      this.toast(t(best.role === 'fakeK' ? 'dq.cr.notK' : best.role === 'fakeG' ? 'dq.cr.notG' : 'dq.cr.nope'));
    }
  }

  private shout(): void {
    if (!this.finding || this.time.now - this.lastShout < 6000) return;
    this.lastShout = this.time.now;
    this.toast(t('dq.cr.shout'));
    sfx.bell();
    for (const q of this.people) {
      if ((q.role === 'koko' || q.role === 'gogo') && !this.found[q.role]) this.ring(q.img.x, q.img.y, 0xffffff, 3);
    }
  }

  // ---- the story -------------------------------------------------------------------------

  private async script(): Promise<void> {
    await wait(this, 900);
    const dlg = new Dialogue(this);
    await dlg.say('koko', 'dq.cr.k0');
    dlg.hide();
    // a gust: the umbrella flies off into the crowd
    sfx.wind();
    this.snow.wind = 160;
    const umb = this.add.image(ME.x, ME.y, 'dqUmbMine').setDepth(70).setScale(1.2);
    this.toast(t('dq.cr.wind'));
    await tweenP(this, { targets: umb, x: ME.x - 900, y: ME.y - 500, angle: 720, scale: 0.6, alpha: 0, duration: 1600, ease: 'Sine.easeIn' });
    umb.destroy();
    this.snow.wind = 30;
    this.toast(t('dq.cr.lost'), '#ffe08a');
    await wait(this, 1200);

    this.buildHud();
    this.finding = true;
    this.startTime = this.time.now;
    await new Promise<void>((resolve) => {
      const ev = this.time.addEvent({
        delay: 150,
        loop: true,
        callback: () => {
          if (this.found.koko && this.found.gogo) {
            ev.remove();
            resolve();
          }
        },
      });
    });
    this.finding = false;
    dqRun.findTime = Math.round((this.time.now - this.startTime) / 1000);
    await wait(this, 1200);

    // everyone squeezes back to me
    const cam = this.cameras.main;
    cam.pan(ME.x - 120, ME.y, 900, 'Sine.easeInOut');
    const friends = this.people.filter((q) => q.role === 'koko' || q.role === 'gogo');
    friends.forEach((q, i) => {
      this.tweens.add({ targets: q.img, x: ME.x - 90 - i * 70, y: ME.y + (i ? 50 : -50), duration: 1200, ease: 'Sine.easeInOut' });
      const tag = q.img.getData('tag') as Phaser.GameObjects.Text | undefined;
      if (tag) this.tweens.add({ targets: tag, x: ME.x - 90 - i * 70, y: ME.y + (i ? 50 : -50) - 44, duration: 1200, ease: 'Sine.easeInOut' });
    });
    await wait(this, 1300);
    this.snow.amount = 1;
    await dlg.say('koko', 'dq.cr.k1');
    dlg.hide();

    // a lady in white under a silk umbrella, a girl in green beside her
    const lady = this.add.image(ME.x + 380, ME.y - 120, 'dqSilk').setDepth(40);
    const green = this.add.image(ME.x + 440, ME.y - 60, umbrellaTexture(this, 'dqUGreen', '#2f8f7a', 'solid', 3, 26)).setDepth(39);
    this.tweens.add({ targets: [lady, green], x: '-=250', y: '+=80', duration: 1800, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: lady, angle: 360, duration: 6000, repeat: -1 });
    await wait(this, 1900);
    sfx.shimmer();
    await dlg.say('lady', 'dq.cr.l1');
    // she holds the umbrella over me
    await tweenP(this, { targets: lady, x: ME.x, y: ME.y, duration: 700, ease: 'Sine.easeInOut' });
    await dlg.say('me', 'dq.cr.m1');
    await dlg.say('lady', 'dq.cr.l2');
    await dlg.say('gogo', 'dq.cr.g1');
    await dlg.say('lady', 'dq.cr.l3');
    dlg.hide();
    // ...and she and the girl in green turn into a swirl of snow
    sfx.shimmer();
    for (let i = 0; i < 40; i++) {
      const f = this.add.image(green.x + (Math.random() - 0.5) * 60, green.y + (Math.random() - 0.5) * 60, 'dqFlake').setDepth(90).setScale(0.8 + Math.random());
      const a = Math.random() * Math.PI * 2;
      this.tweens.add({ targets: f, x: f.x + Math.cos(a) * 260, y: f.y + Math.sin(a) * 200 - 120, alpha: 0, duration: 1600 + Math.random() * 800, onComplete: () => f.destroy() });
    }
    this.tweens.add({ targets: green, alpha: 0, scale: 0.4, duration: 900 });
    await wait(this, 1000);
    await dlg.say('koko', 'dq.cr.k2');
    await dlg.say('gogo', 'dq.cr.g2');
    await dlg.say(null, 'dq.cr.m2');
    dlg.hide();
    this.cameras.main.fadeOut(1000, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('DuanqiaoSnowman'));
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50);
    const sec = dt / 1000;
    this.snow.update(dt, time);
    // the crowd shuffles along the bridge
    for (const q of this.people) {
      if (q.found) continue;
      const nx = q.img.x + q.vx * sec;
      const ny = q.img.y + Math.sin(time * 0.0008 + q.ph) * 8 * sec;
      if (walkable(nx, ny)) q.img.setPosition(nx, ny);
      else q.vx *= -1;
      q.img.angle += Math.sin(time * 0.002 + q.ph) * 0.2;
      q.extra?.setPosition(q.img.x, q.img.y);
    }
    if (this.finding) {
      const cam = this.cameras.main;
      const sp = 600 * sec;
      if (this.keys.left.isDown) cam.scrollX -= sp;
      if (this.keys.right.isDown) cam.scrollX += sp;
      if (this.keys.up.isDown) cam.scrollY -= sp;
      if (this.keys.down.isDown) cam.scrollY += sp;
    }
    const label = this.meImg.getData('label') as Phaser.GameObjects.Text;
    label.setPosition(this.meImg.x, this.meImg.y - 40);
  }
}
