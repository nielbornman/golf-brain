"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useSession } from "@/hooks/useSession";
import {
  listMentalElements,
  createMentalElement,
  deleteMentalElementAndRepack,
  type MentalElement,
} from "@/lib/mentalElements";

function dangerText(msg: string) {
  return (
    <div className="meta" style={{ color: "hsl(var(--danger))" }}>
      {msg}
    </div>
  );
}

export default function MentalElementsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { session, isLoading } = useSession();
  const userId = session?.user.id; // string | undefined

  const [items, setItems] = useState<MentalElement[]>([]);
  const [label, setLabel] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh(uid: string) {
    const list = await listMentalElements(supabase, uid);
    setItems(list);
  }

  useEffect(() => {
    if (isLoading) return;

    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const uid = userId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

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
  }, [supabase, userId, isLoading]);

  async function onAdd() {
    if (!userId) return;
    const uid = userId;

    const clean = label.trim();
    if (!clean) return;

    setSaving(true);
    setError(null);

    try {
      await createMentalElement(supabase, uid, clean);
      setLabel("");
      await refresh(uid);
    } catch (e: any) {
      setError(e?.message ?? "Failed to add mental element.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(elementId: string) {
    if (!userId) return;
    const uid = userId;

    setSaving(true);
    setError(null);

    try {
      await deleteMentalElementAndRepack(supabase, uid, elementId);
      await refresh(uid);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete mental element.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-app mode-briefing">
      <div className="stack">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="title">Mental Elements</h1>
            <div className="meta">Your cues for Mental Focus during a round.</div>
          </div>

          <Link href="/account" className="btn btn-ghost btn-inline">
            Back
          </Link>
        </div>

        {error ? dangerText(error) : null}

        <div className="card card-pad">
          <div className="section-title">Add element</div>
          <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
            Keep it short (2–40 chars). Examples: Commitment, Target, Tempo.
          </div>

          <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Commitment"
              disabled={saving || !userId}
            />

            <button
              type="button"
              onClick={onAdd}
              disabled={saving || !userId || label.trim().length === 0}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              {saving ? "Saving…" : "Add"}
            </button>
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-title">Your elements</div>
          <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
            These appear as cues on the Scorecard.
          </div>

          {loading ? (
            <div className="meta" style={{ marginTop: "var(--sp-4)" }}>
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="meta" style={{ marginTop: "var(--sp-4)" }}>
              No elements yet.
            </div>
          ) : (
            <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
              {items.map((m, idx) => (
                <div key={m.id} className="row row-compact">
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="body"
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {idx + 1}. {m.label}
                    </div>
                    <div className="meta">Cue</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDelete(m.id)}
                    disabled={saving}
                    className="btn btn-ghost btn-inline"
                    aria-label={`Delete ${m.label}`}
                    title="Delete"
                    style={{ width: 44, paddingLeft: 0, paddingRight: 0 }}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {!userId ? (
          <div className="card card-pad">
            <div className="meta">You must be signed in to manage mental elements.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
