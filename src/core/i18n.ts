import { zh, en, type StrKey } from '../story/strings';
import { load, save } from './storage';

export type Lang = 'zh' | 'en';
export type { StrKey };

const dicts: Record<Lang, Record<StrKey, string>> = { zh, en };
let lang: Lang = load<Lang>('lang', 'zh') === 'en' ? 'en' : 'zh';
const listeners = new Set<() => void>();

/** Translate a key, filling `{name}` placeholders from params. */
export function t(key: StrKey, params?: Record<string, string | number>): string {
  let s = dicts[lang][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

export function getLang(): Lang {
  return lang;
}

export function setLang(next: Lang): void {
  if (next === lang) return;
  lang = next;
  save('lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  for (const fn of [...listeners]) fn();
}

export function toggleLang(): void {
  setLang(lang === 'zh' ? 'en' : 'zh');
}

/** Subscribe to language changes. Returns an unsubscribe function. */
export function onLangChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
