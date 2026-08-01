import styles from "./MixedLabel.module.css";

const NUMBER_PART = /^\d+$/;

/**
 * Marks standalone digit runs for tabular Google Sans Flex. Japanese already
 * falls through to Noto Sans JP via the root stack. Do not use for word data:
 * digits inside an English word should stay with the surrounding Latin face.
 */
export function MixedLabel({ text }: { text: string }) {
  return text.split(/(\d+)/).map((part, index) =>
    NUMBER_PART.test(part) ? (
      <span className={styles.number} key={`${part}-${index}`}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}
