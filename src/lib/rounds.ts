import type { SupabaseClient } from "@supabase/supabase-js";

export type RoundRow = {
  id: string;
  user_id: string;
  home_club_id: string;
  holes_count: number;
  current_hole_number: number;
  status: "active" | "complete";
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HoleSnapshotRow = {
  id: string;
  round_id: string;
  hole_number: number;
  par: number;
  created_at: string;
};

export type StrokeRow = {
  id: string;
  round_id: string;
  hole_number: number;
  seq: number;
  stroke_type:
    | "TeeShot"
    | "Approach"
    | "Pitch"
    | "Chip"
    | "F-Bunker"
    | "G-Bunker"
    | "Putt"
    | "Penalty"
    | "Other";
  mental_ok: boolean;
  club_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function getActiveRound(
  client: SupabaseClient,
  userId: string
): Promise<RoundRow | null> {
  const { data, error } = await client
    .from("rounds")
    .select(
      "id,user_id,home_club_id,holes_count,current_hole_number,status,started_at,completed_at,created_at,updated_at"
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as RoundRow | null;
}

/**
 * Create a new round (active) and snapshot par per hole from the provided home club.
 * homeClubPars must be length = holesCount and each entry is par for hole i+1.
 */
export async function startRound(
  client: SupabaseClient,
  userId: string,
  homeClubId: string,
  holesCount: number,
  homeClubPars: number[]
): Promise<RoundRow> {
  if (holesCount < 1) throw new Error("holesCount must be >= 1");
  if (homeClubPars.length !== holesCount) {
    throw new Error("homeClubPars must match holesCount");
  }

  // Create round
  const { data: round, error: roundErr } = await client
    .from("rounds")
    .insert({
      user_id: userId,
      home_club_id: homeClubId,
      holes_count: holesCount,
      current_hole_number: 1,
      status: "active",
    })
    .select(
      "id,user_id,home_club_id,holes_count,current_hole_number,status,started_at,completed_at,created_at,updated_at"
    )
    .single();

  if (roundErr) throw roundErr;

  // Snapshot pars
  const snapshots = homeClubPars.map((par, idx) => ({
    round_id: round.id,
    hole_number: idx + 1,
    par,
  }));

  const { error: snapErr } = await client.from("round_hole_snapshot").insert(snapshots);
  if (snapErr) throw snapErr;

  return round as RoundRow;
}

export async function getRoundByIdForUser(
  supabase: any,
  userId: string,
  roundId: string
) {
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Round not found.");
  return data as RoundRow;
}

export async function listStrokesForRound(supabase: any, roundId: string) {
  const { data, error } = await supabase
    .from("strokes")
    .select("*")
    .eq("round_id", roundId)
    .order("hole_number", { ascending: true })
    .order("seq", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StrokeRow[];
}


export async function setCurrentHole(
  client: SupabaseClient,
  userId: string,
  roundId: string,
  holeNumber: number
): Promise<void> {
  const { error } = await client
    .from("rounds")
    .update({ current_hole_number: holeNumber })
    .eq("id", roundId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function completeRound(
  client: SupabaseClient,
  userId: string,
  roundId: string
): Promise<void> {
  const { error } = await client
    .from("rounds")
    .update({ status: "complete", completed_at: new Date().toISOString() })
    .eq("id", roundId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function listStrokesForHole(
  client: SupabaseClient,
  roundId: string,
  holeNumber: number
): Promise<StrokeRow[]> {
  const { data, error } = await client
    .from("strokes")
    .select(
      "id,round_id,hole_number,seq,stroke_type,mental_ok,club_id,created_at,updated_at"
    )
    .eq("round_id", roundId)
    .eq("hole_number", holeNumber)
    .order("seq", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StrokeRow[];
}

export async function getRoundMentalSummary(
  client: SupabaseClient,
  roundId: string
): Promise<{ total: number; ok: number; pct: number }> {
  // Pull minimal fields; round sizes are small
  const { data, error } = await client
    .from("strokes")
    .select("mental_ok")
    .eq("round_id", roundId);

  if (error) throw error;

  const total = (data ?? []).length;
  const ok = (data ?? []).filter((s: any) => s.mental_ok === true).length;
  const pct = total === 0 ? 0 : Math.round((ok / total) * 100);

  return { total, ok, pct };
}

export async function addStroke(
  client: SupabaseClient,
  roundId: string,
  holeNumber: number,
  strokeType: StrokeRow["stroke_type"],
  mentalOk: boolean,
  clubId: string | null
): Promise<StrokeRow> {
  // Determine next seq for this hole
  const { data: maxRow, error: maxErr } = await client
    .from("strokes")
    .select("seq")
    .eq("round_id", roundId)
    .eq("hole_number", holeNumber)
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) throw maxErr;

  const nextSeq = (maxRow?.seq ?? 0) + 1;

  const { data, error } = await client
    .from("strokes")
    .insert({
      round_id: roundId,
      hole_number: holeNumber,
      seq: nextSeq,
      stroke_type: strokeType,
      mental_ok: mentalOk,
      club_id: clubId,
    })
    .select(
      "id,round_id,hole_number,seq,stroke_type,mental_ok,club_id,created_at,updated_at"
    )
    .single();

  if (error) throw error;
  return data as StrokeRow;
}

export async function setStrokeMentalOk(
  client: SupabaseClient,
  strokeId: string,
  mentalOk: boolean
): Promise<void> {
  const { error } = await client.from("strokes").update({ mental_ok: mentalOk }).eq("id", strokeId);
  if (error) throw error;
}

export async function deleteStroke(client: SupabaseClient, strokeId: string): Promise<void> {
  const { error } = await client.from("strokes").delete().eq("id", strokeId);
  if (error) throw error;
}

export async function deleteRoundById(
  supabase: any,
  userId: string,
  roundId: string
) {
  // Safety: ensure it belongs to the user
  const { data: round, error: roundErr } = await supabase
    .from("rounds")
    .select("id,user_id,status")
    .eq("id", roundId)
    .single();

  if (roundErr) throw roundErr;
  if (!round || round.user_id !== userId) throw new Error("Not allowed.");

  // Prevent deleting an active round (optional, but safer)
  if (round.status === "active") {
    throw new Error("Can’t delete an active round. Close it first.");
  }

  // Delete strokes first (if you don’t have cascade)
  const { error: strokesErr } = await supabase.from("strokes").delete().eq("round_id", roundId);
  if (strokesErr) throw strokesErr;

  const { error: delErr } = await supabase.from("rounds").delete().eq("id", roundId);
  if (delErr) throw delErr;
}
