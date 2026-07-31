import target1900Data from "@/data/target1900.json";

export type Word = {
  id: number;
  en: string;
  ja: string;
};

export type WordbookId = "target1900" | "pass2" | "passPre2";

export type Wordbook = {
  id: WordbookId;
  label: string;
  shortLabel: string;
  expectedWordCount: number;
  available: boolean;
  words: Word[];
};

const target1900Words: Word[] = (target1900Data as [string, string][]).map(
  ([en, ja], index) => ({
    id: index + 1,
    en,
    ja,
  }),
);

/**
 * Additional books are registered before their datasets arrive so the selector
 * and URL format stay stable. Their buttons remain disabled until licensed
 * word/meaning data is supplied by the user.
 */
export const WORDBOOKS: Wordbook[] = [
  {
    id: "target1900",
    label: "ターゲット1900 6訂版",
    shortLabel: "ターゲット1900",
    expectedWordCount: target1900Words.length,
    available: true,
    words: target1900Words,
  },
  {
    id: "pass2",
    label: "でる順パス単 英検2級 5訂版",
    shortLabel: "でる順パス単 2級",
    expectedWordCount: 1300,
    available: false,
    words: [],
  },
  {
    id: "passPre2",
    label: "でる順パス単 英検準2級 5訂版",
    shortLabel: "でる順パス単 準2級",
    expectedWordCount: 1100,
    available: false,
    words: [],
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
