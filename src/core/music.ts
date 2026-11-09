/**
 * Procedural background music — no audio files needed.
 *
 * Each track is a looping, seeded composition on the Chinese pentatonic scale
 * (宫 商 角 徵 羽), played by a plucked-string voice reminiscent of a guzheng
 * (古筝), with occasional slides (滑音), a soft drone pad, a bass line and an
 * echo. The same seed always produces the same tune, so each scene has its
 * own recognisable theme.
 *
 * To use recorded music later instead, replace `play()` with an <audio> /
 * Phaser sound call — scenes only ever call `music.play(name)`.
 */
import { audioContext, isAudioUnlocked, onAudioUnlocked } from './sfx';
import { load, save } from './storage';

export type TrackName = 'lake' | 'dream' | 'flight' | 'morning';

interface Track {
  bpm: number;
  /** MIDI note of 宫 (the tonic). */
  root: number;
  /** Bass root of each bar, in semitones from the tonic (cycled). */
  bars: number[];
  /** Chance of a melody note on each eighth-note step. */
  density: number;
  /** Chance a melody note starts with a guzheng-style slide. */
  slide: number;
  /** Echo (delay) mix, 0..1. */
  echo: number;
  voice: 'zheng' | 'bell';
  /** Soft woodblock (木鱼) on each beat. */
  woodblock?: boolean;
  seed: number;
}

const TRACKS: Record<TrackName, Track> = {
  // daytime by the lotus ponds — gentle and bright (D 宫)
  lake: { bpm: 84, root: 62, bars: [0, -3, -5, 0, 0, -3, 2, -5], density: 0.55, slide: 0.18, echo: 0.28, voice: 'zheng', seed: 11 },
  // the dream opening — slow, glassy, spacious (F 宫)
  dream: { bpm: 64, root: 65, bars: [0, -3, 5, -5], density: 0.38, slide: 0.1, echo: 0.5, voice: 'bell', seed: 23 },
  // flying over the six bridges — quick and playful (G 宫)
  flight: { bpm: 116, root: 67, bars: [0, -3, -7, -5], density: 0.72, slide: 0.15, echo: 0.22, voice: 'zheng', woodblock: true, seed: 37 },
  // waking up — soft morning bells (C 宫)
  morning: { bpm: 72, root: 60, bars: [0, 5, -3, -5], density: 0.34, slide: 0.05, echo: 0.42, voice: 'bell', seed: 51 },
};

const PENTA = [0, 2, 4, 7, 9]; // 宫 商 角 徵 羽
const STEPS_PER_BAR = 8; // eighth notes
const LOOKAHEAD = 0.2; // seconds of audio scheduled ahead
const MASTER_VOLUME = 0.5;

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const degreeToSemis = (i: number) => PENTA[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5);

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface Note {
  degree: number;
  slide: boolean;
}

/** Compose a 16-bar melody in A A' B A form, with phrases resolving to 宫 or 徵. */
function compose(track: Track): (Note | null)[] {
  const r = seeded(track.seed);
  const phrase = (endOn: number): (Note | null)[] => {
    const out: (Note | null)[] = [];
    let d = 5 + Math.floor(r() * 3);
    const len = 4 * STEPS_PER_BAR;
    for (let i = 0; i < len; i++) {
      const strong = i % 4 === 0;
      if (i >= len - 8) {
        // cadence: land on the final note, then breathe
        out.push(i === len - 8 ? { degree: endOn, slide: r() < 0.5 } : null);
        continue;
      }
      if (r() < track.density * (strong ? 1.35 : 0.8)) {
        const moves = [-2, -1, -1, 0, 1, 1, 2, 3, -3];
        d = Math.min(9, Math.max(2, d + moves[Math.floor(r() * moves.length)]));
        out.push({ degree: d, slide: r() < track.slide });
      } else {
        out.push(null);
      }
    }
    return out;
  };
  const a = phrase(5);
  const a2 = [...a.slice(0, 24), ...phrase(8).slice(24)];
  const b = phrase(3 + 5); // ends on 徵 above the tonic
  return [...a, ...a2, ...b, ...a];
}

class TrackPlayer {
  private ctx: AudioContext;
  private track: Track;
  private melody: (Note | null)[];
  private bus: GainNode;
  private timer: number;
  private step = 0;
  private nextTime: number;
  private stepDur: number;

