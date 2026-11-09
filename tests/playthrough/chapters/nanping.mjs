/** Evening Bell at Nanping Hill: the well, the echoes, the bell (with some chapters visited, so both kinds of answer show). */
export const start = 'NanpingIntro';
export const visited = ['leifeng', 'duanqiao', 'shuangfeng', 'santan'];

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

  // pretend we've already dreamt a few of the other scenes, so both kinds of answer show up
  await sleep(1000);
  await t.open('NanpingIntro');
  await until('NanpingIntro', () => sleep(200));
  await sleep(2400); await shot('a01-intro');
  let i = 0;
  await until('NanpingWell', async () => { await space(1, 1000); i++; if ([2, 5, 8, 11, 14].includes(i)) await shot('a02-' + i); });
  await sleep(1000); await shot('b01-well');
  for (let k = 0; k < 8 && !(await ev('NanpingWell', (s) => s.active)); k++) await space(1, 900);
  let junkTaken = false; let n = 0;
  while (await ev('NanpingWell', (s) => s.active)) {
    const st = await ev('NanpingWell', (s) => s.things.filter((t) => !t.done).map((t) => ({ kind: t.kind, ph: s.phase(t, s.time.now), x: t.img.x, y: t.img.y })));
    for (const th of st) {
      if (th.ph === 'surface' && (th.kind === 'log' || !junkTaken)) { if (th.kind !== 'log') junkTaken = true; await page.mouse.click(th.x, th.y); }
    }
    n++; if (n === 40) await shot('b02-play');
    await sleep(80);
  }
  await sleep(1500); await shot('b03-choose');
  await space(1, 800);
  for (let k = 0; k < 10; k++) {
    const pos = await ev('NanpingWell', (s) => { const l = s.children.list.find((o) => o.texture && o.texture.key === 'npLog' && o.depth === 31); return l ? { x: l.x, y: l.y } : null; });
    if (pos) { await page.mouse.click(pos.x, pos.y); break; }
    await space(1, 600);
  }
  console.log('well', await page.evaluate(() => JSON.stringify(window.__npRun)));
  await until('NanpingEcho', async () => { await space(1, 1000); });
  await sleep(1000); await shot('c01-echo');
  let mistake = false; let shotDemo = false;
  while ((await active()).includes('NanpingEcho')) {
    const st = await ev('NanpingEcho', (s) => ({ l: s.listening, seq: s.seq, n: s.input_.length }));
    if (!st.l) { if (!shotDemo && st.seq.length) { shotDemo = true; await sleep(800); await shot('c02-demo'); } await page.keyboard.press('Space'); await sleep(500); continue; }
    if (!mistake) { mistake = true; await page.keyboard.press('Digit' + (((st.seq[0] + 1) % 5) + 1)); await sleep(300); await shot('c03-burp'); continue; }
    for (const x of st.seq) { await page.keyboard.press('Digit' + (x + 1)); await sleep(250); }
    await sleep(600);
  }
  console.log('echo', await page.evaluate(() => JSON.stringify(window.__npRun)));
  await sleep(1000); await shot('d01-bell');
  for (let k = 0; k < 8 && !(await ev('NanpingBell', (s) => s.active)); k++) await space(1, 900);
  let first = true; let shots = 0;
  while (await ev('NanpingBell', (s) => s.active || s.swinging)) {
    const st = await ev('NanpingBell', (s) => ({ ring: s.ring, sw: s.swinging }));
    if (st.sw || st.ring > 0.3) { await sleep(100); continue; }
    await page.keyboard.down('Space');
    const target = first ? 0.3 : 0.7;
    for (let k = 0; k < 60; k++) { const p = await ev('NanpingBell', (s) => s.power); if (p >= target) break; await sleep(20); }
    if (!first && shots < 3) { await shot('d02-pull' + shots); }
    await page.keyboard.up('Space'); first = false;
    await sleep(1300); if (shots < 4) { await shot('d03-strike' + shots); } shots++;
  }
  console.log('bell', await page.evaluate(() => JSON.stringify(window.__npRun)));
  await sleep(3500); await shot('d04-finale');
  i = 0;
  await until('NanpingEnd', async () => { await space(1, 1300); i++; });
  await sleep(2000); await shot('e01-night');
  let m = 0;
  while (m++ < 40) {
    const scroll = await ev('NanpingEnd', (s) => s.children.list.some((o) => o.depth === 103));
    if (scroll) break;
    await space(1, 1300);
    if (m === 3 || m === 6) await shot('e02-ny' + m);
  }
  await sleep(2500); await shot('e03-scroll');
  await page.keyboard.press('Space'); await sleep(1500); await shot('e04-invite');
  await page.mouse.click(false ? 480 : 800, 628); await sleep(2500);
  console.log('after', await active(), await page.evaluate(() => JSON.stringify(window.__npRun)));
}
