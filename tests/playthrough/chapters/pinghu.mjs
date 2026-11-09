/** Autumn Moon over the Calm Lake: turning bridges, calming the water, the railing qin, the boat. */
export const start = 'PinghuIntro';
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
  await t.open('PinghuIntro');
  await until('PinghuIntro', () => sleep(200));
  await sleep(2000); await shot('a01-intro');
  for (let lv = 0; lv < 3; lv++) {
    await until('PinghuBridge', async () => { await page.keyboard.press('Space'); await sleep(1000); });
    await sleep(1200); await shot(`b${lv}-start`);
    if (lv === 1) { await page.mouse.click(1170, 634); await sleep(500); await shot('b1-hint'); }
    // solve: tap each tile until it matches its solution (a bot would; players won't know)
    for (let k = 0; k < 80; k++) {
      const tile = await page.evaluate(() => { const s = window.__game.scene.getScene('PinghuBridge'); if (s.solved) return null; const tl = s.tiles.find((q) => q.onPath && q.mask !== q.solved && !q.turning); return tl ? { x: 208 + 40 + tl.c * 96 + 48 + 0, y: 116 + tl.r * 96 + 48 } : 'wait'; });
      if (!tile) break;
      if (tile !== 'wait') await page.mouse.click(tile.x, tile.y);
      await sleep(260);
    }
    await sleep(600); await shot(`b${lv}-solved`);
    await until('PinghuCalm', async () => { await page.keyboard.press('Space'); await sleep(900); });
    await sleep(800);
    // calm: dismiss dialogue, then slow circles
    for (let i = 0; i < 6 && !(await page.evaluate(() => window.__game.scene.getScene('PinghuCalm').active)); i++) { await page.keyboard.press('Space'); await sleep(900); }
    await shot(`c${lv}-start`);
    let ang = 0; const t0 = Date.now(); let shotMid = false;
    while (Date.now() - t0 < 60000) {
      const st = await page.evaluate(() => { const s = window.__game.scene.getScene('PinghuCalm'); if (!s.sys.isActive()) return null; return { done: s.done, rough: s.rough, fish: s.fish && { x: s.fish.img.x, y: s.fish.img.y }, waves: s.waves.map((w) => ({ x: w.x, lane: w.lane })), leafY: s.leaf?.y }; });
      if (!st || st.done) break;
      if (st.fish) { await page.mouse.click(st.fish.x, st.fish.y); await sleep(100); continue; }
      const w = st.waves.find((w) => w.x > 940);
      if (w && st.leafY !== undefined && Math.abs(st.leafY - [230, 370, 510][w.lane]) > 40) {
        await page.mouse.move(930, st.leafY); await page.mouse.down(); await page.mouse.move(930, [230, 370, 510][w.lane], { steps: 6 }); await page.mouse.up(); continue;
      }
      await page.mouse.move(640 + Math.cos(ang) * 160, 360 + Math.sin(ang) * 100); await page.mouse.down();
      for (let s = 0; s < 14; s++) { ang += 0.22; await page.mouse.move(640 + Math.cos(ang) * 160, 360 + Math.sin(ang) * 100); await sleep(30); }
      await page.mouse.up();
      if (!shotMid && st.rough < 0.5) { shotMid = true; await shot(`c${lv}-mid`); }
    }
    await sleep(1500); await shot(`c${lv}-done`);
  }
  await until('PinghuMoon', async () => { await page.keyboard.press('Space'); await sleep(1000); });
  await sleep(1500); await shot('m01');
  for (let i = 0; i < 10 && !(await page.evaluate(() => window.__game.scene.getScene('PinghuMoon').playing)); i++) { await page.keyboard.press('Space'); await sleep(1000); }
  // play the railing: press the key when each note arrives
  const keys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5']; let shots = 0;
  while (await page.evaluate(() => window.__game.scene.getScene('PinghuMoon').playing)) {
    const due = await page.evaluate(() => { const s = window.__game.scene.getScene('PinghuMoon'); const now = s.time.now; return s.notes.filter((n) => !n.judged && Math.abs(n.time - now) < 40).map((n) => n.lane); });
    for (const l of due) await page.keyboard.press(keys[l]);
    if (shots < 2 && Math.random() < 0.01) { shots++; await shot(`m02-play${shots}`); }
    await sleep(15);
  }
  console.log('qin', await page.evaluate(() => JSON.stringify(window.__phRun)));
  await sleep(3000); await shot('m03-moon');
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Space'); await sleep(1500); if (i === 1) await shot('m04-couplet'); }
  await until('PinghuEnd', async () => { await page.keyboard.press('Space'); await sleep(1200); });
  await sleep(3000); await shot('e01-boat');
  let m = 0;
  while (m++ < 30) {
    const scroll = await page.evaluate(() => window.__game.scene.getScene('PinghuEnd').children.list.some((o) => o.depth === 103));
    if (scroll) break;
    await page.keyboard.press('Space'); await sleep(1400);
    if (m === 5) await shot('e02-wake');
  }
  await sleep(2500); await shot('e03-scroll');
  await page.mouse.click(1210, 38); await sleep(600); await shot('e04-scroll-en'); await page.mouse.click(1210, 38);
  await page.keyboard.press('Space'); await sleep(1500); await shot('e05-invite');
  await page.mouse.click(false ? 480 : 800, 628); await sleep(2500);
  console.log('after', await active(), await page.evaluate(() => JSON.stringify(window.__phRun)));
}
