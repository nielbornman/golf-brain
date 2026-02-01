import type { SupabaseClient } from "@supabase/supabase-js";

export type BagClub = {
  id: string;
  user_id: string;
  label: string;
  sort_order: number;
  bsm: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeLabel(label: string): string {
  return label.trim();
}

export async function listBagClubs(client: SupabaseClient, userId: string): Promise<BagClub[]> {
  const { data, error } = await client
    .from("bag_clubs")
    .select("id,user_id,label,sort_order,bsm,created_at,updated_at")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as BagClub[];
}

export async function createBagClub(
  client: SupabaseClient,
  userId: string,
  labelRaw: string
): Promise<BagClub> {
  const label = normalizeLabel(labelRaw);
  if (label.length < 1 || label.length > 40) {
    throw new Error("Club name must be between 1 and 40 characters.");
  }

  const { data: maxRow, error: maxErr } = await client
    .from("bag_clubs")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) throw maxErr;

  const nextSort = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await client
    .from("bag_clubs")
    .insert({ user_id: userId, label, sort_order: nextSort, bsm: null })
    .select("id,user_id,label,sort_order,bsm,created_at,updated_at")
    .single();

  if (error) throw error;
  return data as BagClub;
}

export async function updateBagClubBSM(
  client: SupabaseClient,
  userId: string,
  clubId: string,
  bsm: string
): Promise<void> {
  const { error } = await client
    .from("bag_clubs")
    .update({ bsm })
    .eq("id", clubId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteBagClubAndRepack(
  client: SupabaseClient,
  userId: string,
  clubId: string
): Promise<void> {
  const { error: delErr } = await client
    .from("bag_clubs")
    .delete()
    .eq("id", clubId)
    .eq("user_id", userId);

  if (delErr) throw delErr;

  const remaining = await listBagClubs(client, userId);

  for (let i = 0; i < remaining.length; i++) {
    const expected = i + 1;
    if (remaining[i].sort_order === expected) continue;

    const { error } = await client
      .from("bag_clubs")
      .update({ sort_order: expected })
      .eq("id", remaining[i].id)
      .eq("user_id", userId);

    if (error) throw error;
  }
}

export async function reorderBagClubs(
  client: SupabaseClient,
  userId: string,
  orderedIds: string[]
): Promise<void> {
  // Persist order as 1..N
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await client
      .from("bag_clubs")
      .update({ sort_order: i + 1 })
      .eq("id", orderedIds[i])
      .eq("user_id", userId);

    if (error) throw error;
  }
}
