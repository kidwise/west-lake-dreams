/**
 * Shared helpers for the automated play-throughs: a headless Chrome page on the
 * dev server, an error log, screenshots, and small "wait for scene" helpers.
 *
 * Each chapter script exports `async function play(t)`, where `t` is the object
 * returned by `openPage()`. It should play the chapter from start to finish and
 * throw if it gets stuck; console errors are collected automatically.
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

export function findChrome() {
  const p = CHROME_PATHS.find((c) => existsSync(c));
  if (!p) throw new Error('Chrome not found. Install Google Chrome or set CHROME_PATH.');
  return p;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Open the game in a fresh headless browser.
 * @param {object} o
 * @param {string} o.url        dev server URL
 * @param {string} o.out        folder for screenshots
 * @param {string[]} [o.visited] pretend these chapters were already dreamt (for order-dependent lines)
 * @param {'zh'|'en'} [o.lang]
 */
export async function openPage({ url, out, visited = [], lang = 'zh' }) {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: findChrome(),
    headless: true,
    args: process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu'] : ['--enable-gpu'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}\n${(e.stack || '').split('\n').slice(0, 5).join('\n')}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[console] ${m.text()}`);
  });
  // start from a known save: only the chapters we were told about count as visited
  await page.addInitScript(
    ({ visited, lang }) => {
      if (sessionStorage.getItem('pt-seeded')) return;
      sessionStorage.setItem('pt-seeded', '1');
      localStorage.clear();
      localStorage.setItem('wld.progress', JSON.stringify({ visited }));
      localStorage.setItem('wld.tenShown', 'true');
      localStorage.setItem('wld.lang', JSON.stringify(lang));
    },
    { visited, lang },
  );
  await page.goto(url);
  await page.waitForFunction(() => window.__game?.scene.isActive('Title'), null, { timeout: 30000 });
  await sleep(800);

  const t = {
    page,
    browser,
    errors,
    sleep,
    /** Save a screenshot as <out>/<name>.png. */
    shot: (name) => page.screenshot({ path: `${out}/${name}.png` }),
    /** Keys of the scenes currently running. */
    active: () => page.evaluate(() => window.__game.scene.getScenes(true).map((s) => s.sys.settings.key)),
    /** Run `fn(scene)` in the page against the scene with this key and return its result. */
    ev: (key, fn) => page.evaluate(`(() => { const s = window.__game.scene.getScene(${JSON.stringify(key)}); return (${fn})(s); })()`),
    /** Read a chapter's run state (window.__xxRun). */
    run: (name) => page.evaluate((n) => JSON.parse(JSON.stringify(window[n] ?? null)), name),
    /** Press Space `n` times, `ms` apart. */
    space: async (n = 1, ms = 900) => {
      for (let i = 0; i < n; i++) {
        await page.keyboard.press('Space');
        await sleep(ms);
      }
    },
    /** Keep calling `step` until the scene `key` is running. */
    until: async (key, step = () => sleep(200), ms = 150000) => {
      const t0 = Date.now();
      while (!(await t.active()).includes(key)) {
        if (Date.now() - t0 > ms) throw new Error(`stuck before ${key}; running: ${(await t.active()).join(',')}`);
        await step();
      }
    },
    /** Start a chapter from the title screen, like clicking it in the list. */
    open: async (startScene) => {
      await page.evaluate((k) => window.__game.scene.getScene('Title').scene.start(k), startScene);
      await t.until(startScene, () => sleep(100), 10000);
    },
    /** Advance the scroll at a chapter's end and press "back to title" on the invitation. */
    finish: async (endScene) => {
      for (let m = 0; m < 40; m++) {
        const scroll = await t.ev(endScene, (s) => s.children.list.some((o) => o.depth === 103));
        if (scroll) break;
        await t.space(1, 1300);
      }
      await sleep(2500);
      await t.shot('zz-scroll');
      await page.keyboard.press('Space');
      await sleep(1500);
      await t.shot('zz-invite');
      await page.mouse.click(800, 628);
      await t.until('Title', () => sleep(300), 15000);
    },
    close: () => browser.close(),
  };
  return t;
}
