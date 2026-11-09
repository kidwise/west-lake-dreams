import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { makeButton, type Button } from '../ui/Button';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { LOOKS, type Look } from '../art/Cyclist';
import { paintPond, POND, School, type PondFish } from './Pond';
import { VARIETIES, type VarietyId } from './koi';
import { hgRun, nextHgKey } from './state';

const HUD = 100;
const HAND = { x: W / 2, y: H + 10 };
const START_BAG = 160;
const HANDFUL = 18;
const FRAME = { w: 300, h: 200 };

/** Somebody leaning on the railing, seen from behind (we're looking down into the pond). */
export function drawBack(g: Phaser.GameObjects.Graphics, look: Look, reach: number): void {
  g.clear();
  // arms on the rail; the right one reaches out to throw
  g.lineStyle(14, look.shirt, 1);
  g.lineBetween(-34, 10, -40, -36);
  g.lineBetween(34, 10, 40 + reach * 16, -36 - reach * 40);
  g.fillStyle(0xf1c7a5, 1);
  g.fillCircle(-40, -38, 8);
  g.fillCircle(40 + reach * 16, -38 - reach * 40, 8);
  g.fillStyle(look.shirt, 1);
  g.fillEllipse(0, 18, 104, 52);
  if (look.backpack) {
    g.fillStyle(0x2e6f8e, 1);
    g.fillRoundedRect(-26, 8, 52, 40, 10);
  }
  // head from behind
  g.fillStyle(0x2b2522, 1);
  g.fillCircle(0, -12, 27);
  if (look.hair === 'cap') {
    g.fillStyle(look.cap ?? 0xf4d03f, 1);
    g.fillCircle(0, -14, 26);
    g.fillEllipse(0, -40, 40, 16);
  }
  if (look.hair === 'ponytail') {
    g.fillStyle(0x2b2522, 1);
    g.fillEllipse(0, 14, 16, 28);
    g.fillStyle(0xe0628e, 1);
    g.fillCircle(0, 4, 5);
  }
  g.fillStyle(0xf1c7a5, 1);
  g.fillEllipse(-27, -10, 8, 14);
  g.fillEllipse(27, -10, 8, 14);
}

