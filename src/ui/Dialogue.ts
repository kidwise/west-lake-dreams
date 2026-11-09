import * as Phaser from 'phaser';
import { W, H, CSS, FONT_SERIF } from '../core/config';
import { t, getLang, type StrKey } from '../core/i18n';
import { baseStyle, onLang } from './text';
import { makeButton, type Button } from './Button';
import { overGlobalUI } from './overlay';
import { sfx } from '../core/sfx';

export type Speaker = 'me' | 'gogo' | 'koko' | null;

const SPEAKER_COLOR: Record<Exclude<Speaker, null>, string> = {
  me: CSS.me,
  gogo: CSS.gogo,
  koko: CSS.koko,
};

export interface Choice<V extends string> {
  key: StrKey;
  value: V;
}

type Params = Record<string, string | number>;

/**
 * Visual-novel style dialogue box with a typewriter effect.
 * Story code reads like a script:
 *
 *   await dlg.say('gogo', 'pav.gogo1');
 *   const route = await dlg.choose('pav.choose', [...]);
 */
export class Dialogue {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private nameTag: Phaser.GameObjects.Graphics;
  private body: Phaser.GameObjects.Text;
  private arrow: Phaser.GameObjects.Text;
  private current: { speaker: Speaker; key: StrKey; params?: Params } | null = null;
  private chars: string[] = [];
  private shown = 0;
  private timer: Phaser.Time.TimerEvent | null = null;
  private resolveLine: (() => void) | null = null;
  private choiceButtons: Button[] = [];
  private choiceKeys: Phaser.Input.Keyboard.Key[] = [];

  static readonly PANEL_TOP = H - 196;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const top = Dialogue.PANEL_TOP;
    const panel = scene.add.graphics();
    panel.fillStyle(0x000000, 0.18);
    panel.fillRoundedRect(44, top + 8, W - 88, 172, 22);
    panel.fillStyle(0xf8f4ea, 0.96);
    panel.fillRoundedRect(40, top, W - 80, 172, 22);
    panel.lineStyle(3, 0x2f3b3a, 0.8);
    panel.strokeRoundedRect(40, top, W - 80, 172, 22);
    panel.lineStyle(1.5, 0x2f3b3a, 0.25);
    panel.strokeRoundedRect(50, top + 10, W - 100, 152, 16);

    this.nameTag = scene.add.graphics();
    this.nameText = scene.add.text(96, top - 4, '', baseStyle({ fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }));
    this.nameText.setOrigin(0, 0.5);
    this.body = scene.add.text(80, top + 34, '', baseStyle({
      fontSize: '27px',
      lineSpacing: 10,
      wordWrap: { width: W - 170, useAdvancedWrap: true },
    }));
    this.arrow = scene.add.text(W - 92, top + 140, '▼', baseStyle({ fontSize: '20px', color: CSS.muted }));
    scene.tweens.add({ targets: this.arrow, y: '+=6', yoyo: true, repeat: -1, duration: 420 });

