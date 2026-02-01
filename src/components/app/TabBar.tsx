"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string };

const tabs: Tab[] = [
  { href: "/scorecard", label: "Scorecard" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/account", label: "Account" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        borderTop: "1px solid hsl(var(--divider))",
        background: "hsla(var(--bg-page), 0.9)",
        backdropFilter: "blur(10px)",
      }}
      aria-label="Primary"
    >
      <div
        className="container-app"
        style={{
          paddingTop: "var(--sp-3)",
          paddingBottom: "var(--sp-3)",
        }}
      >
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((t) => {
            const isActive = pathname === t.href || pathname.startsWith(t.href + "/");

            return (
              <Link
                key={t.href}
                href={t.href}
                className="btn"
                style={{
                  minHeight: 44,
                  padding: "10px 12px",
                  border: "1px solid hsl(var(--border))",
                  background: isActive ? "hsl(var(--selection))" : "hsl(var(--bg-surface))",
                  color: isActive ? "hsl(var(--text))" : "hsl(var(--text-2))",
                  justifyContent: "center",
                }}
                aria-current={isActive ? "page" : undefined}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
