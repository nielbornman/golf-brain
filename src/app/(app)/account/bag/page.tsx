"use client";

import Link from "next/link";
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

export default function BagPage() {
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

  async function refresh() {
    if (!userId) return;
    const list = await listBagClubs(supabase, userId);
    setItems(list);
  }

  async function onAdd() {
    if (!userId) return;

    setSaving(true);
    setError(null);

    try {
      const created = await createBagClub(supabase, userId, label);
      setItems((prev) => [...prev, created]);
      setLabel("");
    } catch (e: any) {
      const msg = e?.message ?? "Failed to add club.";
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        setError("That club already exists.");
      } else {
        setError(msg);
      }
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

    // optimistic remove
    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== item.id));

    try {
      await deleteBagClubAndRepack(supabase, userId, item.id);
      await refresh();
    } catch (e: any) {
      setItems(snapshot);
      setError(e?.message ?? "Failed to delete club.");
    } finally {
      setSaving(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    if (!userId) return;
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;

    // swap
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;

    setItems(next);
    setSaving(true);
    setError(null);

    try {
      await reorderBagClubs(supabase, userId, next.map((x) => x.id));
    } catch (e: any) {
      setError(e?.message ?? "Failed to save order.");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function onSaveBSM(item: BagClub, bsm: string) {
    if (!userId) return;

    setSaving(true);
    setError(null);

    // optimistic
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, bsm } : x)));

    try {
      await updateBagClubBSM(supabase, userId, item.id, bsm);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save BSM.");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-app mode-briefing">
      <div className="stack">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="title">Bag + Best Shot Memory</h1>
            <div className="meta">Add clubs you carry and store a best-shot cue for each.</div>
          </div>

          <Link href="/account" className="btn btn-ghost btn-inline">
            Back
          </Link>
        </div>

        {/* Main card */}
        <div className="card card-pad">
          <div className="stack-xs">
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Add a club (e.g., 7 iron)"
              disabled={loading || saving}
              aria-label="Club label"
            />

            <button className="btn btn-primary" onClick={onAdd} disabled={!canAdd || loading}>
              Add
            </button>

            {error ? (
              <div className="meta" style={{ color: "hsl(var(--danger))" }}>
                {error}
              </div>
            ) : null}
          </div>

          <div className="divider" style={{ marginTop: "var(--sp-5)" }} />

          {loading ? (
            <div className="meta" style={{ marginTop: "var(--sp-4)" }}>
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="meta" style={{ marginTop: "var(--sp-4)" }}>
              No clubs yet. Add your first one.
            </div>
          ) : (
            <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
              {items.map((item, idx) => (
                <div key={item.id} className="card" style={{ padding: "var(--sp-4)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="body">{item.label}</div>

                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-ghost btn-inline"
                        onClick={() => move(idx, -1)}
                        disabled={saving || idx === 0}
                        type="button"
                        aria-label={`Move ${item.label} up`}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        className="btn btn-ghost btn-inline"
                        onClick={() => move(idx, 1)}
                        disabled={saving || idx === items.length - 1}
                        type="button"
                        aria-label={`Move ${item.label} down`}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        className="btn btn-ghost btn-inline"
                        onClick={() => onDelete(item)}
                        disabled={saving}
                        type="button"
                        aria-label={`Delete ${item.label}`}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: "var(--sp-3)" }}>
                    <div className="meta">Best Shot Memory</div>
                    <textarea
                      className="textarea"
                      defaultValue={item.bsm ?? ""}
                      placeholder="Best Shot Memory (optional)…"
                      rows={2}
                      disabled={saving}
                      onBlur={(e) => onSaveBSM(item, e.target.value)}
                      aria-label={`Best shot memory for ${item.label}`}
                      style={{ marginTop: "var(--sp-2)" }}
                    />
                    <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                      Saved on blur.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="meta">
          Scorecard reads BSM cues from this list (selected club).
        </div>
      </div>
    </div>
  );
}