/** 红鱼池: feed the koi from the zig-zag bridge, make a fish mountain, photograph the varieties. */
export class HuagangPondScene extends Phaser.Scene {
  private pond!: { update: (time: number) => void };
  private school!: School;
  private bag = START_BAG;
  private mode: 'feed' | 'photo' = 'feed';
  private talking = false;
  private done = false;
  private holdStart = -1;
  private aim!: Phaser.GameObjects.Graphics;
  private viewfinder!: Phaser.GameObjects.Graphics;
  private flash!: Phaser.GameObjects.Rectangle;
  private modeBtn: Button | null = null;
  private bagText!: Phaser.GameObjects.Text;
  private goalTexts: Phaser.GameObjects.Text[] = [];
  private dexSlots: { v: VarietyId; img: Phaser.GameObjects.Image | null; label: Phaser.GameObjects.Text; x: number; y: number }[] = [];
  private mountainDone = false;
  private friends: Record<'koko' | 'gogo', { g: Phaser.GameObjects.Graphics; reach: number }> = {} as never;
  private petals: { img: Phaser.GameObjects.Image; vx: number; vy: number; nib: number }[] = [];
  private gulpDeg = 3;
  private lastGulp = 0;
  private throws = 0;
  private bubbles: Phaser.GameObjects.Container[] = [];
  private hintText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('HuagangPond');
  }

  create(): void {
    music.play('huagang');
    this.bag = START_BAG;
    this.mode = 'feed';
    this.talking = false;
    this.done = false;
    this.holdStart = -1;
    this.mountainDone = false;
    this.goalTexts = [];
    this.dexSlots = [];
    this.petals = [];
    this.throws = 0;
    this.bubbles = [];

    this.pond = paintPond(this);
    this.school = new School(this, 52, 5, {
      onGulp: (f) => this.gulp(f),
      onMountain: (n, x, y) => this.onMountain(n, x, y),
    });

    // KOKO and GOGO leaning on the railing beside me
    for (const [who, x] of [['koko', 300], ['gogo', W - 330]] as const) {
      const g = this.add.graphics().setDepth(92).setPosition(x, H - 44);
      drawBack(g, LOOKS[who], 0);
      this.friends[who] = { g, reach: 0 };
    }

    this.aim = this.add.graphics().setDepth(HUD - 4);
    this.viewfinder = this.add.graphics().setDepth(HUD - 3);
    this.flash = this.add.rectangle(0, 0, W, H, 0xffffff, 0).setOrigin(0).setDepth(HUD + 50);
    this.buildHud();

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onUp(p));

    // KOKO and GOGO throw a handful of their own now and then
    this.time.addEvent({ delay: 8000, loop: true, callback: () => this.friendThrow() });
    // peony petals drifting in from the 花港 stream
    this.time.addEvent({ delay: 2600, loop: true, callback: () => this.spawnPetal() });
    for (let i = 0; i < 5; i++) this.spawnPetal(true);

    this.cameras.main.fadeIn(1000, 255, 248, 236);
    void this.script();
  }

  // ---- HUD -----------------------------------------------------------------

  private buildHud(): void {
    const panel = this.add.graphics().setDepth(HUD);
    panel.fillStyle(0xf6f1e7, 0.88);
    panel.fillRoundedRect(14, 10, 400, 82, 16);
    panel.fillRoundedRect(424, 10, 470, 82, 16);
    const goal = (y: number, fn: () => string) => {
      const txt = i18nText(this, 30, y, fn, { fontSize: '19px', color: CSS.ink }).setOrigin(0, 0.5).setDepth(HUD + 1);
      this.goalTexts.push(txt);
      return txt;
    };
    goal(32, () => `${this.mountainDone ? '✔' : '○'} ${t('hg.goalMountain')}`);
    goal(66, () => `${this.dexCount() >= 3 ? '✔' : '○'} ${t('hg.goalPhoto', { n: Math.min(3, this.dexCount()) })}`);

    // koi book: seven slots
    VARIETIES.forEach((v, i) => {
      const x = 462 + i * 64;
      const y = 40;
      const slot = this.add.graphics().setDepth(HUD + 1);
      slot.fillStyle(0x2f6f6a, 0.18);
      slot.fillRoundedRect(x - 28, y - 22, 56, 40, 10);
      const label = i18nText(this, x, y + 32, () => (this.dexSlots.find((d) => d.v === v.id)?.img ? t(v.name) : t('hg.dexUnknown')), { fontSize: '12px', color: CSS.muted })
        .setOrigin(0.5)
        .setDepth(HUD + 1);
      this.dexSlots.push({ v: v.id, img: null, label, x, y: y - 2 });
    });

    // the bag of food on the railing
    this.add.image(64, H - 38, 'hgBag').setScale(0.62).setDepth(HUD);
    this.bagText = i18nText(this, 96, H - 38, () => t('hg.bag', { n: this.bag }), { fontSize: '22px', color: CSS.ink, fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(HUD);

    this.modeBtn = makeButton(this, W - 110, H - 40, () => t(this.mode === 'feed' ? 'hg.btnPhoto' : 'hg.btnFeed'), {
      width: 150,
      height: 56,
      fontSize: 24,
      depth: HUD + 2,
      fill: 0xfdf8ee,
      onClick: () => this.toggleMode(),
    });
    const hintKey: StrKey = this.sys.game.device.input.touch ? 'hg.hintTouch' : 'hg.hintKeys';
    const hint = i18nText(this, W / 2, 118, () => (this.mode === 'photo' ? t('hg.photoHint') : t(hintKey)), {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#123a3a',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setDepth(HUD);
    this.tweens.add({ targets: hint, alpha: 0.75, yoyo: true, repeat: -1, duration: 1400 });
    this.hintText = hint;
  }

  private refreshHud(): void {
    this.goalTexts.forEach((tx, i) =>
      tx.setText(i === 0 ? `${this.mountainDone ? '✔' : '○'} ${t('hg.goalMountain')}` : `${this.dexCount() >= 3 ? '✔' : '○'} ${t('hg.goalPhoto', { n: Math.min(3, this.dexCount()) })}`),
    );
    this.bagText.setText(t('hg.bag', { n: this.bag }));
  }

  private dexCount(): number {
    return Object.keys(hgRun.dex).length;
  }

  private toggleMode(): void {
    if (this.talking || this.done) return;
    this.mode = this.mode === 'feed' ? 'photo' : 'feed';
    sfx.blip();
    this.modeBtn?.refresh();
    this.aim.clear();
    this.viewfinder.clear();
    this.hintText?.setText(this.mode === 'photo' ? t('hg.photoHint') : t(this.sys.game.device.input.touch ? 'hg.hintTouch' : 'hg.hintKeys'));
  }

  // ---- input ---------------------------------------------------------------

  private inWater(p: Phaser.Input.Pointer): boolean {
    if (overGlobalUI(p)) return false;
    if (p.y > H - 80 || p.y < 100) return false;
    return true;
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.talking || this.done || !this.inWater(p)) return;
    if (this.mode === 'photo') {
      this.snap(p.x, p.y);
      return;
    }
    this.holdStart = this.time.now;
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (this.holdStart < 0) return;
    const held = this.time.now - this.holdStart;
    this.holdStart = -1;
    this.aim.clear();
    if (this.talking || this.done || this.bag <= 0) return;
    const x = Phaser.Math.Clamp(p.x, POND.left + 10, POND.right - 10);
    const y = Phaser.Math.Clamp(p.y, POND.top + 10, POND.bottom - 10);
    if (held < 200) {
      this.bag -= 1;
      this.school.throwPellet(HAND.x, HAND.y, x, y);
      this.time.delayedCall(450, () => sfx.plop(1));
    } else {
      const n = Math.min(HANDFUL, this.bag);
      this.bag -= n;
      this.throwHandful(HAND.x, HAND.y, x, y, n, this.spread(held));
      hgRun.handfuls += 1;
    }
    this.throws += 1;
    this.refreshHud();
  }

  private spread(held: number): number {
    return 26 + Math.min(1, (held - 200) / 900) * 90;
  }

  private throwHandful(fx: number, fy: number, x: number, y: number, n: number, spread: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * spread;
      const lx = Phaser.Math.Clamp(x + Math.cos(a) * d, POND.left + 6, POND.right - 6);
      const ly = Phaser.Math.Clamp(y + Math.sin(a) * d * 0.8, POND.top + 6, POND.bottom - 6);
      this.school.throwPellet(fx + (Math.random() - 0.5) * 30, fy, lx, ly, Math.random() * 90);
    }
    this.time.delayedCall(520, () => sfx.plop(n));
  }

  // ---- photos ----------------------------------------------------------------

  private snap(cx: number, cy: number): void {
    const x = Phaser.Math.Clamp(cx - FRAME.w / 2, 0, W - FRAME.w);
    const y = Phaser.Math.Clamp(cy - FRAME.h / 2, 0, H - FRAME.h);
    const inside = this.school.fish.filter((f) => f.x > x + 10 && f.x < x + FRAME.w - 10 && f.y > y + 10 && f.y < y + FRAME.h - 10);
    const fresh: PondFish[] = [];
    for (const f of inside) {
      if (!hgRun.dex[f.variety] && !fresh.some((o) => o.variety === f.variety)) fresh.push(f);
    }
    // hide the HUD for the shot
    const hud = this.children.list.filter((o) => (o as unknown as { depth: number }).depth >= HUD - 4 && (o as unknown as { visible: boolean }).visible) as unknown as {
      setVisible: (v: boolean) => void;
    }[];
    hud.forEach((o) => o.setVisible(false));
    const keepPhoto = inside.length > 0 && (hgRun.photos.length < 3 || fresh.length > 0);
    const key = nextHgKey('pond');
    this.game.renderer.snapshotArea(Math.round(x), Math.round(y), FRAME.w, FRAME.h, (snapImg) => {
      hud.forEach((o) => o.setVisible(true));
      this.announce(inside, fresh, cx, cy);
      sfx.shutter();
      this.flash.setAlpha(0.7);
      this.tweens.add({ targets: this.flash, alpha: 0, duration: 300 });
      if (keepPhoto && snapImg instanceof HTMLImageElement) {
        const add = () => {
          if (this.textures.exists(key)) return;
          this.textures.addImage(key, snapImg);
          if (hgRun.photos.length >= 3) {
            // replace the oldest photo that found nothing new
            const old = hgRun.photos.shift();
            if (old && this.textures.exists(old)) this.textures.remove(old);
          }
          hgRun.photos.push(key);
        };
        if (snapImg.complete) add();
        else snapImg.onload = add;
      }
    });
    // record new koi straight away (so a quick second tap doesn't count them twice)…
    fresh.forEach((f) => (hgRun.dex[f.variety] = f.tex));
  }

  /** …but only show the pop-ups once the photo has been taken, so they aren't in it. */
  private announce(inside: PondFish[], fresh: PondFish[], cx: number, cy: number): void {
    if (inside.length === 0) {
      this.pop(t('hg.noKoi'), cx, cy, '#ffffff');
      return;
    }
    fresh.forEach((f, i) => {
      const slot = this.dexSlots.find((s) => s.v === f.variety);
      if (slot) {
        slot.img = this.add.image(slot.x, slot.y, f.tex).setScale(0.4).setDepth(HUD + 2);
        slot.label.setText(t(VARIETIES.find((v) => v.id === f.variety)!.name));
        this.tweens.add({ targets: slot.img, scale: { from: 0.8, to: 0.4 }, duration: 500, ease: 'Back.easeOut' });
      }
      this.time.delayedCall(i * 500, () => {
        sfx.chime();
        this.pop(t('hg.newKoi', { name: t(VARIETIES.find((v) => v.id === f.variety)!.name) }), f.x, f.y - 40 - i * 34, '#ffe9a8');
      });
    });
    this.refreshHud();
  }

  // ---- feeding feedback ---------------------------------------------------------

  private gulp(f: PondFish): void {
    void f;
    const now = this.time.now;
    if (now - this.lastGulp < 55) return;
    this.lastGulp = now;
    // each mouth is a note: a wandering pentatonic melody (鱼嘴是琴键)
    this.gulpDeg = Phaser.Math.Clamp(this.gulpDeg + Phaser.Math.Between(-2, 2), 0, 8);
    sfx.gulp(music.noteFreq(this.gulpDeg));
  }

  private onMountain(n: number, x: number, y: number): void {
    hgRun.mountain = Math.max(hgRun.mountain, n);
    this.pop(t('hg.mountain', { n }), x, Math.max(150, y - 70), '#fff3c4', 30);
    sfx.whee();
    if (!this.mountainDone) {
      this.mountainDone = true;
      sfx.chime();
      this.refreshHud();
    }
  }

  private pop(text: string, x: number, y: number, color: string, size = 24): void {
    const txt = this.add
      .text(Phaser.Math.Clamp(x, 200, W - 200), y, text, baseStyle({ fontSize: `${size}px`, color, fontStyle: 'bold', stroke: '#123a3a', strokeThickness: 5 }))
      .setOrigin(0.5)
      .setDepth(HUD + 10);
    this.tweens.add({ targets: txt, y: y - 50, alpha: 0, delay: 700, duration: 1100, onComplete: () => txt.destroy() });
  }

  // ---- friends ------------------------------------------------------------------

  private friendThrow(): void {
    if (this.talking || this.done) return;
    const who = Math.random() < 0.5 ? 'koko' : 'gogo';
    const fr = this.friends[who];
    const sx = fr.g.x + 40;
    const x = who === 'koko' ? 160 + Math.random() * 400 : W - 160 - Math.random() * 400;
    const y = 220 + Math.random() * 320;
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 260,
      yoyo: true,
      onUpdate: (tw) => drawBack(fr.g, LOOKS[who], tw.getValue() ?? 0),
    });
    this.time.delayedCall(200, () => this.throwHandful(sx, H - 90, x, y, 8, 50));
  }

  private bubble(who: 'koko' | 'gogo', key: StrKey, ms = 3800): void {
    const fr = this.friends[who];
    const x = Phaser.Math.Clamp(fr.g.x + (who === 'koko' ? 120 : -120), 220, W - 220);
    const y = H - 170;
    const box = this.add.container(x, y).setDepth(HUD + 5);
    const txt = i18nText(this, 0, 0, () => t(key), { fontSize: '21px', color: CSS.ink, wordWrap: { width: 380, useAdvancedWrap: true } }).setOrigin(0.5);
    const bg = this.add.graphics();
    const draw = () => {
      const w = txt.width + 36;
      const h = txt.height + 24;
      bg.clear();
      bg.fillStyle(0xffffff, 0.96);
      bg.lineStyle(3, Phaser.Display.Color.HexStringToColor(who === 'koko' ? CSS.koko : CSS.gogo).color, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
      const tx = who === 'koko' ? -w / 2 + 30 : w / 2 - 30;
      bg.fillTriangle(tx - 10, h / 2 - 1, tx + 10, h / 2 - 1, tx + (who === 'koko' ? -20 : 20), h / 2 + 26);
    };
    draw();
    box.add([bg, txt]);
    box.setScale(0.6).setAlpha(0);
    this.bubbles.forEach((b) => b.destroy());
    this.bubbles = [box];
    this.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: fr.g, y: fr.g.y - 8, yoyo: true, duration: 140, repeat: 1 });
    this.time.delayedCall(ms, () => {
      if (box.active) this.tweens.add({ targets: box, alpha: 0, duration: 300, onComplete: () => box.destroy() });
    });
  }

  /** A bouncing arrow over a fish for a few seconds. */
  private pointAt(f: PondFish, ms: number): void {
    const arrow = this.add.text(f.x, f.y - 40, '▼', baseStyle({ fontSize: '30px', color: '#ffe066', stroke: '#123a3a', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD - 1);
    const until = this.time.now + ms;
    const ev = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        arrow.setPosition(f.x, f.y - 44 + Math.sin(this.time.now * 0.012) * 6);
        if (this.time.now > until) {
          ev.remove();
          arrow.destroy();
        }
      },
    });
  }

  private spawnPetal(anywhere = false): void {
    if (this.petals.length > 14) return;
    const img = this.add
      .image(anywhere ? 60 + Math.random() * (W - 120) : -20, anywhere ? 140 + Math.random() * 440 : 140 + Math.random() * 200, Math.random() < 0.6 ? 'hgPetal' : 'hgPetalRed')
      .setDepth(51)
      .setAngle(Math.random() * 360)
      .setScale(0.8 + Math.random() * 0.4);
    this.petals.push({ img, vx: 10 + Math.random() * 12, vy: 3 + Math.random() * 6, nib: 0 });
  }

  // ---- the story ------------------------------------------------------------------

  private async script(): Promise<void> {
    await wait(this, 2500);
    await this.until(() => this.throws > 0, 9000);
    await wait(this, 1500);
    const gold = this.school.fish.find((f) => f.variety === 'ogon');
    this.bubble('gogo', 'hg.p.g1', 4200);
    if (gold) this.pointAt(gold, 4500);
    await wait(this, 4800);
    this.bubble('koko', 'hg.p.k1', 3800);
    await wait(this, 4200);
    this.bubble('koko', 'hg.p.k2', 5200);

    // play until both goals are done (KOKO tops up the bag if it runs low)
    let refilled = false;
    await this.until(() => {
      if (!refilled && this.bag < HANDFUL + 2 && !(this.mountainDone && this.dexCount() >= 3)) {
        refilled = true;
        this.bag += 120;
        this.refreshHud();
        this.bubble('koko', 'hg.p.refill', 3000);
        sfx.chime();
      }
      return this.mountainDone && this.dexCount() >= 3;
    }, Infinity);
    await wait(this, 1800);

    this.done = true;
    this.talking = true;
    this.aim.clear();
    this.viewfinder.clear();
    this.bubbles.forEach((b) => b.destroy());
    this.bag = HANDFUL;
    this.refreshHud();
    const dlg = new Dialogue(this);
    await dlg.say('gogo', 'hg.p.g2');
    await dlg.say('koko', 'hg.p.k3');
    dlg.hide();
    hgRun.mountain = Math.max(hgRun.mountain, this.school.best);
    this.cameras.main.fadeOut(1000, 255, 248, 236);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('HuagangStele'));
  }

  private until(cond: () => boolean, timeout: number): Promise<void> {
    const t0 = this.time.now;
    return new Promise((resolve) => {
      const ev = this.time.addEvent({
        delay: 120,
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

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50);
    this.pond.update(time);
    this.school.update(dt, time);

    // petals drift with the current; fish nibble at them (花著鱼身鱼嘬花)
    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];
      p.img.x += (p.vx * dt) / 1000;
      p.img.y += (Math.sin(time * 0.0005 + i) * p.vy * dt) / 1000;
      p.img.angle += (dt / 1000) * 6;
      p.nib = Math.max(0, p.nib - dt / 1000);
      for (const f of this.school.fish) {
        if (p.nib > 0) break;
        if (Math.abs(f.x - p.img.x) < 24 && Math.abs(f.y - p.img.y) < 24) {
          p.nib = 0.8;
          this.school.ripple(p.img.x, p.img.y, 0.3);
          this.tweens.add({ targets: p.img, scale: p.img.scale * 0.9, yoyo: true, duration: 120 });
        }
      }
      if (p.img.x > W + 30) {
        p.img.destroy();
        this.petals.splice(i, 1);
      }
    }

    // aiming a handful, or framing a photo
    const p = this.input.activePointer;
    if (this.mode === 'feed' && this.holdStart >= 0 && !this.talking) {
      const held = this.time.now - this.holdStart;
      this.aim.clear();
      if (held >= 200) {
        const r = this.spread(held);
        this.aim.lineStyle(3, 0xffffff, 0.8);
        this.aim.strokeEllipse(p.x, p.y, r * 2, r * 1.6);
        this.aim.fillStyle(0xffffff, 0.12);
        this.aim.fillEllipse(p.x, p.y, r * 2, r * 1.6);
        this.aim.lineStyle(2, 0xffffff, 0.4);
        this.aim.lineBetween(HAND.x, H - 70, p.x, p.y);
      }
    } else if (this.mode === 'photo' && !this.talking) {
      const x = Phaser.Math.Clamp(p.x - FRAME.w / 2, 0, W - FRAME.w);
      const y = Phaser.Math.Clamp(p.y - FRAME.h / 2, 0, H - FRAME.h);
      const v = this.viewfinder;
      v.clear();
      v.lineStyle(3, 0xffffff, 0.9);
      const c = 26;
      for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + FRAME.w, y, -1, 1], [x, y + FRAME.h, 1, -1], [x + FRAME.w, y + FRAME.h, -1, -1]]) {
        v.lineBetween(cx, cy, cx + c * sx, cy);
        v.lineBetween(cx, cy, cx, cy + c * sy);
      }
      v.lineStyle(1, 0xffffff, 0.5);
      v.strokeCircle(x + FRAME.w / 2, y + FRAME.h / 2, 10);
    }
  }
}
