"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@/hooks/useSession";
import {
  createMentalElement,
  deleteMentalElementAndRepack,
  listMentalElements,
  type MentalElement,
} from "@/lib/mentalElements";

export default function MentalElementsPage() {
  const { session, isLoading, supabase } = useSession();
  const userId = session?.user.id ?? null;

  const [items, setItems] = useState<MentalElement[]>([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdd = useMemo(() => label.trim().length >= 2 && !saving, [label, saving]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const list = await listMentalElements(supabase as SupabaseClient, userId);
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
  }, [supabase, userId]);

  async function onAdd() {
    if (!userId) return;

    setSaving(true);
    setError(null);

    try {
      const created = await createMentalElement(supabase as SupabaseClient, userId, label);
      setItems((prev) => [...prev, created]);
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

    // optimistic
    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== item.id));

    try {
      await deleteMentalElementAndRepack(supabase as SupabaseClient, userId, item.id);
      const list = await listMentalElements(supabase as SupabaseClient, userId);
      setItems(list);
    } catch (e: any) {
      setItems(snapshot);
      setError(e?.message ?? "Failed to delete mental element.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container-app mode-briefing">
        <div className="meta">Loading…</div>
      </div>
    );
  }

  return (
    <div className="container-app mode-briefing">
      <div className="stack">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="stack-xs">
            <div className="title">Mental Elements</div>
            <div className="meta">Define the mental cues you want to track.</div>
          </div>

          <Link href="/account" className="btn btn-ghost btn-inline">
            Back
          </Link>
        </div>

        {/* Add */}
        <div className="card card-pad">
          <div className="section-title">Add a mental element</div>
          <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
            Keep them short (1–3 words). Example: Commitment, Routine, Breathing.
          </div>

          <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Commitment"
              disabled={saving}
              aria-label="Mental element label"
            />

            <button
              type="button"
              className="btn btn-primary"
              onClick={onAdd}
              disabled={!canAdd}
              style={{ width: "100%" }}
            >
              Add
            </button>

            {error ? <div className="meta" style={{ color: "hsl(var(--danger))" }}>{error}</div> : null}
          </div>
        </div>

        {/* List */}
        <div className="card card-pad">
          <div className="section-title">Your elements</div>

          {loading ? (
            <div className="meta" style={{ marginTop: "var(--sp-3)" }}>
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="meta" style={{ marginTop: "var(--sp-3)" }}>
              No mental elements yet. Add your first one above.
            </div>
          ) : (
            <div style={{ marginTop: "var(--sp-4)" }}>
              <div className="inset-list">
                {items.map((item) => (
                  <div key={item.id} className="inset-row">
                    <div className="body">{item.label}</div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-inline"
                      onClick={() => onDelete(item)}
                      disabled={saving}
                      aria-label={`Delete ${item.label}`}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
