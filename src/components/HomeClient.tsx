"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NumberPill } from "@/components/NumberPill";
import { PencilIcon, ShuffleIcon } from "@/components/icons";
import {
  MAX_COUNT,
  MAX_SETS,
  buildSet,
  encodeConfig,
  normalizeConfig,
  type QuizConfig,
  type QuizMode,
} from "@/lib/quiz";
import { randomSeed } from "@/lib/random";
import { FIRST_ID, LAST_ID, countInRange } from "@/lib/words";
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

  const available = countInRange(config.from, config.to);
  const preview = useMemo(() => buildSet(config, 0), [config]);
  const update = (patch: Partial<QuizConfig>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <main className={`${styles.page} screen-only`}>
      <div className={styles.shell}>
        <section className={styles.panel}>
          <h1 className={styles.brand}>Target 1900 randum tester</h1>

          <div className={styles.field}>
            <span className={`${styles.fieldLabel} jp`}>範囲</span>
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
              <span className={`${styles.fieldLabel} jp`}>問題数</span>
              <NumberPill
                label="問題数"
                value={config.count}
                min={1}
                max={Math.min(MAX_COUNT, available)}
                onChange={(count) => update({ count })}
              />
            </div>
            <div>
              <span className={`${styles.fieldLabel} jp`}>組数</span>
              <NumberPill
                label="組数"
                value={config.sets}
                min={1}
                max={MAX_SETS}
                onChange={(sets) => update({ sets })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <span className={`${styles.fieldLabel} jp`}>形式</span>
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
            <p className={`${styles.hint} jp`}>
              {config.mode === "en-ja" ? "英語を見て意味を書く" : "意味を見て英語を書く"}・
              {available}語からランダム
            </p>
          </div>
        </section>

        <div className={styles.listHeader}>
          <span className={`${styles.setBadge} jp`}>{config.sets > 1 ? "1組目" : ""}</span>
          <span className={`${styles.listHeaderCell} jp`}>問題</span>
          <span className={`${styles.listHeaderCell} jp`}>答え</span>
          <button
            type="button"
            className={styles.shuffleButton}
            aria-label="出題し直す"
            onClick={() => update({ seed: randomSeed() })}
          >
            <ShuffleIcon />
          </button>
        </div>

        <ol className={styles.list}>
          {preview.questions.map((question) => (
            <li className={styles.row} key={question.no}>
              <span className={styles.rowNo}>{question.no}</span>
              <span className={`${styles.rowPrompt} jp`}>{question.prompt}</span>
              <span className={`${styles.rowAnswer} jp`}>{question.answer}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.floatingBar}>
        <Link className={styles.primaryButton} href={`/print?${encodeConfig(config)}`}>
          <PencilIcon />
          <span className="jp">テストを作成</span>
        </Link>
      </div>
    </main>
  );
}
