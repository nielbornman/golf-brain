"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useSession } from "@/hooks/useSession";

type UserCourseRow = {
  id: string;
  course_name: string;
  club_name: string | null; // used as "Address" in UI
  holes_count: number;
  is_default: boolean;
  created_at?: string;
};

type UserCourseHoleRow = {
  user_course_id: string;
  hole_number: number;
  par: number;
};

function clampPar(value: number): 3 | 4 | 5 {
  if (value <= 3) return 3;
  if (value >= 5) return 5;
  return 4;
}

function makeDefaultPars(count: number): (3 | 4 | 5)[] {
  return Array.from({ length: count }, () => 4);
}

function dangerText(msg: string) {
  return (
    <div className="meta" style={{ color: "hsl(var(--danger))" }}>
      {msg}
    </div>
  );
}

function successText(msg: string) {
  return (
    <div className="meta" style={{ color: "hsl(var(--success))" }}>
      {msg}
    </div>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
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
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card-hero card-pad"
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: "var(--r-lg)",
        }}
      >
        {children}
      </div>
    </div>
  );
}


export default function HomeClubCoursesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { session, isLoading } = useSession();
  const userId = session?.user.id;

  const [courses, setCourses] = useState<UserCourseRow[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Panels
  const [showCreate, setShowCreate] = useState(false);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Form state (used by create or edit)
  const [courseName, setCourseName] = useState("");
  const [address, setAddress] = useState("");
  const [holesCount, setHolesCount] = useState<9 | 18>(18);
  const [pars, setPars] = useState<(3 | 4 | 5)[]>(makeDefaultPars(18));
  const [loadingPars, setLoadingPars] = useState(false);

  const homeCourse = courses.find((c) => c.is_default) ?? null;
  const otherCourses = courses.filter((c) => !c.is_default);

  function clearMessages() {
    setError(null);
    setOk(null);
  }

  function resetFormForCreate() {
    setCourseName("");
    setAddress("");
    setHolesCount(18);
    setPars(makeDefaultPars(18));
  }

  function applyHoleCount(nextCount: 9 | 18) {
    setHolesCount(nextCount);
    setPars((prev) => {
      const trimmed = prev.slice(0, nextCount);
      if (trimmed.length < nextCount) {
        const extra = makeDefaultPars(nextCount - trimmed.length);
        return trimmed.concat(extra);
      }
      return trimmed;
    });
  }

  function setParAt(index: number, par: 3 | 4 | 5) {
    setPars((prev) => {
      const next = prev.slice();
      next[index] = par;
      return next;
    });
  }

  async function loadCourses() {
    if (!userId) return;

    setLoadingCourses(true);
    clearMessages();

    const { data, error: e } = await supabase
      .from("user_courses")
      .select("id, course_name, club_name, holes_count, is_default, created_at")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    if (e) {
      setError(e.message);
      setCourses([]);
      setLoadingCourses(false);
      return;
    }

    setCourses((data ?? []) as UserCourseRow[]);
    setLoadingCourses(false);
  }

  async function loadParsForCourse(courseId: string, count: 9 | 18) {
    setLoadingPars(true);

    const { data, error: e } = await supabase
      .from("user_course_holes")
      .select("user_course_id, hole_number, par")
      .eq("user_course_id", courseId)
      .order("hole_number", { ascending: true });

    if (e) {
      setError(e.message);
      setPars(makeDefaultPars(count));
      setLoadingPars(false);
      return;
    }

    const rows = (data ?? []) as UserCourseHoleRow[];
    const byHole = new Map<number, 3 | 4 | 5>();
    for (const r of rows) byHole.set(Number(r.hole_number), clampPar(Number(r.par)));

    const nextPars: (3 | 4 | 5)[] = Array.from({ length: count }, (_, i) => {
      const holeNum = i + 1;
      return byHole.get(holeNum) ?? 4;
    });

    setPars(nextPars);
    setLoadingPars(false);
  }

  useEffect(() => {
    if (isLoading) return;
    if (!userId) {
      setCourses([]);
      setLoadingCourses(false);
      return;
    }
    void loadCourses();
  }, [isLoading, userId, supabase]);

  function openCreate() {
    clearMessages();
    setEditCourseId(null);
    resetFormForCreate();
    setShowCreate(true);
  }

  function openEdit(courseId: string) {
    clearMessages();
    setShowCreate(false);
    setEditCourseId(courseId);

    const c = courses.find((x) => x.id === courseId);
    if (!c) return;

    setCourseName(c.course_name ?? "");
    setAddress(c.club_name ?? "");
    const count = (c.holes_count === 9 ? 9 : 18) as 9 | 18;
    setHolesCount(count);
    void loadParsForCourse(courseId, count);
  }

  function closePanels() {
    setShowCreate(false);
    setEditCourseId(null);
    setLoadingPars(false);
    clearMessages();
  }

  function openDeleteModal(courseId: string) {
    const c = courses.find((x) => x.id === courseId);
    setDeleteTarget({ id: courseId, name: c?.course_name ?? "this course" });
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!userId) return;
    if (!deleteTarget) return;

    clearMessages();
    setSaving(true);

    const deletingId = deleteTarget.id;

    const { error: e } = await supabase
      .from("user_courses")
      .delete()
      .eq("id", deletingId)
      .eq("user_id", userId);

    if (e) {
      setError(e.message);
      setSaving(false);
      return;
    }

    setOk("Course deleted.");
    setSaving(false);

    if (editCourseId === deletingId) setEditCourseId(null);
    setDeleteTarget(null);
    await loadCourses();
  }

  async function createCourse() {
    if (!userId) return;

    clearMessages();

    const name = courseName.trim();
    if (!name) {
      setError("Please enter a course name.");
      return;
    }

    setSaving(true);

    const isFirst = courses.length === 0;

    const { data, error: e } = await supabase
      .from("user_courses")
      .insert({
        user_id: userId,
        course_name: name,
        club_name: address.trim() || null,
        holes_count: holesCount,
        is_default: isFirst,
      })
      .select("id")
      .limit(1);

    if (e) {
      setError(e.message);
      setSaving(false);
      return;
    }

    const newId = (data?.[0] as { id?: string } | undefined)?.id ?? "";
    if (!newId) {
      setError("Course created but ID was not returned.");
      setSaving(false);
      return;
    }

    const holeUpserts: UserCourseHoleRow[] = pars.slice(0, holesCount).map((p, i) => ({
      user_course_id: newId,
      hole_number: i + 1,
      par: p,
    }));

    const { error: holesError } = await supabase
      .from("user_course_holes")
      .upsert(holeUpserts, { onConflict: "user_course_id,hole_number" });

    if (holesError) {
      setError(holesError.message);
      setSaving(false);
      return;
    }

    setOk(isFirst ? "Course created and set as Home Club." : "Course created.");
    setSaving(false);

    await loadCourses();
    setShowCreate(false);
  }

  async function saveCourse() {
    if (!userId) return;
    if (!editCourseId) return;

    clearMessages();

    const name = courseName.trim();
    if (!name) {
      setError("Please enter a course name.");
      return;
    }

    setSaving(true);

    const { error: e } = await supabase
      .from("user_courses")
      .update({
        course_name: name,
        club_name: address.trim() || null,
        holes_count: holesCount,
      })
      .eq("id", editCourseId)
      .eq("user_id", userId);

    if (e) {
      setError(e.message);
      setSaving(false);
      return;
    }

    const holeUpserts: UserCourseHoleRow[] = pars.slice(0, holesCount).map((p, i) => ({
      user_course_id: editCourseId,
      hole_number: i + 1,
      par: p,
    }));

    const { error: holesUpsertError } = await supabase
      .from("user_course_holes")
      .upsert(holeUpserts, { onConflict: "user_course_id,hole_number" });

    if (holesUpsertError) {
      setError(holesUpsertError.message);
      setSaving(false);
      return;
    }

    if (holesCount === 9) {
      const { error: deleteError } = await supabase
        .from("user_course_holes")
        .delete()
        .eq("user_course_id", editCourseId)
        .gt("hole_number", 9);

      if (deleteError) {
        setError(deleteError.message);
        setSaving(false);
        return;
      }
    }

    setOk("Course saved.");
    setSaving(false);

    await loadCourses();
    setEditCourseId(null);
  }

  async function setHomeCourse(courseId: string) {
    if (!userId) return;

    clearMessages();
    setSaving(true);

    const { error: clearError } = await supabase
      .from("user_courses")
      .update({ is_default: false })
      .eq("user_id", userId)
      .eq("is_default", true);

    if (clearError) {
      setError(clearError.message);
      setSaving(false);
      return;
    }

    const { error: setError2 } = await supabase
      .from("user_courses")
      .update({ is_default: true })
      .eq("id", courseId)
      .eq("user_id", userId);

    if (setError2) {
      setError(setError2.message);
      setSaving(false);
      return;
    }

    setOk("Home Club updated.");
    setSaving(false);

    await loadCourses();
  }

  function stop(e: React.MouseEvent) {
    e.stopPropagation();
  }

  function IconDeleteButton({ courseId, disabled }: { courseId: string; disabled: boolean }) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-inline"
        onClick={(e) => {
          stop(e);
          openDeleteModal(courseId);
        }}
        disabled={disabled}
        aria-label="Delete"
        title="Delete"
        style={{
          background: "transparent",
          borderColor: "transparent",
          paddingLeft: 0,
          paddingRight: 0,
          width: 40,
          justifyContent: "center",
          color: "hsl(var(--danger))",
        }}
      >
        🗑
      </button>
    );
  }

  function ParButton({
    active,
    label,
    onClick,
    disabled,
  }: {
    active: boolean;
    label: string;
    onClick: () => void;
    disabled: boolean;
  }) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-inline"
        onClick={onClick}
        disabled={disabled}
        style={
          active
            ? {
                background: "hsl(var(--selection))",
                borderColor: "hsl(var(--selection))",
                color: "hsl(var(--action))",
              }
            : undefined
        }
      >
        {label}
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="container-app mode-briefing">
        <div className="stack">
          <div className="card card-pad">
            <div className="meta">Loading</div>
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
            <h1 className="title">Home Club & Courses</h1>
            <div className="meta">You must be signed in to manage courses.</div>
            <Link href="/login" className="btn btn-primary" style={{ width: "100%" }}>
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app mode-briefing">
      {/* Delete confirmation modal */}
      <Modal
        open={Boolean(deleteTarget)}
        title="Delete course"
        onClose={() => {
          if (!saving) closeDeleteModal();
        }}
      >
 <div className="stack-sm">
  <div className="section-title">Delete course?</div>
  <div className="meta">
    This will remove{" "}
    <span style={{ color: "hsl(var(--danger))", fontWeight: 650 }}>
      {deleteTarget?.name ?? "this course"}
    </span>{" "}
    and its hole pars. This cannot be undone.
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
      onClick={closeDeleteModal}
      disabled={saving}
      style={{ width: "100%" }}
    >
      Cancel
    </button>

    <button
      type="button"
      className="btn btn-danger"
      onClick={confirmDelete}
      disabled={saving}
      style={{ width: "100%" }}
    >
      {saving ? "Deleting" : "Delete"}
    </button>
  </div>
