/** Lingering Snow on the Broken Bridge: window, snowball fight, the crowd, snowmen, the hill, the ink painting. */
export const start = 'DuanqiaoIntro';
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

  await sleep(1000); await shot('f00-title');
  await t.open('DuanqiaoIntro');
  await until('DuanqiaoIntro', () => sleep(200));
  await sleep(1500);
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Space'); await sleep(1300); }
  await sleep(500);
  await page.mouse.move(440, 100); await page.mouse.down();
  for (let y = 100; y < 440; y += 50) { await page.mouse.move(1040, y, { steps: 12 }); await page.mouse.move(440, y + 25, { steps: 12 }); }
  await page.mouse.up();
  await sleep(2500);
  await until('DuanqiaoStreet', async () => { await page.keyboard.press('Space'); await sleep(1200); });
  await sleep(1500);
  let t0 = Date.now(); const seen = {}; let lastThrow = 0; let ducking = false;
  while (Date.now() - t0 < 150000) {
    const st = await page.evaluate(() => {
      const s = window.__game.scene.getScene('DuanqiaoStreet'); if (!s.sys.isActive()) return null;
      const cam = s.cameras.main.scrollX;
      return { amb: s.ambush, cam, meX: s.meX, foes: s.foes.map((f) => ({ x: f.g.x - cam, out: f.out })), incoming: s.balls.filter((b) => !b.mine && b.t > b.T - 0.35).length, patch: s.patches.filter((p) => p.amount > 0 && p.x - cam > 80 && p.x - cam < 1100).map((p) => ({ x: p.x - cam, y: p.y - 12 }))[0] };
    });
    if (!st) break;
    if (st.amb >= 0 && !seen['a' + st.amb]) { seen['a' + st.amb] = 1; await sleep(1500); await shot(`s-amb${st.amb}`); }
    if (st.incoming && !ducking) { ducking = true; await page.keyboard.down('ArrowDown'); if (!seen.duck) { seen.duck = 1; await shot('s-duck'); } }
    if (!st.incoming && ducking) { ducking = false; await page.keyboard.up('ArrowDown'); }
    const f = st.foes.find((f) => f.out > 0.7);
    if (f && !ducking && Date.now() - lastThrow > 300) { lastThrow = Date.now(); await page.mouse.click(f.x, 480); }
    else if (st.patch && st.amb < 0 && Date.now() - lastThrow > 350) { lastThrow = Date.now(); await page.mouse.click(st.patch.x, st.patch.y); }
    await sleep(40);
  }
  await page.keyboard.up('ArrowDown');
  await until('DuanqiaoCrowd', () => sleep(200));
  await sleep(1500);
  // until finding starts
  for (let i = 0; i < 20 && !(await page.evaluate(() => window.__game.scene.getScene('DuanqiaoCrowd').finding)); i++) { await page.keyboard.press('Space'); await sleep(800); if (i === 2) await shot('c01-wind'); }
  await sleep(500); await shot('c02-find');
  // drag a little
  await page.mouse.move(640, 400); await page.mouse.down(); await page.mouse.move(900, 380, { steps: 10 }); await page.mouse.up(); await sleep(400); await shot('c03-drag');
  // click a decoy red umbrella
  const decoy = await page.evaluate(() => { const s = window.__game.scene.getScene('DuanqiaoCrowd'); const p = s.people.find((q) => q.role === 'fakeK'); s.cameras.main.centerOn(p.img.x, p.img.y); return true; });
  await sleep(200); await page.mouse.click(640, 360); await sleep(300); await shot('c04-decoy');
  for (const role of ['koko', 'gogo']) {
    await page.evaluate((role) => { const s = window.__game.scene.getScene('DuanqiaoCrowd'); const p = s.people.find((q) => q.role === role); s.cameras.main.centerOn(p.img.x, p.img.y); }, role);
    await sleep(150);
    const pos = await page.evaluate((role) => { const s = window.__game.scene.getScene('DuanqiaoCrowd'); const p = s.people.find((q) => q.role === role); return { x: p.img.x - s.cameras.main.scrollX, y: p.img.y - s.cameras.main.scrollY }; }, role);
    await page.mouse.click(pos.x, pos.y); await sleep(500); await shot(`c05-${role}`);
  }
  let n = 0;
  while ((await active()).includes('DuanqiaoCrowd') && n++ < 40) { await page.keyboard.press('Space'); await sleep(1000); if (n === 4) await shot('c06-lady'); if (n === 9) await shot('c07-lady2'); }
  await until('DuanqiaoSnowman', () => sleep(200));
  await sleep(1200);
  for (let i = 0; i < 10 && !(await page.evaluate(() => window.__game.scene.getScene('DuanqiaoSnowman').building)); i++) { await page.keyboard.press('Space'); await sleep(900); }
  await sleep(1200); await shot('m01-build');
  const targets = [[-14, -2.0], [14, -2.0], [0, -1.75], [-40, -1.0], [40, -1.0], [0, -1.35], [0, -2.55]];
  const items = await page.evaluate(() => window.__game.scene.getScene('DuanqiaoSnowman').items.map((i) => ({ x: i.homeX, y: i.homeY, k: i.img.texture.key })));
  const body = await page.evaluate(() => window.__game.scene.getScene('DuanqiaoSnowman').body);
  const pick = ['dqStone', 'dqStone', 'dqBerry', 'dqTwig', 'dqLeaf', 'dqYarn', 'dqTeaHat'];
  for (const [n, key] of pick.entries()) {
    const it = items.find((i) => i.k === key && !i.used); it.used = 1;
    const [dx, ky] = targets[n];
    const tx = 640 + dx * (key === 'dqTwig' || key === 'dqLeaf' ? 1.2 : 1); const ty = 470 + ky * body * (key === 'dqTeaHat' ? 1.02 : 1);
    await page.mouse.move(it.x, it.y); await page.mouse.down(); await page.mouse.move(tx, ty, { steps: 8 }); await page.mouse.up(); await sleep(250);
  }
  await shot('m02-decorated');
  await page.mouse.click(1130, 646); await sleep(1500);
  n = 0;
  while ((await active()).includes('DuanqiaoSnowman') && n++ < 20) { await page.keyboard.press('Space'); await sleep(1100); if (n === 3) await shot('m03-friends'); }
  await sleep(1500);
  await page.keyboard.press('Space'); await sleep(1500); await shot('h01-start');
  // hill: wait for the broken moment (or go too late once)
  t0 = Date.now(); let lateDone = true;
  while (Date.now() - t0 < 90000) {
    const st = await page.evaluate(() => { const s = window.__game.scene.getScene('DuanqiaoHill'); if (!s.sys.isActive()) return null; return { melting: s.melting, ok: s.isBroken(), done: s.done, resets: s.resets }; });
    if (!st || st.done) break;
    if (st.ok && !lateDone) { await shot('h02-ready'); await sleep(9000); lateDone = true; await shot('h03-late'); continue; }
    if (st.ok && lateDone) { await shot('h04-ready'); await page.mouse.click(1150, 630); break; }
    if (st.resets && !st.melting) await page.keyboard.press('Space');
    await sleep(150);
  }
  await sleep(2500); await shot('h05-ink');
  n = 0;
  while ((await active()).includes('DuanqiaoHill') && n++ < 15) { await page.keyboard.press('Space'); await sleep(1100); }
  await sleep(2500); await page.keyboard.press('Space'); await sleep(1500); await shot('e01-paper');
  for (const [x, y] of [[560, 380], [760, 326], [480, 470], [480, 462]]) { await page.mouse.click(x, y); await sleep(1500); }
  await shot('e02-zhangdai');
  await sleep(1500); await page.keyboard.press('Space'); await sleep(3500); await shot('e03-wake');
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Space'); await sleep(1400); if (i === 2) await shot('e04-phone'); }
  await sleep(2000); await shot('e05-scroll');
  await page.mouse.click(1210, 38); await sleep(600); await shot('e06-scroll-en'); await page.mouse.click(1210, 38);
  await page.keyboard.press('Space'); await sleep(1500); await shot('e07-invite');
  await page.mouse.click(480, 628); await sleep(2500);
  console.log('after', await active());
  console.log('run', await page.evaluate(() => JSON.stringify(window.__dqRun)));
}
