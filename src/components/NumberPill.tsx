"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./NumberPill.module.css";

type NumberPillProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
};

/**
 * Blue pill that behaves like a number field: free typing while focused, and a
 * clamped commit on blur so the value can never leave [min, max].
 */
export function NumberPill({ value, min, max, onChange, label }: NumberPillProps) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    const next = Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : value;
    setText(String(next));
    onChange(next);
  };

  return (
    <input
      className={styles.pill}
      type="number"
      inputMode="numeric"
      aria-label={label}
      value={text}
      min={min}
      max={max}
      onFocus={(event) => {
        focused.current = true;
        event.currentTarget.select();
      }}
      onChange={(event) => {
        setText(event.target.value);
        const parsed = Number.parseInt(event.target.value, 10);
        if (Number.isFinite(parsed) && parsed >= min && parsed <= max) onChange(parsed);
      }}
      onBlur={(event) => {
        focused.current = false;
        commit(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}
