/**
 * Small synthesized sound effects (no audio files needed yet).
 * Browsers only allow audio after a user gesture, so the context is created
 * lazily and resumed on the first pointer/key press.
 */
let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor =
        globalThis.AudioContext ??
        (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Shared audio context (also used by the music player). */
export function audioContext(): AudioContext | null {
  return ac();
}

const unlockListeners: (() => void)[] = [];
let unlocked = false;

export function isAudioUnlocked(): boolean {
  return unlocked;
}

/** Run `fn` once audio is allowed (immediately if it already is). */
export function onAudioUnlocked(fn: () => void): void {
  if (unlocked) fn();
  else unlockListeners.push(fn);
}

export function unlockAudio(): void {
  const unlock = () => {
    if (unlocked || !ac()) return;
    unlocked = true;
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    unlockListeners.splice(0).forEach((fn) => fn());
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

function noiseBurst(duration: number, freq: number, gain: number): void {
  const a = ac();
  if (!a) return;
  const len = Math.floor(a.sampleRate * duration);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(a.destination);
  src.start();
}

function tone(freq: number, duration: number, gain: number, type: OscillatorType = 'sine', delay = 0): void {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  const g = a.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export const sfx = {
  shutter(): void {
    noiseBurst(0.05, 3000, 0.5);
    setTimeout(() => noiseBurst(0.06, 1800, 0.35), 70);
  },
  bell(): void {
    tone(1318, 0.5, 0.12, 'triangle');
    tone(1760, 0.6, 0.06, 'sine', 0.02);
  },
  blip(): void {
    tone(880, 0.08, 0.05, 'square');
  },
  whee(): void {
    const a = ac();
    if (!a) return;
    const osc = a.createOscillator();
    const g = a.createGain();
    const t0 = a.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t0);
    osc.frequency.exponentialRampToValueAtTime(1100, t0 + 0.35);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.08, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    osc.connect(g).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + 0.5);
  },
  /** A bird call: a few quick upward chirps (spring morning). */
  bird(): void {
    const a = ac();
    if (!a) return;
    const base = 2200 + Math.random() * 1600;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const t0 = a.currentTime + i * 0.11;
      const o = a.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(base, t0);
      o.frequency.exponentialRampToValueAtTime(base * 1.6, t0 + 0.06);
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.03, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
      o.connect(g).connect(a.destination);
      o.start(t0);
      o.stop(t0 + 0.1);
    }
  },
  /** A gust of wind. */
  wind(): void {
    const a = ac();
    if (!a) return;
    const dur = 1.6;
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len);
    const src = a.createBufferSource();
    src.buffer = buf;
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(300, a.currentTime);
    bp.frequency.linearRampToValueAtTime(900, a.currentTime + dur * 0.5);
    bp.frequency.linearRampToValueAtTime(400, a.currentTime + dur);
    const g = a.createGain();
    g.gain.value = 0.25;
    src.connect(bp).connect(g).connect(a.destination);
    src.start();
  },
  /** A seal being pressed onto paper (盖章). */
  stamp(): void {
    tone(140, 0.18, 0.18, 'sine');
    noiseBurst(0.08, 900, 0.35);
  },
  /** Catching a petal: a tiny pentatonic sparkle, rising with the combo. */
  petal(combo = 0): void {
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    const f = 1046 * Math.pow(2, scale[combo % scale.length] / 12);
    tone(f, 0.18, 0.035, 'sine');
  },
  /** A shovel of mud. */
  dig(): void {
    noiseBurst(0.12, 400, 0.4);
    tone(90, 0.12, 0.08, 'sine');
  },
  splash(): void {
    noiseBurst(0.25, 1800, 0.25);
  },
  /** The two-tone chime before a public announcement. */
  announce(): void {
    tone(784, 0.5, 0.08, 'sine');
    tone(659, 0.7, 0.08, 'sine', 0.42);
  },
  /** A fish gulping food at the surface: a little rising "bloop" at the given pitch. */
  gulp(freq: number): void {
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime;
    const o = a.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * 0.62, t0);
    o.frequency.exponentialRampToValueAtTime(freq, t0 + 0.045);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    const o2 = a.createOscillator();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(freq * 2, t0 + 0.02);
    const g2 = a.createGain();
    g2.gain.setValueAtTime(0.0001, t0);
    g2.gain.exponentialRampToValueAtTime(0.018, t0 + 0.03);
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
    o.connect(g).connect(a.destination);
    o2.connect(g2).connect(a.destination);
    o.start(t0);
    o2.start(t0);
    o.stop(t0 + 0.3);
    o2.stop(t0 + 0.35);
  },
  /** A pellet (or a handful) landing on the water. */
  plop(n = 1): void {
    noiseBurst(0.06 + Math.min(0.2, n * 0.015), 2600, 0.12 + Math.min(0.2, n * 0.02));
  },
  /** A big splash (jumping into the water). */
  bigSplash(): void {
    noiseBurst(0.6, 900, 0.5);
    setTimeout(() => noiseBurst(0.5, 2200, 0.25), 90);
    tone(110, 0.3, 0.12, 'sine');
  },
  /** A rising sweep of bubbles. */
  bubbles(): void {
    for (let i = 0; i < 6; i++) tone(500 + i * 160 + Math.random() * 80, 0.08, 0.03, 'sine', i * 0.05);
  },
  /** A soft magical shimmer (the character coming to life). */
  shimmer(): void {
    [1175, 1397, 1568, 1760, 2093, 2349].forEach((f, i) => tone(f, 1.2, 0.035, 'sine', i * 0.07));
  },
  /** A stone chime (磬): a clear, ringing note with a stony attack. */
  stone(freq: number): void {
    tone(freq, 1.6, 0.11, 'sine');
    tone(freq * 2.76, 0.5, 0.025, 'sine');
    tone(freq * 5.4, 0.18, 0.012, 'sine');
    noiseBurst(0.03, freq * 3, 0.08);
  },
  /** A soft woodblock tick for keeping time. */
  tick(accent = false): void {
    tone(accent ? 1000 : 820, 0.06, accent ? 0.05 : 0.03, 'sine');
  },
  /** A low plucked bass note. */
  bassPluck(freq: number): void {
    tone(freq, 0.9, 0.08, 'triangle');
  },
  /** Summer cicadas: a buzzing, pulsing drone. */
  cicada(): void {
    for (let i = 0; i < 8; i++) setTimeout(() => noiseBurst(0.18, 5200, 0.06), i * 140);
  },
  chime(): void {
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.9, 0.06, 'sine', i * 0.12));
  },
};
