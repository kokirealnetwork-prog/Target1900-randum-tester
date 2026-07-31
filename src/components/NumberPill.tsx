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
 * Blue pill number field. Keeps free typing in local state while focused, and
 * only clamps + commits on blur / Enter — otherwise typing "1000" would commit
 * "1" midway and flip the range to 1–1.
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
    if (next !== value) onChange(next);
  };

  return (
    <input
      className={styles.pill}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      aria-label={label}
      value={text}
      onFocus={(event) => {
        focused.current = true;
        event.currentTarget.select();
      }}
      onChange={(event) => {
        // Digits only; empty is allowed while typing so the field can be cleared.
        const next = event.target.value.replace(/\D/g, "");
        setText(next);
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
