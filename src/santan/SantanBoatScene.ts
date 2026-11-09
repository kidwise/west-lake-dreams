import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { i18nText, onLang, baseStyle } from '../ui/text';
import { makeButton, type Button } from '../ui/Button';
import { Dialogue } from '../ui/Dialogue';
import { drawHead, LOOKS } from '../art/Cyclist';
import { sfx } from '../core/sfx';
import { LakeView } from './LakeView';
import { createDreamNote } from './art';
import { santanRun, nextSantanPhotoKey } from './state';
import {
  VIEW_H,
  FRAME,
  MATCH,
  START,
  LAKE,
  ISLAND,
  OBJECTS,
  TARGETS,
  similarity,
  wholeMatch,
  collide,
  type Pose,
  type TargetId,
} from './world';

const PART_KEY: Record<TargetId, StrKey> = {
  near: 'santan.part.near',
  pair: 'santan.part.pair',
  far: 'santan.part.far',
};
const HINT_KEY: Record<TargetId, StrKey> = {
  near: 'santan.c.hintNear',
  pair: 'santan.c.hintPair',
  far: 'santan.c.hintFar',
};
const HINT_DELAY = 45000;

// mini-map
const MAP = { x: 150, y: 612, r: 92 };
const mapK = MAP.r / LAKE.r;
const toMap = (x: number, y: number) => ({ x: MAP.x + (x - LAKE.x) * mapK, y: MAP.y - (y - LAKE.y) * mapK });

interface Slot {
  id: TargetId;
  x: number;
  thumb: Phaser.GameObjects.Image | null;
  bar: Phaser.GameObjects.Graphics;
  pct: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
}

/** Rowing around 三潭印月, looking for the three views printed on the note. */
export class SantanBoatScene extends Phaser.Scene {
  private view!: LakeView;
  private pose: Pose = { ...START };
  private speed = 0;
  private turnHeld = 0;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private btn = {} as Record<'left' | 'right' | 'fwd' | 'back' | 'note' | 'photo', Button>;
  private frameG!: Phaser.GameObjects.Graphics;
  private closest!: Phaser.GameObjects.Text;
  private slots: Slot[] = [];
  private whole!: Phaser.GameObjects.Text;
  private mapBoat!: Phaser.GameObjects.Graphics;
  private hintRing!: Phaser.GameObjects.Graphics;
  private hintTarget: TargetId | null = null;
  private nextHintAt = 0;
  private flash!: Phaser.GameObjects.Rectangle;
  private toast!: Phaser.GameObjects.Text;
  private noteOverlay!: Phaser.GameObjects.Container;
  private chat!: Phaser.GameObjects.Container;
  private chatText!: Phaser.GameObjects.Text;
  private chatHead!: Phaser.GameObjects.Graphics;
  private chatName!: Phaser.GameObjects.Text;
  private chatKey: StrKey | null = null;
  private hint!: Phaser.GameObjects.Text;
  private chatQueue: { who: 'koko' | 'gogo'; key: StrKey }[] = [];
  private chatUntil = 0;
  private said = new Set<string>();
  private locked = false;
  private photoReady = true;
  private sims: Record<TargetId, number> = { near: 0, pair: 0, far: 0 };

  constructor() {
    super('SantanBoat');
  }

  create(): void {
    music.play('moonlake');
    this.pose = { ...START };
    this.speed = 0;
    this.locked = false;
    this.photoReady = true;
    this.slots = [];
    this.said = new Set();
    this.chatQueue = [];
    this.chatKey = null;
    this.hintTarget = null;
    this.nextHintAt = this.time.now + HINT_DELAY;

    this.view = new LakeView(this);
    this.buildFrame();
    this.buildDeck();
    this.buildChat();
    this.buildNoteOverlay();
    this.setupInput();

    const touch = this.sys.game.device.input.touch;
    const hint = (this.hint = i18nText(this, W / 2, VIEW_H - 22, () => t(touch ? 'santan.hintTouch' : 'santan.hintKeys'), {
      fontSize: '18px',
      color: '#fff8ee',
      backgroundColor: '#2f3b3acc',
      padding: { x: 14, y: 6 },
    })
      .setOrigin(0.5)
      .setDepth(700));
    this.tweens.add({ targets: hint, alpha: 0, delay: 10000, duration: 1000 });

    this.say('koko', 'santan.c.start1');
    this.say('gogo', 'santan.c.start2');
    this.cameras.main.fadeIn(900, 248, 217, 166);
  }