  constructor(ctx: AudioContext, dest: AudioNode, echoIn: AudioNode, track: Track) {
    this.ctx = ctx;
    this.track = track;
    this.melody = compose(track);
    this.stepDur = 60 / track.bpm / 2;
    this.bus = ctx.createGain();
    this.bus.gain.setValueAtTime(0, ctx.currentTime);
    this.bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
    this.bus.connect(dest);
    const send = ctx.createGain();
    send.gain.value = track.echo;
    this.bus.connect(send).connect(echoIn);
    this.nextTime = ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 40);
  }

  stop(fade = 1.0): void {
    const t = this.ctx.currentTime;
    this.bus.gain.cancelScheduledValues(t);
    this.bus.gain.setValueAtTime(this.bus.gain.value, t);
    this.bus.gain.linearRampToValueAtTime(0, t + fade);
    window.clearInterval(this.timer);
    window.setTimeout(() => this.bus.disconnect(), (fade + 2) * 1000);
  }

  private schedule(): void {
    const now = this.ctx.currentTime;
    // if the tab was in the background, skip ahead instead of bursting notes
    if (this.nextTime < now - 0.1) this.nextTime = now + 0.05;
    while (this.nextTime < now + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += this.stepDur;
      this.step += 1;
    }
  }

  private playStep(step: number, t: number): void {
    const tr = this.track;
    const inBar = step % STEPS_PER_BAR;
    const bar = Math.floor(step / STEPS_PER_BAR);
    const bassRoot = tr.root - 24 + tr.bars[bar % tr.bars.length];

    if (inBar === 0) {
      this.pad(mtof(bassRoot + 12), mtof(bassRoot + 19), t, this.stepDur * STEPS_PER_BAR);
      this.bass(mtof(bassRoot), t);
    } else if (inBar === 4) {
      this.bass(mtof(bassRoot + 7), t);
    }
    if (tr.woodblock && step % 2 === 0) this.woodblock(t, inBar === 0);

    const note = this.melody[step % this.melody.length];
    if (note) {
      const f = mtof(tr.root + degreeToSemis(note.degree) - 12 + (tr.voice === 'bell' ? 12 : 0));
      if (tr.voice === 'zheng') this.zheng(f, t, note.slide);
      else this.bell(f, t);
    }
  }

  // ---- voices -------------------------------------------------------------

  private env(t: number, peak: number, decay: number, attack = 0.005): GainNode {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }

  /** Plucked string with a bright attack that mellows, like a guzheng. */
  private zheng(f: number, t: number, slide: boolean): void {
    const c = this.ctx;
    const dur = 1.8;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 2;
    filter.frequency.setValueAtTime(Math.min(8000, f * 8), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + 0.5);
    const g = this.env(t, 0.16, dur);
    filter.connect(g).connect(this.bus);
    for (const [mult, type, level] of [[1, 'triangle', 1], [2, 'sine', 0.25], [3, 'sawtooth', 0.05]] as const) {
      const o = c.createOscillator();
      o.type = type;
      const lv = c.createGain();
      lv.gain.value = level;
      if (slide) {
        // 滑音: slide up a whole tone into the note
        o.frequency.setValueAtTime(f * mult * 0.891, t);
        o.frequency.exponentialRampToValueAtTime(f * mult, t + 0.12);
      } else {
        o.frequency.setValueAtTime(f * mult, t);
      }
      // gentle vibrato (揉弦) as the note rings
      const lfo = c.createOscillator();
      lfo.frequency.value = 5.2;
      const depth = c.createGain();
      depth.gain.setValueAtTime(0, t);
      depth.gain.linearRampToValueAtTime(f * mult * 0.004, t + 0.6);
      lfo.connect(depth).connect(o.frequency);
      o.connect(lv).connect(filter);
      o.start(t);
      lfo.start(t);
      o.stop(t + dur + 0.1);
      lfo.stop(t + dur + 0.1);
    }
  }

  /** Soft glassy bell (inharmonic partials). */
  private bell(f: number, t: number): void {
    const c = this.ctx;
    const dur = 2.6;
    for (const [mult, level] of [[1, 0.11], [2.76, 0.03], [5.4, 0.012]]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mult;
      const g = this.env(t, level, dur / mult ** 0.3, 0.01);
      o.connect(g).connect(this.bus);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
  }

  private bass(f: number, t: number): void {
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = this.env(t, 0.09, 1.1, 0.02);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 1.3);
  }

  private pad(f1: number, f2: number, t: number, len: number): void {
    const c = this.ctx;
    for (const [f, det] of [[f1, -4], [f1, 4], [f2, 0]]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = det;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.018, t + len * 0.35);
      g.gain.linearRampToValueAtTime(0, t + len * 1.05);
      o.connect(g).connect(this.bus);
      o.start(t);
      o.stop(t + len * 1.1);
    }
  }

  private woodblock(t: number, accent: boolean): void {
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(accent ? 900 : 750, t);
    o.frequency.exponentialRampToValueAtTime(500, t + 0.05);
    const g = this.env(t, accent ? 0.05 : 0.03, 0.07, 0.002);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 0.12);
  }
}

class Music {
  private master: GainNode | null = null;
  private echoIn: AudioNode | null = null;
  private player: TrackPlayer | null = null;
  private current: TrackName | null = null;
  private wanted: TrackName | null = null;
  private muted = load<boolean>('musicMuted', false) === true;

  constructor() {
    onAudioUnlocked(() => {
      if (this.wanted) this.start(this.wanted);
    });
  }

  /** Switch to a track (cross-fades; does nothing if it is already playing). */
  play(name: TrackName): void {
    this.wanted = name;
    if (name === this.current) return;
    // Browsers block audio until the first click / key press; the constructor's
    // unlock hook starts whatever track is wanted at that moment.
    if (isAudioUnlocked()) this.start(name);
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): void {
    this.muted = !this.muted;
    save('musicMuted', this.muted);
    const ctx = audioContext();
    if (ctx && this.master) {
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.setTargetAtTime(this.muted ? 0 : MASTER_VOLUME, ctx.currentTime, 0.15);
    }
  }

  private ensureGraph(ctx: AudioContext): void {
    if (this.master) return;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
    this.master.connect(ctx.destination);
    // echo: delay -> lowpass -> feedback, mixed back into master
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.42;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2200;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    delay.connect(tone).connect(fb).connect(delay);
    tone.connect(this.master);
    this.echoIn = delay;
  }

  private start(name: TrackName): void {
    if (name === this.current) return;
    const ctx = audioContext();
    if (!ctx) return;
    this.ensureGraph(ctx);
    this.player?.stop(1.2);
    this.player = new TrackPlayer(ctx, this.master!, this.echoIn!, TRACKS[name]);
    this.current = name;
  }
}

export const music = new Music();
