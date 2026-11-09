import { load, save } from './storage';

/** Persistent progress across play sessions: which of the Ten Scenes have been dreamt. */
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