  // ------------------------------------------------------------------ UI

  private buildFrame(): void {
    this.frameG = this.add.graphics().setDepth(600);
    this.closest = this.add
      .text(FRAME.x + FRAME.w / 2, FRAME.y - 18, '', baseStyle({ fontSize: '17px', color: '#fff8ee', backgroundColor: '#2f3b3a99', padding: { x: 10, y: 3 } }))
      .setOrigin(0.5)
      .setDepth(601);
    this.flash = this.add.rectangle(0, 0, W, H, 0xffffff, 1).setOrigin(0).setDepth(2000).setAlpha(0);
    this.toast = this.add
      .text(W / 2, 120, '', baseStyle({ fontSize: '24px', color: '#fff8ee', backgroundColor: '#c0392bdd', padding: { x: 16, y: 8 } }))
      .setOrigin(0.5)
      .setDepth(1500)
      .setAlpha(0);
  }

  private drawFrame(best: number): void {
    const g = this.frameG;
    const f = FRAME;
    const color = best >= MATCH ? 0x7dffb0 : best >= 0.45 ? 0xffe08a : 0xffffff;
    g.clear();
    g.lineStyle(1.5, color, 0.5);
    g.strokeRect(f.x, f.y, f.w, f.h);
    g.lineStyle(5, color, 1);
    const c = 34;
    for (const [x, y, dx, dy] of [
      [f.x, f.y, 1, 1],
      [f.x + f.w, f.y, -1, 1],
      [f.x, f.y + f.h, 1, -1],
      [f.x + f.w, f.y + f.h, -1, -1],
    ]) {
      g.lineBetween(x, y, x + dx * c, y);
      g.lineBetween(x, y, x, y + dy * c);
    }
    g.lineStyle(1, color, 0.35);
    g.lineBetween(f.x + f.w / 3, f.y, f.x + f.w / 3, f.y + f.h);
    g.lineBetween(f.x + (2 * f.w) / 3, f.y, f.x + (2 * f.w) / 3, f.y + f.h);
  }

