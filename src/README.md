# Developer notes

The player-facing overview is in the top-level `README.md`. Each chapter keeps its full design, real-world facts and sources in its own folder, in `src/<chapter>/STORY.md`.

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
Sound effects are synthesized in code too (`src/core/sfx.ts`). Later chapters paint their art on canvases (gradients, ink outlines) at load time, in each chapter's `art.ts`.

**Background music** is also composed in code (`src/core/music.ts`). Each
track is a looping melody on the Chinese pentatonic scale (宫商角徵羽). It is
played by a plucked-string voice in the style of a guzheng (古筝), with slides
(滑音) and vibrato (揉弦), over a soft drone and bass line, with an echo. Each
scene has its own mood:

Every chapter adds its own tracks to `TRACKS` (their moods are listed in each
`STORY.md`). A few are shared: `lake` (title screen), `morning` (most
wake-up scenes).

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

## Changing the story

- **Wording, character names, translations:** edit the chapter's
  `src/story/<chapter>Strings.ts` (shared text is in `src/story/strings.ts`).
  The English table is type-checked against the Chinese one, so a missing
  translation won't compile.
- **Conversation order:** the pavilion script reads like a play, in
  `QuyuanPavilionScene.partOne()` and `partTwo()`.
- **Adding a chapter:** every chapter follows the same layout.
  1. Make a folder `src/<chapter>/` with its scenes, an `art.ts` (textures,
     generated from `BootScene`), and a `state.ts` for its run.
     - The run state is reset in the chapter's intro scene, so the photos on
       the end scroll survive until the next play.
  2. Put its text in `src/story/<chapter>Strings.ts` and merge it into
     `strings.ts`.
  3. Register its scenes in `main.ts`.
  4. Set `startScene` in `src/story/chapters.ts`. The title screen then lists
     it as playable.
  5. Chapters can be played in any order. Anything that refers to another
     chapter should check `getProgress().visited` instead of assuming an
     order.

## Automated play-throughs

`tests/playthrough/` has one script per chapter that plays it from start to
finish in headless Chrome: riding, aiming photos, solving the puzzles, through
the scroll and the invitation. Any page error or console error fails the
chapter.

```bash
npm run test:play                    # all ten chapters (about 15 minutes)
npm run test:play -- leifeng nanping # only these
```

- The runner starts its own dev server.
- Screenshots go to `tests/playthrough/out/<chapter>/`, which is git-ignored.
- It needs Google Chrome installed. Set `CHROME_PATH` if it isn't in a
  standard place.
- Each run starts from a clean save. A chapter that changes with what you've
  already played (for example 南屏晚钟's roll call or 柳浪闻莺's kites)
  declares `visited` in its script.
- The scripts read the game's state through the dev-only hooks on `window`:
  - `__game`
  - each chapter's run state, such as `__lfRun`
- When a scene's internals change, its script may need updating too.

