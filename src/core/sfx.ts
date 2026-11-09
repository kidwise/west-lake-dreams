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
  chime(): void {
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.9, 0.06, 'sine', i * 0.12));
  },
};
