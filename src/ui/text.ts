import * as Phaser from 'phaser';
import { FONT_SANS, TEXT_RES, CSS } from '../core/config';
import { onLangChange } from '../core/i18n';

type Refresher = () => void;
const perScene = new Map<Phaser.Scene, Set<Refresher>>();

/**
 * Register a callback that re-runs whenever the language changes, for as long
 * as the scene is alive. Used to keep every on-screen string translated live.
 */
export function onLang(scene: Phaser.Scene, fn: Refresher): void {
  let set = perScene.get(scene);
  if (!set) {
    const s = new Set<Refresher>();
    perScene.set(scene, s);
    set = s;
    const off = onLangChange(() => s.forEach((f) => f()));
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      off();
      perScene.delete(scene);
    });
  }
  set.add(fn);
}

export type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

export function baseStyle(style: TextStyle = {}): TextStyle {
  return {
    fontFamily: FONT_SANS,
    fontSize: '24px',
    color: CSS.ink,
    resolution: TEXT_RES,
    ...style,
  };
}

/** A Text object whose content comes from `fn()` and refreshes on language change. */
export function i18nText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  fn: () => string,
  style: TextStyle = {},
): Phaser.GameObjects.Text {
  const txt = scene.add.text(x, y, fn(), baseStyle(style));
  onLang(scene, () => {
    if (txt.active) txt.setText(fn());
  });
  return txt;
}
