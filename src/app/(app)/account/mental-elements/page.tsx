"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import {
  listMentalElements,
  addMentalElement,
  deleteMentalElement,
} from "@/lib/mentalElements";

type MentalElement = {
  id: string;
  label: string;
};

function dangerText(msg: string) {
  return (
    <div className="meta" style={{ color: "hsl(var(--danger))" }}>
      {msg}
    </div>
  );
}

export default function MentalElementsPage() {
  const { session, isLoading, supabase } = useSession();
  const userId = session?.user.id;

  const [items, setItems] = useState<MentalElement[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ SAFE LOAD — never call lib with null userId
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userId) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const list = await listMentalElements(supabase, userId);
        if (!cancelled) setItems(list);
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message ?? "Failed to load mental elements.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!isLoading) void load();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId, isLoading]);

  async function onAdd() {
    if (!userId) return;

    const label = newLabel.trim();
    if (!label) return;

    setSaving(true);
    setError(null);

    try {
      await addMentalElement(supabase, userId, label);
      setNewLabel("");
      const list = await listMentalElements(supabase, userId);
      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? "Failed to add mental element.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!userId) return;

    setSaving(true);
    setError(null);

    try {
      await deleteMentalElement(supabase, id);
      const list = await listMentalElements(supabase, userId);
      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete mental element.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="container-app mode-briefing">
        <div className="card card-pad">
          <div className="meta">Loading…</div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="container-app mode-briefing">
        <div className="stack">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="title">Mental Elements</h1>
              <div className="meta">Sign in required.</div>
            </div>
            <Link href="/login" className="btn btn-ghost btn-inline">
              Login
            </Link>
          </div>

          <div className="card card-pad">
            <div className="meta">
              Please sign in to manage your mental elements.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app mode-briefing">
      <div className="stack">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="title">Mental Elements</h1>
            <div className="meta">
              Cues you want to track (e.g. Commitment, Target).
            </div>
          </div>

          <Link href="/account" className="btn btn-ghost btn-inline">
            Back
          </Link>
        </div>

        {error ? dangerText(error) : null}

        <div className="card card-pad">
          <div className="section-title">Add element</div>

          <div className="stack-xs" style={{ marginTop: "var(--sp-3)" }}>
            <input
              className="input"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Commitment"
              disabled={saving}
            />

            <button
              type="button"
              className="btn btn-primary"
              onClick={onAdd}
              disabled={saving || !newLabel.trim()}
              style={{ width: "100%" }}
            >
              {saving ? "Saving…" : "Add"}
            </button>
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-title">Your elements</div>

          <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
            {items.length === 0 ? (
              <div className="meta">No mental elements yet.</div>
            ) : (
              items.map((it, idx) => (
                <div key={it.id} className="row row-compact">
                  <div className="body">
                    {idx + 1}. {it.label}
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost btn-inline"
                    onClick={() => onDelete(it.id)}
                    disabled={saving}
                    aria-label={`Delete ${it.label}`}
                    title="Delete"
                    style={{ width: 44, paddingLeft: 0, paddingRight: 0 }}
                  >
                    🗑
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
