import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, FONT_SANS, CSS } from '../core/config';
import { t, getLang, type StrKey } from '../core/i18n';
import { paintBackdrop, type Backdrop } from '../art/backdrop';
import { i18nText, onLang } from '../ui/text';
import { makeButton } from '../ui/Button';
import { TEN_VIEWS } from '../story/chapters';
import { getProgress } from '../core/state';
import { sfx } from '../core/sfx';
import { load, save } from '../core/storage';
import { koiTopTexture } from '../huagang/koi';

/** Each scene's card: a little painted window in its own season and light, with a keepsake from its dream. */
const CARD_ART: Record<string, { sky: [string, string]; icon: string | (() => string); scale?: number; dark?: boolean }> = {
  sudi: { sky: ['#fbd2b0', '#a8cfe6'], icon: 'peach' },
  quyuan: { sky: ['#e2f2e6', '#94caae'], icon: 'bloomFull' },
  pinghu: { sky: ['#1c2850', '#46588a'], icon: 'phMoon', dark: true },
  duanqiao: { sky: ['#f2f6fa', '#b6c8d6'], icon: 'dqSilk' },
  liulang: { sky: ['#e6f4cf', '#9fd47e'], icon: 'llOriole-perch' },
  huagang: { sky: ['#a6d8d2', '#4e9c9e'], icon: '' },
  leifeng: { sky: ['#f8b070', '#7a4a86'], icon: 'lfPagoda', dark: true },
  shuangfeng: { sky: ['#eef4f8', '#b4cadb'], icon: 'sfCow' },
  nanping: { sky: ['#5e3e6e', '#d0766a'], icon: 'npBell', dark: true },
  santan: { sky: ['#24345a', '#5a6e9c'], icon: 'santanPagodaLit', dark: true },
};

const CARD = { w: 216, h: 164, gap: 16, top: 346, art: 104 };
const RANKS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/** The title screen: the game's name, your progress, and the Ten Scenes as cards to step into. */
export class TitleScene extends Phaser.Scene {
  private backdrop!: Backdrop;
  private leaving = false;

  constructor() {
    super('Title');
  }

  create(): void {
    this.leaving = false;
    music.play('lake');
    this.backdrop = paintBackdrop(this, { horizon: 300 });
    this.paintVeils();
    this.drawHeader();
    this.drawCards();
    this.input.keyboard?.once('keydown-ENTER', () => this.begin());
    this.cameras.main.fadeIn(600, 246, 241, 231);
    // the first time all ten are done, unroll the whole scroll straight away
    if (TEN_VIEWS.every((v) => getProgress().visited.includes(v.id)) && !load<boolean>('tenShown', false)) {
      save('tenShown', true);
      this.time.delayedCall(700, () => this.begin('TenScenes'));
    }
  }

  /** Soft light behind the title and a misty floor under the cards, so text reads cleanly on the landscape. */
  private paintVeils(): void {
    const g = this.add.graphics().setDepth(5);
    g.fillGradientStyle(0xf8f4ec, 0xf8f4ec, 0xf8f4ec, 0xf8f4ec, 0.82, 0, 0.55, 0);
    g.fillRect(0, 0, W * 0.7, 330);
    g.fillGradientStyle(0xf6f1e7, 0xf6f1e7, 0xf6f1e7, 0xf6f1e7, 0, 0, 0.92, 0.92);
    g.fillRect(0, 300, W, H - 300);
  }

