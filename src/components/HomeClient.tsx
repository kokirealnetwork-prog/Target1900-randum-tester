"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NumberPill } from "@/components/NumberPill";
import { DocumentIcon, UpDownChevronsIcon } from "@/components/icons";
import {
  encodeConfig,
  normalizeConfig,
  toQuestion,
  type QuizConfig,
  type QuizMode,
} from "@/lib/quiz";
import {
  WORDBOOKS,
  firstIdFor,
  getWordbook,
  lastIdFor,
  wordsInRange,
  type WordbookId,
} from "@/lib/words";
import styles from "./HomeClient.module.css";

const MODE_OPTIONS: { mode: QuizMode; label: string }[] = [
  { mode: "en-ja", label: "ENから日本語" },
  { mode: "ja-en", label: "日本語からEN" },
];

export function HomeClient({ initialConfig }: { initialConfig: QuizConfig }) {
  /**
   * Kept unclamped on purpose: narrowing the range temporarily caps the question
   * count, and widening it again restores what the user actually asked for.
   * Range bounds keep the typed order (300–1 stays 300–1 in the pills); the
   * word list always walks min..max so it still shows 1→300.
   */
  const [draft, setDraft] = useState<QuizConfig>(initialConfig);
  const config = useMemo(() => normalizeConfig(draft), [draft]);
  const firstId = firstIdFor();
  const lastId = lastIdFor(config.wordbook);

  // Book order between the two ends, regardless of which pill is larger.
  const words = useMemo(
    () => wordsInRange(config.wordbook, config.from, config.to),
    [config.wordbook, config.from, config.to],
  );
  const update = (patch: Partial<QuizConfig>) => setDraft((current) => ({ ...current, ...patch }));

  const selectWordbook = (wordbook: WordbookId) => {
    const selected = getWordbook(wordbook);
    if (!selected.available) return;
    const selectedLastId = lastIdFor(wordbook);
    const low = Math.min(config.from, config.to);
    const high = Math.max(config.from, config.to);
    const rangeFitsSelectedBook = low >= firstIdFor() && high <= selectedLastId;
    update({
      wordbook,
      from: rangeFitsSelectedBook ? config.from : firstIdFor(),
      to: rangeFitsSelectedBook ? config.to : Math.min(300, selectedLastId),
      count: rangeFitsSelectedBook ? config.count : Math.min(50, selectedLastId),
    });
  };
  const selectMode = (mode: QuizMode) => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLInputElement) activeElement.blur();
    update({ mode });
  };

  return (
    <main className={`${styles.page} screen-only`}>
      <div className={styles.shell}>
        <section className={styles.panel}>
          <h1 className={styles.brand}>
            <Image
              src="/brand-yikes.svg"
              alt="tango random tester"
              width={260}
              height={23}
              priority
            />
          </h1>

          <div className={styles.bookPicker}>
            <UpDownChevronsIcon />
            <select
              className={styles.bookSelect}
              aria-label="単語帳を選択"
              value={config.wordbook}
              onChange={(event) => selectWordbook(event.target.value as WordbookId)}
            >
              {WORDBOOKS.map((option) => (
                <option key={option.id} value={option.id} disabled={!option.available}>
                  {option.available ? option.shortLabel : `${option.shortLabel}（データ待ち）`}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>範囲</span>
            <div className={styles.rangeRow}>
              <NumberPill
                label="範囲の始め"
                value={config.from}
                min={firstId}
                max={lastId}
                onChange={(from) => update({ from })}
              />
              <span className={styles.connector} aria-hidden="true">
                <span className={styles.connectorLine} />
              </span>
              <NumberPill
                label="範囲の終わり"
                value={config.to}
                min={firstId}
                max={lastId}
                onChange={(to) => update({ to })}
              />
            </div>
          </div>

          <div className={styles.modeField}>
            <div className={styles.toggle} role="group" aria-label="出題形式">
              <span
                className={`${styles.toggleIndicator} ${
                  config.mode === "ja-en" ? styles.toggleIndicatorSecond : ""
                }`}
                aria-hidden="true"
              />
              {MODE_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  className={`${styles.toggleOption} ${
                    config.mode === option.mode ? styles.toggleOptionActive : ""
                  }`}
                  aria-pressed={config.mode === option.mode}
                  onPointerDown={(event) => {
                    if (event.pointerType !== "mouse") selectMode(option.mode);
                  }}
                  onClick={() => selectMode(option.mode)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className={styles.listHeader} aria-hidden="true">
          <span />
          <span>問題</span>
          <span>答え</span>
        </div>

        <ol className={styles.list}>
          {words.map((word) => {
            const question = toQuestion(word, config.mode, word.id);
            return (
              <li className={styles.row} key={word.id}>
                <span className={styles.rowNo}>{word.id}</span>
                <span className={styles.rowPrompt}>{question.prompt}</span>
                <span className={styles.rowAnswer}>{question.answer}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className={styles.floatingBar}>
        <Link className={styles.primaryButton} href={`/print?${encodeConfig(config)}`}>
          <DocumentIcon />
          <span>テストを作成</span>
        </Link>
      </div>
    </main>
  );
}
