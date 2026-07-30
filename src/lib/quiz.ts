import { mulberry32, sample } from "./random";
import { FIRST_ID, LAST_ID, countInRange, primaryMeaning, wordsInRange, type Word } from "./words";

/** `en-ja` shows the English word and asks for the meaning (Aあ). */
export type QuizMode = "en-ja" | "ja-en";

export type QuizConfig = {
  from: number;
  to: number;
  /** Total questions across every 組. */
  count: number;
  mode: QuizMode;
  seed: number;
};

export const ROWS_PER_COLUMN = 14;
export const COLUMNS_PER_PAGE = 2;
/** One 組 is exactly one A4 sheet, so the page capacity fixes the 組 count. */
export const QUESTIONS_PER_SET = ROWS_PER_COLUMN * COLUMNS_PER_PAGE;
export const MAX_COUNT = 200;

export const DEFAULT_CONFIG: QuizConfig = {
  from: 1,
  to: 300,
  count: 20,
  mode: "en-ja",
  seed: 1,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function normalizeConfig(input: Partial<QuizConfig>): QuizConfig {
  const from = clamp(Math.round(input.from ?? DEFAULT_CONFIG.from), FIRST_ID, LAST_ID);
  const to = clamp(Math.round(input.to ?? DEFAULT_CONFIG.to), FIRST_ID, LAST_ID);
  const low = Math.min(from, to);
  const high = Math.max(from, to);
  const available = countInRange(low, high);
  return {
    from: low,
    to: high,
    count: clamp(Math.round(input.count ?? DEFAULT_CONFIG.count), 1, Math.min(MAX_COUNT, available)),
    mode: input.mode === "ja-en" ? "ja-en" : "en-ja",
    seed: (input.seed ?? DEFAULT_CONFIG.seed) >>> 0,
  };
}

export function encodeConfig(config: QuizConfig): string {
  return new URLSearchParams({
    from: String(config.from),
    to: String(config.to),
    count: String(config.count),
    mode: config.mode,
    seed: String(config.seed),
  }).toString();
}

export function decodeConfig(params: URLSearchParams | null): QuizConfig {
  const num = (key: string) => {
    const raw = params?.get(key);
    if (raw === null || raw === undefined || raw === "") return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  return normalizeConfig({
    from: num("from"),
    to: num("to"),
    count: num("count"),
    mode: params?.get("mode") === "ja-en" ? "ja-en" : "en-ja",
    seed: num("seed"),
  });
}

export type QuizQuestion = {
  /** Position within its 組, 1-based. */
  no: number;
  word: Word;
  prompt: string;
  answer: string;
};

export type QuizSet = {
  /** 0-based. */
  index: number;
  questions: QuizQuestion[];
};

export function toQuestion(word: Word, mode: QuizMode, no: number): QuizQuestion {
  const meaning = primaryMeaning(word);
  return {
    no,
    word,
    prompt: mode === "en-ja" ? word.en : meaning,
    answer: mode === "en-ja" ? meaning : word.en,
  };
}

export function setCount(config: QuizConfig): number {
  return Math.max(1, Math.ceil(config.count / QUESTIONS_PER_SET));
}

/** Draws every question at once, then cuts the list into one 組 per sheet. */
export function buildSets(config: QuizConfig): QuizSet[] {
  const pool = wordsInRange(config.from, config.to);
  const rng = mulberry32(config.seed);
  const picked = sample(pool, config.count, rng);
  return Array.from({ length: setCount(config) }, (_, index) => ({
    index,
    questions: picked
      .slice(index * QUESTIONS_PER_SET, (index + 1) * QUESTIONS_PER_SET)
      .map((word, i) => toQuestion(word, config.mode, i + 1)),
  }));
}

export type SheetKind = "question" | "answer";

export type SheetSpec = {
  key: string;
  kind: SheetKind;
  /** 0-based 組 index; the 問題 and 答え sheets of one 組 share it. */
  setIndex: number;
  setTotal: number;
  questions: QuizQuestion[];
};

export const SHEET_KINDS: SheetKind[] = ["question", "answer"];

export function buildSheets(config: QuizConfig, kinds: SheetKind[] = SHEET_KINDS): SheetSpec[] {
  const sets = buildSets(config);
  return sets.flatMap((set) =>
    SHEET_KINDS.filter((kind) => kinds.includes(kind)).map((kind) => ({
      key: `${kind}-${set.index}`,
      kind,
      setIndex: set.index,
      setTotal: sets.length,
      questions: set.questions,
    })),
  );
}

export function rangeLabel(config: QuizConfig): string {
  return `${config.from}－${config.to}`;
}

export function modeLabel(mode: QuizMode): string {
  return mode === "en-ja" ? "Aあ" : "あA";
}
