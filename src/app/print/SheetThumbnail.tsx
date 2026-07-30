"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import type { QuizConfig, SheetSpec } from "@/lib/quiz";
import styles from "./print.module.css";

/**
 * A full 1900 word draw is 136 sheets, so the page content is only built once a
 * thumbnail comes near the viewport.
 */
export function SheetThumbnail({
  sheet,
  config,
  scale,
}: {
  sheet: SheetSpec;
  config: QuizConfig;
  scale: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || shown) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setShown(true);
      },
      { rootMargin: "600px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div ref={ref} className={styles.thumb} style={{ "--scale": scale } as React.CSSProperties}>
      {shown ? (
        <div className={styles.thumbInner}>
          <Sheet sheet={sheet} config={config} />
        </div>
      ) : null}
    </div>
  );
}
