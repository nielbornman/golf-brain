"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ui } from "@/lib/uiClasses";
import {
  createMentalElement,
  deleteMentalElementAndRepack,
  listMentalElements,
  type MentalElement,
} from "@/lib/mentalElements";

type Props = {
  supabase: SupabaseClient;
};

export default function MentalElementsSection({ supabase }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<MentalElement[]>([]);
  const [label, setLabel] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdd = useMemo(() => label.trim().length >= 2 && !saving, [label, saving]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        if (!cancelled) setError(userErr.message);
        if (!cancelled) setLoading(false);
        return;
      }

      const uid = data.user?.id ?? null;
      if (!uid) {
        if (!cancelled) setError("Not authenticated.");
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled) setUserId(uid);

      try {
        const list = await listMentalElements(supabase, uid);
        if (!cancelled) setItems(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load mental elements.");
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
      const created = await createMentalElement(supabase, userId, label);
      setItems((prev) => [...prev, created]); // append to bottom
      setLabel("");
    } catch (e: any) {
      const msg = e?.message ?? "Failed to add mental element.";
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        setError("That mental element already exists.");
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item: MentalElement) {
    if (!userId) return;

    const ok = window.confirm(`Delete “${item.label}”?`);
    if (!ok) return;

    setSaving(true);
    setError(null);

    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== item.id)); // optimistic

    try {
      await deleteMentalElementAndRepack(supabase, userId, item.id);
      const list = await listMentalElements(supabase, userId); // reflect repack
      setItems(list);
    } catch (e: any) {
      setItems(snapshot);
      setError(e?.message ?? "Failed to delete mental element.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={ui.section}>
      <h2 className={ui.sectionTitle}>Mental Elements</h2>
      <p className={ui.sectionHelp}>Define the mental cues you want to track.</p>

      <div className={ui.fieldRow}>
        <input
          className={ui.input}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Add a mental element (e.g., Commitment)"
          disabled={loading || saving}
          aria-label="Mental element label"
        />
        <button
          className={ui.buttonPrimary}
          onClick={onAdd}
          disabled={!canAdd || loading}
          type="button"
        >
          Add
        </button>
      </div>

      {error ? <div className={ui.errorText}>{error}</div> : null}

      {loading ? (
        <div className={ui.emptyText}>Loading…</div>
      ) : items.length === 0 ? (
        <div className={ui.emptyText}>No mental elements yet. Add your first one.</div>
      ) : (
        <div className={ui.list}>
          {items.map((item) => (
            <div key={item.id} className={ui.listItem}>
              <div className={ui.listItemText}>{item.label}</div>
              <button
                className={ui.iconButton}
                onClick={() => onDelete(item)}
                disabled={saving}
                type="button"
                aria-label={`Delete ${item.label}`}
                title="Delete"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
