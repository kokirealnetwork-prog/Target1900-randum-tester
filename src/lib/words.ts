import data from "@/data/target1900.json";

export type Word = {
  /** 1-1900, matching the numbering printed in ターゲット1900. */
  id: number;
  en: string;
  ja: string;
  /** Marked 新 (newly added) in the source list. */
  isNew: boolean;
};

export const WORDS = data as Word[];
export const FIRST_ID = 1;
export const LAST_ID = WORDS.length;

const NESTED = "(?:[^（）]|（[^（）]*）)*";
/** Cross references such as （⇔ decrease ⇒ 223） that only make sense in the book. */
const CROSS_REFERENCE = new RegExp(`（${NESTED}[⇔⇒≒＝]${NESTED}）`, "g");
const USAGE_NOTE = /〔[^〕]*〕/g;
const LABEL = /【[^】]*】/g;

/**
 * The book lists every sense of a word separated by "；", which is far too long
 * for a test row. Keep the first sense and drop book-only annotations.
 */
export function primaryMeaning(word: Word): string {
  const firstSense = word.ja.split("；")[0];
  const trimmed = firstSense
    .replace(CROSS_REFERENCE, "")
    .replace(USAGE_NOTE, "")
    .replace(LABEL, "")
    .replace(/\s+/g, " ")
    .trim();
  return trimmed || firstSense.trim();
}

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
