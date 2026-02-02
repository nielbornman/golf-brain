"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/hooks/useSession";

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Product", href: "/product" },
  { label: "Why mental", href: "/why-mental" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

export default function MarketingHeader() {
  const { session, isLoading } = useSession();
  const isAuthed = useMemo(() => !!session?.user?.id, [session?.user?.id]);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const primaryHref = isAuthed ? "/scorecard" : "/login";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            {/* Use a stable icon path in /public/icons */}
            <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
              <Image
                src="/icons/icon-120.png"
                alt="Golf Brain"
                fill
                sizes="40px"
                priority
              />
            </div>

            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight text-slate-900">
                Golf Brain
              </div>
              <div className="text-xs font-medium text-slate-600">
                Remind • Record • Reduce Strokes
              </div>
            </div>
          </Link>

          {/* Right controls */}
          <div className="relative flex items-center gap-2">
            {/* Primary CTA: small pill */}
            <Link
              href={primaryHref}
              className={cx(
                "rounded-full px-4 py-2 text-sm font-semibold",
                "text-white",
                // Prefer your V1 brand token if present; fallback to emerald.
                "bg-emerald-600 hover:bg-emerald-700",
                "transition-colors"
              )}
              aria-disabled={isLoading}
            >
              {isAuthed ? "Open app" : "Start free"}
            </Link>

            {/* Burger */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={cx(
                "h-10 w-10 rounded-full border border-slate-200/70 bg-white",
                "grid place-items-center",
                "hover:bg-slate-50 transition-colors"
              )}
              aria-label="Open menu"
              aria-expanded={open}
            >
              <div className="w-4 space-y-1">
                <div className="h-0.5 rounded bg-slate-800/80" />
                <div className="h-0.5 rounded bg-slate-800/80" />
                <div className="h-0.5 rounded bg-slate-800/80" />
              </div>
            </button>

            {/* Simple, non-intrusive drawer (not a modal) */}
            {open ? (
              <div
                ref={panelRef}
                className={cx(
                  "absolute right-0 top-12 w-72 overflow-hidden",
                  "rounded-3xl border border-slate-200/70 bg-white",
                  "shadow-[0_16px_40px_rgba(15,23,42,0.10)]"
                )}
              >
                <nav className="p-2">
                  <div className="px-2 py-2 text-xs font-semibold text-slate-500">
                    Menu
                  </div>

                  <div className="space-y-1">
                    {NAV.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cx(
                          "flex items-center justify-between rounded-2xl px-3 py-3",
                          "text-sm font-medium text-slate-900",
                          "hover:bg-slate-50 transition-colors"
                        )}
                      >
                        <span>{item.label}</span>
                        <span className="text-slate-400">›</span>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-2 border-t border-slate-200/70 p-2">
                    {!isAuthed ? (
                      <Link
                        href="/login"
                        onClick={() => setOpen(false)}
                        className="block rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Log in
                      </Link>
                    ) : (
                      <Link
                        href="/scorecard"
                        onClick={() => setOpen(false)}
                        className="block rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Go to scorecard
                      </Link>
                    )}
                  </div>
                </nav>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}