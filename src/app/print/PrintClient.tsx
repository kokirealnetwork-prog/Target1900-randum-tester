"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Sheet } from "@/components/Sheet";
import { CheckCircleIcon, ChevronLeftIcon, PrinterIcon } from "@/components/icons";
import { SheetThumbnail } from "./SheetThumbnail";
import {
  buildSheets,
  encodeConfig,
  modeLabel,
  rangeLabel,
  setCount,
  sortForPrint,
  type QuizConfig,
  type SheetKind,
} from "@/lib/quiz";
import styles from "./print.module.css";

const KIND_LABELS: { kind: SheetKind; label: string }[] = [
  { kind: "question", label: "問題" },
  { kind: "answer", label: "答え" },
];

/** 210mm in CSS pixels, used to scale a full sheet down into a thumbnail. */
const A4_WIDTH_PX = (210 * 96) / 25.4;
const THUMB_GAP_PX = 12;

export function PrintClient({ config }: { config: QuizConfig }) {
  const [activeKinds, setActiveKinds] = useState<SheetKind[]>(["question", "answer"]);
  const total = setCount(config);
  const [selectedSets, setSelectedSets] = useState<number[]>(() =>
    Array.from({ length: total }, (_, i) => i),
  );
  const [printing, setPrinting] = useState(false);

  const orderedKinds = useMemo(
    () => KIND_LABELS.map((entry) => entry.kind).filter((kind) => activeKinds.includes(kind)),
    [activeKinds],
  );

  const sheets = useMemo(() => buildSheets(config, orderedKinds), [config, orderedKinds]);
  const printSheets = useMemo(
    () => sortForPrint(sheets.filter((sheet) => selectedSets.includes(sheet.setIndex))),
    [sheets, selectedSets],
  );

  // Two sheets always sit side by side, so the thumbnail scale follows the
  // column width rather than a fixed breakpoint.
  const setsRef = useRef<HTMLDivElement>(null);
  const [thumbScale, setThumbScale] = useState(0.2);
  useEffect(() => {
    const element = setsRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width > 0) setThumbScale((width - THUMB_GAP_PX) / 2 / A4_WIDTH_PX);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    return () => window.removeEventListener("afterprint", done);
  }, []);

  const handlePrint = () => {
    // Mobile browsers require window.print() to run inside the original tap.
    // Flush first so the full-resolution sheets exist before the dialog opens.
    flushSync(() => setPrinting(true));
    window.print();
  };

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
                  <CheckCircleIcon />
                  {label}
                </button>
              );
            })}
          </div>

          <div className={styles.sets} ref={setsRef}>
            {Array.from({ length: total }, (_, setIndex) => {
              const on = selectedSets.includes(setIndex);
              return (
                <section key={setIndex} className={`${styles.set} ${on ? "" : styles.setOff}`}>
                  <button
                    type="button"
                    className={`${styles.setToggle} ${on ? "" : styles.setToggleOff}`}
                    aria-pressed={on}
                    onClick={() => toggleSet(setIndex)}
                  >
                    <CheckCircleIcon filled={on} />
                    <span className={styles.setLabel}>
                      {setIndex + 1}
                      <span className={styles.setLabelUnit}>組目</span>
                    </span>
                  </button>
                  <div className={styles.thumbs}>
                    {sheets
                      .filter((sheet) => sheet.setIndex === setIndex)
                      .map((sheet) => (
                        <SheetThumbnail
                          key={sheet.key}
                          sheet={sheet}
                          config={config}
                          scale={thumbScale}
                        />
                      ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className={styles.floatingBar}>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={printSheets.length === 0}
            onClick={handlePrint}
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
