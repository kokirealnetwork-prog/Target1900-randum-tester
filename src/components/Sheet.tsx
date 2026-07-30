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

function columnsOf(questions: QuizQuestion[]): QuizQuestion[][] {
  const perColumn = Math.max(1, Math.ceil(questions.length / COLUMNS_PER_PAGE));
  return Array.from({ length: COLUMNS_PER_PAGE }, (_, i) =>
    questions.slice(i * perColumn, (i + 1) * perColumn),
  );
}

export function Sheet({ sheet, config }: { sheet: SheetSpec; config: QuizConfig }) {
  const showAnswers = sheet.kind === "answer";
  const columns = columnsOf(sheet.questions);

  return (
    <div className={styles.sheet}>
      <div className={styles.header}>
        <div className={styles.legend}>
          <span className={`${styles.legendItem} ${showAnswers ? "" : styles.legendItemActive}`}>
            問題
          </span>
          <span className={`${styles.legendItem} ${showAnswers ? styles.legendItemActive : ""}`}>
            答え
          </span>
        </div>

        <div className={styles.title}>
          <span className={styles.range}>{rangeLabel(config)}</span>
          <span className={styles.count}>
            {config.count}
            <span className={styles.countUnit}>問</span>
          </span>
        </div>

        <div className={styles.pageNo}>
          <span className={styles.pageNoMain}>
            <span className={styles.pageNoValue}>{sheet.sheetNo}</span>
            <span className={styles.pageNoUnit}>枚目</span>
          </span>
          <span className={styles.pageNoTotal}>/ {sheet.sheetTotal}</span>
        </div>
      </div>

      <div className={styles.body}>
        {columns.map((column, columnIndex) => (
          <div className={styles.column} key={columnIndex}>
            {column.map((question) => (
              <div className={styles.row} key={question.no}>
                <span className={styles.rowNo}>{question.no}</span>
                <div className={styles.box}>
                  <div className={styles.cell}>
                    <span
                      className={styles.cellText}
                      style={{ fontSize: fitFontSize(question.prompt) }}
                    >
                      {question.prompt}
                    </span>
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

      <div className={styles.footer}>Target 1900 randum tester</div>
    </div>
  );
}
