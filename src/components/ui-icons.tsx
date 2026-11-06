const iconStyle = {
  display: "inline-block",
  verticalAlign: "-0.125em",
  flexShrink: 0,
} as const;

const rotations = { right: 0, "up-right": -45, left: 180, up: -90, down: 90 };

/** Decorative vector arrows stay monochrome on every platform. */
export function ArrowIcon({ direction = "right" }: { direction?: keyof typeof rotations }) {
  return (
    <svg data-icon="arrow" width="1em" height="1em" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false" style={iconStyle}>
      <path d="M4 12h16m-7-7 7 7-7 7" transform={`rotate(${rotations[direction]} 12 12)`} />
    </svg>
  );
}

export function PlaybackIcon({ paused }: { paused: boolean }) {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"
      aria-hidden="true" focusable="false" style={iconStyle}>
      {paused ? <path d="m7 4 14 8-14 8Z" /> : <path d="M6 4h4v16H6zm8 0h4v16h-4z" />}
    </svg>
  );
}
