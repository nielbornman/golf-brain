"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

type TrendDir = "up" | "down" | "flat" | "na";

type RoundRow = {
  id: string;
  user_id: string;
  home_club_id: string;
  holes_count: number;
  started_at: string;
  completed_at: string | null;
  status: string;
  user_course_id: string | null;
};

type StrokeRow = {
  id: string;
  round_id: string;
  hole_number: number;
  seq: number;
  stroke_type: string | null;
  mental_ok: boolean;
  is_counted: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatDateWithYear(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString(undefined, { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function pctOrNull(ok: number, total: number) {
  if (!total) return null;
  return Math.round((ok / total) * 100);
}

// Locked thresholds: 3%
function trendFromDelta(delta: number | null): { dir: TrendDir; label: string } {
  if (delta === null) return { dir: "na", label: "—" };
  if (delta >= 3) return { dir: "up", label: `↑ +${Math.round(delta)}%` };
  if (delta <= -3) return { dir: "down", label: `↓ ${Math.round(delta)}%` };
  return { dir: "flat", label: "Stable" };
}

function displayStrokeType(t: string | null) {
  if (!t) return "Stroke";
  if (t === "TeeShot") return "Tee Shot";
  if (t === "Recovery") return "Recovery";
  if (t === "Approach") return "Approach";
  if (t === "ChipPitch") return "Pitch/Chip";
  if (t === "LayUp") return "Lay-up";
  if (t === "F-Bunker") return "Bunker (F)";
  if (t === "G-Bunker") return "Bunker (G)";
  if (t === "Penalty") return "Penalty";
  if (t === "Putt") return "Putt";
  if (t === "Other") return "Other";
  return t;
}

function sparkFromValues(values: Array<number | null>) {
  const clean = values.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : 0));
  const max = Math.max(1, ...clean);
  return clean.map((v) => Math.round((v / max) * 100));
}

export default function RoundDetailPage() {
  const params = useParams<{ roundId: string }>();
  const roundId = params?.roundId;
  const router = useRouter();

  const { session, isLoading, supabase } = useSession();
  const userId = session?.user?.id;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [round, setRound] = useState<RoundRow | null>(null);
  const [courseName, setCourseName] = useState<string>("Course");

  const [strokes, setStrokes] = useState<StrokeRow[]>([]);
  const [expandedHole, setExpandedHole] = useState<number | null>(null);

  // Summary
  const [focusPct, setFocusPct] = useState<number | null>(null);
  const [prevAvgPct, setPrevAvgPct] = useState<number | null>(null);
  const [deltaPct, setDeltaPct] = useState<number | null>(null);
  const [spark, setSpark] = useState<number[]>([]);

  // Reflection
  const [reflection, setReflection] = useState<string>("");
  const [savingReflection, setSavingReflection] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const trend = useMemo(() => trendFromDelta(deltaPct), [deltaPct]);

  const strokesByHole = useMemo(() => {
    const m = new Map<number, StrokeRow[]>();
    for (const s of strokes) {
      const hn = Number(s.hole_number);
      if (!m.has(hn)) m.set(hn, []);
      m.get(hn)!.push(s);
    }
    for (const [k, list] of m) list.sort((a, b) => Number(a.seq) - Number(b.seq));
    return m;
  }, [strokes]);

  const holeSummaries = useMemo(() => {
    if (!round) return [];
    const out: Array<{ hole: number; total: number; ok: number; pct: number | null }> = [];
    for (let h = 1; h <= round.holes_count; h += 1) {
      const list = strokesByHole.get(h) ?? [];
      const total = list.length;
      const ok = list.filter((s) => !!s.mental_ok).length;
      out.push({ hole: h, total, ok, pct: pctOrNull(ok, total) });
    }
    return out;
  }, [round, strokesByHole]);

  useEffect(() => {
    if (!userId || !roundId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        // Round row
        const { data: rr, error: rErr } = await supabase
          .from("rounds")
          .select("id, user_id, home_club_id, holes_count, started_at, completed_at, status, user_course_id")
          .eq("id", roundId)
          .eq("user_id", userId)
          .limit(1);

        if (rErr) throw rErr;

        const r = ((rr ?? [])[0] ?? null) as any as RoundRow | null;
        if (!r) {
          if (!cancelled) setErr("Round not found.");
          return;
        }
        if (!cancelled) setRound(r);

        // Course name: user_course > club
        if (r.user_course_id) {
          const { data: uc, error: ucErr } = await supabase
            .from("user_courses")
            .select("id, course_name")
            .eq("id", r.user_course_id)
            .limit(1);

          if (!ucErr) {
            const row = (uc ?? [])[0] as any;
            const nm = row?.course_name ? String(row.course_name) : null;
            if (nm && !cancelled) setCourseName(nm);
          }
        } else {
          const { data: c, error: cErr } = await supabase.from("clubs").select("id, name").eq("id", r.home_club_id).limit(1);
          if (!cErr) {
            const row = (c ?? [])[0] as any;
            const nm = row?.name ? String(row.name) : null;
            if (nm && !cancelled) setCourseName(nm);
          }
        }

        // Counted strokes for this round (this is the truth everywhere in v2)
        const { data: ss, error: sErr } = await supabase
          .from("strokes")
          .select("id, round_id, hole_number, seq, stroke_type, mental_ok, is_counted")
          .eq("round_id", r.id)
          .eq("is_counted", true);

        if (sErr) throw sErr;
        const list = (ss ?? []) as any as StrokeRow[];
        list.sort((a, b) => Number(a.hole_number) - Number(b.hole_number) || Number(a.seq) - Number(b.seq));
        if (!cancelled) setStrokes(list);

        const ok = list.filter((s) => !!s.mental_ok).length;
        const total = list.length;
        const pct = pctOrNull(ok, total);
        if (!cancelled) setFocusPct(pct);

        // Prev 5 completed rounds for trend (exclude current)
        const { data: pr, error: prErr } = await supabase
          .from("rounds")
          .select("id, completed_at")
          .eq("user_id", userId)
          .eq("status", "complete")
          .not("completed_at", "is", null)
          .neq("id", r.id)
          .order("completed_at", { ascending: false })
          .limit(5);

        if (prErr) throw prErr;
        const prevRounds = (pr ?? []) as any[];
        const prevIds = prevRounds.map((x) => String(x.id));

        let prevAvg: number | null = null;
        if (prevIds.length > 0) {
          const { data: ps, error: psErr } = await supabase
            .from("strokes")
            .select("round_id, mental_ok")
            .in("round_id", prevIds)
            .eq("is_counted", true);

          if (psErr) throw psErr;

          const byRound: Record<string, { ok: number; total: number }> = {};
          (ps ?? []).forEach((s: any) => {
            const rid = String(s.round_id);
            if (!byRound[rid]) byRound[rid] = { ok: 0, total: 0 };
            byRound[rid].total += 1;
            if (s.mental_ok) byRound[rid].ok += 1;
          });

          const prevPcts: number[] = [];
          prevIds.forEach((rid) => {
            const agg = byRound[rid] ?? { ok: 0, total: 0 };
            const p = pctOrNull(agg.ok, agg.total);
            if (typeof p === "number") prevPcts.push(p);
          });

          prevAvg = prevPcts.length > 0 ? Math.round(prevPcts.reduce((a, b) => a + b, 0) / prevPcts.length) : null;
        }

        if (!cancelled) setPrevAvgPct(prevAvg);

        let delta: number | null = null;
        if (typeof pct === "number" && typeof prevAvg === "number") delta = pct - prevAvg;
        if (!cancelled) setDeltaPct(delta);

        // Spark: oldest -> newest left-to-right (prev5 then this round)
        const sparkVals: Array<number | null> = [];
        // reverse prevIds so oldest first
        const prevIdsOldestFirst = prevIds.slice().reverse();
        // reuse prevAvg calc data: easiest: recompute per round pct by querying again was waste; so compute now from prevIds with prior map
        // We'll do a tiny second pass using the byRound we already built, but it may be undefined if prevIds empty.
        if (prevIdsOldestFirst.length > 0) {
          // We still have byRound only inside scope, so compute directly using an extra query for simplicity with small N
          const { data: ps2 } = await supabase
            .from("strokes")
            .select("round_id, mental_ok")
            .in("round_id", prevIdsOldestFirst)
            .eq("is_counted", true);

          const by2: Record<string, { ok: number; total: number }> = {};
          (ps2 ?? []).forEach((s: any) => {
            const rid = String(s.round_id);
            if (!by2[rid]) by2[rid] = { ok: 0, total: 0 };
            by2[rid].total += 1;
            if (s.mental_ok) by2[rid].ok += 1;
          });

          prevIdsOldestFirst.forEach((rid) => {
            const agg = by2[rid] ?? { ok: 0, total: 0 };
            sparkVals.push(pctOrNull(agg.ok, agg.total));
          });
        }
        sparkVals.push(pct);
        if (!cancelled) setSpark(sparkFromValues(sparkVals));
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load round.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    // Local reflection fallback (never blocks)
    try {
      const key = `gb_round_reflection_${roundId}`;
      const saved = localStorage.getItem(key);
      if (typeof saved === "string") setReflection(saved);
    } catch {
      // ignore
    }

    return () => {
      cancelled = true;
    };
  }, [supabase, userId, roundId]);

  async function saveReflection() {
    if (!roundId) return;
    setSavingReflection(true);
    setReflectionSaved(false);

    try {
      // Always save to local first
      const key = `gb_round_reflection_${roundId}`;
      localStorage.setItem(key, reflection);

      // Best effort: if rounds has a "reflection" column in your DB, this will persist server-side.
      // If not, Supabase will throw and we silently fall back to localStorage.
      const { error } = await supabase.from("rounds").update({ reflection }).eq("id", roundId).eq("user_id", userId);
      if (error) {
        // ignore: localStorage already saved
      }

      setReflectionSaved(true);
      setTimeout(() => setReflectionSaved(false), 1200);
    } finally {
      setSavingReflection(false);
    }
  }

  if (isLoading) return null;

  if (!session) {
    return (
      <div className="container-app mode-briefing">
        <div className="stack">
          <div className="card card-pad">
            <div className="section-title">Please log in</div>
            <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
              You need to be signed in to view this round.
            </div>
            <Link href="/login" className="btn btn-primary" style={{ width: "100%", marginTop: "var(--sp-4)" }}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const whenIso = round?.completed_at ?? round?.started_at ?? "";
  const whenLabel = whenIso ? formatDateWithYear(whenIso) : "";

  const headerTitle = courseName || "Course";
  const headerSub = whenLabel ? `${whenLabel}` : "";

  return (
    <div className="container-app mode-briefing">
      <div className="stack">
        <div className="flex items-start justify-between gap-3" style={{ width: "100%" }}>
          <div style={{ minWidth: 0 }}>
            <h1 className="title">{headerTitle}</h1>
            <div className="meta">{headerSub}</div>
          </div>

          <button type="button" className="btn btn-ghost" style={{ minHeight: 44 }} onClick={() => router.back()}>
            Back
          </button>
        </div>

        {err ? (
          <div className="card card-pad" style={{ borderColor: "hsl(var(--danger))" }}>
            <div className="meta" style={{ color: "hsl(var(--danger))" }}>
              {err}
            </div>
          </div>
        ) : null}

        {loading || !round ? (
          <div className="card card-pad">
            <div className="meta">Loading…</div>
          </div>
        ) : (
          <>
            {/* Summary card (same standard as dashboard main card) */}
            <div className="card-hero card-pad">
              <div className="section-title">Mental Focus</div>

              <div className="flex items-end justify-between gap-4" style={{ marginTop: "var(--sp-4)" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="body" style={{ fontSize: 44, lineHeight: 1 }}>
                    {typeof focusPct === "number" ? `${focusPct}%` : "—%"}
                  </div>

                  <div className="meta" style={{ marginTop: 10, whiteSpace: "nowrap" }}>
                    {typeof focusPct === "number" && typeof prevAvgPct === "number"
                      ? `${trend.label} vs previous 5 (avg ${prevAvgPct}%)`
                      : "Compared to your previous 5 rounds."}
                  </div>
                </div>

                <div
                  aria-label="Sparkline"
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 4,
                    height: 46,
                    minWidth: 140,
                    justifyContent: "flex-end",
                  }}
                >
                  {spark.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: 10,
                        height: clamp(Math.round((h / 100) * 46), 14, 46),
                        borderRadius: 6,
                        background: "hsl(var(--action))",
                        opacity: 0.6,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="meta" style={{ marginTop: "var(--sp-4)" }}>
                Strokes (counted): {strokes.length}
              </div>
            </div>

            {/* Reflection (editable) */}
            <div className="card card-pad">
              <div className="section-title">Reflection</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                What were you thinking on the key moments?
              </div>

              <textarea
                className="input"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Write a short reflection..."
                style={{ marginTop: "var(--sp-4)", minHeight: 120, resize: "vertical" }}
              />

              <div className="flex items-center justify-between gap-3" style={{ marginTop: "var(--sp-3)" }}>
                <div className="meta" style={{ color: reflectionSaved ? "hsl(var(--action))" : "hsl(var(--muted))" }}>
                  {reflectionSaved ? "Saved" : " "}
                </div>

                <button type="button" className="btn btn-primary" disabled={savingReflection} onClick={saveReflection}>
                  {savingReflection ? "Saving…" : "Save reflection"}
                </button>
              </div>
            </div>

            {/* By hole (expand to strokes) */}
            <div className="card card-pad">
              <div className="section-title">By hole</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                Tap a hole to see strokes.
              </div>

              <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
                {holeSummaries.map((h) => {
                  const isOpen = expandedHole === h.hole;
                  const pct = typeof h.pct === "number" ? `${h.pct}%` : "—%";

                  return (
                    <div key={h.hole} className="card" style={{ padding: "var(--sp-4)" }}>
                      <button
                        type="button"
                        onClick={() => setExpandedHole(isOpen ? null : h.hole)}
                        className="row"
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <div className="flex items-center justify-between gap-3" style={{ width: "100%" }}>
                          <div className="meta" style={{ fontWeight: 800, color: "hsl(var(--text))" }}>
                            Hole {h.hole}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="pill pill-neutral">{pct}</div>
                            <div className="meta" style={{ color: "hsl(var(--muted))" }}>
                              {isOpen ? "−" : "+"}
                            </div>
                          </div>
                        </div>
                      </button>

                      {isOpen ? (
                        <div className="stack-xs" style={{ marginTop: "var(--sp-3)" }}>
                          {(strokesByHole.get(h.hole) ?? []).length === 0 ? (
                            <div className="meta">No counted strokes on this hole.</div>
                          ) : (
                            (strokesByHole.get(h.hole) ?? []).map((s) => (
                              <div
                                key={s.id}
                                className="card"
                                style={{
                                  padding: "var(--sp-3)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "var(--sp-3)",
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div className="meta" style={{ fontWeight: 800, color: "hsl(var(--text))" }}>
                                    {s.seq}. {displayStrokeType(s.stroke_type)}
                                  </div>
                                  <div className="meta" style={{ marginTop: 4 }}>
                                    MF: {s.mental_ok ? "Yes" : "No"}
                                  </div>
                                </div>

                                <div
                                  aria-label={s.mental_ok ? "Mental focus: Yes" : "Mental focus: No"}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 999,
                                    border: "1px solid hsl(var(--border))",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: s.mental_ok ? "hsl(var(--action) / 0.12)" : "transparent",
                                    color: s.mental_ok ? "hsl(var(--action))" : "hsl(var(--muted))",
                                    fontWeight: 900,
                                  }}
                                >
                                  ✓
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
