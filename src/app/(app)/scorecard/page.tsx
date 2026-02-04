"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useHomeClub } from "@/hooks/useHomeClub";
import { SetupRequired } from "@/components/app/SetupRequired";
import { listBagClubs, type BagClub } from "@/lib/bagClubs";
import {
  completeRound,
  getActiveRound,
  listStrokesForHole,
  setStrokeMentalOk,
  deleteStroke,
  type RoundRow,
  type StrokeRow,
} from "@/lib/rounds";
import { listMentalElements, type MentalElement } from "@/lib/mentalElements";

type UserCourseRow = {
  id: string;
  course_name: string;
  club_name: string | null;
  holes_count: number;
  is_default: boolean;
};

type UserCourseHoleRow = {
  hole_number: number;
  par: number;
};

function roundKey(roundId: string) {
  return `gb_active_round_${roundId}`;
}

function displayStrokeType(t: string) {
  if (t === "TeeShot") return "Tee Shot";
  if (t === "Recovery") return "Recovery";
  if (t === "Approach") return "Approach";
  if (t === "ChipPitch") return "Chip/Pitch";
  if (t === "LayUp") return "Lay-up";
  if (t === "F-Bunker") return "Bunker (F)";
  if (t === "G-Bunker") return "Bunker (G)";
  if (t === "Penalty") return "Penalty";
  if (t === "Putt") return "Putt";
  if (t === "Other") return "Other";
  return t;
}

const STROKE_BUTTONS: Array<{ label: string; dbType: string }> = [
  { label: "Tee Shot", dbType: "TeeShot" },
  { label: "Recovery", dbType: "Recovery" },
  { label: "Lay-up", dbType: "LayUp" },
  { label: "Bunker (F)", dbType: "F-Bunker" },
  { label: "Approach", dbType: "Approach" },
  { label: "Chip/Pitch", dbType: "ChipPitch" },
  { label: "Bunker (G)", dbType: "G-Bunker" },
  { label: "Penalty", dbType: "Penalty" },
  { label: "Other", dbType: "Other" },
  { label: "Putt", dbType: "Putt" },
];

const ADD_ORDER: Record<string, number> = {
  TeeShot: 1,
  Recovery: 2,
  LayUp: 3,
  "F-Bunker": 4,
  Approach: 5,
  ChipPitch: 6,
  "G-Bunker": 7,
  Penalty: 8,
  Other: 9,
  Putt: 10,
};

function orderOf(strokeType: string) {
  return ADD_ORDER[strokeType] ?? 999;
}

function patternForPar(par: number): string[] {
  if (par === 3) return ["TeeShot", "Putt", "Putt"];
  if (par === 5) return ["TeeShot", "LayUp", "Approach", "Putt", "Putt"];
  return ["TeeShot", "Approach", "Putt", "Putt"];
}

