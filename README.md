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

## Dream 2 · 三潭印月 (Three Pools Mirroring the Moon): finding West Lake on the one-yuan note

The story is based on the real note. The back of China's one-yuan note
(fifth series) shows the three stone pagodas of 三潭印月:
- a big pagoda close on the left,
- a small far one in the middle,
- a medium one on the right,
- a tree-lined shore behind, and a slender pagoda on the far hills.

The pagodas stand in an equilateral triangle. It has been reported that the
photographer's angle could only capture **two** of them, and the note shows
**three**.

In the dream you are a kid again, holding a one-yuan note from Grandma:

1. **Study the note.** Tap its three parts: 近塔 (the near pagoda),
   双塔 (the far-and-near pair) and 远景 (the far view with the slender
   pagoda on the hills).
2. **Row the boat.** This is a first-person view. Each pagoda's size, spacing
   and position, and which one hides another, all change as you move and turn.
   A live meter shows how close each part is.
3. **Photograph the three parts.** If you're stuck, KOKO and GOGO give hints,
   and a glowing ring appears on the mini-map.
4. **The real twist.** The "整张纸币" meter counts how many of the note's
   three pagodas the view matches at once. It never goes above **2/3**, just
   like the reported reality: the third pagoda on the note was added in.
5. **Rebuild the picture.** Drag your three photos onto the note.
6. **Finale.** Night falls and the moon rises. Candles inside the pagodas cast
   little moons on the water through their round openings, which is where the
   name 三潭印月 comes from. You wake up holding the corner of your blanket,
   and the game invites you to bring a one-yuan note to the Three Pools and
   count how many pagodas you can see at once.

The pagodas follow the real structure: 塔基 → ball-shaped body with round
openings → 宝盖 → small six-sided pavilion → 小宝盖 → 葫芦顶.

**Boat controls:** ← → to turn (slow at first, so you can aim precisely),
↑ to row, ↓ to back up, Space to take a photo, and hold N to look at the note.
On touch screens, use the buttons on the deck.

**About the note:** the banknote in the game follows the real composition
but is an original drawing. It has no bank name, emblem, serial number or other
RMB design elements. The use of RMB images is regulated in China.

**How the scene works:** `src/santan/world.ts` describes the lake in metres
and projects it into a first-person view. Each part of the note is a target
composition: where pagodas and landmarks sit in the photo frame, and how big
they look. A brute-force check over the whole lake confirms three things:
- every part can be photographed,
- two pagodas can line up with the note,
- three never can.

