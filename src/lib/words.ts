import data from "@/data/target1900.json";

export type Word = {
  /** 1-1900, matching the numbering printed in ターゲット1900. */
  id: number;
  en: string;
  /** The primary meaning, already trimmed down by scripts/build-words.mjs. */
  ja: string;
};

export const WORDS: Word[] = (data as [string, string][]).map(([en, ja], index) => ({
  id: index + 1,
  en,
  ja,
}));

export const FIRST_ID = 1;
export const LAST_ID = WORDS.length;

export function wordsInRange(from: number, to: number): Word[] {
  const start = Math.max(FIRST_ID, Math.min(from, to));
  const end = Math.min(LAST_ID, Math.max(from, to));
  return WORDS.slice(start - 1, end);
}

export function countInRange(from: number, to: number): number {
  const start = Math.max(FIRST_ID, Math.min(from, to));
  const end = Math.min(LAST_ID, Math.max(from, to));
  return Math.max(0, end - start + 1);
}
