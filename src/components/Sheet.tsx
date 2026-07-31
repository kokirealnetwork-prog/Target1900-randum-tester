import Image from "next/image";
import {
  COLUMNS_PER_PAGE,
  rangeLabel,
  type QuizConfig,
  type QuizQuestion,
  type SheetSpec,
} from "@/lib/quiz";
import styles from "./Sheet.module.css";

/**
 * Cells are ~35mm wide, so long entries (e.g. 「（人）に（～を）警告［注意］する（of / against）」)
 * need a smaller face to stay inside two lines.
 */
function fitFontSize(text: string): string {
  const width = [...text].reduce((sum, char) => sum + (/[\x20-\x7e]/.test(char) ? 0.55 : 1), 0);
  if (width <= 9) return "10.5pt";
  if (width <= 12) return "9.5pt";
  if (width <= 16) return "8.5pt";
  if (width <= 22) return "7.5pt";
  return "6.5pt";
}

function columnsOf(
  questions: QuizQuestion[],
  questionsPerPage: QuizConfig["questionsPerPage"],
): QuizQuestion[][] {
  // Keep the column boundary tied to the selected paper layout, not to the
  // number of questions left on the final sheet. This makes a partial sheet
  // use the same row size and alignment as a full one.
  const perColumn = Math.ceil(questionsPerPage / COLUMNS_PER_PAGE);
  return Array.from({ length: COLUMNS_PER_PAGE }, (_, i) =>
    questions.slice(i * perColumn, (i + 1) * perColumn),
  );
}

export function Sheet({ sheet, config }: { sheet: SheetSpec; config: QuizConfig }) {
  const showAnswers = sheet.kind === "answer";
  const columns = columnsOf(sheet.questions, config.questionsPerPage);

  return (
    <div
      className={`${styles.sheet} ${
        config.questionsPerPage === 50 ? styles.sheetDense : ""
      }`}
    >
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.range}>{rangeLabel(config)}</span>
          <span className={styles.count}>
            <span className={styles.countNumber}>{config.count}</span>
            <span className={styles.countUnit}>問</span>
          </span>
        </div>

        <div className={styles.brand}>
          <Image
            src="/brand-yikes-stacked.svg"
            alt="tango randum tester"
            width={85}
            height={26}
          />
        </div>

        <div className={`${styles.legend} ${showAnswers ? styles.legendAnswer : ""}`}>
          {showAnswers ? "答え" : "問題"}
        </div>

        <div className={styles.pageNo}>
          <span className={styles.pageNoValue}>{sheet.setIndex + 1}</span>
          <span className={styles.pageNoTotal}>/ {sheet.setTotal}</span>
        </div>
      </div>

      <div className={styles.body}>
        {columns.map((column, columnIndex) => (
          <div className={styles.column} key={columnIndex}>
            {column.map((question) => (
              <div className={styles.row} key={question.no}>
                <span className={styles.rowNo}>{question.no}</span>
                <div className={styles.box}>
                  <div className={`${styles.cell} ${styles.cellPrompt}`}>
                    <span
                      className={styles.cellText}
                      style={{ fontSize: fitFontSize(question.prompt) }}
                    >
                      {question.prompt}
                    </span>
                    <span className={styles.wordId}>{question.word.id}</span>
                  </div>
                  <div className={`${styles.cell} ${styles.cellAnswer}`}>
                    {showAnswers ? (
                      <span
                        className={styles.cellText}
                        style={{ fontSize: fitFontSize(question.answer) }}
                      >
                        {question.answer}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
