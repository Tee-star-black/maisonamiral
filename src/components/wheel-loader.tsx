import styles from "./wheel-loader.module.css";

export function WheelLoader({ label = "Loading", compact = false }: { label?: string; compact?: boolean }) {
  return <span className={compact ? styles.compact : styles.wrapper} role="status" aria-label={label}>
    <svg className={styles.wheel} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="32" cy="32" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      {Array.from({ length: 8 }, (_, i) => <line key={i} x1="32" y1="9" x2="32" y2="24" transform={`rotate(${i * 45} 32 32)`} stroke="currentColor" strokeWidth="3" strokeLinecap="round" />)}
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </svg>
    {!compact && <span className={styles.label}>{label}</span>}
  </span>;
}
