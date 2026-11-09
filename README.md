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

## Dream 4 · 花港观鱼 (Viewing Fish at Flower Harbour): the fish that ran off the tablet

A childhood memory: throwing a handful of fish food and watching the big koi
pile up to grab it. The story follows the real place:

- A stream from 花家山 flows into the lake here, hence 花港 (Flower Harbour).
  In the Southern Song it was 卢园, Lu Yunsheng's private garden. On his
  southern tour the Kangxi Emperor had a fish pond built near the south end of
  Su Causeway and a tablet inscribed 「花港观鱼」.
- The 红鱼池 (Red Fish Pond) is the heart of the park: a zig-zag bridge crosses
  it, and thousands of red fish swim below. Peonies bloom in April and May.
- **Legend:** on the tablet, 「魚」 has three dots instead of four. Four dots
  look like 火 (fire), and three dots mean 水 (water), so the fish can live.
  The game presents this as a legend, and the invitation notes that today's
  tablet is a later replacement.
- The chapter's mood comes from a widely quoted line attributed to 乾隆,
  「花家山下流花港，花著鱼身鱼嘬花」 (the source wasn't verified).

1. **Prologue.** It is a weekend at the end of April. Dad's one yuan buys a
   bag of fish food. The kids run through the 牡丹园 (peony garden).
2. **The pond (top-down).** You lean over the railing of the zig-zag bridge.
   - Click to drop one pellet. Hold and release to throw a handful; the
     longer you hold, the wider it spreads.
   - Every koi has its own procedurally painted pattern across 7 varieties:
     红鲤, 红白, 大正三色, 昭和三色, 浅黄, 黄金 and 丹顶. Each fish's body is a
     bending Rope, so it sways and swishes its tail.
   - The fish crowd in. Big koi shove small ones, and a thick crowd climbs into
     a 「鱼山」 (fish mountain).
   - Every gulp is a pentatonic note in the key of the music (鱼嘴是琴键), so a
     feeding frenzy plays a melody.
   - Shy fish (黄金, 丹顶) avoid the crowd. Throw a handful far away as a
     decoy, then drop a single pellet for them.
   - Photo mode adds new varieties to a 锦鲤图鉴 (koi book).
   - Goals: make one fish mountain and photograph three varieties. KOKO and
     GOGO throw food too and chat in speech bubbles.
3. **The tablet (御碑亭).** KOKO tells the three-dot legend. The three dots
   drip off as drops of water, the character becomes an ink-brush fish, and
   it leaps into the pond, leaving 「花港观」.
   - GOGO and KOKO argue in the words of 庄子's 濠梁之辩 (「你又不是鱼…」).
   - A peony petal falls on the water, and the three kids jump in.
4. **Under the water (side view).** You are a 红白 koi, KOKO a 黄金 and GOGO
   a 昭和三色. Heard from below, the music is the same tune, muffled.
   - **Food rain:** a giant hand above the surface throws food, and you
     scramble for it.
   - **Gather a school:** swim near other koi and they follow you. Peony
     petals stick to your school and tint it pink: 「花著鱼身鱼嘬花」.
   - **Chase 魚:** it outswims you. The school closes in around it until it
     slows, then you dash to catch it.
   - **Three drops of water:** 魚 says that out of the water it is 「火上之鱼」.
     Find its three drops under a lotus leaf, in a bridge pier and up the
     stream mouth against the current. A compass points the way.
5. **Finale.** 魚 flies home and the tablet is whole again. The pond's fish
   gather to spell 「花港观鱼」 on the glowing water, then burst into a pond
   full of petals.
   - You wake up to a goldfish blowing bubbles on the windowsill, next to an
     empty bag of fish food.
   - The 观鱼图卷 shows your photos, your koi book and your stats.
   - An invitation to visit in peony season follows.

**Controls:**
- **Pond:** click or tap to drop a pellet; hold and release to throw a
  handful; use the 拍照 button for photo mode.
- **Underwater:** arrow keys or WASD, or hold the screen; Space or a
  double-tap to dash.

**Music:** a new pipa (琵琶) voice with 轮指 tremolo on long notes:
- `huagang`: the pond.
- `huagangUnder`: the same tune through a low-pass filter.
- `huagangStele`: the legend, on bells.
- `huagangFinale`: the fish write the characters.

**Sources:**
- History and layout:
  [携程](https://gs.ctrip.com/html5/you/travels/14/4157150.html),
  [China Services Info](https://www.chinaservicesinfo.com/s/201806/14/WS5b78aa4b498e855160e90a4f/fishing-view-at-the-flower-harbor.html)
- The tablet is a replacement:
  [杭州网](https://www.ehangzhou.gov.cn/2018-06/14/c_271620.htm)
- Peony garden:
  [杭州网](https://hznews.hangzhou.com.cn/chengshi/content/2020-11/30/content_7863270.htm)

## Dream 5 · 断桥残雪 (Lingering Snow on the Broken Bridge): the snow that comes once every few years

Snow is rare in Hangzhou: it falls once every few years, it's thin, and it's
usually gone by noon. When it does fall, half the city rushes to the Broken
Bridge, and people scrape snow off car roofs to make palm-sized snowmen for
the bridge railings. The chapter is built from these real details:

- **The name:** after snow, the sunny side of the bridge melts first while
  the shady side stays white, so from above the bridge looks broken (似断非断).
- **Two stories for 断桥:** the road from 孤山 ends here, or it was once
  「段家桥」. It stands at the east end of 白堤, next to a tablet pavilion.
- **白娘子 meets 许仙** at the Broken Bridge in the folk tale 白蛇传. The game
  only hints at her.

1. **The window.** A snowy morning. Wipe the fogged-up glass with your finger
   to reveal the snow, and GOGO waving a snowball. Mum warns that Hangzhou
   snow is gone by noon.
2. **北山街 snowball fight (side view).**
   - Click anywhere to throw a snowball there. Duck (↓) to dodge, or hit an
     incoming snowball in mid-air.
   - GOGO and KOKO crouch behind a holly hedge or a parked car and pop up to
     throw.
   - Click the snow on car roofs, benches and hedges to scrape it up. The more
     you scrape, the bigger your snowman will be.
3. **The crowd (top-down).** The bridge is packed with umbrellas.
   - A gust blows your umbrella away. Drag around and find KOKO (a red
     umbrella with a pink scarf peeking out) and GOGO (no umbrella, a yellow
     bobble hat) among decoys.
   - A lady in white, with a girl in green beside her, lends you a 西湖绸伞.
     She says the bridge was once 段家桥, tells you to look from the hill when
     the sun comes out, and turns into a swirl of snow.
   - 「她……是白娘子吧？」
4. **Snowmen on the railing.** Drag stones, a berry, leaves, twigs, a pine
   needle, a scarf, a tea-leaf hat or a persimmon onto your snowman. It joins
   other people's: one wears a tea-leaf hat, one is a little snow bridge, and
   one has a tilted head and a white veil. KOKO's bunny and GOGO's big head
   join yours for a photo.
5. **宝石山: make the bridge "break".** Look through a telescope from below
   保俶塔 as the sun melts the snow.
   - The hump of the arch melts first and the willow-shaded ends last.
   - Drag clouds to shade parts of the bridge.
   - Take the photo when the top is bare but both ends are still white.
   - Too late? In a dream it can just snow again.
   - The moment is repainted as an ink painting, where the snow is the paper
     left blank (留白).
6. **Epilogue: 湖心亭看雪.** A blank sheet of paper in the falling snow. Tap
   the faint shapes to paint Zhang Dai's 「长堤一痕、湖心亭一点、与余舟一芥、
   舟中人两三粒而已」.
7. **Waking up.** It's summer: the air conditioner hums, then the phone lights
   up with 「杭州，明天，小雪」. The 雪景 scroll and the invitation follow.

**Music:**
- `dqMorning`: bells like falling snow.
- `dqFight`: flute and woodblock.
- `dqLady`: guzheng in the 羽 mode.
- `dqHill`: guzheng.
- `dqXiao`: a low 箫, the flute voice an octave down.

**Sources:**
- The name and its legends:
  [中国日报](https://govt.chinadaily.com.cn/s/201806/14/WS5b78aa4e498e855160e90a51/duanqiao-bridge-remnant-snow.html),
  [携程](https://you.ctrip.com/sight/hangzhou14/2031.html),
  [买购](https://m.maigoo.com/citiao/175997.html),
  [杭州网](https://hznews.hangzhou.com.cn/wghz/content/2019-12/27/content_7650195_2.htm)

## Dream 6 · 平湖秋月 (Autumn Moon over the Calm Lake): the moon that fell into the lake

The real place:
- In the Southern Song it was already one of the Ten Scenes, but it had no
  fixed spot: people took boats out to watch the Mid-Autumn moon.
- In 1699 Kangxi inscribed 「平湖秋月」. The old 龙王堂 became the 御书楼,
  with a stone terrace jutting out over the water on three sides. Zig-zag
  bridges link the 御碑亭, 月波亭 and other pavilions.
- Today's tablet is a 1980 replica.
- The couplet 「万顷湖平长似镜，四时月好最宜秋」 explains the name.
- The Cantonese tune 《平湖秋月》 by 吕文成 is probably still under copyright, so
  the game doesn't use its melody.

The puzzle is in the name: while the lake isn't 平 (calm), the moon is broken.

1. **Prologue.** It's Mid-Autumn night. KOKO carries a rabbit lantern, GOGO a
   revolving 走马灯, and you a lotus lantern.
   - There's no moon in the sky. It has fallen into the lake and the ripples
     have broken it into three pieces.
   - The Jade Rabbit (玉兔) hops onto the railing and asks for help.
2. **The turning bridges (top-down).** The wind has jumbled the zig-zag
   bridges. Tap a section to turn it 90°, and connect a path from the terrace
   to the pavilion where the piece of moon lies.
   - The darkness is lit only by your lanterns.
   - GOGO's 走马灯 casts the bridge's true shape on the water as a hint.
   - Each pavilion's bridge is more winding than the last.
3. **Smooth the water.** At the first pavilion GOGO tries to net the moon, and
   KOKO calls him a 猴子捞月.
   - Draw slow circles on the water to calm the ripples. Strokes that are too
     fast make bigger waves.
   - Each piece brings a new trouble: gusts of wind; a fish whose shadow you
     tap to shoo it away before it jumps; a boat's wake that you block by
     dragging a lotus leaf.
   - The reflection is cut into wobbling strips, and becomes a mirror as the
     water calms.
4. **The railing qin (rhythm).** The pieces join into a full moon under the
   water. On the 御书楼 terrace, five stone posts are five pentatonic stone
   chimes (磬).
   - Moonlight travels from the moon in the water to each post: press 1–5, or
     tap the post, as it arrives.
   - A woodblock keeps time. The melody is original, not the 吕文成 tune.
   - The better you play, the higher the moon rises before the song ends.
5. **Climax.** The full moon rises over a lake like a mirror, and the couplet
   is written down both sides. The Jade Rabbit goes home along a path of
   moonlight, after telling us that people used to watch this moon from a
   boat.
6. **By boat.** A little boat glides towards the moon's reflection, after the
   old Southern Song way of watching.
7. **Waking up.** Moonlight on the floor (「床前明月光」「疑是地上霜」) and half
   a mooncake on the table. The 秋月 scroll and the invitation follow.

**Music:**
- `phNight`: guzheng in the 羽 mode.
- `phCalm`: sparse bells.
- `phMoon`: pipa, light and lilting.
- `phBoat`: low flute.
- The rhythm section makes its own music: stone chimes on each hit, a
  woodblock and a bass pluck.

**Sources:**
[潮新闻](https://tidenews.com.cn/news.html?id=2850172),
[携程](https://you.ctrip.com/sight/hangzhou14/2030.html),
[杭州网](https://hznews.hangzhou.com.cn/content/2021-09/22/content_8058879.htm),
[Sin80](https://sin80.com/en/work/ping-hu-qiu-yue)

## Dream 7 · 双峰插云 (Twin Peaks Piercing the Clouds): Granny Cow and the lost pagodas

The real place:
- The South Peak (南高峰, about 257 m) and North Peak (北高峰, about 313 m) stand
  west of the lake, about 5 km apart.
- In the Southern Song each summit had a pagoda whose tip came and went in the
  clouds, and the scene was called 「两峰插云」.
  - The North Peak pagoda had seven storeys and was built in the Tang, in the
    Tianbao years.
  - The South Peak pagoda was built in the Later Jin's Tianfu years (936–944).
  - The Qing 《西湖志》 says the North Peak path has 「石蹬数万级，曲折三十六弯」.
- In 1699 Kangxi renamed it 「双峰插云」 and built the tablet pavilion by 洪春桥
  as its viewpoint. By then both pagodas were long gone, so it is the Ten
  Scene "everyone knows by name but nobody has seen".
- In 2017 archaeologists found the Southern Song pagoda base, courtyard and
  paths on the South Peak. Restoring both pagodas has been under study since.
- 烟霞洞 below the South Peak holds Wuyue-period arhats, among the earliest
  stone arhats in China.
- Monk 韬光's temple on the North Peak path is linked by poems with Bai Juyi.

The dream starts from a childhood memory: the glass bottle of 双峰 milk in the
wooden milk box by the door, and the joke 「牛奶奶牛」.
- The label is drawn fresh (two little hills and a cloud); it is not the real
  brand's design.
- 「牛奶奶牛」 becomes 牛奶奶, Granny Cow: a cow made of cloud whose breath is
  the morning mist and whose milk is the sea of cloud.
- She found her way home by the two pagodas. Since they fell, she has been
  lost.

1. **The morning milk.** Tap the milk box to take the bottle out. KOKO and
   GOGO come by on the way to school, and KOKO gets tongue-tied on the
   「双峰牛奶，牛奶奶牛」 twister.
   - In the drinking race you hold Space or the button to glug.
   - Hold too long and you choke, and a little breath gauge shows when to let
     go. GOGO is quick.
   - Everyone ends up with a milk moustache and dozes off on the doorstep.
2. **The dream: 洪春桥.** Kangxi's tablet stands before two bare peaks.
   Granny Cow, in spectacles, tells the story: two pagodas, 「两峰」 changed
   to 「双峰」, and hundreds of years of wandering.
3. **Thirty-six bends.** Climb the North Peak's switchbacks in the mist.
   - At each bend, read which way the stone steps go and press ←/→ (or tap
     a side). The wrong way runs into bamboo.
   - Right turns in a row speed you up, and gulps of milk give you sprints.
   - You race a 挑山工 (porter) who climbs at a steady pace and never takes a
     wrong turn.
   - Notes on 韬光寺, 灵隐寺 and the 《西湖志》 line pop up as you climb.
4. **The North Peak pagoda.** Stack the seven Tang storeys, which hang from
   Granny Cow and swing.
   - Whatever overhangs the storey below is trimmed off.
   - From the fourth storey she starts sneezing clouds of mist.
   - When it is finished every doorway lights up, and she remembers the way.
5. **Herding clouds.** Ride Granny Cow 5 km across the valley over the
   Longjing tea terraces and the 九里松 pines, gathering her twelve lost cloud
   calves.
   - Calves left to themselves sink, and too low they turn to mist and catch
     on the tea bushes.
   - KOKO's whistle calls distant calves.
   - GOGO's moo makes sinking or stuck calves jump up.
   - My cowbell pulls the line tight against gusts of wind.
6. **Little archaeologists.** On the South Peak, brush the earth away to
   uncover the base and five finds, then drag each back to its place on the
   outline of a slim, 六和塔-like pagoda, which grows back up.
   - The finds are a lotus stone base, a brick, an eave-tile end, a wind-bell
     and the spire pearl.
   - An optional peek into 烟霞洞 shows the arhats, and one of them winks.
7. **Piercing the clouds.** Back at the tablet pavilion, Granny Cow breathes
   out a sea of cloud that swells up and down.
   - You get three shots. A shot only counts when the cloud covers the hills
     but leaves the pagoda tips showing.
   - GOGO: "like two straws in a bowl of milk."
   - A distant bell from 南屏山 points to the next dream.
8. **Waking up.** Mum shoos the three moustached sleepers off to school. A
   tiny cloud is left in the empty bottle. The 双峰插云 scroll and the
   invitation follow.

**Music:**
- `sfMist`: misty flute.
- `sfClimb`: brisk flute with woodblock steps.
- `sfTower`: guzheng.
- `sfHerd`: pastoral pipa.
- `sfDig`: quiet bells.
- `sfFinale`: broad flute.
- New sound effects: moo, cowbell, whistle, sneeze, cough and brush.

**Sources:**
[杭州网 · 复原南北高峰塔](https://hznews.hangzhou.com.cn/chengshi/content/2018-10/17/content_7082276_0.htm),
[杭州网 · 南高峰塔基](https://hznews.hangzhou.com.cn/chengshi/content/2017-06/21/content_6583420.htm),
[杭州网 · 西湖十景缺失一景](https://hznews.hangzhou.com.cn/chengshi/content/2018-01/26/content_6784111_0.htm),
[杭州网 · 双峰插云大景区](https://hznews.hangzhou.com.cn/chengshi/content/2018-10/17/content_7082131_0.htm),
[杭州网 · 北高峰灵顺寺](https://hznews.hangzhou.com.cn/chengshi/content/2018-02/21/content_6802776_0.htm),
[杭州网 · 西湖石刻古迹](https://hznews.hangzhou.com.cn/chengshi/content/2026-01/30/content_9170902_2.htm)

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
  huagang/             Dream 4 · 花港观鱼
    koi.ts             koi varieties, canvas-painted patterns, bendable Rope bodies, the ink fish 魚
    Pond.ts            the pond seen from the bridge + the koi school (feeding, fish mountain, formations)
    art.ts             peonies, pellets, lily pads, caustics, light rays, the giant hand
    HuagangIntroScene  a bag of fish food; the peony garden
    HuagangPondScene   feeding from the zig-zag bridge, photos, koi book
    HuagangSteleScene  the tablet, the three-dot legend, 魚 swims away, 子非鱼
    HuagangUnderScene  underwater: food rain, gathering a school, the chase, three drops
    HuagangEndScene    the fish write 花港观鱼, waking up, the 观鱼图卷, invitation
  duanqiao/            Dream 5 · 断桥残雪
    art.ts             winter clothes, snowfall, top-down umbrellas and hats, silk umbrella, cars, plane trees
    DuanqiaoIntroScene wipe the fogged window: it's snowing
    DuanqiaoStreetScene the 北山街 snowball fight; scraping snow
    DuanqiaoCrowdScene the umbrella crowd on the bridge; finding KOKO and GOGO; the lady in white
    DuanqiaoSnowmanScene decorating a snowman on the railing
    DuanqiaoHillScene  the telescope: melting snow, clouds, the "broken" moment, ink painting
    DuanqiaoEndScene   湖心亭看雪, waking up in summer, the 雪景 scroll, invitation
  pinghu/              Dream 6 · 平湖秋月
    art.ts             the moon and its three shards, the Jade Rabbit, lanterns, pavilion roof
    Shimmer.ts         reflections on water: a picture cut into wobbling strips
    NightLake.ts       the lake at night from the 御书楼 terrace (stars, bridge, library, railing)
    PinghuIntroScene   no moon in the sky; the broken moon in the lake; the Jade Rabbit
    PinghuBridgeScene  the turning zig-zag bridge puzzle (three levels)
    PinghuCalmScene    smoothing the water: wind, a jumping fish, a boat's wake
    PinghuMoonScene    the railing qin rhythm game; the moon rises; the couplet
    PinghuEndScene     by boat to the moon, waking up, the 秋月 scroll, invitation
  shuangfeng/          Dream 7 · 双峰插云
    art.ts             Granny Cow and calves, milk bottle, pagoda storeys, the twin peaks, porter, tablet pavilion
    ShuangfengIntroScene the milk box, the drinking race, the dream at 洪春桥
    ShuangfengClimbScene the thirty-six bends in the mist; racing the porter
    ShuangfengTowerScene stacking the seven-storey North Peak pagoda
    ShuangfengHerdScene herding cloud calves over the tea terraces
    ShuangfengDigScene the South Peak dig; putting the finds back; 烟霞洞
    ShuangfengEndScene the cloud-sea photo, waking up, the scroll, invitation
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
