import type { SupabaseClient } from "@supabase/supabase-js";

export type MentalElement = {
  id: string;
  user_id: string;
  label: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function normalizeLabel(label: string): string {
  return label.trim();
}

export async function listMentalElements(
  client: SupabaseClient,
  userId: string
): Promise<MentalElement[]> {
  const { data, error } = await client
    .from("mental_elements")
    .select("id,user_id,label,sort_order,created_at,updated_at")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MentalElement[];
}

export async function createMentalElement(
  client: SupabaseClient,
  userId: string,
  labelRaw: string
): Promise<MentalElement> {
  const label = normalizeLabel(labelRaw);
  if (label.length < 2 || label.length > 40) {
    throw new Error("Label must be between 2 and 40 characters.");
  }

  // Append-to-bottom ordering
  const { data: maxRow, error: maxErr } = await client
    .from("mental_elements")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) throw maxErr;

  const nextSort = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await client
    .from("mental_elements")
    .insert({
      user_id: userId,
      label,
      sort_order: nextSort,
    })
    .select("id,user_id,label,sort_order,created_at,updated_at")
    .single();

  if (error) throw error;
  return data as MentalElement;
}

/**
 * Delete an element, then repack remaining to sort_order = 1..N (gap-free).
 */
export async function deleteMentalElementAndRepack(
  client: SupabaseClient,
  userId: string,
  elementId: string
): Promise<void> {
  const { error: delErr } = await client
    .from("mental_elements")
    .delete()
    .eq("id", elementId)
    .eq("user_id", userId);

  if (delErr) throw delErr;

  const remaining = await listMentalElements(client, userId);

  // Repack sequentially (stable + clear)
  for (let i = 0; i < remaining.length; i++) {
    const id = remaining[i].id;
    const newSort = i + 1;

    if (remaining[i].sort_order === newSort) continue;

    const { error: updErr } = await client
      .from("mental_elements")
      .update({ sort_order: newSort })
      .eq("id", id)
      .eq("user_id", userId);

    if (updErr) throw updErr;
  }
}
