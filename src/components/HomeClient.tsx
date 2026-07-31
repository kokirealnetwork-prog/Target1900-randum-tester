"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MixedLabel } from "@/components/MixedLabel";
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

function reloadWithConfig(config: QuizConfig) {
  window.location.replace(`/?${encodeConfig(config)}`);
}

export function HomeClient({ initialConfig }: { initialConfig: QuizConfig }) {
  /**
   * Kept unclamped on purpose: narrowing the range temporarily caps the question
   * count, and widening it again restores what the user actually asked for.
   */
  const [draft, setDraft] = useState<QuizConfig>(initialConfig);
  const config = useMemo(() => normalizeConfig(draft), [draft]);
  const [bookMenuOpen, setBookMenuOpen] = useState(false);
  const book = getWordbook(config.wordbook);
  const firstId = firstIdFor();
  const lastId = lastIdFor(config.wordbook);

  // The list is the plain word list for the chosen range, in book order.
  const words = useMemo(
    () => wordsInRange(config.wordbook, config.from, config.to),
    [config.wordbook, config.from, config.to],
  );
  const update = (patch: Partial<QuizConfig>) => setDraft((current) => ({ ...current, ...patch }));

  // URL が from > to（例: 300–1）のときは 1–300 に直して再ロードする。
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawFrom = Number(params.get("from"));
    const rawTo = Number(params.get("to"));
    if (!Number.isFinite(rawFrom) || !Number.isFinite(rawTo) || rawFrom <= rawTo) return;
    reloadWithConfig(initialConfig);
  }, [initialConfig]);

  /** 範囲を更新。逆転したら小さい方→大きい方に入れ替えて再ロードする。 */
  const applyRange = (from: number, to: number) => {
    if (from > to) {
      reloadWithConfig(normalizeConfig({ ...draft, from, to }));
      return;
    }
    update({ from, to });
  };

  const selectWordbook = (wordbook: WordbookId) => {
    const selected = getWordbook(wordbook);
    if (!selected.available) return;
    const selectedLastId = lastIdFor(wordbook);
    const rangeFitsSelectedBook = config.from >= firstIdFor() && config.to <= selectedLastId;
    update({
      wordbook,
      from: rangeFitsSelectedBook ? config.from : firstIdFor(),
      to: rangeFitsSelectedBook ? config.to : Math.min(300, selectedLastId),
      count: rangeFitsSelectedBook ? config.count : Math.min(50, selectedLastId),
    });
    setBookMenuOpen(false);
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
            <button
              type="button"
              className={styles.bookPickerButton}
              aria-haspopup="listbox"
              aria-expanded={bookMenuOpen}
              onClick={() => setBookMenuOpen((open) => !open)}
            >
              <UpDownChevronsIcon />
              <span><MixedLabel text={book.label} /></span>
            </button>
            {bookMenuOpen ? (
              <div className={styles.bookMenu} role="listbox" aria-label="単語帳を選択">
                {WORDBOOKS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={config.wordbook === option.id}
                    disabled={!option.available}
                    className={`${styles.bookMenuOption} ${
                      config.wordbook === option.id ? styles.bookMenuOptionActive : ""
                    }`}
                    onClick={() => selectWordbook(option.id)}
                  >
                    <span><MixedLabel text={option.label} /></span>
                    {!option.available ? <small>データ待ち</small> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>範囲</span>
            <div className={styles.rangeRow}>
              <NumberPill
                label="範囲の始め"
                value={config.from}
                min={firstId}
                max={lastId}
                onChange={(from) => {
                  // Pin the other end to the on-screen value so draft cannot drift
                  // away from what the pills show.
                  applyRange(from, config.to);
                }}
              />
              <span className={styles.connector} aria-hidden="true">
                <span className={styles.connectorLine} />
              </span>
              <NumberPill
                label="範囲の終わり"
                value={config.to}
                min={firstId}
                max={lastId}
                onChange={(to) => {
                  applyRange(config.from, to);
                }}
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
