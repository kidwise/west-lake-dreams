# 西湖逍遥游 · West Lake Dreams

一个关于童年梦境的小游戏：和小学同学 KOKO、GOGO 一起，在梦里游遍杭州西湖十景。

A small story game about childhood dreams: wandering the Ten Scenes of Hangzhou's West Lake with two school friends, KOKO and GOGO.

> 我今天做了一个梦，梦见和童年的伙伴，小学同学一起，游西湖……

---

## 故事（中文）

十个梦，每个梦是西湖十景中的一景，可以按任意顺序玩。下面按西湖十景的传统次序排列。故事以真实的历史和传说为底，用孩子的梦来讲。

1. **苏堤春晓**：天亮之前骑过苏堤六桥，看太阳从湖上升起来。
2. **曲院风荷**：骑单车穿过荷塘，给初开的荷花拍照，在凉亭里想象冲坡飞过六座桥。
3. **平湖秋月**：中秋夜月亮掉进湖里碎了。转动曲桥、抚平湖面，在栏杆上弹一支歌，把月亮唤回来。
4. **断桥残雪**：好几年才下一次的雪。打雪仗、堆雪人，遇见打伞的白衣姐姐，等雪化出「断桥」。
5. **柳浪闻莺**：早春，妈妈带我们做柳笛、找黄莺，看柳浪翻起，在大草坪上放风筝。
6. **花港观鱼**：一把鱼饵撒下去，锦鲤涌上来；钻进水里，追回从石碑上跑掉的「鱼」字。
7. **雷峰夕照**：陪白娘子爬上雷峰塔看夕阳，一路被法海捣乱；最后他躲进了螃蟹壳。
8. **双峰插云**：喝完一瓶双峰牛奶，梦见云做的「牛奶奶」迷了路。爬三十六弯、叠塔、牧云、考古，让两座塔重新插进云里。
9. **南屏晚钟**：净慈寺的大钟哑了。跟济公从古井里捞木头、找回山洞里的回声，敲响 108 下晚钟，钟声传遍西湖。
10. **三潭印月**：拿着一元纸币背面的图案，划船去找当年取景的角度。

十个梦都做完，会解锁一幅「西湖十景全图」长卷。

每个梦醒来，都有一份邀请：来杭州，把梦里的地方真的走一遍。

## Story (English)

Ten dreams, one for each of the Ten Scenes of West Lake, playable in any order. Listed here in the traditional order of the Ten Scenes. Each is built on real history and local legend, told through a child's dream.

1. **Spring Dawn at Su Causeway**: ride the six bridges before sunrise and watch the sun come up over the lake.
2. **Lotus in the Breeze at Quyuan**: cycle past the lotus ponds taking photos, then daydream of flying over six bridges.
3. **Autumn Moon over the Calm Lake**: on Mid-Autumn night the moon falls into the lake and shatters. Turn the zig-zag bridges, calm the water and play the railing like a qin to call it back.
4. **Lingering Snow on the Broken Bridge**: the snow that comes once every few years. Snowball fights, a snowman, a lady in white, and the bridge that seems "broken".
5. **Orioles Singing in the Willows**: in early spring Mum shows us how to make willow whistles, call out the orioles, and fly kites on the big lawn.
6. **Viewing Fish at Flower Harbour**: scatter fish food and watch the koi surge; dive in to bring back the "fish" that swam off an old stone tablet.
7. **Leifeng Pagoda at Sunset**: climb the pagoda with Lady White to watch the sunset, while the monk Fahai makes mischief — until he hides in a crab shell.
8. **Twin Peaks Piercing the Clouds**: a cow made of cloud has lost her way. Climb thirty-six bends, stack a pagoda, herd cloud calves and dig up the past until two pagodas pierce the clouds again.
9. **Evening Bell at Nanping Hill**: the temple bell has lost its voice. With the monk Jigong, haul logs from an old well, catch the echoes in the caves, and ring the bell 108 times across the lake.
10. **Three Pools Mirroring the Moon**: row out to find the exact view printed on the back of the one-yuan note.

Finish all ten and a painted scroll of the whole lake unlocks.

Every dream ends with an invitation: come to Hangzhou and walk these places for real.

---

## Play / 运行

Requires Node.js (`brew install node`).

```bash
npm install     # first time only
npm run dev     # play at http://localhost:5173
npm run build   # static site in dist/
```

The game is in Chinese with an English toggle (top right). All art, music and sound are made in code — there are no image or audio files.

## More / 更多

- Each chapter's full design, real-world facts and sources: `src/<chapter>/STORY.md`
- Developer notes (tech, adding a chapter): `src/README.md`
