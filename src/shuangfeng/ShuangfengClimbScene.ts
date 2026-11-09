import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue, type Speaker } from '../ui/Dialogue';
import { makeButton, type Button } from '../ui/Button';
import { overGlobalUI } from '../ui/overlay';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { rng } from '../art/paint';
import { drawPorter } from './art';
import { sfRun } from './state';

const BENDS = 36;
const SEG_H = 150;
const DX = 240;
const HUD = 300;
const BASE_SPEED = 165;
/** The porter reaches the top after this many seconds. */
const PORTER_TIME = 66;
const FACTS: Record<number, StrKey> = { 9: 'sf.c.n.tao', 19: 'sf.c.n.ling', 28: 'sf.c.n.stone' };

type Pt = { x: number; y: number };
type Mode = 'walk' | 'wait' | 'detour' | 'back' | 'done';

/** 北高峰 · 三十六弯: up the switchbacks in the mist, racing a porter to the top. */
export class ShuangfengClimbScene extends Phaser.Scene {
  private nodes: Pt[] = [];
  private wrongEnd: Pt[] = [];
  private segG: Phaser.GameObjects.Graphics[] = [];
  private wrongG: Phaser.GameObjects.Container[] = [];
  private seg = 0;
  private u = 0;
  private mode: Mode = 'walk';
  private detourU = 0;
  private choice: -1 | 1 | 0 = 0;
  private waited = false;
  private detoured = false;
  private combo = 0;
  private boostUntil = 0;
  private milk = 3;
  private active = false;
  private startTime = 0;
  private porterT = 0;
  private trail: Pt[] = [];
  private kids: Phaser.GameObjects.Graphics[] = [];
  private porter!: Phaser.GameObjects.Graphics;
  private bendText!: Phaser.GameObjects.Text;
  private milkBtn: Button | null = null;
  private bar!: Phaser.GameObjects.Graphics;
  private comboText!: Phaser.GameObjects.Text;

  constructor() {
    super('ShuangfengClimb');
  }

