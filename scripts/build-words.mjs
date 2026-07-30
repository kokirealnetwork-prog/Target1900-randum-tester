// ターゲット1900.xlsx -> src/data/target1900.json
// Run with: npm run build:words

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
  return String(value ?? "").trim();
};

const words = [];
for (const row of rows) {
  const [, id, word, meaning] = row;
  if (typeof id !== "number") continue; // header row
  const en = toText(word);
  const ja = toText(meaning);
  if (!en || !ja) throw new Error(`Incomplete row at id ${id}`);
  words.push({ id, en, ja, isNew: toText(row[0]) === "新" });
}

words.sort((a, b) => a.id - b.id);

for (const [index, entry] of words.entries()) {
  if (entry.id !== index + 1) {
    throw new Error(`Expected a gapless 1..N id sequence, got ${entry.id} at position ${index + 1}`);
  }
}

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(words, null, 0)}\n`, "utf8");

console.log(`Wrote ${words.length} words to ${OUTPUT}`);
