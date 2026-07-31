import target1900Data from "@/data/target1900.json";
import pass2Data from "@/data/pass2.json";
import passPre1Data from "@/data/passPre1.json";

export type Word = {
  id: number;
  en: string;
  ja: string;
};

export type WordbookId = "target1900" | "pass2" | "passPre1";

export type Wordbook = {
  id: WordbookId;
  label: string;
  shortLabel: string;
  available: boolean;
  words: Word[];
};

const toWords = (data: [string, string][]): Word[] =>
  data.map(([en, ja], index) => ({
    id: index + 1,
    en,
    ja,
  }));

const target1900Words = toWords(target1900Data as [string, string][]);
const pass2Words = toWords(pass2Data as [string, string][]);
const passPre1Words = toWords(passPre1Data as [string, string][]);

export const WORDBOOKS: Wordbook[] = [
  {
    id: "target1900",
    label: "英単語ターゲット1900 6訂版",
    shortLabel: "ターゲット1900",
    available: true,
    words: target1900Words,
  },
  {
    id: "pass2",
    label: "英検2級 でる順パス単 5訂版",
    shortLabel: "でる順パス単 2級",
    available: true,
    words: pass2Words,
  },
  {
    id: "passPre1",
    label: "英検準1級 でる順パス単 5訂版",
    shortLabel: "でる順パス単 準1級",
    available: true,
    words: passPre1Words,
  },
];

export const DEFAULT_WORDBOOK_ID: WordbookId = "target1900";

export function isWordbookId(value: unknown): value is WordbookId {
  return WORDBOOKS.some((book) => book.id === value);
}

export function getWordbook(id: WordbookId): Wordbook {
  return WORDBOOKS.find((book) => book.id === id) ?? WORDBOOKS[0];
}

export function availableWordbook(id: unknown): Wordbook {
  const requested = isWordbookId(id) ? getWordbook(id) : getWordbook(DEFAULT_WORDBOOK_ID);
  return requested.available ? requested : getWordbook(DEFAULT_WORDBOOK_ID);
}

export function firstIdFor(): number {
  return 1;
}

export function lastIdFor(wordbook: WordbookId): number {
  return getWordbook(wordbook).words.length;
}

export function wordsInRange(wordbook: WordbookId, from: number, to: number): Word[] {
  const words = getWordbook(wordbook).words;
  const first = firstIdFor();
  const last = words.length;
  const start = Math.max(first, Math.min(from, to));
  const end = Math.min(last, Math.max(from, to));
  return words.slice(start - 1, end);
}

export function countInRange(wordbook: WordbookId, from: number, to: number): number {
  const first = firstIdFor();
  const last = lastIdFor(wordbook);
  const start = Math.max(first, Math.min(from, to));
  const end = Math.min(last, Math.max(from, to));
  return Math.max(0, end - start + 1);
}
