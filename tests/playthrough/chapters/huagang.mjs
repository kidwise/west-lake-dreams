/** Viewing Fish at Flower Harbour: the pond, the tablet, underwater, the finale. */
export const start = 'HuagangIntro';
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

  await sleep(1000); await shot('f01-title');
  await t.open('HuagangIntro');
  await until('HuagangIntro', () => sleep(200));
  await until('HuagangPond', async () => { await page.keyboard.press('Space'); await sleep(1200); });
  await sleep(1500); await shot('f02-pond');
  // feed until the fish mountain
  let n = 0;
  while (!(await page.evaluate(() => window.__game.scene.getScene('HuagangPond').mountainDone)) && n++ < 20) {
    await page.mouse.move(600 + (n % 3) * 30, 380); await page.mouse.down(); await sleep(500); await page.mouse.up(); await sleep(1500);
  }
  await shot('f03-mountain');
  // photo mode: aim at fish of varieties not yet in the book
  await page.mouse.click(1170, 680); await sleep(400);
  for (let k = 0; k < 30; k++) {
    const st = await page.evaluate(() => { const s = window.__game.scene.getScene('HuagangPond'); if (!s.sys.isActive()) return null; const dex = window.__hg ?? {}; const known = Object.keys(s.constructor && s.dexSlots.filter((d) => d.img).map((d) => d.v)); const have = s.dexSlots.filter((d) => d.img).map((d) => d.v); const f = s.school.fish.find((f) => !have.includes(f.variety) && f.x > 200 && f.x < 1080 && f.y > 200 && f.y < 560); return { n: have.length, f: f && { x: f.x, y: f.y } }; });
    if (!st || st.n >= 3) break;
    if (st.f) { await page.mouse.move(st.f.x, st.f.y); await sleep(60); await page.mouse.down(); await page.mouse.up(); if (k === 0) { await sleep(200); await shot('f04-photo'); } }
    await sleep(700);
  }
  await sleep(1200); await shot('f05-dex');
  console.log('photos after pond', await page.evaluate(() => JSON.stringify(window.__hgRun.photos) + ' ' + window.__hgRun.photos.map((k) => window.__game.textures.exists(k)).join(',')));
  if (process.env.SHORT) { await until('HuagangStele', async () => { await page.keyboard.press('Space'); await sleep(1000); }); console.log('photos at stele', await page.evaluate(() => JSON.stringify(window.__hgRun.photos) + ' ' + window.__hgRun.photos.map((k) => window.__game.textures.exists(k)).join(','))); await page.evaluate(() => window.__game.scene.getScene('HuagangStele').scene.start('HuagangEnd')); await sleep(1000); console.log('photos at end', await page.evaluate(() => JSON.stringify(window.__hgRun.photos) + ' ' + window.__hgRun.photos.map((k) => window.__game.textures.exists(k)).join(','))); throw new Error('short done'); }
  await until('HuagangStele', async () => { await page.keyboard.press('Space'); await sleep(1000); });
  await sleep(2000); await shot('f06-stele');
  await until('HuagangUnder', async () => { await page.keyboard.press('Space'); await sleep(1300); });
  // underwater autopilot
  let lastSpace = 0; const seen = {};
  while ((await active()).includes('HuagangUnder')) {
    const st = await page.evaluate(() => {
      const s = window.__game.scene.getScene('HuagangUnder'); if (!s.sys.isActive() || !s.me) return null;
      const me = s.me; const near = (arr) => arr.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0];
      const wild = near(s.fish.filter((f) => f.kind === 'wild')); const food = near(s.food.filter((f) => !f.gone)); const drop = s.drops.find((d) => !d.got);
      return { stage: s.stage, me: { x: me.x, y: me.y }, wild: wild && { x: wild.x, y: wild.y }, food: food && { x: food.x, y: food.y }, ink: s.ink && { x: s.ink.x, y: s.ink.y }, drop: drop && { x: drop.x, y: drop.y }, dlg: s.children.list.some((o) => o.depth === 1000 && o.visible) };
    });
    if (!st) { await sleep(200); continue; }
    if (!seen[st.stage]) { seen[st.stage] = 1; await sleep(300); await shot(`f07-under-${st.stage}`); }
    const target = st.stage === 'rain' ? st.food : st.stage === 'gather' ? st.wild : st.stage === 'chase' ? st.ink : st.stage === 'drops' ? st.drop : null;
    if (st.dlg || !target) { await hold([]); if (Date.now() - lastSpace > 900) { lastSpace = Date.now(); await page.keyboard.press('Space'); } }
    else { const k = []; const dx = target.x - st.me.x, dy = target.y - st.me.y; if (dx > 20) k.push('ArrowRight'); if (dx < -20) k.push('ArrowLeft'); if (dy > 20) k.push('ArrowDown'); if (dy < -20) k.push('ArrowUp'); await hold(k); if (st.stage === 'chase' && Math.hypot(dx, dy) < 220 && Date.now() - lastSpace > 1300) { lastSpace = Date.now(); await page.keyboard.press('Space'); } }
    await sleep(60);
  }
  await hold([]);
  await until('HuagangEnd', () => sleep(200));
  let m = 0;
  while (m++ < 40) {
    const scroll = await page.evaluate(() => window.__game.scene.getScene('HuagangEnd').children.list.some((o) => o.depth === 103));
    if (scroll) break;
    await page.keyboard.press('Space'); await sleep(1500);
    if (m === 6) await shot('f08-finale');
  }
  await sleep(2600); await shot('f09-scroll');
  await page.mouse.click(1210, 38); await sleep(600); await shot('f10-scroll-en'); await page.mouse.click(1210, 38);
  console.log('run', JSON.stringify(await page.evaluate(() => { const s = window.__game.scene.getScene('HuagangEnd'); return null; })));
  await page.keyboard.press('Space'); await sleep(1500); await shot('f11-invite');
  await page.mouse.click(false ? 480 : 800, 628);
  await sleep(2600);
  console.log('after click:', await active());
  await shot('f12-after');
  if (false) {
    await until('HuagangPond', async () => { await page.keyboard.press('Space'); await sleep(1200); });
    await sleep(1500);
    await page.mouse.click(1170, 680); await sleep(300); await page.mouse.click(640, 360); await sleep(800);
    console.log('replay state', await page.evaluate(() => JSON.stringify({ photos: window.__hgRun.photos, dex: Object.keys(window.__hgRun.dex), eaten: window.__hgRun.eaten })));
    await shot('f13-replay-pond');
  }
}
