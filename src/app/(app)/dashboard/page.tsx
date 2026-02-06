"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/hooks/useSession";

type RoundRow = {
  id: string;
  user_id: string;
  home_club_id: string;
  holes_count: number;
  current_hole_number: number;
  started_at: string;
  completed_at: string | null;
  status: "active" | "complete" | string;
  user_course_id: string | null;
};

type InsightRow = Record<string, any>;

const STROKE_TYPES: Array<{ key: string; label: string }> = [
  { key: "TeeShot", label: "Tee Shots" },
  { key: "Recovery", label: "Recovery" },
  { key: "LayUp", label: "Lay-ups" },
  { key: "F-Bunker", label: "Bunker (F)" },
  { key: "Approach", label: "Approaches" },
  { key: "ChipPitch", label: "Pitch/Chip" },
  { key: "G-Bunker", label: "Bunker (G)" },
  { key: "Penalty", label: "Penalties" },
  { key: "Other", label: "Other" },
  { key: "Putt", label: "Putts" },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pctOrNull(ok: number, total: number) {
  if (!total) return null;
  return Math.round((ok / total) * 100);
}

function formatDateWithYear(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString(undefined, { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function trendLabel(deltaPct: number | null) {
  if (deltaPct === null) return { dir: "flat" as const, label: "—" };

  // Locked thresholds: 3%
  if (deltaPct >= 3) return { dir: "up" as const, label: `↑ +${Math.round(deltaPct)}%` };
  if (deltaPct <= -3) return { dir: "down" as const, label: `↓ ${Math.round(deltaPct)}%` };
  return { dir: "flat" as const, label: "Stable" };
}

function sparkFromValues(values: Array<number | null>) {
  // nulls become 0 for bar height, but labels remain separate
  const clean = values.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : 0));
  const max = Math.max(1, ...clean);
  return clean.map((v) => Math.round((v / max) * 100));
}

function pickInsightText(row: InsightRow | null, kind: "highlight" | "focus") {
  if (!row) return null;

  const candidates =
    kind === "highlight"
      ? ["highlight", "highlight_text", "highlightText", "insight_highlight", "insightHighlight", "summary_highlight"]
      : ["focus_area", "focusArea", "focus_area_text", "focusAreaText", "insight_focus", "insightFocus", "summary_focus"];

  for (const k of candidates) {
    if (typeof row[k] === "string" && row[k].trim().length > 0) return row[k].trim();
  }

  const jsonKeys = ["payload", "data", "insights", "result"];
  for (const jk of jsonKeys) {
    const blob = row[jk];
    if (blob && typeof blob === "object") {
      for (const k of candidates) {
        const v = blob[k];
        if (typeof v === "string" && v.trim().length > 0) return v.trim();
      }
    }
  }

  return null;
}

function asCourseName(args: {
  round: RoundRow;
  clubsById: Record<string, string>;
  coursesById: Record<string, string>;
}) {
  const { round, clubsById, coursesById } = args;
  if (round.user_course_id && coursesById[round.user_course_id]) return coursesById[round.user_course_id];
  if (clubsById[round.home_club_id]) return clubsById[round.home_club_id];
  return "Course";
}

function getActiveRoundCourseName(
  round: { user_course_id: string | null; home_club_id: string },
  clubsById: Record<string, string>,
  coursesById: Record<string, string>
) {
  if (round.user_course_id && coursesById[round.user_course_id]) {
    return coursesById[round.user_course_id];
  }

  if (round.home_club_id && clubsById[round.home_club_id]) {
    return clubsById[round.home_club_id];
  }

  return "Course";
}

function strokeTypeLabel(key: string) {
  const hit = STROKE_TYPES.find((s) => s.key === key);
  return hit ? hit.label : key;
}

type BreakdownRow = {
  key: string;
  pct: number | null; // latest round pct for this stroke type
  delta: number | null; // latest pct - prior5 avg pct (if latest exists)
  prevAvg: number | null; // prior5 avg pct for this stroke type
  spark: number[]; // per-round values (prior5 oldest->newest, then latest)
  total: number; // total strokes across latest + prior5 for this stroke type (counted)
};

export default function DashboardPage() {
  const { session, isLoading, supabase } = useSession();
  const userId = session?.user?.id;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [activeRound, setActiveRound] = useState<RoundRow | null>(null);
  const [recentRounds, setRecentRounds] = useState<RoundRow[]>([]);
  const [clubsById, setClubsById] = useState<Record<string, string>>({});
  const [coursesById, setCoursesById] = useState<Record<string, string>>({});

  // For latest + prior 5 (6 rounds total)
  const [roundPctById, setRoundPctById] = useState<Record<string, number | null>>({});
  const [roundCountedTotalById, setRoundCountedTotalById] = useState<Record<string, number>>({});
  const [roundSpark, setRoundSpark] = useState<Array<number | null>>([]);
  const [latestTrendDelta, setLatestTrendDelta] = useState<number | null>(null);

  const [latestInsightHighlight, setLatestInsightHighlight] = useState<string | null>(null);
  const [latestInsightFocus, setLatestInsightFocus] = useState<string | null>(null);

  const [typeBreakdown, setTypeBreakdown] = useState<BreakdownRow[]>([]);

  const [lateRoundCard, setLateRoundCard] = useState<{
    title: string;
    pct: number | null;
    copy: string;
    kind: "highlight" | "focus";
  } | null>(null);

  const recentCompleted = useMemo(
    () =>
      recentRounds
        .filter((r) => r.status === "complete")
        .sort((a, b) => +new Date(b.started_at) - +new Date(a.started_at)),
    [recentRounds]
  );

  const latestCompleted = recentCompleted[0] ?? null;
  const prior5 = recentCompleted.slice(1, 6);

  const latestPct = latestCompleted ? roundPctById[latestCompleted.id] ?? null : null;
  const latestTotal = latestCompleted ? roundCountedTotalById[latestCompleted.id] ?? 0 : 0;

  const trend = trendLabel(latestTrendDelta);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setErr(null);

      try {
        // Active round
        const { data: ar, error: arErr } = await supabase
          .from("rounds")
          .select("id, user_id, home_club_id, holes_count, current_hole_number, started_at, completed_at, status, user_course_id")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("started_at", { ascending: false })
          .limit(1);

        if (arErr) throw arErr;
        if (!cancelled) setActiveRound(((ar ?? [])[0] ?? null) as any);

        // Recent rounds (active + complete)
        const { data: rr, error: rrErr } = await supabase
          .from("rounds")
          .select("id, user_id, home_club_id, holes_count, current_hole_number, started_at, completed_at, status, user_course_id")
          .eq("user_id", userId)
          .in("status", ["complete", "active"])
          .order("started_at", { ascending: false })
          .limit(30);

        if (rrErr) throw rrErr;

        const rounds = (rr ?? []) as any as RoundRow[];
        if (!cancelled) setRecentRounds(rounds);

        // Build id sets for names
        const clubIds = Array.from(new Set(rounds.map((r) => r.home_club_id).filter(Boolean)));
        const courseIds = Array.from(new Set(rounds.map((r) => r.user_course_id).filter(Boolean))) as string[];

        // Club names
        if (clubIds.length > 0) {
          const { data: clubs, error: cErr } = await supabase.from("clubs").select("id, name").in("id", clubIds);
          if (cErr) throw cErr;
          const map: Record<string, string> = {};
          (clubs ?? []).forEach((c: any) => (map[String(c.id)] = String(c.name ?? "")));
          if (!cancelled) setClubsById(map);
        } else {
          if (!cancelled) setClubsById({});
        }

        // Course names
        if (courseIds.length > 0) {
          const { data: courses, error: ucErr } = await supabase.from("user_courses").select("id, course_name").in("id", courseIds);
          if (ucErr) throw ucErr;
          const map: Record<string, string> = {};
          (courses ?? []).forEach((c: any) => (map[String(c.id)] = String(c.course_name ?? "")));
          if (!cancelled) setCoursesById(map);
        } else {
          if (!cancelled) setCoursesById({});
        }

        // Trend set: latest + prior5
        const completed = rounds
          .filter((r) => r.status === "complete")
          .sort((a, b) => +new Date(b.started_at) - +new Date(a.started_at));

        const usedForTrend = completed.slice(0, 6);
        const usedIds = usedForTrend.map((r) => r.id);

        const pctById: Record<string, number | null> = {};
        const totalById: Record<string, number> = {};
        const sparkVals: Array<number | null> = [];

        if (usedIds.length > 0) {
          const { data: strokes, error: sErr } = await supabase
            .from("strokes")
            .select("round_id, mental_ok")
            .in("round_id", usedIds)
            .eq("is_counted", true);

          if (sErr) throw sErr;

          const byRound: Record<string, { ok: number; total: number }> = {};
          (strokes ?? []).forEach((s: any) => {
            const rid = String(s.round_id);
            if (!byRound[rid]) byRound[rid] = { ok: 0, total: 0 };
            byRound[rid].total += 1;
            if (s.mental_ok) byRound[rid].ok += 1;
          });

          usedForTrend.forEach((r) => {
            const agg = byRound[r.id] ?? { ok: 0, total: 0 };
            totalById[r.id] = agg.total;
            const p = pctOrNull(agg.ok, agg.total);
            pctById[r.id] = p;
            sparkVals.push(p);
          });
        }

        if (!cancelled) {
          setRoundPctById(pctById);
          setRoundCountedTotalById(totalById);
          setRoundSpark(sparkVals);
        }

        // Delta: latest vs prior5 avg (only when both exist)
        const latest = usedForTrend[0] ?? null;
        const prev5 = usedForTrend.slice(1, 6);

        let delta: number | null = null;
        if (latest) {
          const latestP = pctById[latest.id];
          const prevVals = prev5.map((r) => pctById[r.id]).filter((v) => typeof v === "number") as number[];
          if (typeof latestP === "number" && prevVals.length > 0) {
            const prevAvg = Math.round(prevVals.reduce((a, b) => a + b, 0) / prevVals.length);
            delta = latestP - prevAvg;
          }
        }
        if (!cancelled) setLatestTrendDelta(delta);

        // Stable insights (stored)
        if (latest) {
          const { data: ins, error: insErr } = await supabase
            .from("round_insights")
            .select("*")
            .eq("round_id", latest.id)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1);

          if (!insErr) {
            const row = (ins ?? [])[0] ?? null;
            if (!cancelled) {
              setLatestInsightHighlight(pickInsightText(row, "highlight"));
              setLatestInsightFocus(pickInsightText(row, "focus"));
            }
          } else {
            if (!cancelled) {
              setLatestInsightHighlight(null);
              setLatestInsightFocus(null);
            }
          }
        } else {
          if (!cancelled) {
            setLatestInsightHighlight(null);
            setLatestInsightFocus(null);
          }
        }

        // Focus breakdown (for all stroke types, canonical order)
        if (latest) {
          const prevIds = prev5.map((r) => r.id);

          const { data: latestStrokes, error: lsErr } = await supabase
            .from("strokes")
            .select("stroke_type, mental_ok")
            .eq("round_id", latest.id)
            .eq("is_counted", true);

          if (lsErr) throw lsErr;

          let prevStrokes: any[] = [];
          if (prevIds.length > 0) {
            const { data: ps, error: psErr } = await supabase
              .from("strokes")
              .select("round_id, stroke_type, mental_ok")
              .in("round_id", prevIds)
              .eq("is_counted", true);

            if (psErr) throw psErr;
            prevStrokes = ps ?? [];
          }

          const latestAgg: Record<string, { ok: number; total: number }> = {};
          (latestStrokes ?? []).forEach((s: any) => {
            const k = String(s.stroke_type);
            if (!latestAgg[k]) latestAgg[k] = { ok: 0, total: 0 };
            latestAgg[k].total += 1;
            if (s.mental_ok) latestAgg[k].ok += 1;
          });

          // prev aggregated per round, per type
          const prevAggByTypeByRound: Record<string, Record<string, { ok: number; total: number }>> = {};
          prevStrokes.forEach((s: any) => {
            const rid = String(s.round_id);
            const k = String(s.stroke_type);
            if (!prevAggByTypeByRound[rid]) prevAggByTypeByRound[rid] = {};
            if (!prevAggByTypeByRound[rid][k]) prevAggByTypeByRound[rid][k] = { ok: 0, total: 0 };
            prevAggByTypeByRound[rid][k].total += 1;
            if (s.mental_ok) prevAggByTypeByRound[rid][k].ok += 1;
          });

          const rows: BreakdownRow[] = [];

          for (const st of STROKE_TYPES) {
            const la = latestAgg[st.key] ?? { ok: 0, total: 0 };
            const latestP = pctOrNull(la.ok, la.total);

            // perRoundVals is in the same order as prev5 (newest->older), but we want spark oldest->newest then latest
            const perRoundValsNewestFirst: Array<number | null> = [];
            let prevTotalStrokes = 0;

            for (const r of prev5) {
              const agg = prevAggByTypeByRound[r.id]?.[st.key] ?? { ok: 0, total: 0 };
              prevTotalStrokes += agg.total;
              perRoundValsNewestFirst.push(pctOrNull(agg.ok, agg.total));
            }

            const prevVals2 = perRoundValsNewestFirst.filter((v) => typeof v === "number") as number[];
            const prevAvgVal = prevVals2.length > 0 ? Math.round(prevVals2.reduce((a, b) => a + b, 0) / prevVals2.length) : null;

            const d = typeof latestP === "number" && prevAvgVal !== null ? latestP - prevAvgVal : null;

            // spark wants: prior5 oldest->newest, then latest
            const perRoundValsOldestFirst = perRoundValsNewestFirst.slice().reverse();
            const spark = sparkFromValues([...perRoundValsOldestFirst, latestP]);

            const totalAcross = la.total + prevTotalStrokes;

            rows.push({
              key: st.key,
              pct: latestP,
              delta: d,
              prevAvg: prevAvgVal,
              spark,
              total: totalAcross,
            });
          }

          // Keep stroke types that have any data in either latest or prior 5
          const anyData = rows.filter((r) => r.total > 0);

          if (!cancelled) setTypeBreakdown(anyData);
        } else {
          if (!cancelled) setTypeBreakdown([]);
        }

        // Late-round slip (13–16) on latest
        if (latest) {
          const { data: ls, error: lErr } = await supabase
            .from("strokes")
            .select("hole_number, mental_ok")
            .eq("round_id", latest.id)
            .eq("is_counted", true);

          if (lErr) throw lErr;

          const all = ls ?? [];
          const late = all.filter((s: any) => Number(s.hole_number) >= 13 && Number(s.hole_number) <= 16);

          const lateP = pctOrNull(late.filter((s: any) => !!s.mental_ok).length, late.length);
          const allP = pctOrNull(all.filter((s: any) => !!s.mental_ok).length, all.length);

          if (late.length === 0) {
            if (!cancelled) setLateRoundCard(null);
          } else if (typeof lateP === "number" && typeof allP === "number" && lateP - allP <= -3) {
            if (!cancelled) {
              setLateRoundCard({
                title: "Late Round (Holes 13–16)",
                pct: lateP,
                copy: "Focus is lower here relative to your round average.",
                kind: "focus",
              });
            }
          } else {
            if (!cancelled) {
              setLateRoundCard({
                title: "Late Round (Holes 13–16)",
                pct: lateP,
                copy: "No strong late-round drop detected.",
                kind: "highlight",
              });
            }
          }
        } else {
          if (!cancelled) setLateRoundCard(null);
        }

        if (!cancelled) setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message ?? "Failed to load dashboard.");
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  // Mental sparkline: oldest->newest left-to-right
  const sparkHeights = useMemo(() => sparkFromValues(roundSpark.slice().reverse()), [roundSpark]);

  if (isLoading) return null;

  if (!session) {
    return (
      <div className="container-app mode-briefing">
        <div className="stack">
          <div className="card card-pad">
            <div className="section-title">Please log in</div>
            <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
              You need to be signed in to use the dashboard.
            </div>
            <Link href="/login" className="btn btn-primary" style={{ width: "100%", marginTop: "var(--sp-4)" }}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const prevVals = prior5.map((r) => roundPctById[r.id]).filter((v) => typeof v === "number") as number[];
  const prevAvg = prevVals.length ? Math.round(prevVals.reduce((a, b) => a + b, 0) / prevVals.length) : 0;

  return (
    <div className="container-app mode-briefing">
      <div className="stack">
        <div className="flex items-start justify-between gap-3" style={{ width: "100%" }}>
          <div>
            <h1 className="title">Dashboard</h1>
            <div className="meta">Trends compare your most recent round to the 5 prior rounds.</div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/scorecard" className="btn btn-primary" style={{ minHeight: 44 }}>
              Open Scorecard
            </Link>
          </div>
        </div>

        {err ? (
          <div className="meta" style={{ color: "hsl(var(--danger))" }}>
            {err}
          </div>
        ) : null}

        {loading ? (
          <div className="card card-pad">
            <div className="meta">Loading…</div>
          </div>
        ) : (
          <>
            <div className="card-hero card-pad" style={{ position: "relative" }}>
              <Link
                href="/how-insights-work"
                aria-label="How insights work"
                title="How insights work"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  border: "1px solid hsl(var(--border))",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  color: "hsl(var(--text))",
                  fontWeight: 800,
                }}
              >
                ?
              </Link>

              <div className="section-title">Mental Focus</div>

              <div className="flex items-end justify-between gap-4" style={{ marginTop: "var(--sp-4)" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="body" style={{ fontSize: 44, lineHeight: 1 }}>
                    {latestCompleted ? (typeof latestPct === "number" ? `${latestPct}%` : "—%") : "—%"}
                  </div>

                  {latestCompleted ? (
                    latestTotal === 0 ? (
                      <div className="meta" style={{ marginTop: 10, whiteSpace: "nowrap" }}>
                        No committed strokes in your most recent round yet.
                      </div>
                    ) : (
                      <div className="meta" style={{ marginTop: 10, whiteSpace: "nowrap" }}>
                        {trend.label} vs previous 5 (avg {prevAvg}%)
                      </div>
                    )
                  ) : (
                    <div className="meta" style={{ marginTop: 10 }}>
                      Complete a round to see your trend.
                    </div>
                  )}
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
                  {sparkHeights.map((h, i) => (
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

              <div style={{ marginTop: "var(--sp-4)" }}>
                <div className="meta" style={{ fontWeight: 800, color: "hsl(var(--text))" }}>
                  Key insights
                </div>

                <div className="stack-xs" style={{ marginTop: "var(--sp-2)" }}>
                  <div className="meta" style={{ color: "hsl(var(--text))", fontSize: 15 }}>
                    <span style={{ fontWeight: 800 }}>Highlight:</span>{" "}
                    {latestInsightHighlight ?? (latestCompleted ? "No saved highlight yet." : "—")}
                  </div>

                  <div className="meta" style={{ color: "hsl(var(--text))", fontSize: 15 }}>
                    <span style={{ fontWeight: 800 }}>Focus area:</span>{" "}
                    {latestInsightFocus ?? (latestCompleted ? "No saved focus area yet." : "—")}
                  </div>
                </div>
              </div>
            </div>

            {activeRound ? (
              <div className="card card-pad">
                <div className="section-title">You have an open round</div>

                <div className="meta" style={{ marginTop: "var(--sp-2)", fontWeight: 700 }}>
                  {getActiveRoundCourseName(activeRound, clubsById, coursesById)}
                </div>

                <div className="meta" style={{ marginTop: "var(--sp-1)" }}>
                  Hole {activeRound.current_hole_number} of {activeRound.holes_count}
                </div>

                <Link href="/scorecard" className="btn btn-primary" style={{ width: "100%", marginTop: "var(--sp-4)" }}>
                  Continue Round
                </Link>
              </div>
            ) : null}

            <div className="card card-pad">
              <div className="section-title">Focus Breakdown</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                By Stroke Type (most recent round vs previous 5).
              </div>

              {typeBreakdown.length === 0 ? (
                <div className="meta" style={{ marginTop: "var(--sp-3)" }}>
                  No stroke-type breakdown yet.
                </div>
              ) : (
                <div className="stack" style={{ marginTop: "var(--sp-4)" }}>
                  {typeBreakdown.map((r) => {
                    // Standard format: latest pct • delta label • prev5 avg
                    const pctText = typeof r.pct === "number" ? `${r.pct}%` : "—%";

                    const prevAvgText = typeof r.prevAvg === "number" ? `${r.prevAvg}%` : "—";

                    let deltaText = "—";
                    if (typeof r.delta === "number") {
                      if (r.delta >= 3) deltaText = `↑ +${Math.round(r.delta)}%`;
                      else if (r.delta <= -3) deltaText = `↓ ${Math.round(r.delta)}%`;
                      else deltaText = "Stable";
                    }

                    const pill = `${pctText} • ${deltaText} • ${prevAvgText}`;

                    return (
                      <div
                        key={r.key}
                        className="card"
                        style={{
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--r-sm)",
                          padding: "var(--sp-4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "var(--sp-3)",
                        }}
                      >
                        <div className="meta" style={{ fontWeight: 800, color: "hsl(var(--text))" }}>
                          {strokeTypeLabel(r.key)}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="pill pill-neutral">{pill}</div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-end",
                              gap: 3,
                              height: 24,
                              minWidth: 72,
                              justifyContent: "flex-end",
                            }}
                          >
                            {r.spark.map((h, i) => (
                              <div
                                key={i}
                                style={{
                                  width: 8,
                                  height: clamp(Math.round((h / 100) * 24), 10, 24),
                                  borderRadius: 6,
                                  background: "hsl(var(--action))",
                                  opacity: 0.55,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {lateRoundCard ? (
              <div className="card card-pad">
                <div className="section-title">Where Focus Slips</div>
                <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                  {lateRoundCard.title} • Avg Focus: {typeof lateRoundCard.pct === "number" ? `${lateRoundCard.pct}%` : "—%"}
                </div>
                <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                  {lateRoundCard.kind === "highlight" ? (
                    <span style={{ fontWeight: 800, color: "hsl(var(--text))" }}>Highlight:</span>
                  ) : (
                    <span style={{ fontWeight: 800, color: "hsl(var(--text))" }}>Focus area:</span>
                  )}{" "}
                  {lateRoundCard.copy}
                </div>
              </div>
            ) : null}

            <div className="card card-pad">
              <div className="flex items-start justify-between gap-3" style={{ width: "100%" }}>
                <div>
                  <div className="section-title">Recent rounds</div>
                  <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                    Last 6 completed rounds.
                  </div>
                </div>

                <Link href="/rounds" className="btn btn-ghost" style={{ minHeight: 40 }}>
                  History
                </Link>
              </div>

              {recentCompleted.slice(0, 6).length === 0 ? (
                <div className="meta" style={{ marginTop: "var(--sp-3)" }}>
                  No completed rounds yet.
                </div>
              ) : (
                <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
                  {recentCompleted.slice(0, 6).map((r) => {
                    const name = asCourseName({ round: r, clubsById, coursesById });
                    const mp = roundPctById[r.id];
                    const pill = typeof mp === "number" ? `Mental ${mp}%` : "Mental —%";

                    return (
                      <Link key={r.id} href={`/rounds/${r.id}`} className="row" style={{ textDecoration: "none" }}>
                        <div className="flex items-start justify-between gap-3" style={{ width: "100%" }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="meta" style={{ fontWeight: 800, color: "hsl(var(--text))" }}>
                              {name}
                            </div>
                            <div className="meta" style={{ marginTop: 6 }}>
                              {r.holes_count} holes • {formatDateWithYear(r.started_at)}
                            </div>
                          </div>

                          <div className="pill pill-neutral">{pill}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}