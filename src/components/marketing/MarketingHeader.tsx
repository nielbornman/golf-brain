"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  /** Optional override for demos/tests */
  isAuthedOverride?: boolean;
};

const NAV = [
  { href: "/", label: "Home" },
  { href: "/product", label: "Product" },
  { href: "/why-mental", label: "Why mental" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function MarketingHeader({ isAuthedOverride }: Props) {
  // Replace with your real session check if you want "Open App" logic.
  const isAuthed = useMemo(() => {
    if (typeof isAuthedOverride === "boolean") return isAuthedOverride;
    return false;
  }, [isAuthedOverride]);

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (wrapRef.current && !wrapRef.current.contains(t)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const primaryHref = isAuthed ? "/dashboard" : "/login";

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="mx-auto w-full max-w-md px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/icons/icon-180.png"
            alt="Golf Brain"
            className="h-10 w-10 rounded-2xl border border-slate-200/70 bg-white object-cover"
            onError={(e) => {
              // fallback to another common icon path if needed
              (e.currentTarget as HTMLImageElement).src = "/icons/icon-192.png";
            }}
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-slate-900">
              Golf Brain
            </div>
            <div className="text-xs text-slate-600">
              Remind • Record • Reduce Strokes
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2" ref={wrapRef}>
          <Link
            href={primaryHref}
            className="px-3 py-2 rounded-full text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition"
          >
            {isAuthed ? "Open App" : "Start free"}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="h-10 w-10 rounded-full border border-slate-200/70 bg-white hover:bg-slate-50 active:bg-slate-100 transition flex items-center justify-center"
            aria-label="Menu"
            aria-expanded={open}
          >
            <div className="w-4 space-y-1">
              <div className="h-0.5 bg-slate-900/80" />
              <div className="h-0.5 bg-slate-900/80" />
              <div className="h-0.5 bg-slate-900/80" />
            </div>
          </button>

          {open ? (
            <div className="absolute top-[56px] right-4 w-[260px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/70 bg-white shadow-sm p-2">
              <div className="px-2 py-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Log in
                </Link>
              </div>

              <div className="h-px bg-slate-100 my-1" />

              <nav className="px-1">
                {NAV.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                  >
                    <span>{i.label}</span>
                    <span className="text-slate-400">›</span>
                  </Link>
                ))}
              </nav>

              <div className="h-px bg-slate-100 my-2" />

              <div className="px-2 pb-2">
                <Link
                  href={primaryHref}
                  onClick={() => setOpen(false)}
                  className="block w-full text-center px-4 py-3 rounded-2xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition"
                >
                  {isAuthed ? "Open App" : "Start free"}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}