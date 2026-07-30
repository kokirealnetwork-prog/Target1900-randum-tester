"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NumberPill } from "@/components/NumberPill";
import { PencilIcon } from "@/components/icons";
import {
  encodeConfig,
  normalizeConfig,
  toQuestion,
  type QuizConfig,
  type QuizMode,
} from "@/lib/quiz";
import { FIRST_ID, LAST_ID, countInRange, wordsInRange } from "@/lib/words";
import styles from "./HomeClient.module.css";

const MODE_OPTIONS: { mode: QuizMode; label: string }[] = [
  { mode: "ja-en", label: "あA" },
  { mode: "en-ja", label: "Aあ" },
];

export function HomeClient({ initialConfig }: { initialConfig: QuizConfig }) {
  /**
   * Kept unclamped on purpose: narrowing the range temporarily caps the question
   * count, and widening it again restores what the user actually asked for.
   */
  const [draft, setDraft] = useState<QuizConfig>(initialConfig);
  const config = useMemo(() => normalizeConfig(draft), [draft]);

  // The list is the plain word list for the chosen range, in book order.
  const words = useMemo(() => wordsInRange(config.from, config.to), [config.from, config.to]);
  const available = countInRange(config.from, config.to);
  const update = (patch: Partial<QuizConfig>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <main className={`${styles.page} screen-only`}>
      <div className={styles.shell}>
        <section className={styles.panel}>
          <h1 className={styles.brand}>Target 1900 randum tester</h1>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>範囲</span>
            <div className={styles.rangeRow}>
              <NumberPill
                label="範囲の始め"
                value={config.from}
                min={FIRST_ID}
                max={LAST_ID}
                onChange={(from) => update({ from })}
              />
              <span className={styles.connector} aria-hidden="true">
                <span className={styles.connectorLine} />
                <span className={styles.connectorDot} />
              </span>
              <NumberPill
                label="範囲の終わり"
                value={config.to}
                min={FIRST_ID}
                max={LAST_ID}
                onChange={(to) => update({ to })}
              />
            </div>
          </div>

          <div className={`${styles.field} ${styles.duo}`}>
            <div>
              <span className={styles.fieldLabel}>問題数</span>
              <NumberPill
                label="問題数"
                value={config.count}
                min={1}
                max={available}
                onChange={(count) => update({ count })}
              />
            </div>
            <div>
              <span className={styles.fieldLabel}>形式</span>
              <div className={styles.toggle} role="group" aria-label="形式">
                {MODE_OPTIONS.map((option) => (
                  <button
                    key={option.mode}
                    type="button"
                    className={`${styles.toggleOption} ${
                      config.mode === option.mode ? styles.toggleOptionActive : ""
                    }`}
                    aria-pressed={config.mode === option.mode}
                    onClick={() => update({ mode: option.mode })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className={styles.listHeader}>
          <span />
          <span className={styles.listHeaderCell}>問題</span>
          <span className={styles.listHeaderCell}>答え</span>
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
          <PencilIcon />
          <span>テストを作成</span>
        </Link>
      </div>
    </main>
  );
}