function MfTick({ on }: { on: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        fill="none"
        stroke={on ? "hsl(var(--success))" : "hsl(var(--border))"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
              {busy ? "Working" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function getRoundMentalPctCounted(supabase: any, roundId: string) {
  const { data, error } = await supabase
    .from("strokes")
    .select("mental_ok,is_counted")
    .eq("round_id", roundId)
    .eq("is_counted", true);

  if (error) return 0;

  const rows = (data ?? []) as { mental_ok: boolean; is_counted: boolean }[];
  const total = rows.length;
  if (total === 0) return 0;

  const ok = rows.filter((r) => r.mental_ok).length;
  return Math.round((ok / total) * 100);
}

export default function ScorecardPage() {
  const { session, isLoading, supabase } = useSession();
  const userId = session?.user.id;

  const homeClub = useHomeClub(userId);

  const [courses, setCourses] = useState<UserCourseRow[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("none");

  const [round, setRound] = useState<RoundRow | null>(null);
  const [roundCourseName, setRoundCourseName] = useState<string>("");
  const [roundUsesCourseDefaults, setRoundUsesCourseDefaults] = useState<boolean>(false);

  const [activeHole, setActiveHole] = useState<number>(1);
  const [strokes, setStrokes] = useState<StrokeRow[]>([]);
  const [mentalPct, setMentalPct] = useState<number>(0);
  const [isHoleCommitted, setIsHoleCommitted] = useState<boolean>(true);

  const [mentalElements, setMentalElements] = useState<MentalElement[]>([]);
  const [loadingElements, setLoadingElements] = useState(true);

  const [bag, setBag] = useState<BagClub[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>("");

  const [loadingRound, setLoadingRound] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const refreshNonceRef = useRef(0);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  const homeClubLabel =
    homeClub.status === "present" ? String((homeClub as any).name ?? "Home Club") : "Course";

  useEffect(() => {
    if (!userId) {
      setMentalElements([]);
      setLoadingElements(false);
      return;
    }

    const uid = userId;
    let cancelled = false;

    async function load() {
      setLoadingElements(true);
      try {
        const list = await listMentalElements(supabase, uid);
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

  useEffect(() => {
    if (!userId) {
      setCourses([]);
      setSelectedCourseId("none");
      return;
    }

    const uid = userId;
    let cancelled = false;

    async function loadCourses() {
      try {
        const { data, error: e } = await supabase
          .from("user_courses")
          .select("id, course_name, club_name, holes_count, is_default")
          .eq("user_id", uid)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: true });

        if (cancelled) return;
        if (e) throw e;

        const list = (data ?? []) as UserCourseRow[];
        setCourses(list);

        const stillValid = list.find((c) => c.id === selectedCourseId);
        if (stillValid) return;

        const def = list.find((c) => c.is_default);
        setSelectedCourseId(def?.id ?? (list[0]?.id ?? "none"));
      } catch {
        if (!cancelled) {
          setCourses([]);
          setSelectedCourseId("none");
        }
      }
    }

    void loadCourses();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId, selectedCourseId]);

  useEffect(() => {
    if (!userId) {
      setBag([]);
      setSelectedClubId("");
      return;
    }

    const uid = userId;
    let cancelled = false;

    async function loadBag() {
      try {
        const list = await listBagClubs(supabase, uid);
        if (cancelled) return;
        setBag(list);
        setSelectedClubId("");
      } catch {
        if (!cancelled) {
          setBag([]);
          setSelectedClubId("");
        }
      }
    }

    void loadBag();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  async function fetchHoleCommitted(roundId: string, holeNumber: number) {
    const { data, error: e } = await supabase
      .from("round_holes")
      .select("is_committed")
      .eq("round_id", roundId)
      .eq("hole_number", holeNumber)
      .limit(1);

    if (e) return true;
    const val = (data?.[0] as any)?.is_committed;
    return typeof val === "boolean" ? val : true;
  }

  async function refreshHole(roundId: string, holeNumber: number) {
    const nonce = refreshNonceRef.current + 1;
    refreshNonceRef.current = nonce;

    const list = await listStrokesForHole(supabase, roundId, holeNumber);
    const sorted = list.slice().sort((a, b) => Number(a.seq) - Number(b.seq));

    if (refreshNonceRef.current !== nonce) return;

    setStrokes(sorted);

    const pct = await getRoundMentalPctCounted(supabase, roundId);

    if (refreshNonceRef.current !== nonce) return;

    setMentalPct(pct);

    const committed = await fetchHoleCommitted(roundId, holeNumber);

    if (refreshNonceRef.current !== nonce) return;

    setIsHoleCommitted(committed);
  }

  async function commitHole(roundId: string, holeNumber: number) {
    await supabase
      .from("round_holes")
      .update({ is_committed: true })
      .eq("round_id", roundId)
      .eq("hole_number", holeNumber);

    await supabase
      .from("strokes")
      .update({ is_counted: true })
      .eq("round_id", roundId)
      .eq("hole_number", holeNumber);

    setIsHoleCommitted(true);
  }

  useEffect(() => {
    if (!userId) {
      setRound(null);
      setLoadingRound(false);
      return;
    }

    const uid = userId;
    let cancelled = false;

    async function loadRound() {
      setLoadingRound(true);
      setError(null);

      try {
        const active = await getActiveRound(supabase, uid);
        if (cancelled) return;

        if (!active) {
          setRound(null);
          setActiveHole(1);
          setStrokes([]);
          setMentalPct(0);
          setRoundCourseName("");
          setRoundUsesCourseDefaults(false);
          setIsHoleCommitted(true);
          setLoadingRound(false);
          return;
        }

        setRound(active);

        const maybeCourseId = (active as any)?.user_course_id as string | null | undefined;
        if (maybeCourseId) {
          const name = courses.find((c) => c.id === maybeCourseId)?.course_name ?? "Course";
          setRoundCourseName(name);
          setRoundUsesCourseDefaults(true);
        } else {
          setRoundCourseName(homeClubLabel);
          setRoundUsesCourseDefaults(false);
        }

        const rid = active.id;
        if (!rid) throw new Error("Active round id missing.");

        const stored = localStorage.getItem(roundKey(rid));
        const parsed = stored ? Number(stored) : NaN;

        const holeToUse =
          Number.isFinite(parsed) && parsed >= 1
            ? parsed
            : Number((active as any).current_hole_number ?? 1);

        setActiveHole(holeToUse);
        await refreshHole(rid, holeToUse);
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
  }, [supabase, userId, courses, homeClubLabel]);

  useEffect(() => {
    const rid = round?.id;
    if (!rid) return;
    localStorage.setItem(roundKey(rid), String(activeHole));
  }, [round, activeHole]);

  async function createRoundFromCourse(uid: string, course: UserCourseRow) {
    if (homeClub.status !== "present") {
      throw new Error("Please set your Home Club in Account before starting a round.");
    }

    const { data: holesData, error: holesErr } = await supabase
      .from("user_course_holes")
      .select("hole_number, par")
      .eq("user_course_id", course.id)
      .order("hole_number", { ascending: true });

    if (holesErr) throw holesErr;

    const holesCount = course.holes_count;

    const parsByHole = new Map<number, number>();
    for (const r of (holesData ?? []) as UserCourseHoleRow[]) {
      parsByHole.set(Number((r as any).hole_number), Number((r as any).par));
    }

    const pars: number[] = Array.from({ length: holesCount }, (_, i) => {
      const holeNum = i + 1;
      const p = parsByHole.get(holeNum);
      return p === 3 || p === 4 || p === 5 ? p : 4;
    });

    const { data: roundData, error: roundErr } = await supabase
      .from("rounds")
      .insert({
        user_id: uid,
        home_club_id: (homeClub as any).id,
        user_course_id: course.id,
        holes_count: holesCount,
        current_hole_number: 1,
        status: "active",
      })
      .select("*")
      .limit(1);

    if (roundErr) throw roundErr;

    const created = (roundData?.[0] ?? null) as RoundRow | null;
    if (!created) throw new Error("Failed to start round.");

    const roundHolesRows = pars.map((par, idx) => ({
      round_id: created.id,
      hole_number: idx + 1,
      par,
      is_committed: false,
    }));

    const { error: rhErr } = await supabase
      .from("round_holes")
      .upsert(roundHolesRows, { onConflict: "round_id,hole_number", ignoreDuplicates: true });

    if (rhErr) throw rhErr;

    const allStrokesRows: any[] = [];
    for (let i = 0; i < pars.length; i += 1) {
      const holeNumber = i + 1;
      const strokeTypes = patternForPar(pars[i]);
      for (let s = 0; s < strokeTypes.length; s += 1) {
        allStrokesRows.push({
          round_id: created.id,
          hole_number: holeNumber,
          seq: s + 1,
          stroke_type: strokeTypes[s],
          mental_ok: false,
          club_id: null,
          is_counted: false,
        });
      }
    }

    const { error: stErr } = await supabase.from("strokes").insert(allStrokesRows);
    if (stErr) throw stErr;

    return created;
  }

  async function onStartRound() {
    if (!userId) return;

    const uid = userId;

    setSaving(true);
    setError(null);

    try {
      if (selectedCourse && selectedCourseId !== "none") {
        const created = await createRoundFromCourse(uid, selectedCourse);

        setRound(created);
        setRoundCourseName(selectedCourse.course_name);
        setRoundUsesCourseDefaults(true);

        setActiveHole(1);

        if (created.id) localStorage.setItem(roundKey(created.id), "1");
        if (!created.id) throw new Error("Round id missing.");

        await refreshHole(created.id, 1);
        return;
      }

      if (homeClub.status !== "present") {
        throw new Error("Please add a course in Account first.");
      }

      const holesCount = Number((homeClub as any).holesCount ?? 18);

      const { data: roundData, error: roundErr } = await supabase
        .from("rounds")
        .insert({
          user_id: uid,
          home_club_id: (homeClub as any).id,
          user_course_id: null,
          holes_count: holesCount,
          current_hole_number: 1,
          status: "active",
        })
        .select("*")
        .limit(1);

      if (roundErr) throw roundErr;

      const createdRound = (roundData?.[0] ?? null) as RoundRow | null;
      if (!createdRound) throw new Error("Failed to start round.");
      if (!createdRound.id) throw new Error("Round id missing.");

      const pars = ((homeClub as any).pars ?? []) as number[];
      const safePars = pars.length === holesCount ? pars : Array.from({ length: holesCount }, () => 4);

      const roundHolesRows = safePars.map((par, idx) => ({
        round_id: createdRound.id,
        hole_number: idx + 1,
        par,
        is_committed: true,
      }));

      await supabase
        .from("round_holes")
        .upsert(roundHolesRows, { onConflict: "round_id,hole_number", ignoreDuplicates: true });

      setRound(createdRound);
      setRoundCourseName(homeClubLabel);
      setRoundUsesCourseDefaults(false);

      setActiveHole(1);
      localStorage.setItem(roundKey(createdRound.id), "1");

      await refreshHole(createdRound.id, 1);
    } catch (e: any) {
      setError(e?.message ?? "Failed to start round.");
    } finally {
      setSaving(false);
    }
  }

  async function onToggleMental(stroke: StrokeRow) {
    const rid = round?.id;
    if (!rid) return;

    setSaving(true);
    setError(null);

    try {
      await setStrokeMentalOk(supabase, stroke.id, !stroke.mental_ok);
      await refreshHole(rid, activeHole);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update Mental Focus.");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteStroke(stroke: StrokeRow) {
    const rid = round?.id;
    if (!rid) return;

    setSaving(true);
    setError(null);

    try {
      await deleteStroke(supabase, stroke.id);
      await refreshHole(rid, activeHole);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete stroke.");
    } finally {
      setSaving(false);
    }
  }

  async function onAddStroke(dbType: StrokeRow["stroke_type"]) {
    const rid = round?.id;
    if (!rid) return;

    setSaving(true);
    setError(null);

    try {
      const counted = roundUsesCourseDefaults ? isHoleCommitted : true;

      const existing = await listStrokesForHole(supabase, rid, activeHole);
      const sorted = existing.slice().sort((a, b) => Number(a.seq) - Number(b.seq));

      const newKey = orderOf(String(dbType));
      const maxSeq = sorted.reduce((m, s) => Math.max(m, Number(s.seq)), 0);

      let targetSeq = maxSeq + 1;

      for (let i = 0; i < sorted.length; i += 1) {
        const s = sorted[i];
        const sKey = orderOf(String(s.stroke_type));
        if (sKey > newKey) {
          targetSeq = Number(s.seq);
          break;
        }
      }

      if (targetSeq <= maxSeq) {
        const toShift = sorted
          .filter((s) => Number(s.seq) >= targetSeq)
          .sort((a, b) => Number(b.seq) - Number(a.seq));

        for (const s of toShift) {
          const { error: eShift } = await supabase
            .from("strokes")
            .update({ seq: Number(s.seq) + 1 })
            .eq("id", s.id);

          if (eShift) throw eShift;
        }
      }

      const { error: e } = await supabase.from("strokes").insert({
        round_id: rid,
        hole_number: activeHole,
        seq: targetSeq,
        stroke_type: dbType,
        mental_ok: false,
        club_id: selectedClubId || null,
        is_counted: counted,
      });

      if (e) throw e;

      await refreshHole(rid, activeHole);
    } catch (e: any) {
      setError(e?.message ?? "Failed to add stroke.");
    } finally {
      setSaving(false);
    }
  }

  async function goToHole(holeNumber: number) {
    const rid = round?.id;
    const uid = userId;
    if (!rid || !uid || !round) return;
    if (holeNumber < 1 || holeNumber > round.holes_count) return;

    setSaving(true);
    setError(null);

    try {
      if (roundUsesCourseDefaults && !isHoleCommitted && holeNumber > activeHole) {
        await commitHole(rid, activeHole);
        await refreshHole(rid, activeHole);
      }

      setActiveHole(holeNumber);

      await supabase
        .from("rounds")
        .update({ current_hole_number: holeNumber })
        .eq("id", rid)
        .eq("user_id", uid);

      await refreshHole(rid, holeNumber);
    } catch (e: any) {
      setError(e?.message ?? "Failed to change hole.");
    } finally {
      setSaving(false);
    }
  }

  async function onCompleteRound() {
    const rid = round?.id;
    const uid = userId;
    if (!rid || !uid || !round) return;

    setConfirm({
      title: "Complete round?",
      body: "This will close the round and update the Dashboard.",
      confirmLabel: "Complete",
      danger: false,
      onConfirm: async () => {
        setSaving(true);
        setError(null);

        try {
          if (roundUsesCourseDefaults && !isHoleCommitted) {
            await commitHole(rid, activeHole);
            await refreshHole(rid, activeHole);
          }

          await completeRound(supabase, uid, rid);
          localStorage.removeItem(roundKey(rid));

          setRound(null);
          setActiveHole(1);
          setStrokes([]);
          setMentalPct(0);
          setRoundCourseName("");
          setRoundUsesCourseDefaults(false);
          setIsHoleCommitted(true);

          setConfirm(null);
        } catch (e: any) {
          setError(e?.message ?? "Failed to complete round.");
        } finally {
          setSaving(false);
        }
      },
    });
  }

  if (isLoading || homeClub.status === "loading" || loadingRound) {
    return (
      <div className="container-app mode-performance">
        <div className="meta">Loading…</div>
      </div>
    );
  }

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

  const hasCourses = courses.length > 0;
  const hasHomeClub = homeClub.status === "present";

  if (!hasCourses && !hasHomeClub) {
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

  const courseNameForHeader = round
    ? roundCourseName || (hasHomeClub ? homeClubLabel : "Course")
    : selectedCourse?.course_name || (hasHomeClub ? homeClubLabel : "Course");

  return (
    <div className="container-app mode-performance">
      <div className="stack">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="title">Scorecard</h1>
            <div className="meta">One stroke at a time.</div>
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

        {error ? (
          <div className="meta" style={{ color: "hsl(var(--danger))" }}>
            {error}
          </div>
        ) : null}

        {round ? (
          <div className="card-hero card-pad">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="section-title">Mental Focus</div>
                <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                  {loadingElements
                    ? "Loading cues…"
                    : mentalElements.length === 0
                    ? "No mental elements yet — add them in Account."
                    : mentalElements.map((m) => m.label).join(" • ")}
                </div>
              </div>

              <div className="body" style={{ fontWeight: 800 }}>
                {mentalPct}%
              </div>
            </div>
          </div>
        ) : null}

        {!round ? (
          <div className="card card-pad">
            <div className="section-title">Start a round</div>
            <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
              Begin tracking your mental focus to improve your strokes.
            </div>

            <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
              <div className="meta">Course</div>

              {courses.length === 0 ? (
                <div className="meta">No courses yet — add one in Account.</div>
              ) : (
                <select
                  className="input"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  disabled={saving}
                  aria-label="Select course"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_name}
                      {c.is_default ? " (Home)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="button"
              onClick={onStartRound}
              disabled={saving || (courses.length > 0 && selectedCourseId === "none")}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "var(--sp-4)" }}
            >
              {saving ? "Starting…" : "Start Round"}
            </button>
          </div>
        ) : (
          <>
            <div className="card card-pad">
              <div className="section-title">Hole {activeHole}</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                Hole {activeHole} / {round.holes_count} • {courseNameForHeader}
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
                          {s.seq}. {displayStrokeType(String(s.stroke_type))}
                        </div>
                        <div className="meta">MF: {s.mental_ok ? "Yes" : "No"}</div>
                      </div>

                      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => onToggleMental(s)}
                          disabled={saving}
                          className="btn btn-ghost"
                          aria-label={s.mental_ok ? "Mental focus: on" : "Mental focus: off"}
                          title="Mental focus"
                          style={{
                            minHeight: 44,
                            width: 44,
                            padding: 0,
                            borderRadius: "var(--r-sm)",
                            border: "1px solid hsl(var(--border))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: saving ? "not-allowed" : "pointer",
                          }}
                        >
                          <MfTick on={!!s.mental_ok} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteStroke(s)}
                          disabled={saving}
                          aria-label="Delete stroke"
                          title="Delete"
                          style={{
                            minHeight: 44,
                            width: 44,
                            padding: 0,
                            background: "transparent",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "hsl(var(--danger))",
                            cursor: saving ? "not-allowed" : "pointer",
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3" style={{ marginTop: "var(--sp-4)" }}>
                <button
                  type="button"
                  onClick={() => goToHole(activeHole - 1)}
                  disabled={saving || activeHole <= 1}
                  className="btn btn-ghost"
                  style={{ width: "100%" }}
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  onClick={() => goToHole(activeHole + 1)}
                  disabled={saving || activeHole >= round.holes_count}
                  className="btn btn-ghost"
                  style={{ width: "100%" }}
                >
                  Next →
                </button>
              </div>
            </div>

            <div className="card card-pad">
              <div className="section-title">Add stroke</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                Tap to add (defaults to MF: No).
              </div>

              <div
                style={{
                  marginTop: "var(--sp-4)",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "var(--sp-2)",
                }}
              >
                {STROKE_BUTTONS.map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => onAddStroke(b.dbType as any)}
                    disabled={saving}
                    className="btn btn-ghost"
                    style={{ width: "100%", paddingLeft: 10, paddingRight: 10 }}
                  >
                    <span className="meta" style={{ color: "hsl(var(--text))" }}>
                      {b.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card card-pad">
              <div className="section-title">Best Shot Memory</div>
              <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
                Remember the best shot with each club.
              </div>

              {bag.length === 0 ? (
                <div className="meta" style={{ marginTop: "var(--sp-3)" }}>
                  Add clubs in Account → Bag to see BSM cues here.
                </div>
              ) : (
                (() => {
                  const hasAnyBsm = bag.some((c) => (c.bsm ?? "").trim().length > 0);

                  if (!hasAnyBsm) {
                    return (
                      <div style={{ marginTop: "var(--sp-4)" }}>
                        <Link href="/account/bag" className="btn btn-ghost" style={{ width: "100%" }}>
                          Add Best Shot Memories
                        </Link>
                      </div>
                    );
                  }

                  const selected = bag.find((c) => c.id === selectedClubId) ?? null;

                  return (
                    <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)" }}>
                        {bag.map((c) => {
                          const isOn = c.id === selectedClubId;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              className="btn btn-ghost btn-inline"
                              onClick={() => setSelectedClubId(isOn ? "" : c.id)}
                              disabled={saving}
                              style={
                                isOn
                                  ? {
                                      background: "hsl(var(--selection))",
                                      borderColor: "hsl(var(--selection))",
                                      color: "hsl(var(--action))",
                                    }
                                  : undefined
                              }
                            >
                              {c.label}
                            </button>
                          );
                        })}
                      </div>

                      {selected ? (
                        <div
                          className="body"
                          style={{
                            background: "hsl(var(--bg-muted))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--r-sm)",
                            padding: "var(--sp-4)",
                          }}
                        >
                          {selected.bsm && selected.bsm.trim().length > 0
                            ? `“${selected.bsm}”`
                            : "No Best Shot Memory set for this club."}
                        </div>
                      ) : null}
                    </div>
                  );
                })()
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
        danger={!!confirm?.danger}
        onConfirm={confirm?.onConfirm ?? (() => {})}
        busy={saving}
      />
    </div>
  );
}