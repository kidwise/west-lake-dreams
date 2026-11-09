/** Logical game resolution. The canvas is scaled to fit any screen (see main.ts). */
export const W = 1280;
export const H = 720;

export const FONT_SANS =
  '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif';
export const FONT_SERIF =
  '"Songti SC", "STSong", "Noto Serif SC", "Source Han Serif SC", "SimSun", serif';

/** Render text at a higher internal resolution so it stays crisp on retina screens. */
export const TEXT_RES = Math.min(2, Math.max(1, globalThis.devicePixelRatio || 1));

/** Shared palette — soft, watercolour-like tones of West Lake in early summer. */
export const C = {
  ink: 0x2f3b3a,
  paper: 0xf6f1e7,
  skyTop: 0xb9d6e6,
  skyBottom: 0xf4e6d6,
  hillFar: 0xa9c1bb,
  hillNear: 0x8aa89f,
  lake: 0x9fc6c9,
  lakeDeep: 0x7fb0b6,
  leaf: 0x4f8f4a,
  leafDark: 0x3a7038,
  leafLight: 0x79b06a,
  lotus: 0xf2a7c0,
  lotusDeep: 0xe0628e,
  lotusPale: 0xfbe3ec,
  path: 0xd9ccb4,
  pathEdge: 0xb8a88c,
  grass: 0x8fae6a,
  wood: 0x8a3b2e,
  roof: 0x3d4a4f,
  stone: 0xcfc8bb,
};

/** CSS-style colour strings for Text objects. */
export const CSS = {
  ink: '#2f3b3a',
  paper: '#f6f1e7',
  me: '#c0392b',
  gogo: '#2471a3',
  koko: '#c2185b',
  muted: '#7d8a87',
};
