// ターゲット1900.xlsx -> src/data/target1900.json
// Run with: npm run build:words
//
// The output is a compact [english, meaning] pair per entry; the array index
// plus one is the word number. Meanings are trimmed down here so the app never
// has to re-derive them at render time.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(root, "ターゲット1900.xlsx");
const OUTPUT = resolve(root, "src/data/target1900.json");

const workbook = XLSX.read(readFileSync(SOURCE));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

/**
 * Excel coerces bare "false"/"true" cells into booleans, which turns entry 292
 * ("false") into a JS boolean on the way in.
 */
const toText = (value) => {
  if (typeof value === "boolean") return value ? "true" : "false";
  // Excel sometimes inserts NBSP (U+A0) inside compounds such as「必需食品」.
  return String(value ?? "")
    .replace(/\u00a0/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const NESTED = "(?:[^（）]|（[^（）]*）)*";
/** Cross references such as （⇔ decrease ⇒ 223） that only make sense in the book. */
const CROSS_REFERENCE = new RegExp(`（${NESTED}[⇔⇒≒＝]${NESTED}）`, "g");
const USAGE_NOTE = /〔[^〕]*〕/g;
const LABEL = /【[^】]*】/g;

const OPENERS = "（〔【［";
const CLOSERS = "）〕】］";

/**
 * Splits on the first "；" that is not inside brackets. Entries such as
 * 「（～に；...するのに）十分な（for；to do）」 use the separator inside a
 * parenthetical, and a naive split would cut them in half.
 */
function firstSenseOf(meaning) {
  let depth = 0;
  for (let i = 0; i < meaning.length; i += 1) {
    const char = meaning[i];
    if (OPENERS.includes(char)) depth += 1;
    else if (CLOSERS.includes(char)) depth = Math.max(0, depth - 1);
    else if (char === "；" && depth === 0) return meaning.slice(0, i);
  }
  return meaning;
}

/**
 * The book lists every sense separated by "；", which is far too long for a test
 * row. Keep the first sense and drop book-only annotations.
 */
function primaryMeaning(meaning) {
  const firstSense = firstSenseOf(meaning);
  const trimmed = firstSense
    .replace(CROSS_REFERENCE, "")
    .replace(USAGE_NOTE, "")
    .replace(LABEL, "")
    .replace(/\s+/g, " ")
    .trim();
  return trimmed || firstSense.trim();
}

const entries = [];
for (const row of rows) {
  const [, id, word, meaning] = row;
  if (typeof id !== "number") continue; // header row
  const en = toText(word);
  const ja = primaryMeaning(toText(meaning));
  if (!en || !ja) throw new Error(`Incomplete row at id ${id}`);
  entries.push({ id, pair: [en, ja] });
}

entries.sort((a, b) => a.id - b.id);

for (const [index, entry] of entries.entries()) {
  if (entry.id !== index + 1) {
    throw new Error(`Expected a gapless 1..N id sequence, got ${entry.id} at position ${index + 1}`);
  }
}

const json = `[\n${entries.map((entry) => JSON.stringify(entry.pair)).join(",\n")}\n]\n`;

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, json, "utf8");

console.log(`Wrote ${entries.length} words to ${OUTPUT}`);
