/** Twin Peaks Piercing the Clouds: milk race, thirty-six bends, the pagoda, herding, the dig, the photo. */
export const start = 'ShuangfengIntro';
export const visited = [];

export async function play(t) {
  const { page, sleep } = t;
  const shot = (n) => t.shot(n);
  const active = async () => (await t.active()).join(',');
  const until = async (key, step = () => sleep(200), ms = 150000) => {
    const t0 = Date.now();
    while (!(await active()).split(',').includes(key)) {
      if (Date.now() - t0 > ms) throw new Error(`stuck before ${key}: ${await active()}`);
      await step();
    }
  };
  const waitScene = (key, ms = 60000) => until(key, () => sleep(200), ms);
  const ev = (k, f) => t.ev(k, f);
  const space = (n, ms) => t.space(n, ms);
  const R = (f) => page.evaluate(f);

  await sleep(1000);
  await t.open('ShuangfengIntro');
  await until('ShuangfengIntro', () => sleep(200));
  await sleep(1800); await shot('a01-intro');
  // narration x2, then the box
  await space(2, 1300);
  await sleep(600); await shot('a02-box');
  await space(1, 2500);
  await shot('a03-friends');
  // dialogue until the race starts
  for (let i = 0; i < 20 && !(await ev('ShuangfengIntro', (s) => s.racing)); i++) await space(1, 700);
  await sleep(300); await shot('a04-race');
  while (await ev('ShuangfengIntro', (s) => s.racing)) {
    await page.keyboard.down('Space'); await sleep(1300); await page.keyboard.up('Space'); await sleep(250);
  }
  await sleep(800); await shot('a05-stache');
  for (let i = 0; i < 8; i++) { await space(1, 900); if (i === 4) await shot('a06-n3'); }
  await sleep(2500); await shot('a07-dream');
  await until('ShuangfengClimb', async () => { await space(1, 1000); if (Math.random() < 0.15) await shot('a08-cow' + Date.now() % 1000); });
  await sleep(1200); await shot('b01-climb');
  for (let i = 0; i < 6 && !(await ev('ShuangfengClimb', (s) => s.active)); i++) await space(1, 800);
  await shot('b02-start');
  let wrongDone = false; let sh = 0; let lastSeg = -1;
  while (await ev('ShuangfengClimb', (s) => s.active)) {
    const st = await ev('ShuangfengClimb', (s) => ({ seg: s.seg, u: s.u, mode: s.mode, dir: s.seg + 1 < s.nodes.length ? Math.sign(s.nodes[s.seg + 1 + (s.mode === 'walk' ? 1 : 0)]?.x - s.nodes[s.seg + (s.mode === 'walk' ? 1 : 0)].x) : 0, choice: s.choice, milk: s.milk }));
    if (st.mode === 'walk' && st.u > 0.5 && st.choice === 0) {
      let d = st.dir;
      if (st.seg === 4 && !wrongDone) { d = -d; wrongDone = true; }
      await page.keyboard.press(d < 0 ? 'ArrowLeft' : 'ArrowRight');
    } else if (st.mode === 'wait') {
      const d = await ev('ShuangfengClimb', (s) => Math.sign(s.nodes[s.seg + 1].x - s.nodes[s.seg].x));
      await page.keyboard.press(d < 0 ? 'ArrowLeft' : 'ArrowRight');
    }
    if (st.seg !== lastSeg) { lastSeg = st.seg; if ([2, 12, 22].includes(st.seg)) await page.keyboard.press('ArrowUp'); if ([5, 10, 20, 30].includes(st.seg)) { await shot('b03-seg' + st.seg); } }
    await sleep(40);
  }
  console.log('climb', await page.evaluate(() => JSON.stringify(window.__sfRun)));
  await sleep(1500); await shot('b04-top');
  await until('ShuangfengTower', async () => { await space(1, 1000); });
  await sleep(1200); await shot('c01-tower');
  for (let i = 0; i < 6 && !(await ev('ShuangfengTower', (s) => s.swinging)); i++) await space(1, 800);
  let lv = -1;
  while (true) {
    const st = await ev('ShuangfengTower', (s) => ({ sw: s.swinging, dr: s.dropping, x: s.swing.x, bx: s.placed.length ? s.placed[s.placed.length - 1].x : 640, lv: s.level }));
    if (st.lv >= 7 && !st.dr) break;
    if (st.sw) {
      const want = st.lv === 2 ? 45 : st.lv === 5 && lv !== 99 ? 260 : 0;
      if (Math.abs(st.x - st.bx - want) < 6 || (want === 260 && Math.abs(Math.abs(st.x - st.bx) - 240) < 8)) { if (want === 260) lv = 99; await page.keyboard.press('Space'); await sleep(300); if (st.lv === 4) await shot('c02-mid'); }
    }
    await sleep(10);
  }
  console.log('tower', await page.evaluate(() => JSON.stringify(window.__sfRun)));
  await sleep(2500); await shot('c03-lit');
  await until('ShuangfengHerd', async () => { await space(1, 1000); });
  await sleep(1200); await shot('d01-herd');
  for (let i = 0; i < 6 && !(await ev('ShuangfengHerd', (s) => s.active)); i++) await space(1, 900);
  await shot('d02-start');
  let tick = 0;
  while (await ev('ShuangfengHerd', (s) => s.active)) {
    const st = await ev('ShuangfengHerd', (s) => { const cx = s.cameras.main.scrollX; const cs = s.calves.filter((c) => c.state === 'free' || c.state === 'stuck').map((c) => ({ x: c.x - cx, y: c.y, st: c.state })).filter((c) => c.x > 0 && c.x < 1280); return { cow: { x: s.cowX, y: s.cowY }, cs, windy: s.time.now < s.windUntil }; });
    let target = st.cs.sort((a, b) => Math.hypot(a.x - st.cow.x, a.y - st.cow.y) - Math.hypot(b.x - st.cow.x, b.y - st.cow.y))[0];
    if (target) {
      const d = Math.hypot(target.x - st.cow.x, target.y - st.cow.y);
      if (target.st === 'stuck' && d < 300) await page.keyboard.press('Digit2');
      if (d > 400 && tick % 20 === 0) await page.keyboard.press('Digit1');
      await page.mouse.move(Math.min(1080, target.x), Math.min(490, target.y)); await page.mouse.down();
    } else { await page.mouse.move(700, 300); await page.mouse.down(); }
    if (st.windy) await page.keyboard.press('Digit3');
    tick++;
    if (tick % 150 === 0) await shot('d03-fly' + tick);
    await sleep(60);
  }
  await page.mouse.up();
  console.log('herd', await page.evaluate(() => JSON.stringify(window.__sfRun)));
  await sleep(1000); await shot('d04-end');
  await until('ShuangfengDig', async () => { await space(1, 1000); });
  await sleep(1200); await shot('e01-dig');
  for (let i = 0; i < 6 && !(await ev('ShuangfengDig', (s) => s.canDig)); i++) await space(1, 900);
  // peek in the cave first
  await page.mouse.click(120, 520); await sleep(2500); await shot('e02-cave'); await page.mouse.click(640, 300); await sleep(800);
  let pass = 0;
  while (await ev('ShuangfengDig', (s) => s.canDig) && pass < 6) {
    for (let y = 165; y < 530; y += 34) {
      await page.mouse.move(300, y); await page.mouse.down();
      await page.mouse.move(860, y, { steps: 12 }); await page.mouse.up();
    }
    pass++;
    if (pass === 1) await shot('e03-brushed');
  }
  await sleep(1500);
  for (let i = 0; i < 6 && !(await ev('ShuangfengDig', (s) => s.finds.some((f) => f.obj.input))); i++) await space(1, 900);
  await shot('e04-place');
  const finds = await ev('ShuangfengDig', (s) => s.finds.map((f) => ({ x: f.x, y: f.y, sx: f.slot.x, sy: f.slot.y })));
  // one wrong drop first
  await page.mouse.move(finds[0].x, finds[0].y); await page.mouse.down(); await page.mouse.move(finds[4].sx, finds[4].sy, { steps: 10 }); await page.mouse.up(); await sleep(600);
  for (const f of finds) { await page.mouse.move(f.x, f.y); await page.mouse.down(); await page.mouse.move(f.sx, f.sy, { steps: 10 }); await page.mouse.up(); await sleep(500); }
  await sleep(3500); await shot('e05-raised');
  console.log('dig', await page.evaluate(() => JSON.stringify(window.__sfRun)));
  await until('ShuangfengEnd', async () => { await space(1, 1000); });
  await sleep(2000); await shot('f01-end');
  for (let i = 0; i < 6 && !(await ev('ShuangfengEnd', (s) => s.shooting)); i++) await space(1, 1200);
  await shot('f02-photo');
  // first shot too early (low), then wait for the band
  await page.keyboard.press('Space'); await sleep(1500);
  while (await ev('ShuangfengEnd', (s) => s.shooting)) {
    const y = await ev('ShuangfengEnd', (s) => s.seaY);
    if (y > 295 && y < 322) { await page.keyboard.press('Space'); await sleep(200); await shot('f03-perfect'); }
    await sleep(30);
  }
  await sleep(2000); await shot('f04');
  let m = 0;
  while (m++ < 30) {
    const scroll = await ev('ShuangfengEnd', (s) => s.children.list.some((o) => o.depth === 103));
    if (scroll) break;
    await space(1, 1400);
    if (m === 6) await shot('f05-wake');
  }
  await sleep(2500); await shot('f06-scroll');
  await page.mouse.click(1210, 38); await sleep(600); await shot('f07-scroll-en'); await page.mouse.click(1210, 38);
  await page.keyboard.press('Space'); await sleep(1500); await shot('f08-invite');
  await page.mouse.click(false ? 480 : 800, 628); await sleep(2500);
  console.log('after', await active(), await page.evaluate(() => JSON.stringify(window.__sfRun)));
}
