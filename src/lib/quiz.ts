import { mulberry32, sample } from "./random";
import {
  DEFAULT_WORDBOOK_ID,
  availableWordbook,
  countInRange,
  firstIdFor,
  lastIdFor,
  wordsInRange,
  type Word,
  type WordbookId,
} from "./words";

/** `en-ja` shows the English word and asks for the meaning (Aあ). */
export type QuizMode = "en-ja" | "ja-en";
export type QuestionsPerPage = 25 | 50;

export type QuizConfig = {
  wordbook: WordbookId;
  from: number;
  to: number;
  /** Total questions across every 組. */
  count: number;
  questionsPerPage: QuestionsPerPage;
  mode: QuizMode;
  seed: number;
};

export const COLUMNS_PER_PAGE = 2;
export const QUESTIONS_PER_PAGE_OPTIONS: QuestionsPerPage[] = [25, 50];

export const DEFAULT_CONFIG: QuizConfig = {
  wordbook: DEFAULT_WORDBOOK_ID,
  from: 1,
  to: 300,
  count: 50,
  questionsPerPage: 50,
  mode: "en-ja",
  seed: 1,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function normalizeConfig(input: Partial<QuizConfig>): QuizConfig {
  const book = availableWordbook(input.wordbook);
  const firstId = firstIdFor();
  const lastId = lastIdFor(book.id);
  // Keep the typed order (e.g. 300–1). List/draw code already treats the span
  // as min..max, so we must not swap the displayed bounds here.
  const from = clamp(Math.round(input.from ?? DEFAULT_CONFIG.from), firstId, lastId);
  const to = clamp(Math.round(input.to ?? DEFAULT_CONFIG.to), firstId, lastId);
  const available = countInRange(book.id, from, to);
  return {
    wordbook: book.id,
    from,
    to,
    // 問題数 is the whole draw, so the range itself is the only ceiling.
    count: clamp(Math.round(input.count ?? DEFAULT_CONFIG.count), 1, available),
    questionsPerPage: input.questionsPerPage === 25 ? 25 : 50,
    mode: input.mode === "ja-en" ? "ja-en" : "en-ja",
    seed: (input.seed ?? DEFAULT_CONFIG.seed) >>> 0,
  };
}

export function encodeConfig(config: QuizConfig): string {
  return new URLSearchParams({
    book: config.wordbook,
    from: String(config.from),
    to: String(config.to),
    count: String(config.count),
    questionsPerPage: String(config.questionsPerPage),
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
    wordbook: availableWordbook(params?.get("book")).id,
    from: num("from"),
    to: num("to"),
    count: num("count"),
    questionsPerPage: num("questionsPerPage") === 25 ? 25 : 50,
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
  return {
    no,
    word,
    prompt: mode === "en-ja" ? word.en : word.ja,
    answer: mode === "en-ja" ? word.ja : word.en,
  };
}

export function setCount(config: QuizConfig): number {
  return Math.max(1, Math.ceil(config.count / config.questionsPerPage));
}

/** Draws every question at once, then cuts the list into one 組 per sheet. */
export function buildSets(config: QuizConfig): QuizSet[] {
  const pool = wordsInRange(config.wordbook, config.from, config.to);
  const rng = mulberry32(config.seed);
  const picked = sample(pool, config.count, rng);
  return Array.from({ length: setCount(config) }, (_, index) => ({
    index,
    questions: picked
      .slice(
        index * config.questionsPerPage,
        (index + 1) * config.questionsPerPage,
      )
      .map((word, i) =>
        toQuestion(word, config.mode, index * config.questionsPerPage + i + 1),
      ),
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

/** Paper comes out as every 問題 sheet first, then every 答え sheet. */
export function sortForPrint(sheets: SheetSpec[]): SheetSpec[] {
  return sheets
    .slice()
    .sort(
      (a, b) =>
        SHEET_KINDS.indexOf(a.kind) - SHEET_KINDS.indexOf(b.kind) || a.setIndex - b.setIndex,
    );
}

export function rangeLabel(config: QuizConfig): string {
  const low = Math.min(config.from, config.to);
  const high = Math.max(config.from, config.to);
  return `${low}-${high}`;
}

export function modeLabel(mode: QuizMode): string {
  return mode === "en-ja" ? "ENから日本語" : "日本語からEN";
}
