"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useHomeClub } from "@/hooks/useHomeClub";
import { SetupRequired } from "@/components/app/SetupRequired";
import { listBagClubs, type BagClub } from "@/lib/bagClubs";
import {
  addStroke,
  completeRound,
  getActiveRound,
  getRoundMentalSummary,
  listStrokesForHole,
  setCurrentHole,
  setStrokeMentalOk,
  startRound,
  deleteStroke,
  type RoundRow,
  type StrokeRow,
} from "@/lib/rounds";
import { listMentalElements, type MentalElement } from "@/lib/mentalElements";

const STROKE_TYPES: StrokeRow["stroke_type"][] = [
  "TeeShot",
  "Approach",
  "Pitch",
  "Chip",
  "F-Bunker",
  "G-Bunker",
  "Putt",
  "Penalty",
  "Other",
];

function displayStrokeType(t: StrokeRow["stroke_type"]) {
  if (t === "Pitch") return "Lay up";
  if (t === "Chip") return "Pitch/Chip";
  return t;
}

function roundKey(roundId: string) {
  return `gb_active_round_${roundId}`;
}

function dangerText(msg: string) {
  return (
    <div className="meta" style={{ color: "hsl(var(--danger))" }}>
      {msg}
    </div>
  );
}

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

export default function ScorecardPage() {
  const { session, isLoading, supabase } = useSession();

  // IMPORTANT: keep userId as string | null, but never pass it where string is required unless guarded.
  const userId = session?.user.id ?? null;

  const homeClub = useHomeClub(userId ?? undefined);

  const [round, setRound] = useState<RoundRow | null>(null);
  const [activeHole, setActiveHole] = useState<number>(1);
  const [strokes, setStrokes] = useState<StrokeRow[]>([]);
  const [mentalPct, setMentalPct] = useState<number>(0);

  const [mentalElements, setMentalElements] = useState<MentalElement[]>([]);
  const [loadingElements, setLoadingElements] = useState(true);

  const [bag, setBag] = useState<BagClub[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>("");

  const [loadingRound, setLoadingRound] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const selectedClub = useMemo(
    () => bag.find((c) => c.id === selectedClubId) ?? null,
    [bag, selectedClubId]
  );

  // Load mental elements (for cues) — ✅ guard userId
  useEffect(() => {
    if (!userId) {
      setMentalElements([]);
      setLoadingElements(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoadingElements(true);
      try {
        const list = await listMentalElements(supabase, userId);
        if (!cancelled) setMentalElements(list);
      } catch {
        if (!cancelled) setMentalElements([]);
      } finally {
        if (!cancelled) setLoadingElements(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  // Load bag clubs — ✅ guard userId
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function loadBag() {
      try {
        const list = await listBagClubs(supabase, userId);
        if (cancelled) return;
        setBag(list);
        setSelectedClubId(list[0]?.id ?? "");
      } catch {
        // bag optional
      }
    }

    void loadBag();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  // Load or resume active round — ✅ guard userId
  useEffect(() => {
    if (!userId) {
      setRound(null);
      setActiveHole(1);
      setStrokes([]);
      setMentalPct(0);
      setLoadingRound(false);
      return;
    }
    if (homeClub.status !== "present") return;

    let cancelled = false;

    async function loadRound() {
      setLoadingRound(true);
      setError(null);

      try {
        const active = await getActiveRound(supabase, userId);
        if (cancelled) return;

        if (!active) {
          setRound(null);
          setActiveHole(1);
          setStrokes([]);
          setMentalPct(0);
          setLoadingRound(false);
          return;
        }

        setRound(active);

        const stored = localStorage.getItem(roundKey(active.id));
        const parsed = stored ? Number(stored) : NaN;
        const holeToUse =
          Number.isFinite(parsed) && parsed >= 1 ? parsed : active.current_hole_number;

        setActiveHole(holeToUse);

        const list = await listStrokesForHole(supabase, active.id, holeToUse);
        if (cancelled) return;
        setStrokes(list);

        const summary = await getRoundMentalSummary(supabase, active.id);
        if (cancelled) return;
        setMentalPct(summary.pct);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load round.");
      } finally {
        if (!cancelled) setLoadingRound(false);
      }
    }

    void loadRound();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId, homeClub.status]);

  // Persist active hole
  useEffect(() => {
    if (!round) return;
    localStorage.setItem(roundKey(round.id), String(activeHole));
  }, [round, activeHole]);

  async function refreshHole(roundId: string, holeNumber: number) {
    const list = await listStrokesForHole(supabase, roundId, holeNumber);
    setStrokes(list);

    const summary = await getRoundMentalSummary(supabase, roundId);
    setMentalPct(summary.pct);
  }

  async function onStartRound() {
    if (!userId) return;
    if (homeClub.status !== "present") return;

    setSaving(true);
    setError(null);

    try {
      const created = await startRound(
        supabase,
        userId,
        homeClub.id,
        homeClub.holesCount,
        homeClub.pars
      );

      setRound(created);
      setActiveHole(1);
      setStrokes([]);
      setMentalPct(0);
      localStorage.setItem(roundKey(created.id), "1");
    } catch (e: any) {
      setError(e?.message ?? "Failed to start round.");
    } finally {
      setSaving(false);
    }
  }

  async function onAddStroke(strokeType: StrokeRow["stroke_type"]) {
    if (!round) return;

    setSaving(true);
    setError(null);

    try {
      await addStroke(supabase, round.id, activeHole, strokeType, false, selectedClubId || null);
      await refreshHole(round.id, activeHole);
    } catch (e: any) {
      setError(e?.message ?? "Failed to add stroke.");
    } finally {
      setSaving(false);
    }
  }

  async function onToggleMental(stroke: StrokeRow) {
    setSaving(true);
    setError(null);

    try {
      await setStrokeMentalOk(supabase, stroke.id, !stroke.mental_ok);
      if (round) await refreshHole(round.id, activeHole);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update MF.");
    } finally {
      setSaving(false);
    }
  }

  // ✅ immediate delete (no confirm)
  async function onDeleteStroke(stroke: StrokeRow) {
    setSaving(true);
    setError(null);

    try {
      await deleteStroke(supabase, stroke.id);
      if (round) await refreshHole(round.id, activeHole);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete stroke.");
    } finally {
      setSaving(false);
    }
  }

  async function goToHole(holeNumber: number) {
    if (!round || !userId) return;
    if (holeNumber < 1 || holeNumber > round.holes_count) return;

    setSaving(true);
    setError(null);

    try {
      setActiveHole(holeNumber);
      await setCurrentHole(supabase, userId, round.id, holeNumber);
      await refreshHole(round.id, holeNumber);
    } catch (e: any) {
      setError(e?.message ?? "Failed to change hole.");
    } finally {
      setSaving(false);
    }
  }

  async function onCompleteRound() {
    if (!round || !userId) return;

    setConfirm({
      title: "Complete round?",
      body: "This will close the round and update the Dashboard.",
      confirmLabel: "Complete",
      danger: false,
      onConfirm: async () => {
        setSaving(true);
        setError(null);

        try {
          await completeRound(supabase, userId, round.id);
          localStorage.removeItem(roundKey(round.id));
          setRound(null);
          setActiveHole(1);
          setStrokes([]);
          setMentalPct(0);
          setConfirm(null);
        } catch (e: any) {
          setError(e?.message ?? "Failed to complete round.");
        } finally {
          setSaving(false);
        }
      },
    });
  }

  // Gate: session loading OR homeclub loading OR round loading
  if (isLoading || homeClub.status === "loading" || loadingRound) {
    return (
      <div className="container-app mode-performance">
        <div className="meta">Loading…</div>
      </div>
    );
  }

  // If not signed in, route gently
  if (!userId) {
    return (
      <div className="container-app mode-performance">
        <div className="stack">
          <div>
            <h1 className="title">Scorecard</h1>
            <div className="meta">Sign in required.</div>
          </div>
        </div>
      </div>
    );
  }

  // Setup gate
  if (homeClub.status === "missing") {
    return (
      <div className="container-app mode-performance">
        <div className="stack">
          <div>
            <h1 className="title">Scorecard</h1>
            <div className="meta">Setup required.</div>
          </div>
          <SetupRequired />
        </div>
      </div>
    );
  }

  const holeLine = round
    ? `Hole ${activeHole} / ${round.holes_count} • ${homeClub.name}`
    : homeClub.name;

  return (
    <div className="container-app mode-performance">
      <div className="stack">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="title">Scorecard</h1>
            <div className="meta">One hole at a time.</div>
          </div>

          {round ? (
            <button
              type="button"
              onClick={onCompleteRound}
              disabled={saving}
              className="btn btn-primary btn-inline"
            >
              Close round
            </button>
          ) : null}
        </div>

        {error ? dangerText(error) : null}

        {/* Mental Focus */}
        <div className="card-hero card-pad">
          <div className="section-title">Mental Focus</div>
          <div className="body" style={{ marginTop: "var(--sp-2)" }}>
            {mentalPct}%
          </div>

          <div className="meta" style={{ marginTop: "var(--sp-3)" }}>
            {loadingElements
              ? "Loading cues…"
              : mentalElements.length === 0
              ? "No mental elements yet — add them in Account."
              : mentalElements.map((m) => m.label).join(" • ")}
          </div>
        </div>

        {!round ? (
          <div className="card card-pad">
            <div className="section-title">Start a round</div>
            <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
              Begin tracking strokes and mental focus.
            </div>

            <button
              type="button"
              onClick={onStartRound}
              disabled={saving}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "var(--sp-4)" }}
            >
              {saving ? "Starting…" : "Start Round"}
            </button>
          </div>
        ) : (
          <>
            {/* Hole */}
            <div className="card card-pad">
              <div className="section-title">Hole {activeHole}</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                {holeLine}
              </div>

              {strokes.length === 0 ? (
                <div className="meta" style={{ marginTop: "var(--sp-3)" }}>
                  No strokes yet.
                </div>
              ) : (
                <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
                  {strokes.map((s) => (
                    <div key={s.id} className="row" style={{ alignItems: "stretch" }}>
                      <div style={{ minWidth: 0 }}>
                        <div
                          className="body"
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {s.seq}. {displayStrokeType(s.stroke_type)}
                        </div>
                        <div className="meta">MF: {s.mental_ok ? "Yes" : "No"}</div>
                      </div>

                      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => onToggleMental(s)}
                          disabled={saving}
                          className={`btn btn-ghost gb-mf-btn ${s.mental_ok ? "is-on" : ""}`}
                          style={{
                            minHeight: 44,
                            padding: "8px 12px",
                            borderRadius: "var(--r-sm)",
                            border: "1px solid hsl(var(--border))",
                            fontWeight: 700,
                            letterSpacing: 0.2,
                            cursor: saving ? "not-allowed" : "pointer",
                          }}
                        >
                          {s.mental_ok ? "MF ✓" : "MF"}
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteStroke(s)}
                          disabled={saving}
                          className="btn btn-ghost"
                          style={{
                            minHeight: 44,
                            width: 44,
                            padding: 0,
                            cursor: saving ? "not-allowed" : "pointer",
                          }}
                          aria-label="Delete stroke"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Embedded hole nav */}
              <div
                className="flex items-center justify-between gap-3"
                style={{ marginTop: "var(--sp-4)" }}
              >
                <button
                  type="button"
                  onClick={() => goToHole(activeHole - 1)}
                  disabled={saving || activeHole <= 1}
                  className="btn btn-ghost"
                  style={{
                    width: "100%",
                    cursor: saving || activeHole <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  onClick={() => goToHole(activeHole + 1)}
                  disabled={saving || activeHole >= round.holes_count}
                  className="btn btn-ghost"
                  style={{
                    width: "100%",
                    cursor:
                      saving || activeHole >= round.holes_count ? "not-allowed" : "pointer",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Add stroke */}
            <div className="card card-pad">
              <div className="section-title">Add stroke</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                Tap to add (defaults to MF: No).
              </div>

              <div
                className="grid"
                style={{
                  marginTop: "var(--sp-4)",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "var(--sp-2)",
                }}
              >
                {STROKE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onAddStroke(t)}
                    disabled={saving}
                    className="btn btn-ghost"
                    style={{ width: "100%", paddingLeft: 10, paddingRight: 10 }}
                  >
                    <span className="meta" style={{ color: "hsl(var(--text))" }}>
                      {displayStrokeType(t)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Best Shot Memory */}
            <div className="card card-pad">
              <div className="section-title">Best Shot Memory</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                Optional cue for your next stroke.
              </div>

              {bag.length === 0 ? (
                <div className="meta" style={{ marginTop: "var(--sp-3)" }}>
                  Add clubs in Account → Bag to see BSM cues here.
                </div>
              ) : (
                <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
                  <select
                    className="input"
                    value={selectedClubId}
                    onChange={(e) => setSelectedClubId(e.target.value)}
                    disabled={saving}
                    aria-label="Select club"
                  >
                    {bag.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <div
                    className="body"
                    style={{
                      background: "hsl(var(--bg-muted))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--r-sm)",
                      padding: "var(--sp-4)",
                    }}
                  >
                    {selectedClub?.bsm ? `“${selectedClub.bsm}”` : "No BSM set for this club."}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.title ?? ""}
        body={confirm?.body}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm ?? (() => {})}
        busy={saving}
      />
    </div>
  );
}