  private buildDeck(): void {
    const D = 800;
    const deck = this.add.graphics().setDepth(D);
    deck.fillStyle(0x5b3d29, 1);
    deck.fillRect(0, VIEW_H, W, H - VIEW_H);
    deck.fillStyle(0x3d2819, 1);
    deck.fillRect(0, VIEW_H, W, 8);
    for (let y = VIEW_H + 44; y < H; y += 44) {
      deck.lineStyle(2, 0x4a3122, 1);
      deck.lineBetween(0, y, W, y);
    }
    for (let i = 0; i < 40; i++) {
      deck.fillStyle(0x6b4a33, 0.5);
      deck.fillRect((i * 173) % W, VIEW_H + 12 + ((i * 59) % (H - VIEW_H - 20)), 60 + (i % 5) * 20, 2);
    }

    // mini-map (ink on paper)
    const map = this.add.graphics().setDepth(D + 1);
    map.fillStyle(0xf3ead7, 1);
    map.fillRoundedRect(MAP.x - MAP.r - 14, MAP.y - MAP.r - 14, (MAP.r + 14) * 2, (MAP.r + 14) * 2, 14);
    map.fillStyle(0xa8c6cc, 1);
    map.fillCircle(MAP.x, MAP.y, MAP.r);
    const isl = toMap(ISLAND.x, ISLAND.y);
    map.fillStyle(0x6d8b58, 1);
    map.fillCircle(isl.x, isl.y, ISLAND.r * mapK + 1);
    map.fillStyle(0x86a46c, 1);
    map.fillCircle(isl.x - 2, isl.y - 2, ISLAND.r * mapK - 3);
    for (const o of OBJECTS) {
      if (o.tex === 'santanPagoda') {
        const m = toMap(o.x, o.y);
        map.fillStyle(0x3f3b35, 1);
        map.fillCircle(m.x, m.y, 2.6);
      }
      if (o.id === 'pavilion') {
        const m = toMap(o.x, o.y);
        map.fillStyle(0xa33b2c, 1);
        map.fillRect(m.x - 2.5, m.y - 2.5, 5, 5);
      }
    }
    map.lineStyle(2, 0x2f3b3a, 0.8);
    map.strokeCircle(MAP.x, MAP.y, MAP.r);
    this.add.text(MAP.x, MAP.y - MAP.r - 2, 'N', baseStyle({ fontSize: '14px', fontStyle: 'bold' })).setOrigin(0.5, 1).setDepth(D + 2);
    this.hintRing = this.add.graphics().setDepth(D + 2);
    this.mapBoat = this.add.graphics().setDepth(D + 3);

    // photo slots + similarity meters
    const ids: TargetId[] = ['near', 'pair', 'far'];
    ids.forEach((id, i) => {
      const x = 420 + i * 150;
      const card = this.add.graphics().setDepth(D + 1);
      card.fillStyle(0xf3ead7, 1);
      card.fillRoundedRect(x - 64, 516, 128, 128, 10);
      card.lineStyle(2, 0x9c8b70, 1);
      card.strokeRoundedRect(x - 58, 522, 116, 116, 6);
      const label = i18nText(this, x, 580, () => t(PART_KEY[id]), { fontFamily: FONT_SERIF, fontSize: '24px', color: '#9c8b70' })
        .setOrigin(0.5)
        .setDepth(D + 2);
      const bar = this.add.graphics().setDepth(D + 2);
      const pct = this.add.text(x, 680, '', baseStyle({ fontSize: '15px', color: '#f3ead7' })).setOrigin(0.5).setDepth(D + 2);
      this.slots.push({ id, x, thumb: null, bar, pct, label });
    });
    this.whole = this.add.text(570, 704, '', baseStyle({ fontSize: '16px', color: '#e8c9a0' })).setOrigin(0.5).setDepth(D + 2);

    // controls
    const B = (x: number, y: number, label: () => string, w = 74, h = 64, fill = 0xf3ead7) =>
      makeButton(this, x, y, label, { width: w, height: h, fontSize: 26, depth: D + 5, fill });
    this.btn.note = B(830, 545, () => t('santan.btnNote'), 92, 52);
    this.btn.fwd = B(1000, 548, () => '▲');
    this.btn.left = B(918, 622, () => '◀');
    this.btn.back = B(1000, 622, () => '▼');
    this.btn.right = B(1082, 622, () => '▶');
    this.btn.photo = makeButton(this, 1196, 588, () => `◉\n${t('santan.btnPhoto')}`, {
      width: 112,
      height: 128,
      fontSize: 24,
      depth: D + 5,
      fill: 0xfbe3ec,
      onClick: () => this.takePhoto(),
    });
  }

  private buildChat(): void {
    const bg = this.add.graphics();
    this.chatHead = this.add.graphics();
    this.chatName = this.add.text(78, -30, '', baseStyle({ fontSize: '17px', fontStyle: 'bold' }));
    this.chatText = this.add.text(78, -6, '', baseStyle({ fontSize: '18px', wordWrap: { width: 296, useAdvancedWrap: true }, lineSpacing: 4 }));
    this.chat = this.add.container(22, 420, [bg, this.chatHead, this.chatName, this.chatText]).setDepth(650).setAlpha(0);
    this.chat.setData('bg', bg);
    onLang(this, () => {
      if (this.chatKey) this.layoutChat(this.chatKey);
    });
  }

  private layoutChat(key: StrKey): void {
    this.chatText.setText(t(key));
    const h = Math.max(70, this.chatText.height + 46);
    const bg = this.chat.getData('bg') as Phaser.GameObjects.Graphics;
    bg.clear();
    bg.fillStyle(0xfdf8ee, 0.95);
    bg.fillRoundedRect(0, -42, 384, h, 16);
    bg.lineStyle(2, 0x2f3b3a, 0.35);
    bg.strokeRoundedRect(0, -42, 384, h, 16);
    this.chat.y = 470 - h;
  }

