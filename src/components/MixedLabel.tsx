import styles from "./MixedLabel.module.css";

const NUMBER_PART = /^\d+$/;

/**
 * Keeps Japanese and Latin text in Gen Interface JP while assigning only
 * standalone digit runs to Google Sans Flex. Do not use this for word data:
 * digits that are part of an English word must stay in Inter.
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
