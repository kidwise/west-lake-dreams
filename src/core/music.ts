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

export type TrackName =
  | 'lake'
  | 'dream'
  | 'flight'
  | 'morning'
  | 'moonlake'
  | 'moonrise'
  | 'sudiDawn'
  | 'sudiRide'
  | 'sudiSunrise'
  | 'huagang'
  | 'huagangUnder'
  | 'huagangStele'
  | 'huagangFinale'
  | 'dqMorning'
  | 'dqFight'
  | 'dqLady'
  | 'dqHill'
  | 'dqXiao'
  | 'phNight'
  | 'phCalm'
  | 'phMoon'
  | 'phBoat'
  | 'sfMist'
  | 'sfClimb'
  | 'sfTower'
  | 'sfHerd'
  | 'sfDig'
  | 'sfFinale'
  | 'lfDusk'
  | 'lfStairs'
  | 'lfRuins'
  | 'lfSunset'
  | 'lfHome';

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
  voice: 'zheng' | 'bell' | 'dizi' | 'pipa';
  /** Shift the melody by octaves (−1 turns the flute into a low, breathy 箫). */
  octave?: number;
  /** Heard from under the water: everything through a low-pass filter. */
  muffle?: boolean;
  /** Soft woodblock (木鱼) on each beat. */
  woodblock?: boolean;
  /** Plucked guzheng broken chords on the off-beats under the melody. */
  arp?: boolean;
  /** A light brushed shaker on the off-beats (lively tracks). */
  shaker?: boolean;
  /** Scale degree phrases resolve to (5 = 宫; 4 or 9 = 羽 for a minor, wistful feel). */
  home?: number;
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
  // rowing around the Three Pools at dusk — 羽 mode, calm and a little mysterious (D 宫, resolving on B 羽)
  moonlake: { bpm: 70, root: 62, bars: [-3, -5, 0, -3, -3, 2, -5, -3], density: 0.46, slide: 0.32, echo: 0.4, voice: 'zheng', home: 4, seed: 67 },
  // moonrise over the lit pagodas — slow, shimmering bells (E♭ 宫)
  moonrise: { bpm: 58, root: 63, bars: [0, -3, 5, 0], density: 0.4, slide: 0, echo: 0.55, voice: 'bell', home: 9, seed: 79 },
  // 苏堤春晓 — before dawn: mist, a soft flute over slow broken chords (E♭ 宫, 羽 colour)
  sudiDawn: { bpm: 66, root: 63, bars: [-3, -5, 0, -3, 5, 0, -5, -3], density: 0.32, slide: 0.3, echo: 0.48, voice: 'dizi', arp: true, home: 4, seed: 83 },
  // riding the six bridges in the half-light — lively flute, plucked chords, woodblock (F 宫)
  sudiRide: { bpm: 112, root: 65, bars: [0, -3, 5, -5, 0, -3, 2, -5], density: 0.6, slide: 0.2, echo: 0.24, voice: 'dizi', arp: true, woodblock: true, seed: 91 },
  // the sun is up — bright, full and joyful (G 宫)
  sudiSunrise: { bpm: 120, root: 67, bars: [0, 5, -3, 2, 0, 5, -5, 0], density: 0.66, slide: 0.18, echo: 0.22, voice: 'dizi', arp: true, woodblock: true, shaker: true, seed: 97 },
  // 花港观鱼 — a sunny spring day by the fish pond: light 江南丝竹 on pipa (D 宫)
  huagang: { bpm: 100, root: 62, bars: [0, -3, 5, -5, 0, -3, 2, -5], density: 0.58, slide: 0.2, echo: 0.28, voice: 'pipa', arp: true, shaker: true, seed: 103 },
  // the same tune heard from under the water: muffled, slower to breathe, more echo
  huagangUnder: { bpm: 100, root: 62, bars: [0, -3, 5, -5, 0, -3, 2, -5], density: 0.58, slide: 0.2, echo: 0.55, voice: 'zheng', arp: true, muffle: true, seed: 103 },
  // the stele and its legend — quiet and a little magical (D 宫, 羽 colour)
  huagangStele: { bpm: 72, root: 62, bars: [-3, 0, -5, -3, 5, 0, -5, -3], density: 0.36, slide: 0.25, echo: 0.48, voice: 'bell', home: 4, seed: 107 },
  // the fish write 花港观鱼 — bright and festive (G 宫)
  huagangFinale: { bpm: 112, root: 67, bars: [0, 5, -3, 2, 0, -3, -5, 0], density: 0.64, slide: 0.18, echo: 0.26, voice: 'pipa', arp: true, woodblock: true, shaker: true, seed: 109 },
  // 断桥残雪 — a snowy morning: crisp bells like falling snow (A 宫)
  dqMorning: { bpm: 88, root: 69, bars: [0, -3, 5, -5, 0, 2, -3, -5], density: 0.5, slide: 0, echo: 0.42, voice: 'bell', arp: true, seed: 113 },
  // the snowball fight — quick flute and woodblock (G 宫)
  dqFight: { bpm: 126, root: 67, bars: [0, -5, -3, -5, 0, 5, -3, 0], density: 0.7, slide: 0.15, echo: 0.2, voice: 'dizi', arp: true, woodblock: true, shaker: true, seed: 127 },
  // the lady in white — cool guzheng in the 羽 mode (E 宫, resolving on C♯ 羽)
  dqLady: { bpm: 74, root: 64, bars: [-3, -5, 0, -3, 5, -3, -5, -3], density: 0.42, slide: 0.32, echo: 0.46, voice: 'zheng', arp: true, home: 4, seed: 131 },
  // the sun comes out over the bridge (D 宫)
  dqHill: { bpm: 92, root: 62, bars: [0, -3, 5, 0, -5, -3, 2, -5], density: 0.5, slide: 0.2, echo: 0.36, voice: 'zheng', arp: true, seed: 137 },
  // 湖心亭看雪 — almost silence: a low 箫 and long echoes (D 宫, 羽 colour)
  // 平湖秋月 — a moonless Mid-Autumn night on the zig-zag bridges: quiet guzheng, 羽 mode (C 宫)
  phNight: { bpm: 70, root: 60, bars: [-3, -5, 0, -3, 5, -3, -5, -3], density: 0.36, slide: 0.3, echo: 0.5, voice: 'zheng', arp: true, home: 4, seed: 149 },
  // smoothing the water: sparse bells and a lot of space (C 宫)
  phCalm: { bpm: 60, root: 60, bars: [0, -3, 5, -5], density: 0.24, slide: 0, echo: 0.6, voice: 'bell', home: 9, seed: 151 },
  // the moon is back: bright, lilting, a little 广东音乐-like (D 宫)
  phMoon: { bpm: 96, root: 62, bars: [0, 5, -3, 2, 0, -3, -5, 0], density: 0.6, slide: 0.25, echo: 0.36, voice: 'pipa', arp: true, shaker: true, seed: 157 },
  // gliding out to the moon by boat (E♭ 宫)
  phBoat: { bpm: 58, root: 63, bars: [0, -3, 5, 0], density: 0.34, slide: 0.2, echo: 0.6, voice: 'dizi', octave: -1, arp: true, seed: 163 },
  // 双峰插云 — the dream at the foot of the bare peaks: misty flute over slow chords (F 宫, 羽 colour)
  sfMist: { bpm: 68, root: 65, bars: [-3, 0, -5, -3, 5, 0, -5, -3], density: 0.34, slide: 0.3, echo: 0.5, voice: 'dizi', arp: true, home: 4, seed: 167 },
  // up the thirty-six bends: a brisk walking tune with woodblock steps (A 宫)
  sfClimb: { bpm: 118, root: 69, bars: [0, -3, 5, -5, 0, 2, -3, -5], density: 0.62, slide: 0.15, echo: 0.22, voice: 'dizi', arp: true, woodblock: true, seed: 173 },
  // stacking the pagoda: deliberate guzheng, a little suspense (D 宫)
  sfTower: { bpm: 90, root: 62, bars: [0, -5, -3, -5, 0, 5, -3, 0], density: 0.48, slide: 0.22, echo: 0.34, voice: 'zheng', arp: true, seed: 179 },
  // flying over the tea terraces: pastoral, lilting pipa with a shaker (G 宫)
  sfHerd: { bpm: 108, root: 67, bars: [0, 5, -3, 2, 0, -3, -5, 0], density: 0.6, slide: 0.2, echo: 0.28, voice: 'pipa', arp: true, shaker: true, woodblock: true, seed: 181 },
  // brushing away the earth: quiet bells (E♭ 宫)
  sfDig: { bpm: 76, root: 63, bars: [0, -3, 5, -5], density: 0.36, slide: 0, echo: 0.46, voice: 'bell', arp: true, seed: 191 },
  // the cloud sea and the two pagodas: broad and bright (F 宫)
  sfFinale: { bpm: 84, root: 65, bars: [0, 5, -3, 2, 0, -3, 5, 0], density: 0.5, slide: 0.25, echo: 0.42, voice: 'dizi', arp: true, seed: 193 },
  // 雷峰夕照 — dusk by the lake: warm pipa over guzheng broken chords (E♭ 宫, 羽 colour)
  lfDusk: { bpm: 80, root: 63, bars: [-3, 0, 5, -3, -5, 0, 2, -3], density: 0.46, slide: 0.28, echo: 0.42, voice: 'pipa', arp: true, home: 4, seed: 197 },
  // up the steps after 法海: quick and comic, woodblock (木鱼) on every beat (G 宫)
  lfStairs: { bpm: 132, root: 67, bars: [0, -5, -3, -5, 0, 5, -3, 0], density: 0.66, slide: 0.12, echo: 0.18, voice: 'dizi', arp: true, woodblock: true, shaker: true, seed: 199 },
  // under the pagoda: low, mysterious guzheng (D 宫, 羽 mode)
  lfRuins: { bpm: 96, root: 62, bars: [-3, -5, -3, 0, -3, -5, 2, -3], density: 0.5, slide: 0.3, echo: 0.4, voice: 'zheng', arp: true, woodblock: true, home: 4, seed: 211 },
  // the top at sunset: broad, glowing flute (F 宫)
  lfSunset: { bpm: 72, root: 65, bars: [0, 5, -3, 2, 0, -3, 5, 0], density: 0.44, slide: 0.3, echo: 0.5, voice: 'dizi', arp: true, seed: 223 },
  // dinner at home: cosy bells (C 宫)
  lfHome: { bpm: 84, root: 60, bars: [0, -3, 5, -5, 0, 2, -3, 0], density: 0.4, slide: 0.1, echo: 0.36, voice: 'bell', arp: true, seed: 227 },
  dqXiao: { bpm: 56, root: 62, bars: [-3, 0, -5, -3], density: 0.26, slide: 0.35, echo: 0.6, voice: 'dizi', octave: -1, home: 4, seed: 139 },
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
  const home = track.home ?? 5;
  const a = phrase(home);
  const a2 = [...a.slice(0, 24), ...phrase(Math.min(9, home + 3)).slice(24)];
  const b = phrase(Math.min(9, home + 3)); // a contrasting phrase ending higher
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
    if (track.muffle) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 820;
      lp.Q.value = 0.8;
      this.bus.connect(lp).connect(dest);
    } else {
      this.bus.connect(dest);
    }
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
    if (tr.shaker && step % 2 === 1) this.shaker(t);
    if (tr.arp && step % 2 === 1) {
      // broken chord: root, 5th, octave, 5th — an octave above the bass
      const pattern = [0, 7, 12, 7];
      this.pluck(mtof(bassRoot + 24 + pattern[(inBar >> 1) % 4]), t);
    }

    const note = this.melody[step % this.melody.length];
    if (note) {
      const up = (tr.voice === 'zheng' || tr.voice === 'pipa' ? 0 : 12) + 12 * (tr.octave ?? 0);
      const f = mtof(tr.root + degreeToSemis(note.degree) - 12 + up);
      if (tr.voice === 'zheng') this.zheng(f, t, note.slide);
      else if (tr.voice === 'pipa') {
        let len = 1;
        while (len < 8 && !this.melody[(step + len) % this.melody.length]) len++;
        this.pipa(f * 2, t, Math.min(len, 4) * this.stepDur, note.slide);
      }
      else if (tr.voice === 'dizi') {
        // hold until the next note (up to a bar), for a singing line
        let len = 1;
        while (len < 8 && !this.melody[(step + len) % this.melody.length]) len++;
        this.dizi(f, t, Math.min(len, 4) * this.stepDur * 0.95, note.slide, step);
      } else this.bell(f, t);
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

  /**
   * Bamboo flute (笛子): breathy attack, gentle vibrato, slides (滑音) and an
   * occasional quick grace note (倚音) from above.
   */
  private dizi(f: number, t: number, dur: number, slide: boolean, step: number): void {
    const c = this.ctx;
    const end = t + Math.max(0.12, dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.085, t + 0.045);
    g.gain.setValueAtTime(0.085, end - 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, end + 0.12);
    const tone = c.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = Math.min(9000, f * 6);
    tone.connect(g).connect(this.bus);

    const grace = !slide && step % 7 === 3;
    for (const [mult, type, level] of [[1, 'sine', 1], [2, 'triangle', 0.18], [3, 'sine', 0.06]] as const) {
      const o = c.createOscillator();
      o.type = type;
      const fm = f * mult;
      if (slide) {
        o.frequency.setValueAtTime(fm * 0.94, t);
        o.frequency.exponentialRampToValueAtTime(fm, t + 0.09);
      } else if (grace) {
        o.frequency.setValueAtTime(fm * 1.122, t);
        o.frequency.setValueAtTime(fm, t + 0.06);
      } else {
        o.frequency.setValueAtTime(fm, t);
      }
      const lfo = c.createOscillator();
      lfo.frequency.value = 5.6;
      const depth = c.createGain();
      depth.gain.setValueAtTime(0, t);
      depth.gain.linearRampToValueAtTime(fm * 0.006, t + Math.min(0.35, dur));
      lfo.connect(depth).connect(o.frequency);
      const lv = c.createGain();
      lv.gain.value = level;
      o.connect(lv).connect(tone);
      o.start(t);
      lfo.start(t);
      o.stop(end + 0.2);
      lfo.stop(end + 0.2);
    }
    // breath noise at the start of the note
    const len = Math.floor(c.sampleRate * 0.12);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const n = c.createBufferSource();
    n.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f * 2;
    bp.Q.value = 3;
    const ng = c.createGain();
    ng.gain.value = 0.05;
    n.connect(bp).connect(ng).connect(this.bus);
    n.start(t);
  }

  /**
   * 琵琶: a bright, quickly fading pluck; long notes are sustained with a
   * tremolo of rapid plucks (轮指) that swells and fades.
   */
  private pipa(f: number, t: number, dur: number, slide: boolean): void {
    const c = this.ctx;
    const one = (at: number, level: number, decay: number) => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      if (slide && at === t) {
        o.frequency.setValueAtTime(f * 0.891, at);
        o.frequency.exponentialRampToValueAtTime(f, at + 0.08);
      } else {
        o.frequency.setValueAtTime(f, at);
      }
      const o2 = c.createOscillator();
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(f * 2, at);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 3;
      lp.frequency.setValueAtTime(Math.min(9000, f * 7), at);
      lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 1.6), at + decay * 0.6);
      const g = this.env(at, level, decay, 0.002);
      const lv2 = c.createGain();
      lv2.gain.value = 0.3;
      o.connect(lp);
      o2.connect(lv2).connect(lp);
      lp.connect(g).connect(this.bus);
      o.start(at);
      o2.start(at);
      o.stop(at + decay + 0.05);
      o2.stop(at + decay + 0.05);
    };
    one(t, 0.07, 0.55);
    if (dur >= this.stepDur * 2.5) {
      // 轮指 tremolo for the rest of the note
      const n = Math.floor((dur - 0.08) / 0.065);
      for (let i = 1; i < n; i++) {
        const k = i / n;
        one(t + i * 0.065, 0.035 * Math.sin(Math.PI * (0.3 + 0.7 * k)) + 0.008, 0.12);
      }
    }
  }

  /** A soft, short guzheng pluck for broken chords. */
  private pluck(f: number, t: number): void {
    const o = this.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(f * 6, t);
    lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.3);
    const g = this.env(t, 0.045, 0.7, 0.003);
    o.connect(lp).connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 0.8);
  }

  private shaker(t: number): void {
    const c = this.ctx;
    const len = Math.floor(c.sampleRate * 0.05);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const n = c.createBufferSource();
    n.buffer = buf;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    const g = c.createGain();
    g.gain.value = 0.035;
    n.connect(hp).connect(g).connect(this.bus);
    n.start(t);
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

  /**
   * Frequency of a note in the key of the current track (pentatonic degree,
   * 0 = 宫 an octave above the tonic), so sound effects play in tune.
   */
  noteFreq(degree: number): number {
    const root = TRACKS[this.current ?? 'lake'].root;
    return mtof(root + 12 + degreeToSemis(degree));
  }

  /** Fade the music out completely (for scenes that make their own music). */
  stop(): void {
    this.wanted = null;
    this.player?.stop(0.8);
    this.player = null;
    this.current = null;
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
