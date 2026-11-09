# 西湖逍遥游 · West Lake Wandering

A small story game based on a real dream: cycling around Hangzhou's West Lake
(西湖) with childhood friends. Each of the **Ten Scenes of West Lake (西湖十景)**
is meant to become one chapter. The game ends with an invitation to visit
Hangzhou.

> 我今天做了一个梦，梦见和童年的伙伴，小学同学一起，骑单车游西湖……

## Chapter 1 · 曲院风荷 (Lotus in the Breeze at Quyuan)

1. **Intro.** The dream begins, with Yang Wanli's poem
   「接天莲叶无穷碧，映日荷花别样红」.
2. **Ride.** Cycle along the lotus ponds with KOKO and GOGO. Hold the camera up
   with one hand off the bars (单手脱把) and photograph the blossoms that are
   just opening (初绽).
3. **Pavilion (凉亭).** Stop at the stone table and choose the next route:
   苏堤 (Su Causeway) or 杨公堤 (Yanggong Causeway).
4. **Daydream.** Fly over the six bridges like a roller coaster. Each bridge
   shows its real name.
5. **"我内急…"** You leave your bag with your friends, and the dream ends.
6. **Waking up.** Browse the album of photos from the dream, then get the
   invitation to come to Hangzhou and see the other nine scenes.

**Controls**

| Device | Pedal | Brake | Take a photo |
|---|---|---|---|
| Keyboard | Hold → or D | ← or A | Hold Space to raise the camera, release to shoot |
| Touch or mouse | Hold the **踩踏 / Pedal** button | none | Hold the **拍照 / Photo** button, release to shoot |

Click or press Space / Enter to advance dialogue. Use **1** or **2** to choose
a route. The **EN / 中文** button in the top-right corner switches the language
at any time. The **♫** button turns the music on or off.

## Running it

Requires Node.js. Install it with `brew install node` if you don't have it.

```bash
npm install        # first time only
npm run dev        # play at http://localhost:5173 (also reachable from a phone on the same Wi-Fi)
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run typecheck  # TypeScript check only
```

## Tech stack

| Piece | Why |
|---|---|
| **[Phaser 4](https://phaser.io)** | Mature, free 2D game engine for the web: scenes, input, tweens, camera and touch support built in. |
| **TypeScript** | Catches mistakes early as the story and number of chapters grow. |
| **Vite** | Instant dev server; the build output is a plain static website. |

All art is **drawn in code**: lotus, willows, the pavilion, bridges and the
cyclists. There are no image files yet, and the game is playable as-is. To use
real illustrations later, load images in `BootScene` under the same texture
keys (`leaf1`, `bloomHalf`, `pavilion`, …) and they replace the generated ones.
Sound effects are synthesized in code too (`src/core/sfx.ts`).

**Background music** is also composed in code (`src/core/music.ts`). Each
track is a looping melody on the Chinese pentatonic scale (宫商角徵羽). It is
played by a plucked-string voice in the style of a guzheng (古筝), with slides
(滑音) and vibrato (揉弦), over a soft drone and bass line, with an echo. Each
scene has its own mood:

| Track | Scenes | Feel |
|---|---|---|
| `lake` | Title, ride, pavilion | Gentle and bright |
| `dream` | Intro | Slow, glassy bells |
| `flight` | Bridge daydream | Quick, with a woodblock (木鱼) beat |
| `morning` | Waking up | Soft morning bells |

The **♫** button next to EN / 中文 mutes the music, and the game remembers the
setting. To change a tune, adjust its `seed`, `bpm` or `root` in `TRACKS`. To
use recorded music instead, have `music.play(name)` play an audio file; the
scenes don't need to change.

### Where it can go next

The build in `dist/` is a static site, so the same code can go to several
places without a rewrite:

- **Web game:** upload `dist/` to any static host (GitHub Pages, Netlify,
  Vercel, Cloudflare Pages). `vite.config.ts` uses relative paths, so it also
  works from a sub-folder such as `kidwise.github.io/west-lake-dreams/`.
- **iOS / Android app:** wrap it with [Capacitor](https://capacitorjs.com).
  Run `npm i @capacitor/core @capacitor/cli`, then `npx cap init`, and use
  `dist` as the web directory. Then `npx cap add ios` or `npx cap add android`.
  Touch controls and screen scaling are already in place.
- **Desktop app:** wrap `dist/` with Electron or Tauri.
- **Mini-program (小程序):** possible with Phaser adapters. This needs more
  work than the options above.

## Project layout

```
src/
  main.ts              game setup (resolution, scaling, scene list)
  core/
    config.ts          screen size, fonts, colour palette
    i18n.ts            translation lookup + live language switching
    state.ts           current play-through (photos, route) + saved progress
    storage.ts         safe localStorage wrapper
    sfx.ts             synthesized sound effects
    music.ts           procedural background music (pentatonic, guzheng-style)
  story/
    strings.ts         ALL game text, Chinese + English (edit the story here)
    chapters.ts        the Ten Scenes; which ones are playable
  art/
    textures.ts        procedural lotus, willows, pavilion, peach trees…
    Cyclist.ts         animated bike + rider (pedalling legs, camera arm)
    backdrop.ts        sky, hills with pagoda, lake, far causeway
    paint.ts           drawing helpers
  ui/
    Dialogue.ts        visual-novel dialogue box with choices
    Button.ts, text.ts, narrate.ts, overlay.ts
  scenes/
    BootScene          generates art
    TitleScene         title + Ten Scenes list
    IntroScene         "我今天做了一个梦…"
    RideScene          side-scrolling ride + lotus photography
    PavilionScene      conversation, route choice, the bag
    BridgeDreamScene   six-bridge roller-coaster daydream
    WakeScene          waking up, photo album, invitation
    UIScene            language toggle overlay (always on top)
```

### Changing the story

- **Wording, character names, translations:** edit `src/story/strings.ts`.
  The English table is type-checked against the Chinese one, so a missing
  translation won't compile.
- **Conversation order:** the pavilion script reads like a play, in
  `PavilionScene.partOne()` and `partTwo()`.
- **Adding a chapter** (for example 苏堤春晓):
  1. Create its scenes in `src/scenes/`.
  2. Register them in `main.ts`.
  3. Set `startScene` for that scene in `src/story/chapters.ts`. The title
     screen then lists it as playable.
