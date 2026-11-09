/** Lotus in the Breeze at Quyuan: ride and photograph lotus, the pavilion, the bridge daydream, the album. */
export const start = 'QuyuanIntro';
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

  await sleep(1500);
  await shot('01-title');

  // English toggle check on the title
  await page.mouse.click(1210, 38);
  await sleep(500);
  await shot('02-title-en');
  await page.mouse.click(1210, 38);
  await sleep(400);

  await t.open('QuyuanIntro');
  for (let i = 0; i < 5; i++) {
    await sleep(1700);
    if (i === 3) await shot('03-intro-poem');
    await page.keyboard.press('Space');
  }
  await waitScene('QuyuanRide');
  await sleep(1200);
  await shot('04-ride-start');

  // ride: hold right, raise the camera when a blossom approaches the viewfinder
  await page.keyboard.down('ArrowRight');
  let aimedShot = false;
  let t0 = Date.now();
  let n = 0;
  while (!(await active()).includes('QuyuanPavilion') && Date.now() - t0 < 120000) {
    const info = await page.evaluate(() => {
      const s = window.__game.scene.getScene('QuyuanRide');
      if (!s.targets) return null;
      const sx = s.cameras.main.scrollX;
      return { xs: s.targets.filter((t) => !t.shot).map((t) => t.img.x - sx), me: s.pos.me, photos: s.counter?.text };
    });
    if (info && info.xs.some((x) => x > 660 && x < 820)) {
      await page.keyboard.down('Space');
      await sleep(180);
      if (!aimedShot) { await shot('05-ride-aiming'); aimedShot = true; }
      await page.keyboard.up('Space');
      await sleep(250);
      if (n === 0) await shot('06-ride-after-snap');
      n++;
    }
    if (Date.now() - t0 > 14000 && Date.now() - t0 < 14200) await shot('07-ride-mid');
    await sleep(60);
  }
  await page.keyboard.up('ArrowRight');
  console.log('ride done, snaps attempted', n);
  await waitScene('QuyuanPavilion');
  await sleep(1500);
  await shot('08-pavilion');

  // talk until the daydream starts
  t0 = Date.now();
  let k = 0;
  while (!(await active()).includes('QuyuanBridgeDream') && Date.now() - t0 < 60000) {
    await page.keyboard.press('Space');
    await sleep(700);
    k++;
    if (k === 6) await shot('09-pavilion-talk');
    const choosing = await page.evaluate(() => (window.__game.scene.getScene('QuyuanPavilion').dlg?.choiceButtons?.length ?? 0) > 0);
    if (choosing) { await shot('10-choice'); await page.keyboard.press(true ? 'Digit1' : 'Digit2'); }
  }
  await waitScene('QuyuanBridgeDream');
  await sleep(1500);
  await shot('11-dream-start');
  await page.keyboard.down('ArrowRight');
  t0 = Date.now();
  let flyShot = 0;
  while (!(await active()).includes('QuyuanPavilion') && Date.now() - t0 < 90000) {
    const air = await page.evaluate(() => window.__game.scene.getScene('QuyuanBridgeDream').bodies?.me.air);
    if (air && flyShot < 2) { await sleep(250); await shot(`12-dream-fly-${flyShot}`); flyShot++; await sleep(1500); }
    await sleep(80);
  }
  await page.keyboard.up('ArrowRight');
  const flights = await page.evaluate(() => window.__game.scene.getScene('QuyuanBridgeDream').sys && 0);
  void flights;
  await waitScene('QuyuanPavilion');
  await sleep(1200);
  t0 = Date.now();
  k = 0;
  while (!(await active()).includes('QuyuanWake') && Date.now() - t0 < 60000) {
    await page.keyboard.press('Space');
    await sleep(800);
    if (++k === 3) await shot('13-pavilion-bag');
  }
  await waitScene('QuyuanWake');
  await sleep(2600);
  await shot('14-wake');
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Space'); await sleep(1800); }
  await sleep(2500);
  await shot('15-album');
  await page.keyboard.press('Space');
  await sleep(1800);
  await shot('16-invite');
  await page.mouse.click(1210, 38);
  await sleep(500);
  await shot('17-invite-en');
}