    this.root = scene.add.container(0, 0, [panel, this.nameTag, this.nameText, this.body, this.arrow]);
    this.root.setScrollFactor(0).setDepth(1000).setVisible(false);

    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!overGlobalUI(p)) this.advance();
    });
    scene.input.keyboard?.on('keydown-SPACE', () => this.advance());
    scene.input.keyboard?.on('keydown-ENTER', () => this.advance());

    onLang(scene, () => this.relayout());
  }

  /** Show one line and wait until the player advances. */
  say(speaker: Speaker, key: StrKey, params?: Params): Promise<void> {
    this.current = { speaker, key, params };
    this.root.setVisible(true);
    this.drawName();
    this.startTyping(0);
    return new Promise((resolve) => {
      this.resolveLine = resolve;
    });
  }

  /** Show a prompt and a set of buttons; resolves with the chosen value. */
  choose<V extends string>(prompt: StrKey, options: Choice<V>[]): Promise<V> {
    this.current = { speaker: null, key: prompt };
    this.root.setVisible(true);
    this.drawName();
    this.stopTyping();
    this.chars = Array.from(t(prompt));
    this.shown = this.chars.length;
    this.body.setText(t(prompt));
    this.arrow.setVisible(false);

    return new Promise((resolve) => {
      const pick = (v: V) => {
        sfx.blip();
        this.clearChoices();
        resolve(v);
      };
      const top = Dialogue.PANEL_TOP;
      options.forEach((opt, i) => {
        const y = top - 70 - (options.length - 1 - i) * 82;
        const btn = makeButton(this.scene, W / 2, y, () => `${i + 1}. ${t(opt.key)}`, {
          width: 520,
          height: 66,
          fontSize: 26,
          fill: 0xfdf8ee,
          onClick: () => pick(opt.value),
        });
        btn.container.setScrollFactor(0).setDepth(1001);
        btn.zone.setScrollFactor(0).setDepth(1001);
        this.choiceButtons.push(btn);
        const kb = this.scene.input.keyboard;
        if (kb) {
          const key = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE + i);
          key.once('down', () => pick(opt.value));
          this.choiceKeys.push(key);
        }
      });
    });
  }

  hide(): void {
    this.stopTyping();
    this.root.setVisible(false);
    this.current = null;
  }

  private clearChoices(): void {
    this.choiceButtons.forEach((b) => b.destroy());
    this.choiceButtons = [];
    this.choiceKeys.forEach((k) => {
      k.removeAllListeners();
      this.scene.input.keyboard?.removeKey(k);
    });
    this.choiceKeys = [];
  }

  private advance(): void {
    if (!this.current || this.choiceButtons.length) return;
    if (this.timer) {
      // finish the line instantly
      this.stopTyping();
      this.shown = this.chars.length;
      this.body.setText(this.chars.join(''));
      this.arrow.setVisible(true);
      return;
    }
    const done = this.resolveLine;
    this.resolveLine = null;
    if (done) {
      sfx.blip();
      done();
    }
  }

  private drawName(): void {
    const sp = this.current?.speaker ?? null;
    this.nameTag.clear();
    if (!sp) {
      this.nameText.setText('');
      this.body.setStyle({ fontFamily: FONT_SERIF, color: '#4a5553', fontStyle: 'italic' });
      return;
    }
    this.body.setStyle({ fontFamily: baseStyle().fontFamily as string, color: CSS.ink, fontStyle: 'normal' });
    this.nameText.setText(t(`name.${sp}` as StrKey));
    const color = Phaser.Display.Color.HexStringToColor(SPEAKER_COLOR[sp]).color;
    const top = Dialogue.PANEL_TOP;
    const w = this.nameText.width + 44;
    this.nameTag.fillStyle(color, 1);
    this.nameTag.fillRoundedRect(74, top - 24, w, 42, 14);
  }

  private startTyping(fromFraction: number): void {
    if (!this.current) return;
    this.stopTyping();
    this.chars = Array.from(t(this.current.key, this.current.params));
    this.shown = Math.floor(this.chars.length * fromFraction);
    this.body.setText(this.chars.slice(0, this.shown).join(''));
    this.arrow.setVisible(false);
    const delay = getLang() === 'zh' ? 34 : 16;
    this.timer = this.scene.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        this.shown += 1;
        this.body.setText(this.chars.slice(0, this.shown).join(''));
        if (this.shown >= this.chars.length) {
          this.stopTyping();
          this.arrow.setVisible(true);
        }
      },
    });
  }

  private stopTyping(): void {
    this.timer?.remove(false);
    this.timer = null;
  }

  private relayout(): void {
    if (!this.current) return;
    this.drawName();
    if (this.choiceButtons.length) {
      this.body.setText(t(this.current.key));
      return;
    }
    if (this.timer) {
      this.startTyping(this.shown / Math.max(1, this.chars.length));
    } else {
      this.chars = Array.from(t(this.current.key, this.current.params));
      this.shown = this.chars.length;
      this.body.setText(this.chars.join(''));
    }
  }
}