</div>

      </Modal>

      <div className="stack">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="title">Home Club & Courses</h1>
            <div className="meta">Set your Home Club and manage multiple courses.</div>
          </div>

          <Link href="/account" className="btn btn-ghost btn-inline">
            Back
          </Link>
        </div>

        {error ? dangerText(error) : null}
        {ok ? successText(ok) : null}

        {/* Courses list card */}
        <div className="card card-pad">
          <div className="section-title">Courses</div>
          <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
            Your Home Club is the default when starting a round.
          </div>

          {loadingCourses ? (
            <div className="meta" style={{ marginTop: "var(--sp-4)" }}>
              Loading
            </div>
          ) : courses.length === 0 ? (
            <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
              <div className="meta">No courses yet.</div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={openCreate}
                disabled={saving}
                style={{ width: "100%" }}
              >
                Add Course
              </button>
            </div>
          ) : (
            <div className="stack-sm" style={{ marginTop: "var(--sp-4)" }}>
              {/* Home Club */}
              <div className="section-title">Home Club</div>
              {homeCourse ? (
                <div
                  className="row row-compact"
                  role="button"
                  tabIndex={0}
                  onClick={() => openEdit(homeCourse.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openEdit(homeCourse.id);
                  }}
                  style={{ cursor: "pointer" }}
                  aria-label={`Edit ${homeCourse.course_name}`}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="body"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {homeCourse.course_name}
                    </div>
                    <div className="meta">Home</div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <IconDeleteButton courseId={homeCourse.id} disabled={saving} />
                  </div>
                </div>
              ) : (
                <div className="meta">No home club set.</div>
              )}

              <div className="divider" />

              {/* Other courses */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="section-title">Other courses</div>
                  <div className="meta">Tap a course to edit. Use “Home” to make it your Home Club.</div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-inline"
                  onClick={openCreate}
                  disabled={saving}
                >
                  New
                </button>
              </div>

              {otherCourses.length === 0 ? (
                <div className="meta">No other courses.</div>
              ) : (
                <div className="stack-xs">
                  {otherCourses.map((c) => (
                    <div
                      key={c.id}
                      className="row row-compact"
                      role="button"
                      tabIndex={0}
                      onClick={() => openEdit(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openEdit(c.id);
                      }}
                      style={{ cursor: "pointer" }}
                      aria-label={`Edit ${c.course_name}`}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          className="body"
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {c.course_name}
                        </div>
                        <div className="meta">{c.holes_count} holes</div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-inline"
                          onClick={(e) => {
                            stop(e);
                            setHomeCourse(c.id);
                          }}
                          disabled={saving}
                          aria-label="Set as Home"
                          title="Set as Home"
                        >
                          Home
                        </button>

                        <IconDeleteButton courseId={c.id} disabled={saving} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create course card */}
        {showCreate ? (
          <div className="card card-pad">
            <div className="flex items-start justify-between">
              <div>
                <div className="section-title">New Course</div>
                <div className="meta">Add course details and set par per hole.</div>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-inline"
                onClick={closePanels}
                disabled={saving}
              >
                Close
              </button>
            </div>

            <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
              <label className="stack-xs">
                <div className="meta">Course name</div>
                <input
                  className="input"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Example: Lambourne Golf Club"
                  disabled={saving}
                />
              </label>

              <label className="stack-xs">
                <div className="meta">Address</div>
                <input
                  className="input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Example: Essex, UK"
                  disabled={saving}
                />
              </label>

              <label className="stack-xs">
                <div className="meta">Holes</div>
                <select
                  className="input"
                  value={holesCount}
                  onChange={(e) => applyHoleCount((Number(e.target.value) === 9 ? 9 : 18) as 9 | 18)}
                  disabled={saving}
                >
                  <option value={18}>18</option>
                  <option value={9}>9</option>
                </select>
              </label>

              <div className="divider" />

              <div className="section-title">Pars</div>

              <div className="stack-xs">
                {pars.map((p, i) => (
                  <div key={i} className="row row-compact">
                    <div className="meta">Hole {i + 1}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <ParButton active={p === 3} label="Par 3" onClick={() => setParAt(i, 3)} disabled={saving} />
                      <ParButton active={p === 4} label="Par 4" onClick={() => setParAt(i, 4)} disabled={saving} />
                      <ParButton active={p === 5} label="Par 5" onClick={() => setParAt(i, 5)} disabled={saving} />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={createCourse}
                disabled={saving || courseName.trim().length === 0}
                style={{ width: "100%" }}
              >
                {saving ? "Saving" : "Create course"}
              </button>
            </div>
          </div>
        ) : null}

        {/* Edit course card */}
        {editCourseId ? (
          <div className="card card-pad">
            <div className="flex items-start justify-between">
              <div>
                <div className="section-title">
                  Edit Course: {courses.find((c) => c.id === editCourseId)?.course_name ?? "Course"}
                </div>
                <div className="meta">Update details and pars.</div>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-inline"
                onClick={closePanels}
                disabled={saving}
              >
                Close
              </button>
            </div>

            <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
              <label className="stack-xs">
                <div className="meta">Course name</div>
                <input
                  className="input"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  disabled={saving}
                />
              </label>

              <label className="stack-xs">
                <div className="meta">Address</div>
                <input
                  className="input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={saving}
                />
              </label>

              <label className="stack-xs">
                <div className="meta">Holes</div>
                <select
                  className="input"
                  value={holesCount}
                  onChange={(e) => applyHoleCount((Number(e.target.value) === 9 ? 9 : 18) as 9 | 18)}
                  disabled={saving}
                >
                  <option value={18}>18</option>
                  <option value={9}>9</option>
                </select>
              </label>

              <div className="divider" />

              <div className="section-title">Pars</div>

              {loadingPars ? (
                <div className="meta">Loading</div>
              ) : (
                <div className="stack-xs">
                  {pars.map((p, i) => (
                    <div key={i} className="row row-compact">
                      <div className="meta">Hole {i + 1}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <ParButton active={p === 3} label="Par 3" onClick={() => setParAt(i, 3)} disabled={saving} />
                        <ParButton active={p === 4} label="Par 4" onClick={() => setParAt(i, 4)} disabled={saving} />
                        <ParButton active={p === 5} label="Par 5" onClick={() => setParAt(i, 5)} disabled={saving} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={saveCourse}
                disabled={saving || courseName.trim().length === 0}
                style={{ width: "100%" }}
              >
                {saving ? "Saving" : "Save"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
