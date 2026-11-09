import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, CSS } from '../core/config';
import { t } from '../core/i18n';
import { sfx } from '../core/sfx';
import { tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { makeButton, type Button } from '../ui/Button';
import { Dialogue } from '../ui/Dialogue';
import { hillPolygon, rng } from '../art/paint';
import { dqRun, nextDqKey } from './state';

const RAIL = 470;
const HUD = 300;
type G = Phaser.GameObjects.Graphics;

type Variant = 'plain' | 'tea' | 'bunny' | 'bridge' | 'lady' | 'bighead';

/** A little snowman (or snow sculpture) standing on the railing at (x, RAIL). */
function drawSnowman(g: G, x: number, size: number, v: Variant): void {
  const y = RAIL;
  const body = size;
  const head = v === 'bighead' ? size * 1.05 : size * 0.68;
  const shadow = () => {
    g.fillStyle(0x6b7a86, 0.25);
    g.fillEllipse(x + 4, y + 2, body * 2.2, 10);
  };
  shadow();
  if (v === 'bridge') {
    // a little snow arch bridge
    g.fillStyle(0xffffff, 1);
    g.slice(x, y, size * 1.4, Math.PI, Math.PI * 2, false);
    g.fillPath();
    g.fillStyle(0xaab8c0, 1);
    g.slice(x, y + 1, size * 0.6, Math.PI, Math.PI * 2, false);
    g.fillPath();
    g.fillStyle(0xdfe6ec, 1);
    g.fillRect(x - size * 1.4, y - 4, size * 2.8, 4);
    return;
  }
  g.fillStyle(0xdfe6ec, 1);
  g.fillCircle(x + 3, y - body + 3, body);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(x, y - body, body);
  const hy = y - body * 2 - head * 0.8;
  const tilt = v === 'lady' ? 0.25 : 0;
  const hx = x + Math.sin(tilt) * head;
  if (v === 'bunny') {
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(hx - head * 0.45, hy - head * 1.1, head * 0.45, head * 1.2);
    g.fillEllipse(hx + head * 0.45, hy - head * 1.1, head * 0.45, head * 1.2);
    g.fillStyle(0xf7c6d6, 1);
    g.fillEllipse(hx - head * 0.45, hy - head * 1.05, head * 0.2, head * 0.8);
    g.fillEllipse(hx + head * 0.45, hy - head * 1.05, head * 0.2, head * 0.8);
  }
  g.fillStyle(0xdfe6ec, 1);
  g.fillCircle(hx + 2, hy + 2, head);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(hx, hy, head);
  // face
  g.fillStyle(0x2b2b30, 1);
  g.fillCircle(hx - head * 0.32, hy - head * 0.1, Math.max(2, head * 0.1));
  g.fillCircle(hx + head * 0.32, hy - head * 0.1, Math.max(2, head * 0.1));
  if (v === 'bunny') {
    g.fillStyle(0xe8506a, 1);
    g.fillCircle(hx, hy + head * 0.15, head * 0.1);
  } else {
    g.fillStyle(0xf08a24, 1);
    g.fillTriangle(hx, hy + head * 0.05, hx, hy + head * 0.25, hx + head * 0.5, hy + head * 0.17);
  }
  if (v === 'tea') {
    for (let i = 0; i < 6; i++) {
      g.fillStyle(i % 2 ? 0x6f9a3a : 0x5a8a2a, 1);
      g.fillEllipse(hx - head * 0.6 + i * head * 0.24, hy - head * 0.95, head * 0.3, head * 0.55);
    }
  }
  if (v === 'lady') {
    // a white veil and a hairpin, head tilted — rather like someone we met
    g.fillStyle(0xf6f8fa, 0.95);
    g.fillTriangle(hx - head * 1.1, hy - head * 0.3, hx + head * 0.9, hy - head * 0.7, hx - head * 0.2, y - body * 0.4);
    g.fillStyle(0x2f8f7a, 1);
    g.fillCircle(hx + head * 0.6, hy - head * 0.6, head * 0.14);
  }
  if (v === 'bighead') {
    g.fillStyle(0xf4d03f, 1);
    g.slice(hx, hy - head * 0.2, head * 0.9, Math.PI, Math.PI * 2, false);
    g.fillPath();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(hx, hy - head * 1.1, head * 0.2);
  }
}

interface Item {
  img: Phaser.GameObjects.Image;
  homeX: number;
  homeY: number;
  placed: boolean;
}

/** The little snowmen on the Broken Bridge's railing. */
export class DuanqiaoSnowmanScene extends Phaser.Scene {
  private items: Item[] = [];
  private body = 30;
  private head = 20;
  private doneBtn: Button | null = null;
  private building = false;

  constructor() {
    super('DuanqiaoSnowman');
  }

  create(): void {
    music.play('dqLady');
    this.items = [];
    this.building = false;
    this.paint();
    this.cameras.main.fadeIn(1000, 255, 255, 255);
    void this.play();
  }

  private paint(): void {
    const r = rng(29);
    const g = this.add.graphics().setDepth(0);
    // the snow has stopped; a pale winter sun
    g.fillGradientStyle(0xb9d8ee, 0xb9d8ee, 0xeef4f6, 0xeef4f6, 1);
    g.fillRect(0, 0, W, H);
    const sun = this.add.image(1060, 110, 'hgGlow').setScale(2.2).setTint(0xfff6d6).setAlpha(0.9).setDepth(0.5);
    this.tweens.add({ targets: sun, scale: 2.4, yoyo: true, repeat: -1, duration: 2400 });
    // 孤山 across the water, dusted white
    const pts = hillPolygon(W + 40, 300, 40, 380, 17, 12);
    g.fillStyle(0x8fa4a0, 1);
    g.fillPoints(pts, true);
    for (let i = 1; i < pts.length - 1; i += 1) {
      g.fillStyle(0xffffff, 0.85);
      g.fillEllipse(pts[i].x, pts[i].y + 8, 20, 9);
    }
    g.fillGradientStyle(0xa9bcc6, 0xa9bcc6, 0x8ea2ad, 0x8ea2ad, 1);
    g.fillRect(0, 370, W, 120);
    this.add.tileSprite(0, 370, W, 120, 'ripples').setOrigin(0).setDepth(1).setAlpha(0.3);
    // the stone railing, capped with snow
    const rail = this.add.graphics().setDepth(5);
    rail.fillStyle(0xa9a39a, 1);
    rail.fillRect(0, RAIL, W, 34);
    rail.fillStyle(0x8f897f, 1);
    rail.fillRect(0, RAIL + 34, W, H - RAIL - 34);
    rail.fillStyle(0xffffff, 1);
    rail.fillRoundedRect(0, RAIL - 6, W, 10, 4);
    for (let x = 0; x < W; x += 160) {
      rail.fillStyle(0x9b958b, 1);
      rail.fillRect(x - 14, RAIL - 30, 28, 70);
      rail.fillStyle(0xffffff, 1);
      rail.fillEllipse(x, RAIL - 32, 34, 14);
    }
    for (let i = 0; i < 40; i++) {
      rail.fillStyle(0x7f796f, 0.4);
      rail.fillEllipse(r() * W, RAIL + 50 + r() * 180, 30 + r() * 40, 6);
    }
    // other people's snowmen along the railing
    const others = this.add.graphics().setDepth(10);
    drawSnowman(others, 90, 22, 'tea');
    drawSnowman(others, 250, 26, 'bridge');
    drawSnowman(others, 1050, 24, 'lady');
    drawSnowman(others, 1200, 18, 'plain');
  }

  private async play(): Promise<void> {
    await wait(this, 800);
    const dlg = new Dialogue(this);
    await dlg.say('koko', 'dq.sm.k1');
    await dlg.say('gogo', 'dq.sm.g1');
    dlg.hide();

    // our snowman: the more snow we scraped, the bigger
    const snow = Math.min(16, dqRun.snow);
    this.body = 22 + snow * 1.6;
    this.head = this.body * 0.68;
    const me = this.add.graphics().setDepth(12);
    drawSnowman(me, 640, this.body, 'plain');
    // (no face yet: cover it with a blank head)
    me.fillStyle(0xffffff, 1);
    me.fillCircle(640, RAIL - this.body * 2 - this.head * 0.8, this.head);
    me.setScale(0.2, 0.2).setPosition(640 * 0.8, RAIL * 0.8);
    sfx.dig();
    await tweenP(this, { targets: me, scaleX: 1, scaleY: 1, x: 0, y: 0, duration: 600, ease: 'Back.easeOut' });
    const note = i18nText(this, 640, RAIL - this.body * 2 - this.head * 2 - 40, () => t(snow < 6 ? 'dq.sm.small' : 'dq.sm.big'), { fontSize: '20px', color: '#2f3b48' }).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: note, alpha: 0, delay: 2200, duration: 600 });

    await this.decorate();

    // KOKO's bunny and GOGO's big head join ours
    const friends = this.add.graphics().setDepth(11);
    drawSnowman(friends, 470, 24, 'bunny');
    friends.setAlpha(0);
    await tweenP(this, { targets: friends, alpha: 1, duration: 400 });
    await dlg.say('koko', 'dq.sm.k2');
    const gogo = this.add.graphics().setDepth(11);
    drawSnowman(gogo, 820, 22, 'bighead');
    gogo.setAlpha(0);
    await tweenP(this, { targets: gogo, alpha: 1, duration: 400 });
    await dlg.say('gogo', 'dq.sm.g2');
    dlg.hide();
    await wait(this, 300);
    this.snapshot();
    await wait(this, 1200);
    await dlg.say('me', 'dq.sm.m1');
    await dlg.say('koko', 'dq.sm.k3');
    dlg.hide();
    this.cameras.main.fadeOut(1000, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('DuanqiaoHill'));
  }

  /** Drag little things from the tray onto the snowman; "Done" when happy. */
  private decorate(): Promise<void> {
    this.building = true;
    const tray = this.add.graphics().setDepth(HUD - 2);
    tray.fillStyle(0xf6f1e7, 0.92);
    tray.fillRoundedRect(60, H - 128, W - 340, 108, 18);
    const hint = i18nText(this, W / 2, 80, () => t('dq.sm.hint'), { fontSize: '22px', color: '#2f3b48', stroke: '#ffffff', strokeThickness: 5 }).setOrigin(0.5).setDepth(HUD);
    const kinds: [string, number][] = [
      ['dqStone', 4],
      ['dqBerry', 1],
      ['dqLeaf', 2],
      ['dqTwig', 2],
      ['dqNeedle', 1],
      ['dqYarn', 1],
      ['dqTeaHat', 1],
      ['dqPersimmon', 1],
    ];
    let slot = 0;
    for (const [key, n] of kinds) {
      for (let i = 0; i < n; i++) {
        const x = 110 + slot * 66;
        const y = H - 74;
        slot++;
        const img = this.add.image(x, y, key).setDepth(HUD).setInteractive({ useHandCursor: true, draggable: true });
        this.items.push({ img, homeX: x, homeY: y, placed: false });
      }
    }
    const cx = 640;
    const bodyY = RAIL - this.body;
    const headY = RAIL - this.body * 2 - this.head * 0.8;
    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, x: number, y: number) => {
      obj.setPosition(x, y).setDepth(HUD + 1);
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      const it = this.items.find((i) => i.img === obj);
      if (!it) return;
      const onHead = Math.hypot(obj.x - cx, obj.y - headY) < this.head + 14;
      const onBody = Math.hypot(obj.x - cx, obj.y - bodyY) < this.body + 18;
      if (onHead || onBody) {
        it.placed = true;
        obj.setDepth(13);
        // arms point outwards from the body
        const key = obj.texture.key;
        if (key === 'dqLeaf' || key === 'dqTwig') {
          const a = Math.atan2(obj.y - bodyY, obj.x - cx);
          obj.setAngle(Phaser.Math.RadToDeg(a)).setOrigin(0.05, 0.5);
        } else if (key === 'dqYarn') obj.setAngle(0);
        sfx.stamp();
        this.tweens.add({ targets: obj, scale: { from: 1.3, to: 1 }, duration: 200 });
      } else {
        it.placed = false;
        obj.setAngle(0).setOrigin(0.5);
        this.tweens.add({ targets: obj, x: it.homeX, y: it.homeY, duration: 250 });
        obj.setDepth(HUD);
      }
      this.doneBtn?.setEnabled(this.items.filter((i) => i.placed).length >= 3);
    });
    return new Promise((resolve) => {
      this.doneBtn = makeButton(this, W - 150, H - 74, () => t('dq.sm.done'), {
        width: 180,
        height: 70,
        fontSize: 28,
        depth: HUD + 2,
        fill: 0xc0392b,
        stroke: 0x7b241c,
        textColor: '#fff8ee',
        onClick: () => {
          if (this.items.filter((i) => i.placed).length < 3) return;
          this.building = false;
          sfx.chime();
          for (const it of this.items) {
            if (!it.placed) it.img.destroy();
            else it.img.disableInteractive();
          }
          tray.destroy();
          hint.destroy();
          this.doneBtn?.destroy();
          resolve();
        },
      });
      this.doneBtn.setEnabled(false);
    });
  }

  private snapshot(): void {
    const key = nextDqKey('snowmen');
    const x = 340;
    const y = 150;
    const w = 600;
    const h = 400;
    this.game.renderer.snapshotArea(x, y, w, h, (img) => {
      sfx.shutter();
      const flash = this.add.rectangle(0, 0, W, H, 0xffffff, 0.8).setOrigin(0).setDepth(HUD + 10);
      this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
      if (img instanceof HTMLImageElement) {
        const add = () => {
          if (!this.textures.exists(key)) this.textures.addImage(key, img);
          dqRun.photoSnowmen = key;
        };
        if (img.complete) add();
        else img.onload = add;
      }
      const txt = this.add.text(W / 2, 110, t('dq.sm.photo'), baseStyle({ fontSize: '26px', color: CSS.ink, stroke: '#ffffff', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD);
      this.tweens.add({ targets: txt, alpha: 0, delay: 1400, duration: 500, onComplete: () => txt.destroy() });
    });
  }

  update(): void {
    void this.building;
  }
}
