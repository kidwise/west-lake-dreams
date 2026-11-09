/** Three Pools Mirroring the Moon: study the note, row and photograph, rebuild the note, moonrise. */
export const start = 'SantanIntro';
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

  await sleep(1200);
  await shot('s01-title');
  await t.open('SantanIntro');
  await until('SantanIntro', () => sleep(200));
  await sleep(2500); await shot('s02-intro');
  let n = 0;
  while (!(await page.evaluate(() => window.__game.scene.getScene('SantanIntro').observing))) { await sleep(1500); await page.keyboard.press('Space'); if (++n === 4) await shot('s03-intro-note'); if (n > 15) throw new Error('observe never started'); }
  await sleep(800);
  await shot('s04-observe');
  for (const k of ['Digit1', 'Digit2', 'Digit3']) { await page.keyboard.press(k); await sleep(500); }
  await sleep(1200); await shot('s05-observed');
  await page.keyboard.press('Enter');
  await until('SantanBoat', () => sleep(200));
  await sleep(2000); await shot('s06-boat-start');
  // row forward a bit and turn
  await page.keyboard.down('ArrowUp'); await sleep(2500); await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowLeft'); await sleep(1500); await page.keyboard.up('ArrowLeft');
  await sleep(300); await shot('s07-boat-turned');
  // hold N to view the note
  await page.keyboard.down('KeyN'); await sleep(300); await shot('s08-note-overlay'); await page.keyboard.up('KeyN');
  // a near miss photo
  await page.keyboard.press('Space'); await sleep(300); await shot('s09-miss');
  // visit each target viewpoint (slightly off first, to see the meter), then shoot
  await page.evaluate(() => { const s = window.__game.scene.getScene('SantanBoat'); s.pose = { x: -94, y: -110, heading: 102 }; s.speed = 0; });
  await sleep(700); await shot('s09b-two-of-three');
  await page.keyboard.press('Space'); await sleep(400); await shot('s09c-two-of-three-shot'); await sleep(2500);
  const ids = ['near', 'pair', 'far'];
  for (const [i, id] of ids.entries()) {
    const pose = await page.evaluate((id) => {
      const s = window.__game.scene.getScene('SantanBoat');
      // targets are module-level; read them through the scene's similarity data via a debug hook
      return window.__santanDebug.targetPose(id);
    }, id);
    await page.evaluate((p) => { const s = window.__game.scene.getScene('SantanBoat'); s.pose = { x: p.x + 4, y: p.y - 3, heading: p.heading - 3 }; s.speed = 0; }, pose);
    await sleep(500); await shot(`s1${i}-near-${id}`);
    await page.evaluate((p) => { const s = window.__game.scene.getScene('SantanBoat'); s.pose = { ...p }; s.speed = 0; }, pose);
    await sleep(500); await shot(`s1${i}-at-${id}`);
    await page.keyboard.press('Space'); await sleep(900);
    await shot(`s1${i}-shot-${id}`);
    await sleep(4500);
  }
  // reveal dialogue
  await until('SantanPuzzle', async () => { await page.keyboard.press('Space'); await sleep(700); }, 40000);
  await sleep(1500); await shot('s20-puzzle');
  // drag each piece to its slot
  const plan = await page.evaluate(() => { const s = window.__game.scene.getScene('SantanPuzzle'); return s.pieces.map((p) => ({ id: p.id, x: p.obj.x, y: p.obj.y, tx: s.slotX(p.id), ty: 250 })); });
  // first, a wrong drop
  { const p = plan[0]; const wrong = plan.find((q) => q.id !== p.id); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(wrong.tx, wrong.ty, { steps: 10 }); await sleep(200); await page.mouse.up(); await sleep(250); await shot('s21-wrong'); await sleep(600); }
  for (const p of plan) { await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.tx, p.ty, { steps: 12 }); await page.mouse.up(); await sleep(600); }
  await sleep(1800); await shot('s22-restored');
  await until('SantanMoon', async () => { await page.keyboard.press('Space'); await sleep(900); }, 60000);
  await sleep(5000); await shot('s23-moon');
  await page.keyboard.press('Space'); await sleep(6000); await shot('s24-lit');
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Space'); await sleep(2200); }
  await sleep(1500); await shot('s25-invite');
  await page.mouse.click(1210, 38); await sleep(500); await shot('s26-invite-en'); await page.mouse.click(1210, 38);
}
