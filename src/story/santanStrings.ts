/** Text for the 三潭印月 chapter: "寻找人民币上的西湖". */
export const santanZh = {
  'santan.chapter': '十景之十 · 三潭印月',

  'santan.i1': '我做了一个梦。',
  'santan.i2': '梦里，我还是小学生的模样，手心里攥着一张一块钱——奶奶给的零花钱。',
  'santan.i3': '我把它翻过来：背面印着西湖。三座小石塔立在水里，一座近，两座远，远处是树和山。',
  'santan.i4': 'KOKO 凑过来，眼睛一亮：「这是三潭印月！我们去找找，纸币上的风景到底在哪儿！」',
  'santan.i5': 'GOGO 已经跳上了码头边的小船：「快上来，我来划！你来掌舵！」',

  'santan.obsTitle': '仔细看看这张一块钱',
  'santan.obsHint': '点一点纸币上的三处风景，把它们记在心里',
  'santan.obsGo': '记住了，出发！',

  'santan.whole': '整张纸币：对上 {n}/3 座塔',
  'santan.closest': '取景：{name} {p}%',
  'santan.btnNote': '纸币',
  'santan.btnPhoto': '拍照',
  'santan.hintKeys': '← → 转向 · ↑ 划船 · ↓ 后退 · 空格 拍照 · 按住 N 看纸币',
  'santan.hintTouch': '用右下角的按钮划船和转向 · 按住「纸币」对照 · 「拍照」按下快门',

  'santan.snapGood': '咔嚓！拍到了「{name}」！',
  'santan.snapDup': '「{name}」已经拍过啦，去找别的吧',
  'santan.snapMiss': '还不太像……最接近的是「{name}」，{p}%',
  'santan.snapWhole': '两座塔对上了，第三座却怎么也对不上……',

  'santan.c.start1': '纸币上有三处：近塔、双塔、远景。我们一处一处找！',
  'santan.c.start2': '我来划船，你来掌舵，看准了就拍！',
  'santan.c.warm': '有点像了！再慢慢调一调角度……',
  'santan.c.got1': '拍到一张！还差两张。',
  'santan.c.got2': '又一张！就差最后一张了！',
  'santan.c.whole': '两座塔对上了！可是第三座……怎么也对不上？',
  'santan.c.hintMap': '（看左下角的地图，那个闪光的圈！）',

  'santan.r1': '三张都拍到了！可是整张纸币的样子，怎么也拍不出来——三座塔最多只能对上两座。',
  'santan.r2': '这三座塔在水里站成一个三角形。换个角度，总有一座被挡住，要么就是大小不对。',
  'santan.r3': '我知道了！听说当年拍这张照片的角度，其实只能拍到两座塔。纸币上的第三座，是后来画上去的！',
  'santan.r4': '那我们就像画纸币的人一样，把三张照片拼起来吧！',

  'santan.pzTitle': '把三张照片拼到纸币上',
  'santan.pzHint': '拖动照片，放到纸币上对应的位置',
  'santan.pzWrong': '好像不是这里……再看看纸币上的样子？',
  'santan.pzDone': '复原了！',
  'santan.pz1': '看！近塔、双塔、远景拼在一起，就是纸币上的三潭印月！',
  'santan.pz2': '原来纸币上的画，是在照片的基础上，添了一点点想象。',
  'santan.pz3': '画纸币的人，一定也很喜欢这三座塔吧。',

  'santan.m1': '天渐渐黑了。月亮从湖面上升起来。',
  'santan.m2': '石塔里亮起了烛光。塔身的圆孔透出光来，倒映在湖里，像一个个小月亮。',
  'santan.m3': '「天上一个月亮，水里一个月亮，塔里还有好多好多个月亮！」KOKO 拍着手。',
  'santan.m4': '……然后，我就醒了。',
  'santan.m5': '手里攥着的不是一块钱，是被子角。',

  'santan.inviteTitle': '来杭州，坐船去看三潭印月',
  'santan.inviteBody':
    '带上一张一元纸币，坐船去三潭印月，对照着看一看：\n你能同时看到几座塔？\n中秋夜，石塔里点上蜡烛，塔身的圆孔映出一个个月影——这就是「三潭印月」名字的由来。',
  'santan.obsNear': '近塔：左边一座最大的石塔，离得最近。塔基、球形塔身上的圆孔、宝盖、小亭和葫芦顶，都看得清清楚楚。',
  'santan.obsPair': '双塔：中间一座很小，在远处贴着岸线；右边一座中等大小，近一些。',
  'santan.obsFar': '远景：左后方是树木葱郁的岸；右后方的远山上，立着一座细长的塔。',
  'santan.part.near': '近塔',
  'santan.part.pair': '双塔',
  'santan.part.far': '远景',
  'santan.c.hintNear': '近塔：随便挑一座石塔划近一点，让它像纸币左边那座一样又高又大，在取景框中间偏右。',
  'santan.c.hintPair': '双塔：要一座远、一座近。试试划到三座塔的东边，朝西看，近的那座放在右边。',
  'santan.c.hintFar': '远景：朝正北看！远山上那座细长的塔，要在取景框中间偏左一点。',
} as const;

