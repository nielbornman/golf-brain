"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  createBagClub,
  deleteBagClubAndRepack,
  listBagClubs,
  reorderBagClubs,
  updateBagClubBSM,
  type BagClub,
} from "@/lib/bagClubs";

export default function BagSection() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = useState<string | null>(null);

  const [items, setItems] = useState<BagClub[]>([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdd = label.trim().length >= 1 && !saving;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: userErr } = await supabase.auth.getUser();
      if (userErr || !data.user) {
        if (!cancelled) setError("Not authenticated.");
        if (!cancelled) setLoading(false);
        return;
      }

      const uid = data.user.id;
      if (!cancelled) setUserId(uid);

      try {
        const list = await listBagClubs(supabase, uid);
        if (!cancelled) setItems(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load bag.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function onAdd() {
    if (!userId) return;
    setSaving(true);
    setError(null);

    try {
      const created = await createBagClub(supabase, userId, label);
      setItems((prev) => [...prev, created]);
      setLabel("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to add club.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item: BagClub) {
    if (!userId) return;
    const ok = window.confirm(`Delete “${item.label}”?`);
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      await deleteBagClubAndRepack(supabase, userId, item.id);
      const list = await listBagClubs(supabase, userId);
      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete club.");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveBSM(item: BagClub, bsm: string) {
    if (!userId) return;
    setSaving(true);
    setError(null);

    try {
      await updateBagClubBSM(supabase, userId, item.id, bsm);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save BSM.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card card-pad">
      <div className="section-title">Clubs</div>

      <div className="stack-xs" style={{ marginTop: "var(--sp-3)" }}>
        <input
          className="input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Add a club (e.g., 7 iron)"
          disabled={loading || saving}
        />

        <button
          className="btn btn-primary"
          onClick={onAdd}
          disabled={!canAdd || loading}
        >
          Add
        </button>
      </div>

      {error && <div className="meta" style={{ color: "hsl(var(--danger))" }}>{error}</div>}

      <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
        {items.map((item) => (
          <div key={item.id} className="row">
            <div className="body">{item.label}</div>
            <button
              className="btn btn-ghost"
              onClick={() => onDelete(item)}
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
