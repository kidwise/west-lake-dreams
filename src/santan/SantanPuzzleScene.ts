import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { i18nText } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { paintBackdrop } from '../art/backdrop';
import { sfx } from '../core/sfx';
import { tweenP, wait } from '../ui/narrate';
import { createDreamNote, VIGNETTE_H, VIGNETTE_W } from './art';
import { santanRun } from './state';
import type { TargetId } from './world';

const NOTE_X = W / 2;
const NOTE_Y = 268;
const NOTE_SCALE = 0.9;
const SLOT = (VIGNETTE_W / 3) * NOTE_SCALE; // square slot size on screen
const ORDER: TargetId[] = ['near', 'pair', 'far'];
const LABEL: Record<TargetId, StrKey> = {
  near: 'santan.part.near',
  pair: 'santan.part.pair',
  far: 'santan.part.far',
};

interface Piece {
  id: TargetId;
  obj: Phaser.GameObjects.Container;
  home: { x: number; y: number; angle: number };
  placed: boolean;
}

/** Step 5: put the three photos together to restore the picture on the note. */
export class SantanPuzzleScene extends Phaser.Scene {
  private pieces: Piece[] = [];
  private overlay!: Phaser.GameObjects.Image;
  private finished = false;

  constructor() {
    super('SantanPuzzle');
  }

  private slotX(id: TargetId): number {
    return NOTE_X + (ORDER.indexOf(id) - 1) * SLOT;
  }

  create(): void {
    music.play('moonlake');
    this.pieces = [];
    this.finished = false;
    paintBackdrop(this, { horizon: 300, skyTop: 0x4f6496, skyBottom: 0xf8d9a6 });
    // the boat's little table
    const table = this.add.graphics().setDepth(1);
    table.fillStyle(0x5b3d29, 1);
    table.fillRect(0, 430, W, H - 430);
    for (let y = 474; y < H; y += 44) {
      table.lineStyle(2, 0x4a3122, 1);
      table.lineBetween(0, y, W, y);
    }

    createDreamNote(this, NOTE_X, NOTE_Y, NOTE_SCALE).setDepth(5);
    // dashed slot outlines over the three thirds of the picture
    const slots = this.add.graphics().setDepth(6);
    for (const id of ORDER) {
      const x = this.slotX(id);
      slots.fillStyle(0xf3f6ea, 0.55);
      slots.fillRect(x - SLOT / 2 + 3, NOTE_Y - SLOT / 2 + 3, SLOT - 6, SLOT - 6);
      slots.lineStyle(2, 0x4f6b47, 0.9);
      const dash = 10;
      for (let i = -SLOT / 2; i < SLOT / 2; i += dash * 2) {
        slots.lineBetween(x + i, NOTE_Y - SLOT / 2 + 2, x + Math.min(i + dash, SLOT / 2), NOTE_Y - SLOT / 2 + 2);
        slots.lineBetween(x + i, NOTE_Y + SLOT / 2 - 2, x + Math.min(i + dash, SLOT / 2), NOTE_Y + SLOT / 2 - 2);
        slots.lineBetween(x - SLOT / 2 + 2, NOTE_Y + i, x - SLOT / 2 + 2, NOTE_Y + Math.min(i + dash, SLOT / 2));
        slots.lineBetween(x + SLOT / 2 - 2, NOTE_Y + i, x + SLOT / 2 - 2, NOTE_Y + Math.min(i + dash, SLOT / 2));
      }
      i18nText(this, x, NOTE_Y, () => t(LABEL[id]), { fontFamily: FONT_SERIF, fontSize: '26px', color: '#4f6b47' })
        .setOrigin(0.5)
        .setDepth(7)
        .setAlpha(0.8);
    }
    // the engraving, laid over the photos at the end
    this.overlay = this.add.image(NOTE_X, NOTE_Y, 'noteVignette').setScale(NOTE_SCALE).setDepth(40).setAlpha(0);

    i18nText(this, W / 2, 30, () => t('santan.pzTitle'), { fontFamily: FONT_SERIF, fontSize: '28px', color: CSS.paper })
      .setOrigin(0.5)
      .setDepth(10);
    i18nText(this, W / 2, 500, () => t('santan.pzHint'), { fontSize: '19px', color: '#f3ead7' })
      .setOrigin(0.5)
      .setDepth(10);

    this.makePieces();
    this.cameras.main.fadeIn(900, 248, 217, 166);
  }

  private pieceTexture(id: TargetId): { key: string; frame?: string } {
    const key = santanRun.photos[id];
    if (key && this.textures.exists(key)) return { key };
    // fallback if a photo is missing: use that third of the engraving
    const i = ORDER.indexOf(id);
    const tex = this.textures.get('noteVignette');
    const frame = `third${i}`;
    if (!tex.has(frame)) tex.add(frame, 0, (VIGNETTE_W / 3) * i, 0, VIGNETTE_W / 3, VIGNETTE_H);
    return { key: 'noteVignette', frame };
  }

