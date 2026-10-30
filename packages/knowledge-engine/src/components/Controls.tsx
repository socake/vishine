import type { SelectHTMLAttributes } from "react";
const paths = {
  locate: "M12 3v3m0 12v3M3 12h3m12 0h3M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z",
  down: "m5 9 7 7 7-7",
  right: "m9 5 7 7-7 7",
  reset: "M4 10a8 8 0 1 1 1 8M4 4v6h6",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  play: "m8 5 11 7-11 7Z",
  pause: "M8 5v14M16 5v14",
  previous: "m14 5-7 7 7 7",
  next: "m10 5 7 7-7 7",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  fit: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M9 12h6",
};
export function Icon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      className="ki-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function SelectControl(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="ki-select">
      <select {...props} />
      <Icon name="down" />
    </span>
  );
}

export function ButtonControl({
  variant = "secondary",
  size = "regular",
  busy = false,
  children,
  disabled,
  ...props
}: import("react").ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "small" | "regular";
  busy?: boolean;
}) {
  return (
    <button
      {...props}
      className={`ki-button ${props.className || ""}`}
      data-variant={variant}
      data-size={size}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
    >
      {busy && <span className="ki-busy-dot" aria-hidden="true" />}
      {children}
    </button>
  );
}
