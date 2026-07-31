import styles from "./MixedLabel.module.css";

const PART = /(\d+訂版|\d+)/;
const EDITION = /^\d+訂版$/;
const NUMBER_PART = /^\d+$/;

/**
 * Keeps Japanese and Latin text in Gen Interface JP while assigning only
 * standalone digit runs to Google Sans Flex. Do not use this for word data:
 * digits that are part of an English word must stay in Inter.
 *
 * Edition suffixes like "5訂版" stay on one line so "版" is never orphaned.
 */
export function MixedLabel({ text }: { text: string }) {
  return text.split(PART).map((part, index) => {
    if (!part) return null;

    if (EDITION.test(part)) {
      const digits = part.match(/^\d+/)![0];
      return (
        <span className={styles.nowrap} key={`${part}-${index}`}>
          <span className={styles.number}>{digits}</span>
          {part.slice(digits.length)}
        </span>
      );
    }

    if (NUMBER_PART.test(part)) {
      return (
        <span className={styles.number} key={`${part}-${index}`}>
          {part}
        </span>
      );
    }

    return part;
  });
}
