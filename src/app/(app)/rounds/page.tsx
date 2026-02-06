'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useHomeClub } from '@/hooks/useHomeClub';
import { SetupRequired } from '@/components/app/SetupRequired';

type CourseLite = { id: string; course_name: string };

type RoundRow = {
  id: string;
  completed_at: string;
  holes_count: number;
  user_course_id: string | null;
  home_club_id: string;
};

type StrokeLite = {
  round_id: string;
  hole_number: number;
  stroke_type: string | null;
  mental_ok: boolean;
};

function formatDateWithYear(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function safePct(ok: number, total: number) {
  if (!total) return null;
  return Math.round((ok / total) * 100);
}

function csvEscape(v: any) {
  const s = String(v ?? '');
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function RoundsHistoryPage() {
  const { session, isLoading, supabase } = useSession();
  const userId = session?.user?.id;

  const homeClub = useHomeClub(userId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [range, setRange] = useState<'30' | '90' | 'all'>('30');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const [courses, setCourses] = useState<CourseLite[]>([]);
  const [rounds, setRounds] = useState<RoundRow[]>([]);

  const [roundPctById, setRoundPctById] = useState<Record<string, number | null>>({});
  const [highlightsByRoundId, setHighlightsByRoundId] = useState<Record<string, string[]>>({});

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const effectiveFromIso = useMemo(() => {
    if (range === 'all') return null;
    if (range === '90') return daysAgoIso(90);
    return daysAgoIso(30);
  }, [range]);

  const courseNameOf = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of courses) map[c.id] = c.course_name;

    const homeName = homeClub.status === 'present' ? homeClub.name : 'Course';

    return (userCourseId: string | null) => {
      if (!userCourseId) return homeName;
      return map[userCourseId] ?? homeName;
    };
  }, [courses, homeClub]);

  const filteredRounds = useMemo(() => {
    let list = rounds.slice();

    if (effectiveFromIso) {
      const cutoff = new Date(effectiveFromIso).getTime();
      list = list.filter((r) => new Date(r.completed_at).getTime() >= cutoff);
    }

    if (courseFilter !== 'all') {
      if (courseFilter === 'home') list = list.filter((r) => !r.user_course_id);
      else list = list.filter((r) => r.user_course_id === courseFilter);
    }

    return list;
  }, [rounds, effectiveFromIso, courseFilter]);

  useEffect(() => {
    if (!userId) return;
    if (homeClub.status !== 'present') return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Courses for filter dropdown
        const { data: cs, error: cErr } = await supabase
          .from('user_courses')
          .select('id, course_name')
          .eq('user_id', userId)
          .order('course_name', { ascending: true });

        if (cErr) throw cErr;

        const courseList: CourseLite[] = (cs ?? []).map((x: any) => ({
          id: String(x.id),
          course_name: String(x.course_name),
        }));

        if (!cancelled) setCourses(courseList);

        // Completed rounds list
        let q = supabase
          .from('rounds')
          .select('id, completed_at, holes_count, user_course_id, home_club_id')
          .eq('user_id', userId)
          .eq('status', 'complete')
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(250);

        if (effectiveFromIso) q = q.gte('completed_at', effectiveFromIso);

        const { data: rr, error: rErr } = await q;
        if (rErr) throw rErr;

        const roundList: RoundRow[] = (rr ?? []).map((r: any) => ({
          id: String(r.id),
          completed_at: String(r.completed_at),
          holes_count: Number(r.holes_count ?? 0),
          user_course_id: r.user_course_id ? String(r.user_course_id) : null,
          home_club_id: String(r.home_club_id),
        }));

        if (!cancelled) setRounds(roundList);

        // Compute pct + deterministic highlights from counted strokes only
        const ids = roundList.map((r) => r.id);
        if (!ids.length) {
          if (!cancelled) {
            setRoundPctById({});
            setHighlightsByRoundId({});
          }
          return;
        }

        const { data: ss, error: sErr } = await supabase
          .from('strokes')
          .select('round_id, hole_number, stroke_type, mental_ok')
          .in('round_id', ids)
          .eq('is_counted', true);

        if (sErr) throw sErr;

        const byRound = new Map<
          string,
          {
            total: number;
            ok: number;
            byType: Map<string, { total: number; ok: number }>;
            byHole: Map<number, { total: number; ok: number }>;
          }
        >();

        for (const s of (ss ?? []) as StrokeLite[]) {
          const rid = String(s.round_id);
          const entry = byRound.get(rid) ?? { total: 0, ok: 0, byType: new Map(), byHole: new Map() };

          entry.total += 1;
          if (s.mental_ok) entry.ok += 1;

          if (s.stroke_type) {
            const t = String(s.stroke_type);
            const cur = entry.byType.get(t) ?? { total: 0, ok: 0 };
            cur.total += 1;
            if (s.mental_ok) cur.ok += 1;
            entry.byType.set(t, cur);
          }

          const h = Number(s.hole_number ?? 0);
          if (h) {
            const cur = entry.byHole.get(h) ?? { total: 0, ok: 0 };
            cur.total += 1;
            if (s.mental_ok) cur.ok += 1;
            entry.byHole.set(h, cur);
          }

          byRound.set(rid, entry);
        }

        const pctMap: Record<string, number | null> = {};
        const hlMap: Record<string, string[]> = {};

        const rangeAgg = (agg: any, start: number, end: number) => {
          let total = 0;
          let ok = 0;
          for (let h = start; h <= end; h += 1) {
            const a = agg.byHole.get(h);
            if (!a) continue;
            total += a.total;
            ok += a.ok;
          }
          return { total, ok, pct: safePct(ok, total) };
        };

        for (const r of roundList) {
          const agg = byRound.get(r.id) ?? { total: 0, ok: 0, byType: new Map(), byHole: new Map() };
          const focus = safePct(agg.ok, agg.total);
          pctMap[r.id] = focus;

          const highlights: string[] = [];

          // Deterministic, factual statements only
          const tee = agg.byType.get('TeeShot');
          if (tee && tee.total >= 3) {
            const teePct = safePct(tee.ok, tee.total);
            if (teePct !== null && focus !== null && teePct >= focus + 8) highlights.push('Strong Tee focus');
          }

          const putt = agg.byType.get('Putt');
          if (putt && putt.total >= 3) {
            const puttPct = safePct(putt.ok, putt.total);
            if (puttPct !== null && focus !== null && puttPct <= focus - 8) highlights.push('Putting focus struggled');
          }

          const early = rangeAgg(agg, 1, 6);
          const late = rangeAgg(agg, 13, 16);
          if (
            early.total >= 6 &&
            late.total >= 6 &&
            early.pct !== null &&
            late.pct !== null &&
            late.pct <= early.pct - 10
          ) {
            highlights.push('Focus dip on 13–16');
          }

          if (!highlights.length) highlights.push('No strong patterns detected yet.');
          hlMap[r.id] = highlights;
        }

        if (!cancelled) {
          setRoundPctById(pctMap);
          setHighlightsByRoundId(hlMap);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load history.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId, homeClub.status, effectiveFromIso]);

  async function downloadCsvAll() {
    if (!userId) return;

    setError(null);

    try {
      const { data: rr, error: rErr } = await supabase
        .from('rounds')
        .select('id, completed_at, user_course_id, holes_count, home_club_id')
        .eq('user_id', userId);

      if (rErr) throw rErr;

      const roundsById: Record<string, any> = {};
      for (const r of rr ?? []) roundsById[String(r.id)] = r;

      const roundIds = Object.keys(roundsById);
      if (!roundIds.length) return;

      const { data: ss, error: sErr } = await supabase
        .from('strokes')
        .select('round_id, hole_number, seq, stroke_type, mental_ok, is_counted, club_id')
        .in('round_id', roundIds)
        .eq('is_counted', true);

      if (sErr) throw sErr;

      const rows = (ss ?? []).map((s: any) => {
        const round = roundsById[String(s.round_id)];
        const courseName = courseNameOf(round?.user_course_id ? String(round.user_course_id) : null);

        return {
          round_id: String(s.round_id),
          completed_at: round?.completed_at ? String(round.completed_at) : '',
          course: courseName,
          holes_count: round?.holes_count ?? '',
          hole_number: s.hole_number ?? '',
          seq: s.seq ?? '',
          stroke_type: s.stroke_type ?? '',
          mental_ok: s.mental_ok ? 'true' : 'false',
          club_id: s.club_id ?? '',
        };
      });

      if (!rows.length) return;

      const header = Object.keys(rows[0]);
      const csv =
        header.join(',') +
        '\n' +
        rows.map((row: any) => header.map((h) => csvEscape(row[h])).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'golf-brain-data.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to download CSV.');
    }
  }

  async function deleteRound(roundId: string) {
    if (!userId) return;

    setError(null);
    setDeleting(true);

    try {
      const { error: sErr } = await supabase.from('strokes').delete().eq('round_id', roundId);
      if (sErr) throw sErr;

      const { error: hErr } = await supabase.from('round_holes').delete().eq('round_id', roundId);
      if (hErr) throw hErr;

      const { error: rErr } = await supabase.from('rounds').delete().eq('id', roundId).eq('user_id', userId);
      if (rErr) throw rErr;

      setRounds((prev) => prev.filter((r) => r.id !== roundId));
      setRoundPctById((prev) => {
        const n = { ...prev };
        delete n[roundId];
        return n;
      });
      setHighlightsByRoundId((prev) => {
        const n = { ...prev };
        delete n[roundId];
        return n;
      });

      setDeleteTarget(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete round.');
    } finally {
      setDeleting(false);
    }
  }

  if (isLoading) return null;

  if (!session) {
    return (
      <div className="container-app mode-briefing">
        <div className="stack">
          <div className="card card-pad">
            <div className="section-title">Please log in</div>
            <div className="meta" style={{ marginTop: 'var(--sp-2)' }}>
              You need to be signed in to view your history.
            </div>
            <Link href="/login" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-4)' }}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (homeClub.status !== 'present') {
    return (
      <div className="container-app mode-briefing">
        <SetupRequired />
      </div>
    );
  }

  return (
    <div className="container-app mode-briefing">
      <div className="stack">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="title">History</h1>
            <div className="meta">Completed rounds (counted strokes only).</div>
          </div>
          <Link href="/dashboard" className="btn btn-ghost" style={{ minHeight: 44 }}>
            Back
          </Link>
        </div>

        {error ? (
          <div className="card card-pad" style={{ borderColor: 'hsl(var(--danger))' }}>
            <div className="meta" style={{ color: 'hsl(var(--danger))' }}>
              {error}
            </div>
          </div>
        ) : null}

        <div className="card card-pad">
          <div className="section-title">Filters</div>

          <div className="card" style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-4)', background: 'hsl(var(--bg-muted))' }}>
            <div className="flex items-end gap-3">
              <div style={{ flex: 1 }}>
                <div className="meta" style={{ marginBottom: 6 }}>
                  Range
                </div>
                <select className="input" value={range} onChange={(e) => setRange(e.target.value as any)}>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <div className="meta" style={{ marginBottom: 6 }}>
                  Course
                </div>
                <select className="input" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                  <option value="all">All courses</option>
                  <option value="home">Home course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 'var(--sp-4)' }} onClick={downloadCsvAll}>
              Download data (CSV)
            </button>
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-title">Rounds</div>
          <div className="meta" style={{ marginTop: 'var(--sp-2)' }}>
            Showing {filteredRounds.length} round{filteredRounds.length === 1 ? '' : 's'}.
          </div>

          {loading ? (
            <div className="meta" style={{ marginTop: 'var(--sp-4)' }}>
              Loading…
            </div>
          ) : filteredRounds.length === 0 ? (
            <div className="meta" style={{ marginTop: 'var(--sp-4)' }}>
              No rounds match your filters.
            </div>
          ) : (
            <div className="stack-xs" style={{ marginTop: 'var(--sp-4)' }}>
              {filteredRounds.map((r) => {
                const name = courseNameOf(r.user_course_id);
                const mp = roundPctById[r.id];
                const pill = typeof mp === 'number' ? `Mental ${mp}%` : 'Mental —%';
                const highlights = highlightsByRoundId[r.id] ?? [];

                return (
                  <div key={r.id} className="card" style={{ padding: 'var(--sp-4)' }}>
                    <Link href={`/rounds/${r.id}`} className="row" style={{ textDecoration: 'none' }}>
                      <div className="flex items-center justify-between gap-3" style={{ width: '100%' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="meta" style={{ fontWeight: 800, color: 'hsl(var(--text))' }}>
                            {name}
                          </div>
                          <div className="meta" style={{ marginTop: 6 }}>
                            {r.holes_count} holes • {formatDateWithYear(r.completed_at)}
                          </div>
                        </div>

                        {/* Right aligned + vertically centered (pill + delete) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                          <div className="pill pill-success" style={{ flexShrink: 0 }}>
                            {pill}
                          </div>

                          <button
                            type="button"
                            aria-label="Delete round"
                            title="Delete round"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteTarget({ id: r.id, name });
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: 6,
                              cursor: 'pointer',
                              color: 'hsl(var(--muted))',
                              lineHeight: 1,
                              fontSize: 18,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </Link>

                    <div className="meta" style={{ marginTop: 'var(--sp-4)' }}>
                      Highlights:
                    </div>
                    <div className="stack-xs" style={{ marginTop: 'var(--sp-2)' }}>
                      {highlights.map((h, i) => (
                        <div key={i} className="meta" style={{ color: 'hsl(var(--text))' }}>
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom-sheet modal like Courses */}
      {deleteTarget ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 'var(--sp-5)',
            zIndex: 50,
          }}
          onClick={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <div className="card card-pad" style={{ width: '100%', maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="section-title">Delete round</div>

            <div className="meta" style={{ marginTop: 'var(--sp-2)' }}>
              Are you sure you want to delete <span style={{ fontWeight: 800 }}>{deleteTarget.name}</span>?
            </div>

            <div className="meta" style={{ marginTop: 'var(--sp-2)' }}>
              This will remove the round and its strokes. This cannot be undone.
            </div>

            <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--sp-3)",
    marginTop: "var(--sp-3)",
  }}
>
  <button
    type="button"
    className="btn btn-ghost"
    onClick={() => setDeleteTarget(null)}
    disabled={deleting}
    style={{ width: "100%" }}
  >
    Cancel
  </button>

  <button
    type="button"
    className="btn btn-danger"
    onClick={() => deleteRound(deleteTarget.id)}
    disabled={deleting}
    style={{ width: "100%" }}
  >
    {deleting ? "Deleting" : "Delete"}
  </button>
</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}