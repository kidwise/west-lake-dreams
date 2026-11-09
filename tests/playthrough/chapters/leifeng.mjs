/** Leifeng Pagoda at Sunset: the steps, the ruins, the sunset photo, dinner. */
export const start = 'LeifengIntro';
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
  await t.open('LeifengIntro');
  await until('LeifengIntro', () => sleep(200));
  await sleep(1800); await shot('a01-intro');
  let i = 0;
  await until('LeifengStairs', async () => { await space(1, 1000); i++; if ([3, 6, 11, 15].includes(i)) await shot('a02-' + i); });
  await sleep(1200); await shot('b01-stairs');
  for (let k = 0; k < 6 && !(await ev('LeifengStairs', (s) => s.active)); k++) await space(1, 900);
  await sleep(2000);
  let foot = 0; let n = 0;
  while (await ev('LeifengStairs', (s) => s.active)) {
    const st = await ev('LeifengStairs', (s) => ({ s: s.s, th: s.things.map((t) => t.s) }));
    if (st.th.some((x) => x - st.s > 0.4 && x - st.s < 1.4)) await page.keyboard.press('Space');
    await page.keyboard.press(foot ? 'ArrowRight' : 'ArrowLeft'); foot = 1 - foot;
    n++; if (n % 60 === 0) await shot('b02-run' + n);
    await sleep(120);
  }
  console.log('stairs', await page.evaluate(() => JSON.stringify(window.__lfRun)));
  await sleep(1500); await shot('b03-top');
  await until('LeifengRuins', async () => { await space(1, 1000); });
  await sleep(1200); await shot('c01-ruins');
  for (let k = 0; k < 8 && !(await ev('LeifengRuins', (s) => s.active)); k++) await space(1, 900);
  n = 0;
  while (await ev('LeifengRuins', (s) => s.active)) {
    const st = await ev('LeifengRuins', (s) => ({ c: s.crabs.filter((c) => c.state === 'carry' || (c.state === 'pry' && Math.random() < 0.3)).map((c) => ({ x: c.img.x, y: c.img.y })), b: [...s.loose].map((b) => ({ x: b.x, y: b.y })) }));
    if (st.c.length && Math.random() < 0.7) await page.mouse.click(st.c[0].x, st.c[0].y);
    else if (st.b.length) await page.mouse.click(st.b[0].x, st.b[0].y);
    n++; if (n === 80 || n === 200) await shot('c02-play' + n);
    await sleep(180);
  }
  console.log('ruins', await page.evaluate(() => JSON.stringify(window.__lfRun)));
  await sleep(1500); await shot('c03-after');
  i = 0;
  await until('LeifengTop', async () => { await space(1, 1100); i++; if (i === 3 || i === 5) await shot('c04-palace' + i); });
  await sleep(1500); await shot('d01-top');
  for (let k = 0; k < 10 && !(await ev('LeifengTop', (s) => s.shooting)); k++) { await space(1, 1000); if (k === 3) await shot('d02-talk'); }
  await sleep(500); await page.keyboard.press('Space'); await sleep(1500);
  let peeked = false;
  while (await ev('LeifengTop', (s) => s.shooting)) {
    const st = await ev('LeifengTop', (s) => ({ light: s.light(), p: s.peeks.filter((p) => !p.out).map((p) => ({ x: p.img.x, y: p.img.y })) }));
    if (st.p.length) { if (!peeked) { peeked = true; await shot('d03-peek'); } await sleep(400); await page.mouse.click(st.p[0].x, st.p[0].y); }
    else if (st.light === 'perfect') { await page.keyboard.press('Space'); await sleep(300); await shot('d04-perfect'); }
    await sleep(60);
  }
  console.log('top', await page.evaluate(() => JSON.stringify(window.__lfRun)));
  i = 0;
  await until('LeifengEnd', async () => { await space(1, 1300); i++; if ([2, 6, 9].includes(i)) await shot('d05-end' + i); });
  await sleep(2500); await shot('e01-dinner');
  let m = 0;
  while (m++ < 30) {
    const scroll = await ev('LeifengEnd', (s) => s.children.list.some((o) => o.depth === 103));
    if (scroll) break;
    await space(1, 1400);
    if (m === 3) await shot('e02-crab');
  }
  await sleep(2500); await shot('e03-scroll');
  await page.mouse.click(1210, 38); await sleep(600); await shot('e04-scroll-lang'); await page.mouse.click(1210, 38);
  await page.keyboard.press('Space'); await sleep(1500); await shot('e05-invite');
  await page.mouse.click(false ? 480 : 800, 628); await sleep(2500);
  console.log('after', await active(), await page.evaluate(() => JSON.stringify(window.__lfRun)));
}