  create(): void {
    music.play('sfClimb');
    Object.assign(this, { seg: 0, u: 0, mode: 'walk', detourU: 0, choice: 0, waited: false, detoured: false, combo: 0, boostUntil: 0, milk: 3, active: false, porterT: 0 });
    this.trail = [];
    this.kids = [];
    this.segG = [];
    this.wrongG = [];
    this.milkBtn = null;
    this.buildPath();
    this.paintMountain();
    this.buildKids();
    this.buildHud();
    this.cameras.main.setScroll(0, this.nodes[0].y - 470);
    this.cameras.main.fadeIn(900, 240, 244, 240);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.active || overGlobalUI(p)) return;
      if (this.milkBtn && Math.abs(p.x - this.milkBtn.container.x) < 110 && Math.abs(p.y - this.milkBtn.container.y) < 40) return;
      this.pick(p.x < W / 2 ? -1 : 1);
    });
    const kb = this.input.keyboard;
    kb?.on('keydown-LEFT', () => this.active && this.pick(-1));
    kb?.on('keydown-A', () => this.active && this.pick(-1));
    kb?.on('keydown-RIGHT', () => this.active && this.pick(1));
    kb?.on('keydown-D', () => this.active && this.pick(1));
    kb?.on('keydown-SPACE', () => this.active && this.drink());
    kb?.on('keydown-UP', () => this.active && this.drink());
    void this.play();
  }

  // ---- the path ------------------------------------------------------------------------------

  private buildPath(): void {
    const r = rng(36);
    this.nodes = [{ x: 640, y: 0 }];
    this.wrongEnd = [{ x: 0, y: 0 }];
    let x = 640;
    for (let i = 1; i <= BENDS + 1; i++) {
      let dir = r() < 0.5 ? -1 : 1;
      if (x + dir * DX > 960 || x + dir * DX < 320) dir = -dir;
      // the first few alternate, like real switchbacks, to learn the idea
      if (i <= 3) dir = i % 2 ? 1 : -1;
      x += dir * DX;
      this.nodes.push({ x, y: -i * SEG_H });
    }
    // from bend i, the wrong way heads off the other side into the bamboo
    for (let i = 1; i <= BENDS; i++) {
      const a = this.nodes[i];
      const b = this.nodes[i + 1];
      const dir = Math.sign(b.x - a.x);
      this.wrongEnd.push({ x: a.x - dir * DX * 0.55, y: a.y - SEG_H * 0.55 });
    }
  }

  private paintMountain(): void {
    const top = this.nodes[this.nodes.length - 1].y - 500;
    const bottom = 400;
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x6f9a72, 0x6f9a72, 0x3f6a4a, 0x3f6a4a, 1);
    g.fillRect(0, top, W, bottom - top);
    // the forest floor: patches of moss and shade, ferns, leaf litter and stones
    const fr = rng(19);
    for (let i = 0; i < 260; i++) {
      const x = fr() * W;
      const y = top + fr() * (bottom - top);
      g.fillStyle(fr() < 0.5 ? 0x4f7a52 : 0x86ae7a, 0.35);
      g.fillEllipse(x, y, 60 + fr() * 120, 20 + fr() * 40);
    }
    for (let i = 0; i < 520; i++) {
      const x = fr() * W;
      const y = top + fr() * (bottom - top);
      const k = fr();
      if (k < 0.45) {
        // a fern
        g.lineStyle(1.4, 0x3a6a3e, 0.9);
        for (let a = -2; a <= 2; a++) g.lineBetween(x, y, x + a * 6, y - 10 + Math.abs(a) * 2);
      } else if (k < 0.8) {
        g.fillStyle([0xa88a4a, 0x8a6a3a, 0xb89a5a][i % 3], 0.6);
        g.fillEllipse(x, y, 5, 2.4);
      } else {
        g.fillStyle(0x000000, 0.12);
        g.fillEllipse(x + 2, y + 3, 16, 6);
        g.fillStyle(0x9a988a, 1);
        g.fillEllipse(x, y, 14, 8);
        g.fillStyle(0xc8c6b8, 1);
        g.fillEllipse(x - 2, y - 2, 7, 3);
      }
    }
    // trees, kept clear of the path
    const r = rng(7);
    const near = (x: number, y: number) => {
      for (let i = 0; i < this.nodes.length - 1; i++) {
        if (distToSeg({ x, y }, this.nodes[i], this.nodes[i + 1]) < 80) return true;
        if (i >= 1 && i <= BENDS && distToSeg({ x, y }, this.nodes[i], this.wrongEnd[i]) < 70) return true;
      }
      return false;
    };
    for (let k = 0; k < 420; k++) {
      const x = r() * W;
      const y = top + r() * (bottom - top);
      if (near(x, y)) continue;
      const pine = r() < 0.55;
      this.add.image(x, y, pine ? 'sfPine' : 'sfBamboo').setOrigin(0.5, 1).setScale(0.45 + r() * 0.35).setDepth(2 + y / 10000).setTint(r() < 0.5 ? 0xffffff : 0xcfe0cf);
    }
    // the stone steps, one segment at a time (revealed as the mist clears)
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const seg = this.add.graphics().setDepth(3);
      drawSteps(seg, this.nodes[i], this.nodes[i + 1]);
      // a landing at each bend, with a little stone post
      const n = this.nodes[i + 1];
      seg.fillStyle(0x9a8f7a, 1);
      seg.fillEllipse(n.x, n.y, 70, 40);
      seg.fillStyle(0xb8ad96, 1);
      seg.fillEllipse(n.x, n.y - 3, 60, 32);
      if (i + 1 <= BENDS) {
        seg.fillStyle(0x7a7468, 1);
        seg.fillRect(n.x + 26, n.y - 34, 10, 30);
        seg.fillStyle(0x8f897c, 1);
        seg.fillRect(n.x + 24, n.y - 38, 14, 6);
      }
      seg.setAlpha(i < 1 ? 1 : 0);
      this.segG.push(seg);
    }
    // the wrong ways: a muddy trail that ends in bamboo
    this.wrongG.push(this.add.container(0, 0));
    for (let i = 1; i <= BENDS; i++) {
      const c = this.add.container(0, 0).setDepth(3).setAlpha(0);
      const g2 = this.add.graphics();
      const a = this.nodes[i];
      const b = this.wrongEnd[i];
      g2.lineStyle(26, 0x6a5a3a, 1);
      g2.lineBetween(a.x, a.y, b.x, b.y);
      g2.lineStyle(18, 0x7f6c48, 1);
      g2.lineBetween(a.x, a.y, b.x, b.y);
      c.add(g2);
      for (let k = 0; k < 3; k++) c.add(this.add.image(b.x + (k - 1) * 26, b.y + 20 - (k % 2) * 8, 'sfBamboo').setOrigin(0.5, 1).setScale(0.55).setDepth(4));
      this.wrongG.push(c);
    }
    // the summit
    const s = this.nodes[this.nodes.length - 1];
    g.fillStyle(0x8a9a7a, 1);
    g.fillEllipse(s.x, s.y - 20, 420, 140);
  }

  private buildKids(): void {
    for (const who of ['me', 'gogo', 'koko'] as const) {
      const g = this.add.graphics().setDepth(20);
      drawPerson(g, LOOKS[who], { facing: 1, backpack: who === 'me' });
      g.setScale(0.5);
      this.kids.push(g);
    }
    this.porter = this.add.graphics().setDepth(19).setScale(0.55);
    drawPorter(this.porter, 0);
    const p = this.nodes[0];
    for (let i = 0; i < 40; i++) this.trail.push({ x: p.x - 40 + i, y: p.y + 20 });
    this.kids.forEach((k) => k.setPosition(p.x, p.y + 18));
    this.porter.setPosition(p.x - 70, p.y + 18);
  }

  private buildHud(): void {
    const chapter = i18nText(this, 36, 38, () => t('sf.c.title'), { fontFamily: FONT_SERIF, fontSize: '22px', color: '#ffffff', stroke: '#2f4a3a', strokeThickness: 5 }).setScrollFactor(0).setDepth(HUD);
    void chapter;
    this.bendText = this.add.text(36, 76, '', baseStyle({ fontSize: '20px', color: '#ffffff', stroke: '#2f4a3a', strokeThickness: 4 })).setScrollFactor(0).setDepth(HUD);
    this.comboText = this.add.text(36, 108, '', baseStyle({ fontSize: '18px', color: '#ffe9a8', stroke: '#2f4a3a', strokeThickness: 4 })).setScrollFactor(0).setDepth(HUD);
    // mist over the top of the screen: you can't see far up the mountain
    const mist = this.add.graphics().setScrollFactor(0).setDepth(HUD - 20);
    mist.fillGradientStyle(0xf4f6f4, 0xf4f6f4, 0xf4f6f4, 0xf4f6f4, 0.95, 0.95, 0, 0);
    mist.fillRect(0, 0, W, 300);
    for (let i = 0; i < 6; i++) {
      const m = this.add.tileSprite(0, 40 + i * 40, W, 128, 'sfMist').setOrigin(0, 0.5).setScrollFactor(0).setDepth(HUD - 19).setAlpha(0.6);
      this.tweens.add({ targets: m, tilePositionX: i % 2 ? 512 : -512, duration: 20000 + i * 3000, repeat: -1 });
    }
    // the race: a little mountain gauge on the right
    this.bar = this.add.graphics().setScrollFactor(0).setDepth(HUD);
    i18nText(this, W - 60, H - 320, () => t('sf.c.you'), { fontSize: '14px', color: '#ffffff', stroke: '#2f4a3a', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(HUD).setName('youLbl');
    this.updateHud();
  }

  private updateHud(): void {
    const bend = Math.min(BENDS, this.seg);
    this.bendText.setText(t('sf.c.bend', { n: bend }));
    this.comboText.setText(this.combo >= 2 ? t('sf.c.combo', { n: this.combo }) : '');
    const g = this.bar;
    g.clear();
    const x = W - 60;
    const y0 = H - 140;
    const y1 = 340;
    g.fillStyle(0x2f4a3a, 0.5);
    g.fillRoundedRect(x - 8, y1 - 10, 16, y0 - y1 + 20, 8);
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(x - 16, y1 - 8, x + 16, y1 - 8, x, y1 - 30);
    const me = Math.min(1, (this.seg + this.u) / (BENDS + 1));
    const po = Math.min(1, this.porterT / PORTER_TIME);
    g.fillStyle(0x5d8ab0, 1);
    g.fillCircle(x + 12, y0 - (y0 - y1) * po, 8);
    g.fillStyle(0xc0392b, 1);
    g.fillCircle(x - 12, y0 - (y0 - y1) * me, 8);
    const lbl = this.children.getByName('youLbl') as Phaser.GameObjects.Text | null;
    lbl?.setPosition(x - 34, y0 - (y0 - y1) * me);
    this.milkBtn?.refresh();
  }

  // ---- story -----------------------------------------------------------------------------------

  private async speak(dlg: Dialogue, who: Speaker, key: StrKey): Promise<void> {
    await dlg.say(who, key);
  }

  private async play(): Promise<void> {
    const dlg = new Dialogue(this);
    await this.speak(dlg, 'porter', 'sf.c.p1');
    await this.speak(dlg, 'koko', 'sf.c.k1');
    await this.speak(dlg, 'gogo', 'sf.c.g1');
    dlg.hide();
    const touch = this.sys.game.device.input.touch;
    const hint = i18nText(this, W / 2, H - 34, () => t(touch ? 'sf.c.hintTouch' : 'sf.c.hintKeys'), {
      fontSize: '19px',
      color: '#ffffff',
      stroke: '#2f4a3a',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: W - 200, useAdvancedWrap: true },
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(HUD);
    this.milkBtn = makeButton(this, W - 150, H - 90, () => t('sf.c.milk', { n: this.milk }), { width: 170, height: 54, fontSize: 22, fixed: true, depth: HUD, onClick: () => this.drink() });
    this.tweens.add({ targets: hint, alpha: 0.35, delay: 9000, duration: 1000 });
    sfx.bell();
    this.active = true;
    this.startTime = this.time.now;
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => this.mode === 'done' && (ev.remove(), res()) });
    });
    this.active = false;
    hint.destroy();
    this.milkBtn.destroy();
    this.milkBtn = null;
    sfRun.climbTime = Math.round((this.time.now - this.startTime) / 1000);
    sfRun.beatPorter = this.porterT < PORTER_TIME;
    sfx.chime();
    this.toast(t('sf.c.top'));
    await wait(this, 1200);
    if (sfRun.beatPorter) {
      // he arrives a little after us
      await this.porterArrives();
      await this.speak(dlg, 'porter', 'sf.c.pWin');
      await this.speak(dlg, 'gogo', 'sf.c.gWin');
    } else {
      await this.speak(dlg, 'porter', 'sf.c.pLose');
      await this.speak(dlg, 'koko', 'sf.c.kLose');
    }
    await this.speak(dlg, 'cow', 'sf.c.c1');
    dlg.hide();
    this.cameras.main.fadeOut(900, 240, 244, 240);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('ShuangfengTower'));
  }

  private porterArrives(): Promise<void> {
    return new Promise((res) => {
      const ev = this.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          this.porterT = Math.min(PORTER_TIME, this.porterT + 0.25);
          if (this.porterT >= PORTER_TIME) {
            ev.remove();
            res();
          }
        },
      });
    });
  }

  // ---- input ---------------------------------------------------------------------------------

  private pick(dir: -1 | 1): void {
    if (this.mode === 'detour' || this.mode === 'back' || this.mode === 'done') return;
    this.choice = dir;
    sfx.blip();
    if (this.mode === 'wait') this.resolveBend();
  }

  private drink(): void {
    if (this.milk <= 0 || this.time.now < this.boostUntil) return;
    this.milk -= 1;
    this.boostUntil = this.time.now + 3000;
    sfx.gulp(420);
    this.time.delayedCall(180, () => sfx.gulp(520));
    this.popAtKids(t('sf.c.boost'), '#ffffff');
    this.updateHud();
  }

  /** We've reached bend `seg` with `choice` made (or just made it while waiting). */
  private resolveBend(): void {
    const b = this.seg;
    const right = Math.sign(this.nodes[b + 1].x - this.nodes[b].x);
    if (this.choice === 0) {
      this.mode = 'wait';
      this.waited = true;
      this.combo = 0;
      this.popAtKids(t('sf.c.which'), '#ffffff');
      return;
    }
    if (this.choice === right) {
      if (!this.waited) {
        this.combo += 1;
        sfx.petal(this.combo);
      }
      // a bend only counts as right if we didn't wander into the bamboo first
      if (!this.detoured) sfRun.bendsRight += 1;
      this.detoured = false;
      sfRun.puffs += 1;
      this.flyPuff();
      this.mode = 'walk';
      this.u = 0;
      this.choice = 0;
      this.waited = false;
      const fact = FACTS[b];
      if (fact) this.toast(t(fact), 5200);
    } else {
      // into the bamboo…
      this.mode = 'detour';
      this.detoured = true;
      this.detourU = 0;
      this.combo = 0;
      sfRun.wrongTurns += 1;
    }
    this.updateHud();
  }

  // ---- feedback ------------------------------------------------------------------------------

  private popAtKids(s: string, color: string): void {
    const k = this.kids[0];
    const txt = this.add.text(k.x, k.y - 80, s, baseStyle({ fontSize: '22px', color, fontStyle: 'bold', stroke: '#2f4a3a', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD - 5);
    this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 1100, onComplete: () => txt.destroy() });
  }

  private flyPuff(): void {
    const k = this.kids[0];
    const p = this.add.image(k.x, k.y - 40, 'sfPuff').setScale(0.35).setDepth(HUD - 4);
    const cam = this.cameras.main;
    this.tweens.add({
      targets: p,
      x: 60 + cam.scrollX,
      y: 130 + cam.scrollY,
      scale: 0.15,
      alpha: 0.4,
      duration: 700,
      ease: 'Cubic.easeIn',
      onComplete: () => p.destroy(),
    });
  }

  private toast(text: string, hold = 1600): void {
    const box = this.add.container(W / 2, 160).setScrollFactor(0).setDepth(HUD + 2).setAlpha(0);
    const txt = this.add.text(0, 0, text, baseStyle({ fontFamily: FONT_SERIF, fontSize: '22px', color: '#2f3b3a', align: 'center', wordWrap: { width: 760, useAdvancedWrap: true } })).setOrigin(0.5);
    const bg = this.add.graphics();
    bg.fillStyle(0xfdf8ee, 0.92);
    bg.fillRoundedRect(-txt.width / 2 - 24, -txt.height / 2 - 14, txt.width + 48, txt.height + 28, 14);
    box.add([bg, txt]);
    this.tweens.add({ targets: box, alpha: 1, duration: 300, yoyo: true, hold, onComplete: () => box.destroy() });
  }

  // ---- frame ---------------------------------------------------------------------------------

  update(time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    if (this.active) this.porterT += dt;
    const boost = time < this.boostUntil ? 1.7 : 1;
    const speed = (BASE_SPEED + Math.min(10, this.combo) * 14) * boost;
    let lead: Pt = this.trail[this.trail.length - 1];
    if (this.active) {
      if (this.mode === 'walk') {
        const a = this.nodes[this.seg];
        const b = this.nodes[this.seg + 1];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        this.u += (speed * dt) / len;
        if (this.u >= 1) {
          this.u = 1;
          this.seg += 1;
          this.u = 0;
          this.segG[this.seg - 1]?.setAlpha(1);
          if (this.seg > BENDS) {
            this.mode = 'done';
          } else {
            sfx.tick(false);
            this.resolveBend();
          }
          this.updateHud();
        }
        const s = this.seg;
        const p0 = this.nodes[s];
        const p1 = this.nodes[Math.min(this.nodes.length - 1, s + 1)];
        lead = this.mode === 'walk' ? { x: p0.x + (p1.x - p0.x) * this.u, y: p0.y + (p1.y - p0.y) * this.u } : { x: p0.x, y: p0.y };
      } else if (this.mode === 'detour' || this.mode === 'back') {
        const a = this.nodes[this.seg];
        const b = this.wrongEnd[this.seg];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        if (this.mode === 'detour') {
          this.detourU += (speed * dt) / len;
          if (this.detourU >= 0.85) {
            this.detourU = 0.85;
            this.mode = 'back';
            sfx.dig();
            this.cameras.main.shake(160, 0.004);
            this.popAtKids(t('sf.c.wrong'), '#ffd0c0');
          }
        } else {
          this.detourU -= (BASE_SPEED * 1.2 * dt) / len;
          if (this.detourU <= 0) {
            this.detourU = 0;
            // back at the bend: now take the right way
            this.choice = Math.sign(this.nodes[this.seg + 1].x - this.nodes[this.seg].x) as -1 | 1;
            this.waited = true;
            this.resolveBend();
          }
        }
        lead = { x: a.x + (b.x - a.x) * this.detourU, y: a.y + (b.y - a.y) * this.detourU };
      } else {
        const p0 = this.nodes[Math.min(this.seg, this.nodes.length - 1)];
        lead = { x: p0.x, y: p0.y };
      }
      // the fork ahead appears out of the mist
      if (this.mode === 'walk' && this.seg + 1 <= BENDS) {
        const k = Phaser.Math.Clamp((this.u - 0.18) / 0.3, 0, 1);
        this.segG[this.seg + 1]?.setAlpha(Math.max(this.segG[this.seg + 1].alpha, k));
        this.wrongG[this.seg + 1]?.setAlpha(Math.max(this.wrongG[this.seg + 1].alpha, k));
      }
      if (this.seg <= BENDS && this.seg >= 1) {
        this.segG[this.seg]?.setAlpha(1);
        this.wrongG[this.seg]?.setAlpha(1);
      }
      this.trail.push({ x: lead.x, y: lead.y + 18 });
      if (this.trail.length > 400) this.trail.shift();
    }
    // three kids in a line along the trail
    for (let i = 0; i < this.kids.length; i++) {
      const p = this.trailAt(i * 30);
      const q = this.trailAt(i * 30 + 6);
      const k = this.kids[i];
      const moving = Math.hypot(p.x - q.x, p.y - q.y) > 0.5;
      k.setPosition(p.x, p.y - (moving ? Math.abs(Math.sin(time * 0.014 + i)) * 4 : 0));
      if (Math.abs(p.x - q.x) > 0.3) k.setScale(0.5 * Math.sign(p.x - q.x), 0.5);
      k.setDepth(20 + (p.y - this.cameras.main.scrollY) / 1000);
    }
    // the porter: steady, never wrong
    const pu = Math.min(1, this.porterT / PORTER_TIME) * (BENDS + 1);
    const ps = Math.min(BENDS, Math.floor(pu));
    const pa = this.nodes[ps];
    const pb = this.nodes[ps + 1];
    const pf = pu - ps;
    const px = pa.x + (pb.x - pa.x) * pf - 20;
    const py = pa.y + (pb.y - pa.y) * pf + 18;
    if (Math.abs(pb.x - pa.x) > 1) this.porter.setScale(0.55 * Math.sign(pb.x - pa.x), 0.55);
    this.porter.setPosition(px, py);
    drawPorter(this.porter, this.active ? time * 0.008 : 0);
    // camera follows us up the mountain
    const cam = this.cameras.main;
    const target = (this.kids[0]?.y ?? 0) - 470;
    cam.scrollY += (target - cam.scrollY) * Math.min(1, dt * 3);
    if (this.active && Math.floor(time / 250) % 2 === 0) this.updateHud();
  }

  private trailAt(back: number): Pt {
    let d = back;
    for (let i = this.trail.length - 1; i > 0; i--) {
      const a = this.trail[i];
      const b = this.trail[i - 1];
      const l = Math.hypot(a.x - b.x, a.y - b.y);
      if (l >= d) {
        const k = l > 0 ? d / l : 0;
        return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
      }
      d -= l;
    }
    return this.trail[0];
  }
}

function distToSeg(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const k = Phaser.Math.Clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l2, 0, 1);
  return Math.hypot(p.x - (a.x + dx * k), p.y - (a.y + dy * k));
}

/** Stone steps from a to b: a paved band with a line across for each step. */
function drawSteps(g: Phaser.GameObjects.Graphics, a: Pt, b: Pt): void {
  g.lineStyle(44, 0x7a7060, 1);
  g.lineBetween(a.x, a.y, b.x, b.y);
  g.lineStyle(36, 0xb3a78e, 1);
  g.lineBetween(a.x, a.y, b.x, b.y);
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  g.lineStyle(2, 0x857a64, 0.9);
  for (let d = 14; d < len; d += 14) {
    const x = a.x + ((b.x - a.x) * d) / len;
    const y = a.y + ((b.y - a.y) * d) / len;
    g.lineBetween(x - nx * 17, y - ny * 17, x + nx * 17, y + ny * 17);
  }
}
