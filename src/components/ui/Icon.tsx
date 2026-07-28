import type { SVGProps } from "react";

/** Conjunto de ícones inline (traço), coloridos por `currentColor`. Modular:
 *  adicione novos paths em `paths`. Evita dependência de fonte/emoji. */
export type IconName =
  | "coin"
  | "network"
  | "calendar"
  | "briefcase"
  | "users"
  | "cube"
  | "grid"
  | "wrench"
  | "close"
  | "chevron"
  | "lock"
  | "star"
  | "arrow"
  | "bolt"
  | "chart"
  | "globe"
  | "check"
  | "file"
  | "video"
  | "desk"
  | "monitor"
  | "plant"
  | "sofa"
  | "home"
  | "move";

const paths: Record<IconName, string> = {
  coin: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 4v10m-3-7h4a2 2 0 010 4h-4",
  network: "M6 8a3 3 0 100-6 3 3 0 000 6zm12 0a3 3 0 100-6 3 3 0 000 6zM12 22a3 3 0 100-6 3 3 0 000 6zM7 6l4 8m6-8l-4 8",
  calendar: "M4 5h16v16H4zM4 9h16M8 3v4m8-4v4",
  briefcase: "M3 8h18v11H3zM8 8V5h8v3",
  users: "M9 11a3 3 0 100-6 3 3 0 000 6zm7 0a3 3 0 100-6 3 3 0 000 6M3 20a5 5 0 0110 0m1 0a5 5 0 015-5",
  cube: "M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  wrench: "M14 6a4 4 0 00-5 5l-6 6 3 3 6-6a4 4 0 005-5l-3 3-3-3z",
  close: "M6 6l12 12M18 6L6 18",
  chevron: "M6 9l6 6 6-6",
  lock: "M6 11h12v9H6zM9 11V8a3 3 0 016 0v3",
  star: "M12 3l2.9 6 6.1.9-4.5 4.3 1.1 6.1L12 17.8 6.4 20.3l1.1-6.1L3 9.9 9.1 9z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  bolt: "M13 3L4 14h7l-1 7 9-11h-7z",
  chart: "M4 20V10m5 10V4m5 16v-7m5 7V8",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  check: "M5 12l5 5L20 7",
  file: "M6 3h12v18H6zM9 8h6M9 12h6M9 16h6",
  video: "M4 5h16v14H4zM10 9l6 3-6 3z",
  desk: "M3 10h18M5 10V6h14v4M6 10v8M18 10v8M3 18h18",
  monitor: "M4 4h16v11H4zM9 20h6M12 15v5",
  plant: "M12 21v-8M12 13c-4 0-6-3-6-7 4 0 6 2 6 5m0 2c4 0 6-3 6-7-4 0-6 2-6 5",
  sofa: "M4 12V8a2 2 0 012-2h12a2 2 0 012 2v4M3 12h18v6H3zM5 18v2M19 18v2",
  home: "M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z",
  move: "M12 3v18M3 12h18M7 7l-4 5 4 5M17 7l4 5-4 5M7 17l5 4 5-4M7 7l5-4 5 4",
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
