"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { CheckCircleIcon, ChevronLeftIcon, PrinterIcon } from "@/components/icons";
import {
  buildSheets,
  encodeConfig,
  groupBySet,
  modeLabel,
  rangeLabel,
  type QuizConfig,
  type SheetKind,
} from "@/lib/quiz";
import styles from "./print.module.css";

const KIND_LABELS: { kind: SheetKind; label: string }[] = [
  { kind: "question", label: "問題" },
  { kind: "answer", label: "答え" },
];

export function PrintClient({ config }: { config: QuizConfig }) {
  const [activeKinds, setActiveKinds] = useState<SheetKind[]>(["question", "answer"]);
  const [selectedSets, setSelectedSets] = useState<number[]>(() =>
    Array.from({ length: config.sets }, (_, i) => i),
  );
  const [printing, setPrinting] = useState(false);

  const orderedKinds = useMemo(
    () => KIND_LABELS.map((entry) => entry.kind).filter((kind) => activeKinds.includes(kind)),
    [activeKinds],
  );

  const previewGroups = useMemo(
    () => groupBySet(buildSheets(config, { kinds: orderedKinds })),
    [config, orderedKinds],
  );

  const printGroups = useMemo(
    () => groupBySet(buildSheets(config, { kinds: orderedKinds, setIndexes: selectedSets })),
    [config, orderedKinds, selectedSets],
  );

  const printSheets = useMemo(() => printGroups.flatMap((group) => group.sheets), [printGroups]);

  // The full-size pages are only mounted while printing; rendering every sheet
  // twice makes large batches sluggish on phones.
  useEffect(() => {
    if (!printing) return;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
    return () => cancelAnimationFrame(frame);
  }, [printing]);

  useEffect(() => {
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    return () => window.removeEventListener("afterprint", done);
  }, []);

  const toggleKind = (kind: SheetKind) =>
    setActiveKinds((current) =>
      current.includes(kind)
        ? current.length > 1
          ? current.filter((item) => item !== kind)
          : current
        : [...current, kind],
    );

  const toggleSet = (index: number) =>
    setSelectedSets((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index].sort((a, b) => a - b),
    );

  return (
    <>
      <main className={`${styles.page} screen-only`}>
        <div className={styles.shell}>
          <section className={styles.panel}>
            <div className={styles.topBar}>
              <Link className={styles.backButton} href={`/?${encodeConfig(config)}`} aria-label="戻る">
                <ChevronLeftIcon />
              </Link>
              <h1 className={styles.title}>
                <span>{rangeLabel(config)}</span>
                <span>
                  {config.count}
                  <span className={styles.titleUnit}>問</span>
                </span>
                <span className={styles.titleMode}>{modeLabel(config.mode)}</span>
              </h1>
              <span />
            </div>

            <div className={styles.summary}>
              <span className={styles.paper}>A4</span>
              <span className={styles.counts}>
                <span>
                  <span className={styles.countValue}>{selectedSets.length}</span>組
                </span>
                <span>
                  <span className={styles.countValue}>{printSheets.length}</span>枚
                </span>
              </span>
            </div>
          </section>

          <div className={styles.kindChips}>
            {KIND_LABELS.map(({ kind, label }) => {
              const on = activeKinds.includes(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  className={`${styles.chip} ${on ? "" : styles.chipOff}`}
                  aria-pressed={on}
                  onClick={() => toggleKind(kind)}
                >
                  <CheckCircleIcon filled={false} />
                  {label}
                </button>
              );
            })}
          </div>

          <div className={styles.sets}>
            {previewGroups.map((group) => {
              const on = selectedSets.includes(group.setIndex);
              return (
                <section
                  key={group.setIndex}
                  className={`${styles.set} ${on ? "" : styles.setOff}`}
                >
                  <button
                    type="button"
                    className={`${styles.setToggle} ${on ? "" : styles.setToggleOff}`}
                    aria-pressed={on}
                    onClick={() => toggleSet(group.setIndex)}
                  >
                    <CheckCircleIcon filled={on} />
                    <span className={styles.setLabel}>
                      {group.setIndex + 1}
                      <span className={styles.setLabelUnit}>組目</span>
                    </span>
                  </button>
                  <div className={styles.thumbs}>
                    {group.sheets.map((sheet) => (
                      <div className={styles.thumb} key={sheet.key}>
                        <div className={styles.thumbInner}>
                          <Sheet sheet={sheet} config={config} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <p className={styles.note}>
            用紙 A4・余白なし・倍率100%で印刷してください。
          </p>
        </div>

        <div className={styles.floatingBar}>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={printSheets.length === 0}
            onClick={() => setPrinting(true)}
          >
            <PrinterIcon />
            <span>印刷する</span>
          </button>
        </div>
      </main>

      {printing ? (
        <div className={styles.printRoot}>
          {printSheets.map((sheet) => (
            <div className={styles.printPage} key={sheet.key}>
              <Sheet sheet={sheet} config={config} />
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
