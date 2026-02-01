import type { SupabaseClient } from "@supabase/supabase-js";

export type MentalElement = {
  id: string;
  user_id: string;
  label: string;
  sort_order?: number | null;
  created_at?: string | null;
};

const TABLE_CANDIDATES = ["mental_elements", "mentalElements", "mental_element"];

function normalizeRow(row: any): MentalElement {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    label: String(row.label ?? ""),
    sort_order:
      row.sort_order === undefined || row.sort_order === null ? null : Number(row.sort_order),
    created_at: row.created_at ? String(row.created_at) : null,
  };
}

async function trySelectList(supabase: SupabaseClient, userId: string) {
  let lastErr: any = null;

  for (const table of TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId);

    if (!error) return { table, data: (data ?? []) as any[] };
    lastErr = error;
  }

  throw lastErr ?? new Error("Failed to load mental elements.");
}

async function tryInsert(
  supabase: SupabaseClient,
  userId: string,
  label: string,
  sortOrder?: number | null
) {
  let lastErr: any = null;

  for (const table of TABLE_CANDIDATES) {
    const payload: any = { user_id: userId, label };
    if (sortOrder !== undefined) payload.sort_order = sortOrder;

    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select("*")
      .limit(1);

    if (!error) return { table, row: (data?.[0] as any) ?? null };
    lastErr = error;
  }

  throw lastErr ?? new Error("Failed to add mental element.");
}

async function tryDelete(supabase: SupabaseClient, userId: string, id: string) {
  let lastErr: any = null;

  for (const table of TABLE_CANDIDATES) {
    const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId);

    if (!error) return { table };
    lastErr = error;
  }

  throw lastErr ?? new Error("Failed to delete mental element.");
}

/**
 * List mental elements for the current user.
 * Sorted by sort_order if present, otherwise created_at.
 */
export async function listMentalElements(
  supabase: SupabaseClient,
  userId: string
): Promise<MentalElement[]> {
  const { data } = await trySelectList(supabase, userId);

  const items = (data ?? []).map(normalizeRow);

  // stable sort: sort_order first (if any), else created_at, else label
  items.sort((a, b) => {
    const ao = a.sort_order ?? Number.POSITIVE_INFINITY;
    const bo = b.sort_order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;

    const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (ad !== bd) return ad - bd;

    return a.label.localeCompare(b.label);
  });

  return items;
}

/**
 * Add a mental element for the current user.
 */
export async function addMentalElement(
  supabase: SupabaseClient,
  userId: string,
  label: string
): Promise<MentalElement> {
  const clean = label.trim();
  if (!clean) throw new Error("Label is required.");

  const { row } = await tryInsert(supabase, userId, clean);
  if (!row) throw new Error("Failed to add mental element.");

  return normalizeRow(row);
}

/**
 * Delete a mental element for the current user.
 */
export async function deleteMentalElement(
  supabase: SupabaseClient,
  userId: string,
  elementId: string
): Promise<void> {
  if (!elementId) return;
  await tryDelete(supabase, userId, elementId);
}
