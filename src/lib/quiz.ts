import { mulberry32, sample } from "./random";
import { FIRST_ID, LAST_ID, countInRange, primaryMeaning, wordsInRange, type Word } from "./words";

/** `en-ja` shows the English word and asks for the meaning (Aあ). */
export type QuizMode = "en-ja" | "ja-en";

export type QuizConfig = {
  from: number;
  to: number;
  /** Questions per set. */
  count: number;
  /** How many differently shuffled versions of the test to build. */
  sets: number;
  mode: QuizMode;
  seed: number;
};

export const ROWS_PER_COLUMN = 14;
export const COLUMNS_PER_PAGE = 2;
export const QUESTIONS_PER_PAGE = ROWS_PER_COLUMN * COLUMNS_PER_PAGE;
export const MAX_COUNT = 200;
export const MAX_SETS = 10;

export const DEFAULT_CONFIG: QuizConfig = {
  from: 1,
  to: 300,
  count: 20,
  sets: 3,
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
    sets: clamp(Math.round(input.sets ?? DEFAULT_CONFIG.sets), 1, MAX_SETS),
    mode: input.mode === "ja-en" ? "ja-en" : "en-ja",
    seed: (input.seed ?? DEFAULT_CONFIG.seed) >>> 0,
  };
}

export function encodeConfig(config: QuizConfig): string {
  return new URLSearchParams({
    from: String(config.from),
    to: String(config.to),
    count: String(config.count),
    sets: String(config.sets),
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
    sets: num("sets"),
    mode: params?.get("mode") === "ja-en" ? "ja-en" : "en-ja",
    seed: num("seed"),
  });
}

export type QuizQuestion = {
  /** Position within its set, 1-based. */
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

export function buildSet(config: QuizConfig, setIndex: number): QuizSet {
  const pool = wordsInRange(config.from, config.to);
  const rng = mulberry32((config.seed + setIndex * 0x9e3779b9) >>> 0);
  const picked = sample(pool, config.count, rng);
  return {
    index: setIndex,
    questions: picked.map((word, i) => {
      const meaning = primaryMeaning(word);
      return {
        no: i + 1,
        word,
        prompt: config.mode === "en-ja" ? word.en : meaning,
        answer: config.mode === "en-ja" ? meaning : word.en,
      };
    }),
  };
}

export function buildSets(config: QuizConfig): QuizSet[] {
  return Array.from({ length: config.sets }, (_, i) => buildSet(config, i));
}

/**
 * Splits a set across A4 pages, spreading questions evenly so the last page is
 * never left with a lone row.
 */
export function paginate(questions: QuizQuestion[]): QuizQuestion[][] {
  const pageCount = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE));
  const perPage = Math.ceil(questions.length / pageCount);
  return Array.from({ length: pageCount }, (_, i) => questions.slice(i * perPage, (i + 1) * perPage));
}

/** Splits one page's questions into the two printed columns. */
export function splitColumns(questions: QuizQuestion[]): QuizQuestion[][] {
  const perColumn = Math.ceil(questions.length / COLUMNS_PER_PAGE);
  return Array.from({ length: COLUMNS_PER_PAGE }, (_, i) =>
    questions.slice(i * perColumn, (i + 1) * perColumn),
  ).filter((column) => column.length > 0);
}

export type SheetKind = "question" | "answer";

export type SheetSpec = {
  key: string;
  kind: SheetKind;
  /** 0-based set index. */
  setIndex: number;
  pageInSet: number;
  pagesInSet: number;
  /** 1-based position among all sheets of the same kind. */
  sheetNo: number;
  sheetTotal: number;
  questions: QuizQuestion[];
};

export const SHEET_KINDS: SheetKind[] = ["question", "answer"];

export type SheetSelection = {
  kinds?: SheetKind[];
  /** 0-based set indexes to include; omit for every set. */
  setIndexes?: number[];
};

/** Sheets of the same kind are numbered continuously across the included sets. */
export function buildSheets(config: QuizConfig, selection: SheetSelection = {}): SheetSpec[] {
  const kinds = selection.kinds ?? SHEET_KINDS;
  const sets = buildSets(config).filter(
    (set) => !selection.setIndexes || selection.setIndexes.includes(set.index),
  );
  const sheets: SheetSpec[] = [];
  for (const kind of SHEET_KINDS) {
    if (!kinds.includes(kind)) continue;
    const pagesOfKind: Omit<SheetSpec, "sheetNo" | "sheetTotal">[] = [];
    for (const set of sets) {
      const pages = paginate(set.questions);
      pages.forEach((questions, i) => {
        pagesOfKind.push({
          key: `${kind}-${set.index}-${i}`,
          kind,
          setIndex: set.index,
          pageInSet: i + 1,
          pagesInSet: pages.length,
          questions,
        });
      });
    }
    pagesOfKind.forEach((page, i) => {
      sheets.push({ ...page, sheetNo: i + 1, sheetTotal: pagesOfKind.length });
    });
  }
  return sheets;
}

/** Groups sheets so one set's question and answer pages stay together. */
export function groupBySet(sheets: SheetSpec[]): { setIndex: number; sheets: SheetSpec[] }[] {
  const groups = new Map<number, SheetSpec[]>();
  for (const sheet of sheets) {
    const existing = groups.get(sheet.setIndex);
    if (existing) existing.push(sheet);
    else groups.set(sheet.setIndex, [sheet]);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([setIndex, list]) => ({ setIndex, sheets: list }));
}

export function rangeLabel(config: QuizConfig): string {
  return `${config.from}－${config.to}`;
}

export function modeLabel(mode: QuizMode): string {
  return mode === "en-ja" ? "Aあ" : "あA";
}