**Sources:**
- Two pagodas in the photo, three on the note:
  [杭州网](https://hznews.hangzhou.com.cn/wghz/content/2025-06/11/content_9014675.htm),
  [百度百科](https://baike.baidu.com/item/%E4%B8%80%E5%85%83%E4%BA%BA%E6%B0%91%E5%B8%81/7989259)
- Pagoda structure:
  [杭州网](https://hznews.hangzhou.com.cn/chengshi/content/2018-09/24/content_7072403_0.htm)
- History of the pagodas and the Mid-Autumn candles:
  [知乎](https://zhuanlan.zhihu.com/p/150061344)

## Dream 3 · 苏堤春晓 (Spring Dawn at Su Causeway): six bridges before sunrise

The bridge-flying daydream became its own dream. In real life you **can't ride
a bike on Su Causeway**: since 2018, non-motor vehicles have been banned on
the Bai and Su causeways and cyclists must walk. So only in a dream can you
fly over its six bridges. The causeway is about 2.8 km long. Its six
single-arch stone bridges, from south to north, are 映波, 锁澜, 望山, 压堤,
东浦 and 跨虹. Su Shi built it from mud dredged out of the lake.

1. **Prologue: the road dug out of the lake.** Before dawn, in the mist, there
   is a gap in the causeway. An old man in a tall square hat is shovelling
   mud out of the lake. In a timing mini-game you help him fill the gap: the
   causeway grows, the murky water clears, and fish appear. He says that
   digging out the mud clears the lake and piling it up makes a road. Then he
   recites 「欲把西湖比西子，淡妆浓抹总相宜」 and fades into the mist. The
   kids guess: 「他……是苏东坡吧？」 He is never named.
2. **The ride, as night turns to morning.** The sky changes with your
   progress, from deep blue through violet and peach to golden sunrise and a
   clear spring morning. Lamps fade out, birdsong fills in, and the far hills
   catch the first light.
   - **Fly and land:** speed up, fly off each bridge's crest, and lean
     forward in the air (↓) to land along the slope. A guide line turns
     green when the bike's angle matches. A perfect landing gives a speed
     boost; a bad one makes you wobble.
   - **Collect petals:** peach petals fall from the trees, and arcs of petals
     hang over every bridge. Catches in the air count double, and quick
     catches play a rising pentatonic combo.
   - **Collect seals:** each bridge stamps a red seal (印章) into the HUD.
3. **One event per bridge,** inspired by its name:

   | Bridge | Event |
   |---|---|
   | 映波 | Slow motion and an automatic photo of you flying above your reflection |
   | 锁澜 | Wind gusts; tuck down (↓) to push through |
   | 望山 | Slow motion at the top of the jump; photograph the western hills |
   | 压堤 | The middle of the causeway; KOKO and GOGO race you to the north end |
   | 东浦 | 「回头看！」 A cut to the sun rising over the outer lake, with 保俶塔, 湖心亭 and 小瀛洲. The music switches to the sunrise theme |
   | 跨虹 | A rainbow over the last bridge; fly through it |

4. **Ending.** At the north end, a loudspeaker announces 「苏堤上请下车推行」.
   The kids laugh, get off and walk their bikes away. You wake up to
   birdsong with a peach petal on your pillow.
5. **The 春晓长卷.** A scroll unrolls showing the six seals, your two photos,
   the petals you caught, your perfect landings, your time in the air and
   your race result. Then comes an invitation to walk the causeway on a
   spring morning.

**Controls:** hold → (or 踩踏) to speed up. Hold ↓ (or 伏低) to tuck against
the wind, or to lean forward in the air. Press Space (or 拍照) at the 望山
moment.

**Music:** three new pentatonic tracks with a bamboo-flute (笛子) voice:
- `sudiDawn`: mist and broken chords,
- `sudiRide`: lively, with a woodblock beat,
- `sudiSunrise`: bright and full.

New sound effects include birdsong, wind, seals stamping, petal sparkles and
the announcement chime.

**Chapter 1 change:** at the pavilion in 曲院风荷, the route choice now offers
only 杨公堤. KOKO says 苏堤 is best before dawn and is saved for another dream.

**Sources:**
- Length and bridges:
  [澎湃新闻](https://m.thepaper.cn/newsDetail_forward_19443734)
- Cycling ban:
  [杭州网](https://hznews.hangzhou.com.cn/chengshi/content/2018-05/02/content_6862048_0.htm)

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
  santan/              Dream 2 · 三潭印月
    world.ts           the lake as a tiny 3D world: pagoda triangle, projection, note composition, matching
    LakeView.ts        first-person golden-hour renderer (reflections, hills, sun)
    art.ts             stone pagodas (real structure), island, boat bow, the dream note
    SantanIntroScene   the note from Grandma; studying 近塔 / 双塔 / 远景
    SantanBoatScene    rowing, meters, photos, hints, mini-map
    SantanPuzzleScene  drag the photos onto the note
    SantanMoonScene    moonrise, candle-lit pagodas, waking up, invitation
  sudi/                Dream 3 · 苏堤春晓
    causeway.ts        the six bridges as a track (ground, slopes)
    DawnSky.ts         time-of-day sky, hills, lakes, mist and lighting
    art.ts             old man with shovel, seals, petals, catkins, lantern, speaker
    SudiIntroScene     prologue: dredging the lake to build the causeway
    SudiRideScene      the six-bridge ride and its events
    SudiEndScene       "请下车推行", waking up, the 春晓 scroll, invitation
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
