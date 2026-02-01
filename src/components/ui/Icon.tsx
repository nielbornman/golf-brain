"use client";

import React from "react";

type IconName = "flag" | "gear" | "plus" | "trash";

export function Icon({
  name,
  size = 18,
  title,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  const stroke = "currentColor";
  const strokeWidth = 1.8;
  const strokeLinecap = "round" as const;
  const strokeLinejoin = "round" as const;

  const paths: Record<IconName, React.ReactNode> = {
    plus: (
      <>
        <path d="M12 5v14" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} />
        <path d="M5 12h14" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} />
      </>
    ),

    gear: (
      <>
        <path
          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin={strokeLinejoin}
        />
        <path
          d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.4-2.3.6a7.4 7.4 0 0 0-1.7-1l-.3-2.4H9l-.3 2.4a7.4 7.4 0 0 0-1.7 1l-2.3-.6-2 3.4 2 1.2a7.9 7.9 0 0 0 .1 2l-2 1.2 2 3.4 2.3-.6c.5.4 1.1.7 1.7 1l.3 2.4h6l.3-2.4c.6-.3 1.2-.6 1.7-1l2.3.6 2-3.4-2-1.2Z"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin={strokeLinejoin}
        />
      </>
    ),

    flag: (
      <>
        <path
          d="M6 3v18"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap={strokeLinecap}
        />
        <path
          d="M6 4h10l-1.5 3L16 10H6"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin={strokeLinejoin}
        />
        <path
          d="M18 20c0 1.1-1.8 2-4 2s-4-.9-4-2 1.8-2 4-2 4 .9 4 2Z"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin={strokeLinejoin}
        />
      </>
    ),

    trash: (
      <>
        <path
          d="M9 3h6l1 2h4"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap={strokeLinecap}
          strokeLinejoin={strokeLinejoin}
        />
        <path
          d="M6 7h12l-1 14H7L6 7Z"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin={strokeLinejoin}
        />
        <path
          d="M10 11v7"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap={strokeLinecap}
        />
        <path
          d="M14 11v7"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap={strokeLinecap}
        />
      </>
    ),
  };

  return (
    <svg {...common} className={className} style={style} aria-hidden={!title}>
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}
