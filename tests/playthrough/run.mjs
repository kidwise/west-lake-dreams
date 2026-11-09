#!/usr/bin/env node
/**
 * Automated play-throughs: plays each chapter from start to finish in headless
 * Chrome and reports any errors.
 *
 *   npm run test:play                 all ten chapters
 *   npm run test:play -- leifeng sudi only these
 *
 * Starts its own dev server; screenshots go to tests/playthrough/out/<chapter>/.
 * Set CHROME_PATH if Chrome isn't in a standard place.
 */
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rmSync } from 'node:fs';
import { openPage } from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
// the Ten Scenes, in their traditional order
const ALL = ['sudi', 'quyuan', 'pinghu', 'duanqiao', 'liulang', 'huagang', 'leifeng', 'shuangfeng', 'nanping', 'santan'];
const wanted = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const chapters = wanted.length ? wanted : ALL;
for (const c of chapters) {
  if (!ALL.includes(c)) {
    console.error(`Unknown chapter "${c}". Choose from: ${ALL.join(', ')}`);
    process.exit(2);
  }
}

const server = await createServer({ root, logLevel: 'error', server: { port: 5199, strictPort: false } });
await server.listen();
const url = server.resolvedUrls?.local[0] ?? 'http://localhost:5199/';
console.log(`dev server: ${url}\n`);

const results = [];
for (const id of chapters) {
  const mod = await import(`./chapters/${id}.mjs`);
  const out = join(here, 'out', id);
  rmSync(out, { recursive: true, force: true });
  const t0 = Date.now();
  process.stdout.write(`▶ ${id} … `);
  let t;
  let failure = null;
  try {
    t = await openPage({ url, out, visited: mod.visited ?? [] });
    await mod.play(t);
  } catch (e) {
    failure = e;
    await t?.shot('zz-failure').catch(() => {});
  }
  const errors = t?.errors ?? [];
  await t?.close().catch(() => {});
  const secs = Math.round((Date.now() - t0) / 1000);
  const ok = !failure && errors.length === 0;
  console.log(`${ok ? 'ok' : 'FAILED'} (${secs}s)`);
  if (failure) console.log(`   stuck: ${failure.message}`);
  for (const e of errors) console.log(`   ${e.split('\n').join('\n   ')}`);
  results.push({ id, ok });
}

await server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} chapters passed${failed.length ? ` — failed: ${failed.map((r) => r.id).join(', ')}` : ''}`);
console.log(`screenshots: ${join('tests', 'playthrough', 'out')}/`);
process.exit(failed.length ? 1 : 0);