  private makePieces(): void {
    const shuffled: TargetId[] = ['far', 'near', 'pair'];
    const homes = [
      { x: W / 2 - 330, y: 612, angle: -6 },
      { x: W / 2, y: 620, angle: 4 },
      { x: W / 2 + 330, y: 610, angle: -3 },
    ];
    shuffled.forEach((id, i) => {
      const tex = this.pieceTexture(id);
      const img = this.add.image(0, 0, tex.key, tex.frame);
      img.setScale(SLOT / img.width, SLOT / img.height);
      const frame = this.add.rectangle(0, 0, SLOT + 14, SLOT + 14, 0xfdfaf3).setStrokeStyle(1, 0xbbbbbb);
      const obj = this.add.container(homes[i].x, homes[i].y, [frame, img]).setDepth(20 + i).setAngle(homes[i].angle).setScale(0.82);
      obj.setSize(SLOT + 14, SLOT + 14).setInteractive({ draggable: true, useHandCursor: true });
      const piece: Piece = { id, obj, home: homes[i], placed: false };
      this.pieces.push(piece);

      obj.on('dragstart', () => {
        if (piece.placed) return;
        obj.setDepth(60);
        this.tweens.add({ targets: obj, scale: 0.95, angle: 0, duration: 120 });
        sfx.blip();
      });
      obj.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => {
        if (!piece.placed) obj.setPosition(x, y);
      });
      obj.on('dragend', () => this.drop(piece));
    });
  }

  private drop(piece: Piece): void {
    if (piece.placed) return;
    const { obj } = piece;
    const nearSlot = ORDER.find((id) => Math.abs(obj.x - this.slotX(id)) < SLOT * 0.45 && Math.abs(obj.y - NOTE_Y) < SLOT * 0.5);
    if (nearSlot === piece.id) {
      piece.placed = true;
      obj.disableInteractive();
      obj.setDepth(30);
      sfx.bell();
      this.tweens.add({
        targets: obj,
        x: this.slotX(piece.id),
        y: NOTE_Y,
        angle: 0,
        scale: SLOT / (SLOT + 14),
        duration: 260,
        ease: 'Back.easeOut',
        onComplete: () => this.checkDone(),
      });
      return;
    }
    if (nearSlot) {
      const tip = i18nText(this, obj.x, obj.y - 140, () => t('santan.pzWrong'), {
        fontSize: '20px',
        color: '#fff8ee',
        backgroundColor: '#c0392bdd',
        padding: { x: 12, y: 6 },
      })
        .setOrigin(0.5)
        .setDepth(80);
      this.tweens.add({ targets: tip, alpha: 0, delay: 1300, duration: 400, onComplete: () => tip.destroy() });
      this.cameras.main.shake(180, 0.004);
    }
    obj.setDepth(20);
    this.tweens.add({ targets: obj, x: piece.home.x, y: piece.home.y, angle: piece.home.angle, scale: 0.82, duration: 350, ease: 'Quad.easeOut' });
  }

  private checkDone(): void {
    if (this.finished || !this.pieces.every((p) => p.placed)) return;
    this.finished = true;
    void this.celebrate();
  }

  private async celebrate(): Promise<void> {
    sfx.chime();
    // the engraving fades in over the photos: they line up with the note
    await tweenP(this, { targets: this.overlay, alpha: 0.55, duration: 1400 });
    const done = i18nText(this, W / 2, NOTE_Y, () => t('santan.pzDone'), {
      fontFamily: FONT_SERIF,
      fontSize: '64px',
      color: '#fff8ee',
      stroke: '#4f6b47',
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(90)
      .setScale(0.3);
    await tweenP(this, { targets: done, scale: 1, duration: 600, ease: 'Back.easeOut' });
    for (let i = 0; i < 24; i++) {
      const s = this.add.image(W / 2, NOTE_Y, 'sparkle').setDepth(91).setTint(0xfff3c4);
      const a = (i / 24) * Math.PI * 2;
      this.tweens.add({ targets: s, x: W / 2 + Math.cos(a) * 420, y: NOTE_Y + Math.sin(a) * 200, alpha: 0, scale: 2, duration: 1200, onComplete: () => s.destroy() });
    }
    await wait(this, 1200);
    await tweenP(this, { targets: done, alpha: 0, duration: 400 });

    const dlg = new Dialogue(this);
    await dlg.say('me', 'santan.pz1');
    await dlg.say('gogo', 'santan.pz2');
    await dlg.say('koko', 'santan.pz3');
    dlg.hide();
    this.cameras.main.fadeOut(1600, 10, 16, 40);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('SantanMoon'));
  }
}
