/** Orioles Singing in the Willows: willow whistle, orioles, kites; finishing it completes all ten and opens the scroll. */
export const start = 'LiulangIntro';
export const visited = ['quyuan', 'sudi', 'pinghu', 'duanqiao', 'huagang', 'leifeng', 'shuangfeng', 'nanping', 'santan'];

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

  await sleep(1000); await shot('a00-title');
  await t.open('LiulangIntro');
  await until('LiulangIntro', () => sleep(200));
  await sleep(2800); await shot('a01-intro');
  let i = 0;
  await until('LiulangWhistle', async () => { await space(1, 1000); i++; if ([3, 7].includes(i)) await shot('a02-' + i); });
  await sleep(1000);
  for (let k = 0; k < 8 && (await ev('LiulangWhistle', (s) => s.busy)); k++) await space(1, 900);
  await shot('b01-twig');
  // twist: steady circles
  let ang = 0;
  await page.mouse.move(640 + 200, 320); await page.mouse.down();
  for (let k = 0; k < 400 && (await ev('LiulangWhistle', (s) => s.step)) === 'twist'; k++) { ang += 0.25; await page.mouse.move(640 + Math.cos(ang) * 200, 320 + Math.sin(ang) * 140); await sleep(30); if (k === 60) await shot('b02-twisting'); }
  await page.mouse.up(); await sleep(500); await shot('b03-loose');
  await page.mouse.move(980, 320); await page.mouse.down();
  for (let x = 980; x < 1270 && (await ev('LiulangWhistle', (s) => s.step)) === 'pull'; x += 6) { await page.mouse.move(x, 320); await sleep(25); }
  await page.mouse.up();
  for (let k = 0; k < 20 && (await ev('LiulangWhistle', (s) => s.step)) === 'pull'; k++) { await page.mouse.move(700, 320); await page.mouse.down(); for (let x = 700; x < 1260; x += 6) { await page.mouse.move(x, 320); await sleep(25); } await page.mouse.up(); }
  await sleep(1500); await shot('b04-whistle');
  console.log('whistle', await page.evaluate(() => JSON.stringify(window.__llRun)));
  await until('LiulangOriole', async () => { await space(1, 1100); });
  await sleep(1500); await shot('c01-oriole');
  let n = 0; let shotSing = false;
  while ((await active()).includes('LiulangOriole')) {
    const st = await ev('LiulangOriole', (s) => ({ se: s.searching, li: s.listening, t: s.target, song: s.song.map((x) => x.long), heart: s.target >= 0 ? s.willows[s.target].heart() : null, n: s.heard.length }));
    if (st.se && st.heart) {
      await page.mouse.move(st.heart.x - 90, st.heart.y); await page.mouse.down();
      for (let k = 0; k < 6; k++) { await page.mouse.move(st.heart.x + 90, st.heart.y + 10, { steps: 6 }); await page.mouse.move(st.heart.x - 90, st.heart.y - 10, { steps: 6 }); }
      await page.mouse.up(); n++; if (n === 1) await shot('c02-parted');
      continue;
    }
    if (st.li && st.n === 0) {
      if (!shotSing) { shotSing = true; await shot('c03-sing'); }
      for (const long of st.song) { await page.keyboard.down('Space'); await sleep(long ? 420 : 110); await page.keyboard.up('Space'); await sleep(160); }
      await sleep(800);
      continue;
    }
    if (!st.se && !st.li) { const sp = await ev('LiulangOriole', (s) => s.spring.alpha); if (sp > 0.5 && sp < 1) await shot('c04-wave'); await page.keyboard.press('Space'); }
    await sleep(500);
  }
  console.log('oriole', await page.evaluate(() => JSON.stringify(window.__llRun)));
  await sleep(1200); await shot('d01-kite');
  let shotChoose = false; let ff = 0;
  while ((await active()).includes('LiulangKite')) {
    const st = await ev('LiulangKite', (s) => ({ r: s.rescuing, st: s.stuck ? { x: s.stuck.x, y: s.stuck.y } : null, ph: s.phase, ten: s.tension, choosing: s.children.list.some((o) => o.depth === 310 && o.type === 'Container') }));
    if (st.choosing) { if (!shotChoose) { shotChoose = true; await shot('d02-choose'); } await page.keyboard.press('Digit7'); await sleep(600); continue; }
    if (st.r && st.st) { await page.mouse.move(st.st.x - 60, st.st.y); await page.mouse.down(); for (let k = 0; k < 5; k++) { await page.mouse.move(st.st.x + 60, st.st.y, { steps: 5 }); await page.mouse.move(st.st.x - 60, st.st.y, { steps: 5 }); } await page.mouse.up(); await sleep(300); continue; }
    if (st.ph === 'run') { await page.keyboard.down('Space'); await sleep(200); await page.keyboard.up('Space'); continue; }
    if (st.ph === 'fly') { if (st.ten < 0.55) await page.keyboard.down('Space'); else if (st.ten > 0.65) await page.keyboard.up('Space'); ff++; if (ff === 60 || ff === 220) await shot('d03-fly' + ff); await sleep(50); continue; }
    await page.keyboard.up('Space');
    await page.keyboard.press('Space'); await sleep(900);
  }
  console.log('kite', await page.evaluate(() => JSON.stringify(window.__llRun)));
  await sleep(2500); await shot('e01-wake');
  let m = 0;
  while (m++ < 30) {
    const scroll = await ev('LiulangEnd', (s) => s.children.list.some((o) => o.depth === 103));
    if (scroll) break;
    await space(1, 1300);
    if (m === 4) await shot('e02-mom');
  }
  await sleep(2500); await shot('e03-scroll');
  await page.keyboard.press('Space'); await sleep(1500); await shot('e04-invite');
  await page.mouse.click(800, 628); await sleep(2000);
  await until('TenScenes', () => sleep(300), 15000);
  await sleep(2500); await shot('f01-ten');
  await sleep(8000); await shot('f02-ten');
  await sleep(10000); await shot('f03-ten');
  await sleep(16000); await shot('f04-ten-end');
  console.log('after', await active());
}
