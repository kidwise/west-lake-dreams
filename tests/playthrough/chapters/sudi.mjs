/** Spring Dawn at Su Causeway: dig the causeway, ride the six bridges at dawn, the scroll. */
export const start = 'SudiIntro';
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
  await shot('t01-title');
  await t.open('SudiIntro');
  await until('SudiIntro', () => sleep(200));
  await sleep(2200); await shot('t02-intro-narration');
  // narration
  let n = 0;
  while (!(await R(() => window.__game.scene.getScene('SudiIntro').canDig))) { await page.keyboard.press('Space'); await sleep(1300); if (++n > 12) throw new Error('dig never started'); }
  await sleep(600); await shot('t03-dig-start');
  // dig: press space, sometimes timed to the green zone
  let k = 0;
  while (await R(() => window.__game.scene.getScene('SudiIntro').fill < 16)) {
    const green = await R(() => Math.sin(window.__game.scene.getScene('SudiIntro').meterT) > 0.72);
    if (green || k % 3 === 0) await page.keyboard.press('Space');
    await sleep(green ? 400 : 60); k++;
    if (k === 40) await shot('t04-digging');
    if (k > 600) throw new Error('dig stuck');
  }
  await sleep(1500); await shot('t05-dig-done');
  await page.keyboard.press('Space'); await sleep(1600); await shot('t06-elder-poem');
  await until('SudiRide', async () => { await page.keyboard.press('Space'); await sleep(900); }, 60000);
  await sleep(1500); await shot('t07-ride-start');
  await page.keyboard.down('ArrowRight');
  const seen = {};
  const t0 = Date.now();
  while (!(await active()).includes('SudiEnd') && Date.now() - t0 < 180000) {
    const st = await R(() => { const s = window.__game.scene.getScene('SudiRide'); const me = s.me; return { x: me.x, air: me.air, vy: me.vy, gust: s.gustOn, hills: s.ev.hillsActive, race: s.ev.race, sun: s.ev.sunrise, paused: s.paused, rb: s.ev.rainbowPassed, fin: s.ev.finished, tod: s.tod }; });
    if (st.air && !seen.air1) { seen.air1 = 1; await sleep(120); await shot('t08-first-flight'); }
    if (st.gust && !seen.gust) { seen.gust = 1; await page.keyboard.down('ArrowDown'); await sleep(200); await shot('t09-wind'); await sleep(900); await page.keyboard.up('ArrowDown'); }
    if (st.hills && !seen.hills) { seen.hills = 1; await sleep(300); await shot('t10-hills-moment'); await page.keyboard.press('Space'); await sleep(700); await shot('t11-hills-shot'); }
    if (st.air && !st.hills && st.vy > 150 && !seen.lean) { seen.lean = 1; await page.keyboard.down('ArrowDown'); await sleep(180); await page.keyboard.up('ArrowDown'); await shot('t12-landing-guide'); }
    if (st.race === 'countdown' && !seen.race) { seen.race = 1; await sleep(1700); await shot('t13-race'); }
    if (st.paused && !seen.sun) { seen.sun = 1; await sleep(1800); await shot('t14-sunrise-cutaway'); }
    if (st.sun && !st.paused && !seen.after) { seen.after = 1; await sleep(1500); await shot('t15-after-sunrise'); }
    if (st.x > 7300 && !seen.rbw) { seen.rbw = 1; await shot('t16-rainbow'); }
    if (st.fin && !seen.fin) { seen.fin = 1; await sleep(300); await shot('t17-finish'); }
    await sleep(60);
  }
  await page.keyboard.up('ArrowRight');
  console.log('seen', JSON.stringify(seen), 'run', JSON.stringify(await R(() => window.__sudiRun ?? null)));
  await until('SudiEnd', () => sleep(200));
  await sleep(3800); await shot('t18-broadcast');
  let m = 0;
  while (m++ < 30) {
    const scroll = await R(() => window.__game.scene.getScene('SudiEnd').children.list.some((o) => o.depth === 103));
    if (scroll) break;
    await page.keyboard.press('Space'); await sleep(1500);
    if (m === 4) await shot('t19-wake');
  }
  await sleep(2500); await shot('t20-scroll');
  await page.mouse.click(1210, 38); await sleep(500); await shot('t21-scroll-en'); await page.mouse.click(1210, 38);
  await page.keyboard.press('Space'); await sleep(1500); await shot('t22-invite');
  console.log('before click:', await active());
  await page.mouse.click(800, 610); // 返回标题
  await sleep(2500);
  console.log('after click:', await active());
  await shot('t23-after-back');
}
