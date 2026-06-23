import { describe, it, expect } from 'vitest';
import { LANGUAGE_LABELS, type Language } from '@/context/TranslationContext';
import en from './en.json';
import es from './es.json';
import hi from './hi.json';
import fr from './fr.json';
import zh from './zh.json';
import ja from './ja.json';
import ko from './ko.json';
import de from './de.json';
import pt from './pt.json';

// Every locale the switcher offers must stay in lockstep with the English
// source of truth. Because t() silently falls back to English for a missing
// key, a missing/renamed key or a broken {{placeholder}} would otherwise leak
// English into a translated UI with no failing test. This generalizes the
// per-locale de/pt parity tests to all current (and future) locales.
const LOCALES: Record<Language, Record<string, unknown>> = {
  en,
  es,
  hi,
  fr,
  zh,
  ja,
  ko,
  de,
  pt,
};

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') {
      Object.assign(out, flatten(value as Record<string, unknown>, path));
    } else {
      out[path] = String(value);
    }
  }
  return out;
}

// {{placeholder}} tokens a string exposes to t()'s param replacement, sorted so
// ordering differences between languages do not cause false failures.
function placeholders(value: string): string[] {
  return (value.match(/{{\s*\w+\s*}}/g) ?? []).sort();
}

const enFlat = flatten(en);
const enKeys = Object.keys(enFlat).sort();
const codes = Object.keys(LANGUAGE_LABELS) as Language[];
const nonEnCodes = codes.filter((code) => code !== 'en');

describe('locale parity with the English source of truth', () => {
  it('ships a locale file for every language offered by the switcher', () => {
    for (const code of codes) {
      expect(LOCALES[code], `no locale file wired for "${code}"`).toBeDefined();
    }
  });

  describe.each(nonEnCodes)('%s locale', (code) => {
    const localeFlat = flatten(LOCALES[code]);

    it('is registered with a non-empty label', () => {
      expect(LANGUAGE_LABELS[code].trim()).not.toBe('');
    });

    it('defines exactly the same keys as English', () => {
      expect(Object.keys(localeFlat).sort()).toEqual(enKeys);
    });

    it('has a non-empty translation for every key', () => {
      const blank = Object.entries(localeFlat)
        .filter(([, value]) => value.trim().length === 0)
        .map(([path]) => path);
      expect(blank).toEqual([]);
    });

    it('preserves the same {{placeholder}} tokens as English in every value', () => {
      const mismatched = enKeys.filter(
        (path) =>
          placeholders(enFlat[path]).join(',') !== placeholders(localeFlat[path] ?? '').join(',')
      );
      expect(mismatched).toEqual([]);
    });
  });
});
