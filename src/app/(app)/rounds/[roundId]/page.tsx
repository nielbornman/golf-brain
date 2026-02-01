"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import {
  deleteRoundById,
  getRoundByIdForUser,
  listStrokesForRound,
  type RoundRow,
  type StrokeRow,
} from "@/lib/rounds";

type ConfirmState =
  | null
  | {
      title: string;
      body?: string;
      confirmLabel?: string;
      danger?: boolean;
      onConfirm: () => Promise<void> | void;
    };

function ConfirmModal({
  open,
  onClose,
  title,
  body,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  busy: boolean;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "var(--sp-4)",
        zIndex: 50,
      }}
    >
      <div className="card card-pad" style={{ width: "100%", maxWidth: 520 }}>
        <div className="stack-xs">
          <div>
            <div className="section-title">{title}</div>
            {body ? (
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                {body}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3" style={{ marginTop: "var(--sp-2)" }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={busy}
              style={{ width: "100%" }}
            >
              Cancel
            </button>

            <button
              type="button"
              className={danger ? "btn btn-danger" : "btn btn-primary"}
              onClick={onConfirm}
              disabled={busy}
              style={{ width: "100%" }}
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDateFull(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function displayStrokeType(t: StrokeRow["stroke_type"]) {
  if (t === "Pitch") return "Lay up";
  if (t === "Chip") return "Pitch/Chip";
  return t;
}

export default function RoundDetailsPage() {
  const router = useRouter();
  const params = useParams<{ roundId: string }>();
  const roundId = params?.roundId ?? "";

  const { session, isLoading, supabase } = useSession();
  const userId = session?.user.id ?? null;

  const [round, setRound] = useState<RoundRow | null>(null);
  const [strokes, setStrokes] = useState<StrokeRow[]>([]);
  const [expandedHole, setExpandedHole] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId || !roundId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const r = await getRoundByIdForUser(supabase, userId, roundId);
        const s = await listStrokesForRound(supabase, roundId);

        if (cancelled) return;
        setRound(r);
        setStrokes(s);
        setExpandedHole(null);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load round.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId, roundId]);

  const courseName = useMemo(() => {
    // v1 assumption: rounds are played at Home Club (single course)
    return "Home Club";
  }, []);

  const totals = useMemo(() => {
    const totalStrokes = strokes.length;
    const mfYes = strokes.filter((s) => !!s.mental_ok).length;
    const mfPct = totalStrokes === 0 ? 0 : Math.round((mfYes / totalStrokes) * 100);
    return { totalStrokes, mfYes, mfPct };
  }, [strokes]);

  const byHole = useMemo(() => {
    const holesCount = round?.holes_count ?? 18;
    const map = new Map<number, StrokeRow[]>();

    for (const s of strokes) {
      const h = Number(s.hole_number);
      if (!map.has(h)) map.set(h, []);
      map.get(h)!.push(s);
    }

    // ensure ordering & seq ordering within hole
    const rows: Array<{
      hole: number;
      strokes: StrokeRow[];
      strokeCount: number;
      mfYes: number;
    }> = [];

    for (let h = 1; h <= holesCount; h += 1) {
      const list = (map.get(h) ?? []).slice().sort((a, b) => a.seq - b.seq);
      const mfYes = list.filter((x) => !!x.mental_ok).length;
      rows.push({ hole: h, strokes: list, strokeCount: list.length, mfYes });
    }

    return rows;
  }, [strokes, round?.holes_count]);

  if (isLoading || loading) {
    return (
      <div className="container-app mode-briefing">
        <div className="stack">
          <div className="card card-pad">
            <div className="meta">Loading…</div>
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="container-app mode-briefing">
        <div className="stack">
          <div className="card card-pad">
            <div className="meta">Please sign in.</div>
          </div>
          <Link className="btn btn-primary" href="/login">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (err || !round) {
    return (
      <div className="container-app mode-briefing">
        <div className="stack">
          <div className="card card-pad">
            <div className="section-title">Round not found</div>
            <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
              {err ?? "This round may have been deleted."}
            </div>
          </div>
          <Link className="btn btn-ghost" href="/dashboard">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const dateLabel = round.completed_at ? formatDateFull(round.completed_at) : "Not completed";

  return (
    <div className="container-app mode-briefing">
      <div className="stack">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <Link href="/dashboard" className="btn btn-ghost btn-inline">
            ← Dashboard
          </Link>

          <div style={{ flex: 1, textAlign: "center" }}>
            <div className="title" style={{ fontSize: 18 }}>
              Round
            </div>
            <div className="meta" style={{ marginTop: 2 }}>
              Details
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-inline"
            style={{ borderColor: "hsl(var(--danger))", color: "hsl(var(--danger))" }}
            disabled={busy}
            onClick={() => {
              setConfirm({
                title: "Delete round?",
                body: "This will permanently remove the round and its strokes.",
                confirmLabel: "Delete",
                danger: true,
                onConfirm: async () => {
                  setBusy(true);
                  setErr(null);
                  try {
                    await deleteRoundById(supabase, userId, round.id);
                    setConfirm(null);
                    router.replace("/dashboard");
                  } catch (e: any) {
                    setErr(e?.message ?? "Failed to delete round.");
                  } finally {
                    setBusy(false);
                  }
                },
              });
            }}
          >
            🗑
          </button>
        </div>

        {err ? (
          <div className="card card-pad" style={{ borderColor: "hsl(var(--danger))" }}>
            <div className="meta" style={{ color: "hsl(var(--danger))" }}>
              {err}
            </div>
          </div>
        ) : null}

        {/* Summary */}
        <div className="card-hero card-pad">
          <div className="body" style={{ fontWeight: 700, whiteSpace: "normal" }}>
            {courseName}
          </div>
          <div className="meta" style={{ marginTop: "var(--sp-2)", fontSize: 12 }}>
            {dateLabel}
          </div>

          <div className="flex items-center gap-2" style={{ marginTop: "var(--sp-4)" }}>
            <div className="pill pill-success">MF {totals.mfPct}%</div>
            <div className="pill pill-neutral">{totals.totalStrokes} strokes</div>
          </div>
        </div>

        {/* Holes */}
        <div className="card card-pad">
          <div className="section-title">Holes</div>
          <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
            Tap a hole to expand strokes (read-only).
          </div>

          <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
            {byHole.map((h) => {
              const open = expandedHole === h.hole;
              const mfPct = h.strokeCount === 0 ? 0 : Math.round((h.mfYes / h.strokeCount) * 100);


              return (
                <div key={h.hole} className="card" style={{ padding: 0 }}>
                  <button
                    type="button"
                    className="row row-compact"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      cursor: "pointer",
                      background: "transparent",
                      border: "none",
                      padding: "var(--sp-3)",
                    }}
                    onClick={() => setExpandedHole(open ? null : h.hole)}
                  >
                    <div style={{ flex: 1 }}>
  <div className="body">Hole {h.hole}</div>
  <div className="meta" style={{ marginTop: 2, fontSize: 12 }}>
    Tap to view strokes
  </div>
</div>

<div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
  <div className="pill pill-success">MF {mfPct}%</div>
  <div className="pill pill-neutral">{h.strokeCount} strokes</div>
</div>

                  </button>

                  {open ? (
                    <div style={{ padding: "0 var(--sp-3) var(--sp-3)" }}>
                      {h.strokes.length === 0 ? (
                        <div className="meta">No strokes recorded.</div>
                      ) : (
                        <div className="stack-xs">
                          {h.strokes.map((s) => (
                            <div key={s.id} className="row row-compact">
                              <div style={{ minWidth: 0 }}>
                                <div className="body">
                                  {s.seq}. {displayStrokeType(s.stroke_type)}
                                </div>
                                <div className="meta" style={{ fontSize: 12, marginTop: 2 }}>
                                  {s.mental_ok ? "MF ✓" : "MF —"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.title ?? ""}
        body={confirm?.body}
        confirmLabel={confirm?.confirmLabel}
        danger={!!confirm?.danger}
        busy={busy}
        onConfirm={async () => {
          if (!confirm) return;
          await confirm.onConfirm();
        }}
      />
    </div>
  );
}