  private say(who: 'koko' | 'gogo', key: StrKey): void {
    this.chatQueue.push({ who, key });
  }

  private sayOnce(id: string, who: 'koko' | 'gogo', key: StrKey): void {
    if (this.said.has(id)) return;
    this.said.add(id);
    this.say(who, key);
  }

  private pumpChat(now: number): void {
    if (now < this.chatUntil) return;
    const next = this.chatQueue.shift();
    if (!next) {
      if (this.chatKey && now > this.chatUntil) {
        this.chatKey = null;
        this.tweens.add({ targets: this.chat, alpha: 0, duration: 400 });
      }
      return;
    }
    this.chatKey = next.key;
    this.chatHead.clear();
    this.chatHead.fillStyle(next.who === 'koko' ? 0xfbe3ec : 0xdbeaf6, 1);
    this.chatHead.fillCircle(40, 0, 28);
    drawHead(this.chatHead, 40, 4, LOOKS[next.who], 1);
    this.chatHead.setScale(1);
    this.chatName.setText(next.who === 'koko' ? 'KOKO' : 'GOGO').setColor(next.who === 'koko' ? CSS.koko : CSS.gogo);
    this.layoutChat(next.key);
    this.chat.setAlpha(1);
    sfx.blip();
    this.chatUntil = now + 4200;
  }

