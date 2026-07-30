type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PencilIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...base}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function PrinterIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...base}>
      <path d="M7 9V4h10v5" />
      <path d="M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M7 14h10v6H7z" />
    </svg>
  );
}

export function CheckCircleIcon({ className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} />
      <path
        d="M8.2 12.3l2.6 2.6 5-5.2"
        fill="none"
        stroke={filled ? "#fff" : "currentColor"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...base}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

export function ResetIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...base}>
      <path d="M4.5 9A8 8 0 0 1 18 5.5L20.5 8" />
      <path d="M20.5 4v4h-4" />
      <path d="M19.5 15A8 8 0 0 1 6 18.5L3.5 16" />
      <path d="M3.5 20v-4h4" />
    </svg>
  );
}
