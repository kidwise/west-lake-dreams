import type * as Phaser from 'phaser';
import { load, save } from './storage';

export type Route = 'su' | 'yang';

/** State for the current play-through (one dream). */
export const run = {
  /** Texture keys of photos taken during the ride. */
  photoKeys: [] as string[],
  route: 'yang' as Route,
  flights: 0,
};

let photoSeq = 0;

export function resetRun(textures: Phaser.Textures.TextureManager): void {
  for (const key of run.photoKeys) if (textures.exists(key)) textures.remove(key);
  run.photoKeys = [];
  run.route = 'yang';
  run.flights = 0;
}

export function nextPhotoKey(): string {
  photoSeq += 1;
  return `photo-${photoSeq}`;
}

/** Persistent progress across play sessions. */
interface Progress {
  visited: string[];
}

export function getProgress(): Progress {
  const p = load<Progress>('progress', { visited: [] });
  return { visited: Array.isArray(p.visited) ? p.visited : [] };
}

export function markVisited(viewId: string): void {
  const p = getProgress();
  if (!p.visited.includes(viewId)) p.visited.push(viewId);
  save('progress', p);
}
