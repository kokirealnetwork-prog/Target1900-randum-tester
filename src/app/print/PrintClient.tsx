"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { NumberPill } from "@/components/NumberPill";
import { Sheet } from "@/components/Sheet";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  PrinterIcon,
  ResetIcon,
} from "@/components/icons";
import { SheetThumbnail } from "./SheetThumbnail";
import {
  QUESTIONS_PER_PAGE_OPTIONS,
  buildSheets,
  encodeConfig,
  modeLabel,
  normalizeConfig,
  rangeLabel,
  setCount,
  sortForPrint,
  type QuizConfig,
  type SheetKind,
} from "@/lib/quiz";
import { randomSeed } from "@/lib/random";
import { countInRange } from "@/lib/words";
import styles from "./print.module.css";

const KIND_LABELS: { kind: SheetKind; label: string }[] = [
  { kind: "question", label: "問題" },
  { kind: "answer", label: "答え" },
];

/** 210mm in CSS pixels, used to scale a full sheet down into a thumbnail. */
const A4_WIDTH_PX = (210 * 96) / 25.4;

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function PrintClient({ config }: { config: QuizConfig }) {
  const [draftConfig, setDraftConfig] = useState(config);
  const currentConfig = useMemo(() => normalizeConfig(draftConfig), [draftConfig]);
  const [activeKinds, setActiveKinds] = useState<SheetKind[]>(["question", "answer"]);
  const [previewKind, setPreviewKind] = useState<SheetKind>("question");
  const [preparingPdf, setPreparingPdf] = useState(false);
  const total = setCount(currentConfig);
  const available = countInRange(currentConfig.from, currentConfig.to);

  const orderedKinds = useMemo(
    () => KIND_LABELS.map((entry) => entry.kind).filter((kind) => activeKinds.includes(kind)),
    [activeKinds],
  );

  const allSheets = useMemo(
    () => buildSheets(currentConfig),
    [currentConfig],
  );
  const printSheets = useMemo(
    () => sortForPrint(allSheets.filter((sheet) => orderedKinds.includes(sheet.kind))),
    [allSheets, orderedKinds],
  );

  // The new preview uses one large A4 sheet per row.
  const setsRef = useRef<HTMLDivElement>(null);
  const printRootRef = useRef<HTMLDivElement>(null);
  const [thumbScale, setThumbScale] = useState(0.6);
  useEffect(() => {
    const element = setsRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width > 0) setThumbScale(width / A4_WIDTH_PX);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const updateConfig = (patch: Partial<QuizConfig>) =>
    setDraftConfig((current) => ({ ...current, ...patch }));

  const handlePrint = async () => {
    if (!isIOSDevice()) {
      window.print();
      return;
    }

    // iOS WebKit can insert blank pages while printing HTML. Build a PDF with
    // one image per selected sheet so the page count is fixed before AirPrint.
    const pdfWindow = window.open("", "_blank");
    if (!pdfWindow) {
      window.alert("PDFを開けませんでした。ポップアップを許可して、もう一度お試しください。");
      return;
    }

    pdfWindow.document.title = "PDFを作成中";
    pdfWindow.document.body.innerHTML =
      '<p style="font-family:system-ui,sans-serif;padding:24px">印刷用PDFを作成しています…</p>';

    const printRoot = printRootRef.current;
    if (!printRoot) {
      pdfWindow.close();
      return;
    }

    setPreparingPdf(true);
    printRoot.classList.add(styles.pdfRendering);

    try {
      await document.fonts.ready;
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const pages = Array.from(
        printRoot.querySelectorAll<HTMLElement>(`.${styles.printPage}`),
      );
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await html2canvas(pages[index], {
          backgroundColor: "#ffffff",
          logging: false,
          scale: 2,
          useCORS: true,
        });
        if (index > 0) pdf.addPage("a4", "portrait");
        pdf.addImage(canvas, "JPEG", 0, 0, 210, 297, undefined, "FAST");
        canvas.width = 1;
        canvas.height = 1;
      }

      const pdfUrl = URL.createObjectURL(pdf.output("blob"));
      pdfWindow.location.replace(pdfUrl);
      window.addEventListener("beforeunload", () => URL.revokeObjectURL(pdfUrl), {
        once: true,
      });
    } catch (error) {
      console.error("Failed to create print PDF", error);
      pdfWindow.close();
      window.alert("PDFの作成に失敗しました。もう一度お試しください。");
    } finally {
      printRoot.classList.remove(styles.pdfRendering);
      setPreparingPdf(false);
    }
  };

  const toggleKind = (kind: SheetKind) =>
    setActiveKinds((current) =>
      current.includes(kind)
        ? current.length > 1
          ? current.filter((item) => item !== kind)
          : current
        : [...current, kind],
    );

  return (
    <>
      <main className={`${styles.page} screen-only`}>
        <div className={styles.shell}>
          <section className={styles.panel}>
            <div className={styles.topBar}>
              <Link
                className={styles.backButton}
                href={`/?${encodeConfig(currentConfig)}`}
                aria-label="戻る"
              >
                <ChevronLeftIcon />
              </Link>
              <h1 className={styles.title}>
                <span>{rangeLabel(currentConfig)}</span>
                <span className={styles.titleMode}>{modeLabel(currentConfig.mode)}</span>
              </h1>
              <span />
            </div>

            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>ランダム抽出</span>
              <div className={styles.countControl}>
                <div className={styles.countPill}>
                  <NumberPill
                    label="ランダム抽出する問題数"
                    value={currentConfig.count}
                    min={1}
                    max={available}
                    onChange={(count) => updateConfig({ count })}
                  />
                </div>
                <span className={styles.availableCount}>/{available}</span>
              </div>
              <button
                type="button"
                className={styles.resetButton}
                aria-label="ランダム抽出をリセット"
                onClick={() => updateConfig({ seed: randomSeed() })}
              >
                <ResetIcon />
              </button>
            </div>

            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>1ページあたりの問題数</span>
              <div className={styles.pageSizeToggle} role="group" aria-label="1ページあたりの問題数">
                <span
                  className={`${styles.pageSizeIndicator} ${
                    currentConfig.questionsPerPage === 50
                      ? styles.pageSizeIndicatorSecond
                      : ""
                  }`}
                  aria-hidden="true"
                />
                {QUESTIONS_PER_PAGE_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.pageSizeOption} ${
                      currentConfig.questionsPerPage === value
                        ? styles.pageSizeOptionActive
                        : ""
                    }`}
                    aria-pressed={currentConfig.questionsPerPage === value}
                    onClick={() => updateConfig({ questionsPerPage: value })}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.summary}>
              <span className={styles.paper}>A4</span>
              <span className={styles.counts}>
                <span>
                  <span className={styles.countValue}>{total}</span>セット
                </span>
                <span>
                  <span className={styles.countValue}>{printSheets.length}</span>枚
                </span>
              </span>
            </div>
          </section>

          <div className={styles.sets} ref={setsRef}>
            {Array.from({ length: total }, (_, setIndex) => {
              const previewSheet = allSheets.find(
                (sheet) => sheet.setIndex === setIndex && sheet.kind === previewKind,
              );
              if (!previewSheet) return null;
              return (
                <section key={setIndex} className={styles.set}>
                  <div className={styles.setHeader}>
                    <span className={styles.setNumber}>{setIndex + 1}</span>
                    <span className={styles.setTotal}>/ {total}</span>
                    <div className={styles.previewKindToggle} role="group" aria-label="プレビュー">
                      {KIND_LABELS.map(({ kind, label }) => (
                        <button
                          key={kind}
                          type="button"
                          className={`${styles.previewKindOption} ${
                            previewKind === kind ? styles.previewKindOptionActive : ""
                          }`}
                          aria-pressed={previewKind === kind}
                          onClick={() => setPreviewKind(kind)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.thumbs}>
                    <SheetThumbnail
                      key={previewSheet.key}
                      sheet={previewSheet}
                      config={currentConfig}
                      scale={thumbScale}
                    />
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className={styles.floatingBar}>
          <div className={styles.floatingInner}>
            <div className={styles.kindControls}>
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
            <button
              type="button"
              className={styles.primaryButton}
              disabled={printSheets.length === 0 || preparingPdf}
              onClick={handlePrint}
            >
              <PrinterIcon />
              <span>{preparingPdf ? "PDF作成中…" : "印刷"}</span>
            </button>
          </div>
        </div>
      </main>

      <div className={styles.printRoot} aria-hidden="true" ref={printRootRef}>
        {printSheets.map((sheet) => (
          <div className={styles.printPage} key={sheet.key}>
            <Sheet sheet={sheet} config={currentConfig} />
          </div>
        ))}
      </div>
    </>
  );
}