  private drawHeader(): void {
    const x = 72;
    i18nText(this, x, 96, () => t('game.title'), { fontFamily: FONT_SERIF, fontSize: '76px', color: CSS.ink }).setOrigin(0, 0.5).setDepth(20);
    i18nText(this, x + 4, 162, () => t('game.subtitle'), { fontFamily: FONT_SERIF, fontSize: '26px', color: '#5d6a67' }).setOrigin(0, 0.5).setDepth(20);
    // progress: ten little dots, filled for each scene dreamt
    const visited = new Set(getProgress().visited);
    const n = TEN_VIEWS.filter((v) => visited.has(v.id)).length;
    const g = this.add.graphics().setDepth(20);
    TEN_VIEWS.forEach((v, i) => {
      const done = visited.has(v.id);
      g.fillStyle(done ? 0xe0628e : 0xffffff, done ? 1 : 0.7);
      g.fillCircle(x + 10 + i * 22, 220, 7);
      g.lineStyle(1.5, done ? 0xc04870 : 0xa8a39a, 0.9);
      g.strokeCircle(x + 10 + i * 22, 220, 7);
    });
    const all = n >= TEN_VIEWS.length;
    i18nText(this, x + 240, 220, () => t(all ? 'title.allDone' : 'title.progress', { n }), { fontSize: '17px', color: '#5d6a67' }).setOrigin(0, 0.5).setDepth(20);
    if (all) {
      makeButton(this, x + 560, 220, () => t('ten.open'), { width: 230, height: 42, fontSize: 18, fill: 0xc0392b, stroke: 0x7b241c, textColor: '#fff8ee', depth: 22, onClick: () => this.begin('TenScenes') });
    }
  }

  /** The Ten Scenes, in their traditional order, as two rows of five cards. */
  private drawCards(): void {
    const visited = new Set(getProgress().visited);
    const next = TEN_VIEWS.find((v) => v.startScene && !visited.has(v.id))?.id;
    const x0 = (W - (CARD.w * 5 + CARD.gap * 4)) / 2;
    TEN_VIEWS.forEach((v, i) => {
      const cx = x0 + (i % 5) * (CARD.w + CARD.gap) + CARD.w / 2;
      const cy = CARD.top + Math.floor(i / 5) * (CARD.h + CARD.gap) + CARD.h / 2;
      const card = this.add.container(cx, cy).setDepth(30);
      const art = CARD_ART[v.id];
      const key = this.cardTexture(v.id, art.sky);
      // shadow, then the painted window and the label strip
      const shadow = this.add.graphics();
      shadow.fillStyle(0x2f3b3a, 0.16);
      shadow.fillRoundedRect(-CARD.w / 2 + 2, -CARD.h / 2 + 6, CARD.w, CARD.h, 16);
      card.add(shadow);
      card.add(this.add.image(0, 0, key));
      const iconKey = v.id === 'huagang' ? koiTopTexture(this, 'kohaku', 3) : (art.icon as string);
      if (iconKey && this.textures.exists(iconKey)) {
        const ic = this.add.image(0, -CARD.h / 2 + CARD.art / 2 + 4, iconKey);
        const src = ic.frame;
        ic.setScale(Math.min(84 / src.width, 84 / src.height) * (art.scale ?? 1));
        if (v.id === 'huagang') ic.setAngle(-30);
        card.add(ic);
        this.tweens.add({ targets: ic, y: ic.y - 3, yoyo: true, repeat: -1, duration: 1600 + i * 97, ease: 'Sine.easeInOut' });
      }
      const labelY = -CARD.h / 2 + CARD.art + (CARD.h - CARD.art) / 2;
      // the scene's rank, as a small tag on the picture
      card.add(
        i18nText(this, -CARD.w / 2 + 10, -CARD.h / 2 + 10, () => t('title.rank', { n: RANKS[i], m: i + 1 }), {
          fontSize: '12px',
          color: art.dark ? '#ffffff' : '#3a4644',
          backgroundColor: art.dark ? '#ffffff26' : '#ffffffa6',
          padding: { x: 7, y: 3 },
        }).setOrigin(0, 0),
      );
      const name = i18nText(this, -CARD.w / 2 + 14, labelY, () => t(v.name as StrKey), {
        fontFamily: FONT_SANS,
        fontSize: getLang() === 'zh' ? '18px' : '14px',
        color: CSS.ink,
        fontStyle: 'bold',
        lineSpacing: 1,
        wordWrap: { width: CARD.w - 52, useAdvancedWrap: true },
      }).setOrigin(0, 0.5);
      // English names are long: a smaller size when the language switches
      onLang(this, () => name.setFontSize(getLang() === 'zh' ? 18 : 14));
      card.add(name);
      // visited: a small green tick; next up: a soft "continue here" tag
      if (visited.has(v.id)) {
        const tick = this.add.graphics();
        tick.fillStyle(0x2e8b57, 1);
        tick.fillCircle(CARD.w / 2 - 18, labelY, 10);
        tick.lineStyle(2.4, 0xffffff, 1);
        tick.beginPath();
        tick.moveTo(CARD.w / 2 - 23, labelY);
        tick.lineTo(CARD.w / 2 - 19, labelY + 4);
        tick.lineTo(CARD.w / 2 - 12, labelY - 4);
        tick.strokePath();
        card.add(tick);
      } else if (v.id === next) {
        const tag = i18nText(this, CARD.w / 2 - 10, -CARD.h / 2 + 14, () => t('title.next'), {
          fontSize: '12px',
          color: '#ffffff',
          backgroundColor: '#c0392bdd',
          padding: { x: 7, y: 3 },
        }).setOrigin(1, 0);
        card.add(tag);
      }
      // hover lifts the card; click steps into the dream
      const zone = this.add.zone(cx, cy, CARD.w, CARD.h).setInteractive({ useHandCursor: true }).setDepth(31);
      zone.on('pointerover', () => this.tweens.add({ targets: card, y: cy - 6, scale: 1.04, duration: 160, ease: 'Sine.easeOut' }));
      zone.on('pointerout', () => this.tweens.add({ targets: card, y: cy, scale: 1, duration: 160, ease: 'Sine.easeOut' }));
      zone.on('pointerup', () => this.begin(v.startScene));
      // cards float in one after another
      card.setAlpha(0).setY(cy + 20);
      this.tweens.add({ targets: card, alpha: 1, y: cy, delay: 120 + i * 50, duration: 420, ease: 'Cubic.easeOut' });
    });
  }

