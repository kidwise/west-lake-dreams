# 三潭印月 (Three Pools Mirroring the Moon): finding West Lake on the one-yuan note

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
