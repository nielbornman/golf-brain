"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { useHomeClub } from "@/hooks/useHomeClub";
import { SetupRequired } from "@/components/app/SetupRequired";
import { getDashboardSummary, type DashboardSummary } from "@/lib/dashboard";
import { deleteRoundById } from "@/lib/rounds";

type Trend = "improving" | "flat" | "declining";

function labelTrend(t: Trend) {
  if (t === "improving") return "improving";
  if (t === "declining") return "declining";
  return "flat";
}

function arrowTrend(t: Trend) {
  if (t === "improving") return "↑";
  if (t === "declining") return "↓";
  return "→";
}

function formatDateFull(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function trendPillClass(t: Trend) {
  if (t === "improving") return "pill pill-success";
  if (t === "declining") return "pill pill-danger";
  return "pill pill-neutral";
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

export default function DashboardPage() {
  const { session, isLoading, supabase } = useSession();
  const userId = session?.user.id; // string | undefined

  const homeClub = useHomeClub(userId);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busy, setBusy] = useState(false);

  // ✅ No useMemo needed; avoids union type issues entirely
  const courseName = homeClub.status === "present" ? homeClub.name : "Course";

  async function reloadWith(uid: string) {
    if (homeClub.status !== "present") return;

    setLoadingSummary(true);
    setErr(null);

    try {
      const s = await getDashboardSummary(supabase, uid);
      setSummary(s);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load dashboard.");
    } finally {
      setLoadingSummary(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    const uid = userId;

    void reloadWith(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId, homeClub.status]);

  if (isLoading || homeClub.status === "loading") {
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

  if (homeClub.status === "missing") {
    return (
      <div className="container-app mode-briefing">
        <div className="stack">
          <div>
            <h1 className="title">Dashboard</h1>
            <div className="meta">Trends over your last rounds.</div>
          </div>
          <SetupRequired />
        </div>
      </div>
    );
  }

  return (
    <div className="container-app mode-briefing">
      <div className="stack">
        <div>
          <h1 className="title">Dashboard</h1>
          <div className="meta">Trends over your last 5 completed rounds.</div>
        </div>

        {err ? (
          <div className="card card-pad" style={{ borderColor: "hsl(var(--danger))" }}>
            <div className="meta" style={{ color: "hsl(var(--danger))" }}>
              {err}
            </div>
          </div>
        ) : null}

        {loadingSummary || !summary ? (
          <div className="card card-pad">
            <div className="meta">Loading…</div>
          </div>
        ) : summary.rounds.length === 0 ? (
          <div className="card card-pad">
            <div className="section-title">No completed rounds yet</div>
            <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
              Complete a round in Scorecard to see trends here.
            </div>

            <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
              <Link href="/scorecard" className="btn btn-primary" style={{ width: "100%" }}>
                Go to Scorecard
              </Link>
              <div className="meta">Mental Focus % appears after you complete a round.</div>
            </div>
          </div>
        ) : (
          <>
            <div className="card card-pad">
              <div className="section-title">Last 5 rounds</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                Mental Focus and stroke performance direction.
              </div>

              <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
                <div className="row row-compact">
                  <div>
                    <div className="body">Mental Focus</div>
                    <div className="meta">Percent of strokes marked “Yes”.</div>
                  </div>
                  <div className={trendPillClass(summary.mentalTrend)}>
                    {arrowTrend(summary.mentalTrend)} {labelTrend(summary.mentalTrend)}
                  </div>
                </div>

                <div className="row row-compact">
                  <div>
                    <div className="body">Stroke performance</div>
                    <div className="meta">Inferred from total strokes recorded.</div>
                  </div>
                  <div className={trendPillClass(summary.strokeTrend)}>
                    {arrowTrend(summary.strokeTrend)} {labelTrend(summary.strokeTrend)}
                  </div>
                </div>
              </div>
            </div>

            <div className="card card-pad">
              <div className="section-title">Recent rounds</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                Completed rounds (most recent first).
              </div>

              <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
                {summary.rounds.map((r) => (
                  <Link
                    key={r.roundId}
                    href={`/rounds/${r.roundId}`}
                    className="row row-compact"
                    style={{
                      textDecoration: "none",
                      alignItems: "stretch",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {/* Row 1: Club name full width */}
                    <div className="body" style={{ width: "100%", whiteSpace: "normal" }}>
                      {courseName}
                    </div>

                    {/* Row 2: date left, pills+bin right */}
                    <div
                      className="flex items-center justify-between gap-3"
                      style={{ width: "100%" }}
                    >
                      <div className="meta" style={{ fontSize: 12 }}>
                        {formatDateFull(r.completedAt)}
                      </div>

                      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                        <div className="pill pill-neutral">{r.strokeCount} strokes</div>
                        <div className="pill pill-success">YES {r.mentalPct}%</div>

                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ minHeight: 44, width: 44, padding: 0 }}
                          aria-label="Delete round"
                          title="Delete"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            if (!userId) return;
                            const uid = userId;
                            const roundId = r.roundId;

                            setConfirm({
                              title: "Delete round?",
                              body: "This will permanently remove the round and its strokes.",
                              confirmLabel: "Delete",
                              danger: true,
                              onConfirm: async () => {
                                setBusy(true);
                                setErr(null);
                                try {
                                  await deleteRoundById(supabase, uid, roundId);
                                  await reloadWith(uid);
                                  setConfirm(null);
                                } catch (ex: any) {
                                  setErr(ex?.message ?? "Failed to delete round.");
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
                    </div>
                  </Link>
                ))}
              </div>

              <div className="meta" style={{ marginTop: "var(--sp-3)" }}>
                Strokes = number of strokes you recorded in the scorecard.
              </div>
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