  private buildNoteOverlay(): void {
    const shade = this.add.rectangle(0, 0, W, H, 0x10151f, 0.55).setOrigin(0);
    const note = createDreamNote(this, W / 2, VIEW_H / 2 + 10, 0.95);
    this.noteOverlay = this.add.container(0, 0, [shade, note]).setDepth(1800).setVisible(false);
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: kb.addKey(K.LEFT),
      a: kb.addKey(K.A),
      right: kb.addKey(K.RIGHT),
      d: kb.addKey(K.D),
      up: kb.addKey(K.UP),
      w: kb.addKey(K.W),
      down: kb.addKey(K.DOWN),
      s: kb.addKey(K.S),
      n: kb.addKey(K.N),
    };
    kb.on('keydown-SPACE', () => this.takePhoto());
  }

  // ------------------------------------------------------------------ photos

  private takePhoto(): void {
    if (this.locked || !this.photoReady) return;
    this.photoReady = false;
    this.time.delayedCall(450, () => (this.photoReady = true));
    sfx.shutter();

    const fresh = TARGETS.filter((tg) => !santanRun.photos[tg.id]).map((tg) => ({ tg, s: this.sims[tg.id] }));
    fresh.sort((a, b) => b.s - a.s);
    const hit = fresh.find((f) => f.s >= MATCH);
    const doFlash = () => {
      this.flash.setAlpha(0.9);
      this.tweens.add({ targets: this.flash, alpha: 0, duration: 300 });
    };

    if (hit) {
      const id = hit.tg.id;
      const key = nextSantanPhotoKey(id);
      santanRun.photos[id] = key; // reserve immediately
      // keep the UI out of the picture
      const hide = [this.frameG, this.closest, this.chat, this.toast, this.hint];
      hide.forEach((o) => o.setVisible(false));
      this.view.setBowVisible(false);
      this.game.renderer.snapshotArea(FRAME.x, FRAME.y, FRAME.w, FRAME.h, (snap) => {
        hide.forEach((o) => o.setVisible(true));
        this.view.setBowVisible(true);
        doFlash();
        this.showToast(t('santan.snapGood', { name: t(PART_KEY[id]) }), '#2e8b57dd');
        if (snap instanceof HTMLImageElement) {
          const add = () => {
            if (!this.textures.exists(key)) this.textures.addImage(key, snap);
            this.fillSlot(id, key);
          };
          if (snap.complete) add();
          else snap.onload = add;
        }
      });
      sfx.bell();
      this.nextHintAt = this.time.now + HINT_DELAY;
      if (this.hintTarget === id) this.hintTarget = null;
      const count = Object.keys(santanRun.photos).length;
      if (count === 1) this.say('koko', 'santan.c.got1');
      if (count === 2) this.say('gogo', 'santan.c.got2');
      if (count === 3) this.time.delayedCall(1400, () => void this.reveal());
      return;
    }

    doFlash();
    const dup = TARGETS.find((tg) => santanRun.photos[tg.id] && this.sims[tg.id] >= MATCH);
    if (dup) {
      this.showToast(t('santan.snapDup', { name: t(PART_KEY[dup.id]) }), '#2f3b3acc');
    } else if (wholeMatch(this.pose) >= 2) {
      this.showToast(t('santan.snapWhole'), '#5b3a5edd');
      this.sayOnce('whole', 'gogo', 'santan.c.whole');
    } else {
      const best = fresh[0] ?? { tg: TARGETS[0], s: this.sims.near };
      this.showToast(t('santan.snapMiss', { name: t(PART_KEY[best.tg.id]), p: Math.round(best.s * 100) }), '#2f3b3acc');
    }
  }

  private fillSlot(id: TargetId, key: string): void {
    const slot = this.slots.find((s) => s.id === id);
    if (!slot) return;
    slot.thumb?.destroy();
    slot.thumb = this.add.image(slot.x, 580, key).setDepth(803).setScale(112 / FRAME.w).setAngle(-3);
    slot.label.setVisible(false);
    this.tweens.add({ targets: slot.thumb, angle: 2, scale: { from: 0.6, to: 112 / FRAME.w }, duration: 500, ease: 'Back.easeOut' });
  }

  private showToast(msg: string, bg: string): void {
    this.tweens.killTweensOf(this.toast);
    this.toast.setText(msg).setBackgroundColor(bg).setAlpha(1).setY(120);
    this.tweens.add({ targets: this.toast, alpha: 0, y: 100, delay: 1500, duration: 500 });
  }

  // ------------------------------------------------------------------ the reveal

  private async reveal(): Promise<void> {
    this.locked = true;
    this.speed = 0;
    this.chatQueue = [];
    this.chat.setAlpha(0);
    const dlg = new Dialogue(this);
    await dlg.say('koko', 'santan.r1');
    await dlg.say('gogo', 'santan.r2');
    await dlg.say('me', 'santan.r3');
    await dlg.say('koko', 'santan.r4');
    dlg.hide();
    sfx.chime();
    this.cameras.main.fadeOut(1000, 248, 217, 166);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('SantanPuzzle'));
  }

  // ------------------------------------------------------------------ loop

  update(time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 50) / 1000;
    const k = this.keys;
    const b = this.btn;

    const showNote = !this.locked && (k.n.isDown || b.note.isDown());
    this.noteOverlay.setVisible(showNote);

    if (!this.locked) {
      const left = k.left.isDown || k.a.isDown || b.left.isDown();
      const right = k.right.isDown || k.d.isDown || b.right.isDown();
      const fwd = k.up.isDown || k.w.isDown || b.fwd.isDown();
      const back = k.down.isDown || k.s.isDown || b.back.isDown();
      // turning starts slow for fine aiming, then speeds up
      if (left || right) this.turnHeld += dt;
      else this.turnHeld = 0;
      const turnRate = 12 + Math.min(1, this.turnHeld / 0.8) * 40;
      if (left) this.pose.heading -= turnRate * dt;
      if (right) this.pose.heading += turnRate * dt;
      this.pose.heading = ((this.pose.heading % 360) + 360) % 360;
      if (fwd) this.speed = Math.min(11, this.speed + 7 * dt);
      else if (back) this.speed = Math.max(-4, this.speed - 7 * dt);
      else this.speed *= Math.pow(0.35, dt);
      if (Math.abs(this.speed) < 0.05) this.speed = 0;
      const rad = (this.pose.heading * Math.PI) / 180;
      const next = collide({ x: this.pose.x + Math.sin(rad) * this.speed * dt, y: this.pose.y + Math.cos(rad) * this.speed * dt });
      this.pose.x = next.x;
      this.pose.y = next.y;
    }

    this.view.render(this.pose, time, this.speed * dt * 60);

    // similarity meters
    let best: { id: TargetId; s: number } = { id: 'near', s: 0 };
    for (const tg of TARGETS) {
      const s = similarity(this.pose, tg);
      this.sims[tg.id] = s;
      if (!santanRun.photos[tg.id] && s > best.s) best = { id: tg.id, s };
    }
    const whole = wholeMatch(this.pose);
    santanRun.bestWhole = Math.max(santanRun.bestWhole, whole);
    this.drawFrame(best.s);
    this.closest.setText(best.s > 0.05 ? t('santan.closest', { name: t(PART_KEY[best.id]), p: Math.round(best.s * 100) }) : '');
    for (const slot of this.slots) {
      const s = this.sims[slot.id];
      const done = !!santanRun.photos[slot.id];
      slot.bar.clear();
      slot.bar.fillStyle(0x2a1b11, 1);
      slot.bar.fillRoundedRect(slot.x - 58, 656, 116, 10, 5);
      slot.bar.fillStyle(done ? 0x2e8b57 : s >= MATCH ? 0x7dffb0 : s >= 0.45 ? 0xffd166 : 0xd9c6a5, 1);
      slot.bar.fillRoundedRect(slot.x - 58, 656, Math.max(6, 116 * (done ? 1 : s)), 10, 5);
      slot.pct.setText(done ? '✓' : `${Math.round(s * 100)}%`);
    }
    this.whole.setText(t('santan.whole', { n: whole })).setColor(whole >= 2 ? '#ffd166' : '#e8c9a0');
    if (best.s >= 0.45) this.sayOnce('warm', 'koko', 'santan.c.warm');
    if (whole >= 2) this.sayOnce('whole', 'gogo', 'santan.c.whole');

    // hints after a while without progress
    if (!this.locked && time > this.nextHintAt) {
      const remaining = TARGETS.filter((tg) => !santanRun.photos[tg.id]);
      if (remaining.length) {
        remaining.sort((a, b2) => Math.hypot(a.pose.x - this.pose.x, a.pose.y - this.pose.y) - Math.hypot(b2.pose.x - this.pose.x, b2.pose.y - this.pose.y));
        this.hintTarget = remaining[0].id;
        this.say('koko', HINT_KEY[this.hintTarget]);
        this.say('gogo', 'santan.c.hintMap');
      }
      this.nextHintAt = time + HINT_DELAY;
    }
    this.drawMap(time);
    this.pumpChat(time);
  }

  private drawMap(time: number): void {
    const g = this.mapBoat;
    g.clear();
    const m = toMap(this.pose.x, this.pose.y);
    const rad = (this.pose.heading * Math.PI) / 180;
    // field of view of the photo frame
    const half = (9.5 * Math.PI) / 180;
    g.fillStyle(0xfff3c4, 0.45);
    g.fillTriangle(m.x, m.y, m.x + Math.sin(rad - half) * 60, m.y - Math.cos(rad - half) * 60, m.x + Math.sin(rad + half) * 60, m.y - Math.cos(rad + half) * 60);
    g.fillStyle(0xc0392b, 1);
    g.fillTriangle(
      m.x + Math.sin(rad) * 8,
      m.y - Math.cos(rad) * 8,
      m.x + Math.sin(rad + 2.5) * 6,
      m.y - Math.cos(rad + 2.5) * 6,
      m.x + Math.sin(rad - 2.5) * 6,
      m.y - Math.cos(rad - 2.5) * 6,
    );

    const h = this.hintRing;
    h.clear();
    if (this.hintTarget && !santanRun.photos[this.hintTarget]) {
      const tg = TARGETS.find((x) => x.id === this.hintTarget)!;
      const p = toMap(tg.pose.x, tg.pose.y);
      const pulse = 6 + (Math.sin(time * 0.006) + 1) * 4;
      h.lineStyle(2.5, 0xffd166, 1);
      h.strokeCircle(p.x, p.y, pulse);
      const hr = (tg.pose.heading * Math.PI) / 180;
      h.lineStyle(2, 0xffd166, 0.9);
      h.lineBetween(p.x, p.y, p.x + Math.sin(hr) * 18, p.y - Math.cos(hr) * 18);
    }
  }
}
