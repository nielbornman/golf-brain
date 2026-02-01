import type { SupabaseClient } from "@supabase/supabase-js";

type Trend = "improving" | "flat" | "declining";

export type DashboardRound = {
  roundId: string;
  completedAt: string;
  mentalPct: number; // 0..100
  strokeCount: number; // internal (not displayed as raw number in UI)
};

export type DashboardSummary = {
  rounds: DashboardRound[]; // most recent first, length <= 5
  mentalTrend: Trend;
  strokeTrend: Trend; // improving = fewer strokes over time
};

function trendFromSeries(valuesNewestFirst: number[], higherIsBetter: boolean): Trend {
  if (valuesNewestFirst.length < 2) return "flat";

  // Compare most recent vs oldest in window
  const latest = valuesNewestFirst[0];
  const oldest = valuesNewestFirst[valuesNewestFirst.length - 1];
  const delta = latest - oldest;

  // Small deadband to avoid noise
  const threshold = 2; // percent points / strokes
  if (Math.abs(delta) < threshold) return "flat";

  const improving = higherIsBetter ? delta > 0 : delta < 0;
  return improving ? "improving" : "declining";
}

/**
 * Fetch last 5 completed rounds and compute:
 * - mentalPct per round
 * - strokeCount per round (internal)
 * - trend directions
 */
export async function getDashboardSummary(
  client: SupabaseClient,
  userId: string
): Promise<DashboardSummary> {
  // 1) Get last 5 completed rounds
  const { data: rounds, error: roundsErr } = await client
    .from("rounds")
    .select("id,completed_at")
    .eq("user_id", userId)
    .eq("status", "complete")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(5);

  if (roundsErr) throw roundsErr;

  const roundList = (rounds ?? []).map((r: any) => ({
    id: r.id as string,
    completedAt: r.completed_at as string,
  }));

  if (roundList.length === 0) {
    return { rounds: [], mentalTrend: "flat", strokeTrend: "flat" };
  }

  // 2) Pull strokes for these rounds (one query)
  const roundIds = roundList.map((r) => r.id);

  const { data: strokes, error: strokesErr } = await client
    .from("strokes")
    .select("round_id,mental_ok")
    .in("round_id", roundIds);

  if (strokesErr) throw strokesErr;

  // 3) Aggregate per round
  const byRound: Record<
    string,
    { total: number; ok: number }
  > = {};

  for (const rid of roundIds) {
    byRound[rid] = { total: 0, ok: 0 };
  }

  for (const s of strokes ?? []) {
    const rid = (s as any).round_id as string;
    if (!byRound[rid]) continue;
    byRound[rid].total += 1;
    if ((s as any).mental_ok === true) byRound[rid].ok += 1;
  }

  const computed: DashboardRound[] = roundList.map((r) => {
    const agg = byRound[r.id] ?? { total: 0, ok: 0 };
    const pct = agg.total === 0 ? 0 : Math.round((agg.ok / agg.total) * 100);
    return {
      roundId: r.id,
      completedAt: r.completedAt,
      mentalPct: pct,
      strokeCount: agg.total,
    };
  });

  const mentalSeries = computed.map((r) => r.mentalPct); // newest first
  const strokeSeries = computed.map((r) => r.strokeCount); // newest first

  return {
    rounds: computed,
    mentalTrend: trendFromSeries(mentalSeries, true),
    strokeTrend: trendFromSeries(strokeSeries, false), // fewer strokes is better
  };
}