export const santanEn: Record<keyof typeof santanZh, string> = {
  'santan.chapter': 'Scene 10 of 10 · Three Pools Mirroring the Moon',

  'santan.i1': 'I had a dream.',
  'santan.i2': 'In the dream I was a primary-school kid again, clutching a one-yuan note — pocket money from Grandma.',
  'santan.i3': 'I turned it over. On the back was West Lake: three little stone pagodas standing in the water — one close, two far — with trees and hills behind.',
  'santan.i4': 'KOKO leaned in, eyes shining: “That’s Three Pools Mirroring the Moon! Let’s go find where the picture on the note really is!”',
  'santan.i5': 'GOGO had already jumped into a little boat at the pier: “Get in! I’ll row — you steer!”',

  'santan.obsTitle': 'Take a good look at the one-yuan note',
  'santan.obsHint': 'Tap the three scenes on the note to remember them',
  'santan.obsGo': 'Got it — let’s go!',

  'santan.whole': 'Whole note: {n}/3 pagodas match',
  'santan.closest': 'View: {name} {p}%',
  'santan.btnNote': 'Note',
  'santan.btnPhoto': 'Photo',
  'santan.hintKeys': '← → turn · ↑ row · ↓ back · Space photo · hold N to look at the note',
  'santan.hintTouch': 'Row and turn with the buttons bottom-right · hold “Note” to compare · “Photo” to shoot',

  'santan.snapGood': 'Click! Got the “{name}” view!',
  'santan.snapDup': 'Already got “{name}” — find another one',
  'santan.snapMiss': 'Not quite… closest is “{name}”, {p}%',
  'santan.snapWhole': 'Two pagodas line up — but the third just won’t…',

  'santan.c.start1': 'The note has three parts: the near pagoda, the pair, and the far view. Let’s find them one by one!',
  'santan.c.start2': 'I’ll row, you steer — shoot when it lines up!',
  'santan.c.warm': 'It’s starting to look right! Adjust the angle slowly…',
  'santan.c.got1': 'Got one! Two to go.',
  'santan.c.got2': 'Another one! Just one more!',
  'santan.c.whole': 'Two pagodas line up! But the third one… it never fits?',
  'santan.c.hintMap': '(Check the map bottom-left — the glowing ring!)',

  'santan.r1': 'We’ve got all three! But the whole note — we can’t take it. At most two of the three pagodas line up.',
  'santan.r2': 'The three pagodas stand in a triangle. Whatever angle we try, one of them gets hidden, or it’s the wrong size.',
  'santan.r3': 'I get it! They say the angle that photo was taken from could only capture two pagodas. The third one on the note was added in!',
  'santan.r4': 'Then let’s do what the note’s artist did — put our three photos together!',

  'santan.pzTitle': 'Put the three photos onto the note',
  'santan.pzHint': 'Drag each photo to its place on the note',
  'santan.pzWrong': 'Not there… look at the note again?',
  'santan.pzDone': 'Restored!',
  'santan.pz1': 'Look! The near pagoda, the pair and the far view together make the Three Pools on the note!',
  'santan.pz2': 'So the picture on the note is a photo with a little imagination added.',
  'santan.pz3': 'Whoever drew the note must have loved these three pagodas too.',

  'santan.m1': 'Night slowly fell. The moon rose over the lake.',
  'santan.m2': 'Candlelight glowed inside the stone pagodas. Light shone out of the round openings and danced on the water, like little moons.',
  'santan.m3': '“One moon in the sky, one moon in the water, and lots and lots of moons in the pagodas!” KOKO clapped.',
  'santan.m4': '…And then I woke up.',
  'santan.m5': 'What I was clutching wasn’t a one-yuan note. It was the corner of my blanket.',

  'santan.inviteTitle': 'Come to Hangzhou and take a boat to the Three Pools',
  'santan.inviteBody':
    'Bring a one-yuan note, take a boat to the Three Pools, and compare: how many pagodas can you see at once?\nOn Mid-Autumn night, candles inside the pagodas cast little moons on the water — that’s where the name comes from.',
  'santan.obsNear': 'Near pagoda: the biggest one, on the left, closest of all. You can clearly see its base, the round openings in its ball-shaped body, the canopy, the little pavilion and the gourd on top.',
  'santan.obsPair': 'Two pagodas: a tiny one in the middle, far away by the shore; a medium one on the right, a bit closer.',
  'santan.obsFar': 'Far view: a shore thick with trees behind on the left; on the far hills to the right, a slender pagoda.',
  'santan.part.near': 'Near',
  'santan.part.pair': 'Pair',
  'santan.part.far': 'Far',
  'santan.c.hintNear': 'Near: pick any pagoda and row up close, until it’s as big as the one on the left of the note, just right of centre.',
  'santan.c.hintPair': 'Pair: one far, one near. Try rowing to the east of the three pagodas and looking west, with the nearer one on the right.',
  'santan.c.hintFar': 'Far view: look due north! The slender pagoda on the far hills should sit a little left of centre.',
};
