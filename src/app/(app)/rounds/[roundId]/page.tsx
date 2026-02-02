"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useHomeClub } from "@/hooks/useHomeClub";
import {
  getRoundByIdForUser,
  listStrokesForRound,
  getRoundMentalSummary,
  type StrokeRow,
} from "@/lib/rounds";

function dangerText(msg: string) {
  return (
    <div className="meta" style={{ color: "hsl(var(--danger))" }}>
      {msg}
    </div>
  );
}

function formatDateFull(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type HoleSummary = {
  hole: number;
  strokes: number;
  mfPct: number; // 0..100
};

function computeHoleSummaries(strokes: StrokeRow[], holesCount: number): HoleSummary[] {
  const byHole = new Map<number, StrokeRow[]>();

  for (const s of strokes) {
    const hole = Number(s.hole_number) || 0;
    if (!hole) continue;
    const arr = byHole.get(hole) ?? [];
    arr.push(s);
    byHole.set(hole, arr);
  }

  const res: HoleSummary[] = [];
  for (let hole = 1; hole <= holesCount; hole++) {
    const list = byHole.get(hole) ?? [];
    const total = list.length;
    const yes = list.filter((x) => !!x.mental_ok).length;
    const pct = total === 0 ? 0 : Math.round((yes / total) * 100);
    res.push({ hole, strokes: total, mfPct: pct });
  }

  return res;
}

export default function RoundDetailPage() {
  const params = useParams<{ roundId?: string }>();
  const roundId = typeof params?.roundId === "string" ? params.roundId : "";

  const { session, isLoading, supabase } = useSession();
  const userId = session?.user.id; // string | undefined

  const homeClub = useHomeClub(userId);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [round, setRound] = useState<any | null>(null);
  const [strokes, setStrokes] = useState<StrokeRow[]>([]);
  const [mentalPct, setMentalPct] = useState<number>(0);

  const holesCount: number = Number(round?.holes_count ?? 0) || 18;

  const holeSummaries = useMemo(() => {
    return computeHoleSummaries(strokes, holesCount);
  }, [strokes, holesCount]);

  const courseName = homeClub.status === "present" ? homeClub.name : "Course";

  useEffect(() => {
    if (!roundId) return;
    if (!userId) return;

    const uid = userId; // ✅ capture for closure
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const r = await getRoundByIdForUser(supabase, uid, roundId);
        const s = await listStrokesForRound(supabase, roundId);
        const mf = await getRoundMentalSummary(supabase, roundId);

        if (cancelled) return;

        setRound(r);
        setStrokes(s);
        setMentalPct(mf.pct);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load round.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId, roundId]);

  // Basic gates
  if (isLoading) {
    return (
      <div className="container-app mode-briefing">
        <div className="card card-pad">
          <div className="meta">Loading…</div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="container-app mode-briefing">
        <div className="stack">
          <div className="card card-pad">
            <div className="meta">You must be signed in to view round history.</div>
          </div>
          <Link href="/dashboard" className="btn btn-ghost" style={{ width: "100%" }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app mode-briefing">
      <div className="stack">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="title">Round</h1>
            <div className="meta">{courseName}</div>
          </div>

          <Link href="/dashboard" className="btn btn-ghost btn-inline">
            Back
          </Link>
        </div>

        {err ? dangerText(err) : null}

        {loading ? (
          <div className="card card-pad">
            <div className="meta">Loading…</div>
          </div>
        ) : !round ? (
          <div className="card card-pad">
            <div className="meta">Round not found.</div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="card card-pad">
              <div className="section-title">Summary</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                {formatDateFull(round.completed_at ?? round.created_at)}
              </div>

              <div className="row row-compact" style={{ marginTop: "var(--sp-4)" }}>
                <div>
                  <div className="body">Mental Focus</div>
                  <div className="meta">Percent of strokes marked “MF”.</div>
                </div>
                <div className="pill pill-success">MF {mentalPct}%</div>
              </div>

              <div className="row row-compact" style={{ marginTop: "var(--sp-2)" }}>
                <div>
                  <div className="body">Total strokes</div>
                  <div className="meta">Strokes recorded in Scorecard.</div>
                </div>
                <div className="pill pill-neutral">{strokes.length} strokes</div>
              </div>
            </div>

            {/* Per-hole */}
            <div className="card card-pad">
              <div className="section-title">Per hole</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                Strokes + MF per hole.
              </div>

              <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
                {holeSummaries.map((h) => (
                  <div key={h.hole} className="row row-compact">
                    <div>
                      <div className="body">Hole {h.hole}</div>
                      <div className="meta">{h.strokes} strokes</div>
                    </div>

                    <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                      <div className="pill pill-neutral">{h.strokes}</div>
                      <div className="pill pill-success">MF {h.mfPct}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw strokes */}
            <div className="card card-pad">
              <div className="section-title">Strokes</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                Recorded sequence (read-only in v1).
              </div>

              {strokes.length === 0 ? (
                <div className="meta" style={{ marginTop: "var(--sp-4)" }}>
                  No strokes recorded.
                </div>
              ) : (
                <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
                  {strokes.map((s) => (
                    <div key={s.id} className="row row-compact">
                      <div style={{ minWidth: 0 }}>
                        <div className="body" style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
                          Hole {s.hole_number} · {s.seq}. {s.stroke_type}
                        </div>
                        <div className="meta">{s.mental_ok ? "MF ✓" : "MF —"}</div>
                      </div>

                      <div className={s.mental_ok ? "pill pill-success" : "pill pill-neutral"}>
                        {s.mental_ok ? "MF" : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
