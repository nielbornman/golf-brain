"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/marketing/Card";

async function postInterest(email: string, tier: "plus" | "pro") {
  const res = await fetch("/api/interest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, tier }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to register interest");
  }
}

function validateEmail(v: string) {
  const s = v.trim().toLowerCase();
  if (!s || !s.includes("@") || s.length < 6) return null;
  return s;
}

export default function PricingCards({ showHeading = false }: { showHeading?: boolean }) {
  const [plusEmail, setPlusEmail] = useState("");
  const [proEmail, setProEmail] = useState("");

  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loadingTier, setLoadingTier] = useState<null | "plus" | "pro">(null);

  async function onRegister(tier: "plus" | "pro") {
    setStatus(null);

    const raw = tier === "plus" ? plusEmail : proEmail;
    const cleaned = validateEmail(raw);

    if (!cleaned) {
      setStatus({ ok: false, msg: "Please enter a valid email address." });
      return;
    }

    try {
      setLoadingTier(tier);
      await postInterest(cleaned, tier);
      setStatus({ ok: true, msg: "Thanks — you’re on the list." });

      if (tier === "plus") setPlusEmail("");
      if (tier === "pro") setProEmail("");
    } catch (e: any) {
      setStatus({ ok: false, msg: e?.message ?? "Something went wrong." });
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div>
      {showHeading ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Pricing</h1>
          <p className="mt-2 text-slate-700">Start free. Upgrade when you’re ready.</p>
        </>
      ) : null}

      <div className="mt-5 space-y-3">
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold text-slate-900">Free</div>
            <div className="text-sm text-slate-600">£0</div>
          </div>

          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Mental scorecard</li>
            <li>• Focus tracking</li>
            <li>• Basic reflections</li>
          </ul>

          <Link
            href="/login"
            className="mt-4 block w-full rounded-2xl bg-emerald-600 px-4 py-3 text-center font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Start free
          </Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold text-slate-900">Plus</div>
            <div className="text-sm text-slate-600">Coming soon</div>
          </div>

          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Deeper insights & patterns</li>
            <li>• Trends over time</li>
            <li>• Advanced routines</li>
          </ul>

          <div className="mt-4 space-y-2">
            <input
              value={plusEmail}
              onChange={(e) => setPlusEmail(e.target.value)}
              placeholder="Email for early access"
              className="w-full rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm"
              type="email"
              inputMode="email"
            />
            <button
              onClick={() => onRegister("plus")}
              disabled={loadingTier !== null}
              className="w-full rounded-2xl border border-slate-200/70 bg-white px-4 py-3 font-semibold text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {loadingTier === "plus" ? "Registering…" : "Register interest"}
            </button>
            <p className="text-xs text-slate-600">No commitment. Be first to know.</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold text-slate-900">Pro</div>
            <div className="text-sm text-slate-600">For professionals</div>
          </div>

          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Coach / academy workflows</li>
            <li>• Player management</li>
            <li>• Shared language & progress</li>
          </ul>

          <div className="mt-4 space-y-2">
            <input
              value={proEmail}
              onChange={(e) => setProEmail(e.target.value)}
              placeholder="Email for early access"
              className="w-full rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm"
              type="email"
              inputMode="email"
            />
            <button
              onClick={() => onRegister("pro")}
              disabled={loadingTier !== null}
              className="w-full rounded-2xl border border-slate-200/70 bg-white px-4 py-3 font-semibold text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {loadingTier === "pro" ? "Registering…" : "Register interest"}
            </button>
            <p className="text-xs text-slate-600">Early access list for coaches and facilities.</p>
          </div>
        </Card>

        {status ? (
          <p className={`text-sm ${status.ok ? "text-slate-800" : "text-slate-700"}`}>
            {status.msg}
          </p>
        ) : null}
      </div>
    </div>
  );
}