  /** A rounded card: a painted gradient window on top, a paper label strip below. */
  private cardTexture(id: string, sky: [string, string]): string {
    const key = `titleCard-${id}`;
    if (this.textures.exists(key)) return key;
    const tex = this.textures.createCanvas(key, CARD.w, CARD.h);
    if (!tex) return key;
    const ctx = tex.getContext();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, CARD.w, CARD.h, 16);
    ctx.clip();
    ctx.fillStyle = '#fbf8f2';
    ctx.fillRect(0, 0, CARD.w, CARD.h);
    const g = ctx.createLinearGradient(0, 0, 0, CARD.art);
    g.addColorStop(0, sky[0]);
    g.addColorStop(1, sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CARD.w, CARD.art);
    // a far hill line and a little water, the same West Lake in every card
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(0, CARD.art - 22);
    for (let x = 0; x <= CARD.w; x += 6) ctx.lineTo(x, CARD.art - 26 - Math.sin(x * 0.03) * 7 - Math.sin(x * 0.011 + 1) * 6);
    ctx.lineTo(CARD.w, CARD.art);
    ctx.lineTo(0, CARD.art);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, CARD.art - 14, CARD.w, 14);
    ctx.restore();
    ctx.strokeStyle = 'rgba(47,59,58,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(0.5, 0.5, CARD.w - 1, CARD.h - 1, 16);
    ctx.stroke();
    tex.refresh();
    return key;
  }

  /** "Next": the first of the Ten Scenes (in order) not yet dreamt. */
  private nextDream(): string | undefined {
    const visited = new Set(getProgress().visited);
    return (TEN_VIEWS.find((v) => v.startScene && !visited.has(v.id)) ?? TEN_VIEWS[0]).startScene;
  }

  private begin(startScene = this.nextDream()): void {
    if (this.leaving || !startScene) return;
    this.leaving = true;
    sfx.chime();
    this.cameras.main.fadeOut(700, 20, 30, 40);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(startScene));
  }

  update(time: number): void {
    this.backdrop.update(time, 0);
  }
}
