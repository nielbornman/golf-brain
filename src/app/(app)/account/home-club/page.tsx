"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useSession } from "@/hooks/useSession";

type DbClubRow = {
  id: string;
  user_id: string;
  name: string;
  holes_count: number;
  par_per_hole: number[];
  is_home: boolean;
};

function clampPar(value: number): number {
  if (Number.isNaN(value)) return 4;
  if (value < 3) return 3;
  if (value > 6) return 6;
  return value;
}

function makeDefaultPars(count: number): number[] {
  return Array.from({ length: count }, () => 4);
}

export default function HomeClubPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { session } = useSession();
  const userId = session?.user.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [clubId, setClubId] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string>("Home Club");
  const [pars, setPars] = useState<number[]>(makeDefaultPars(18));

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!userId) return;

      setIsLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const { data, error } = await supabase
        .from("clubs")
        .select("id,user_id,name,holes_count,par_per_hole,is_home")
        .eq("user_id", userId)
        .eq("is_home", true)
        .limit(1);

      if (!isMounted) return;

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      const existing = (data?.[0] as DbClubRow | undefined) ?? undefined;

      if (existing) {
        setClubId(existing.id);
        setClubName(existing.name || "Home Club");

        const existingPars = Array.isArray(existing.par_per_hole)
          ? existing.par_per_hole.map((p) => clampPar(Number(p)))
          : [];

        const holesCount = Number(existing.holes_count) || existingPars.length || 18;
        const normalizedCount = holesCount > 0 ? holesCount : 18;

        let normalizedPars = existingPars.slice(0, normalizedCount);
        if (normalizedPars.length < normalizedCount) {
          normalizedPars = normalizedPars.concat(
            makeDefaultPars(normalizedCount - normalizedPars.length)
          );
        }

        setPars(normalizedPars);
      } else {
        setClubId(null);
        setClubName("Home Club");
        setPars(makeDefaultPars(18));
      }

      setIsLoading(false);
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [supabase, userId]);

  function updateParAt(index: number, newPar: number) {
    setPars((prev) => {
      const next = prev.slice();
      next[index] = clampPar(newPar);
      return next;
    });
  }

  function addHole() {
    setPars((prev) => prev.concat([4]));
  }

  function removeHoleAt(index: number) {
    setPars((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  async function saveHomeClub() {
    if (!userId) return;

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const name = clubName.trim();
    if (!name) {
      setErrorMsg("Please enter a club name.");
      setIsSaving(false);
      return;
    }

    const holesCount = pars.length;
    const parPerHole = pars.map((p) => clampPar(Number(p)));

    try {
      const { error: clearError } = await supabase
        .from("clubs")
        .update({ is_home: false })
        .eq("user_id", userId)
        .eq("is_home", true);

      if (clearError) {
        setErrorMsg(clearError.message);
        setIsSaving(false);
        return;
      }

      if (clubId) {
        const { error: updateError } = await supabase
          .from("clubs")
          .update({
            name,
            holes_count: holesCount,
            par_per_hole: parPerHole,
            is_home: true,
          })
          .eq("id", clubId)
          .eq("user_id", userId);

        if (updateError) {
          setErrorMsg(updateError.message);
          setIsSaving(false);
          return;
        }

        setSuccessMsg("Home Club saved.");
        setIsSaving(false);
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("clubs")
        .insert({
          user_id: userId,
          name,
          holes_count: holesCount,
          par_per_hole: parPerHole,
          is_home: true,
        })
        .select("id")
        .limit(1);

      if (insertError) {
        setErrorMsg(insertError.message);
        setIsSaving(false);
        return;
      }

      const newId = (inserted?.[0] as { id?: string } | undefined)?.id ?? null;
      setClubId(newId);
      setSuccessMsg("Home Club created.");
      setIsSaving(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error saving Home Club.";
      setErrorMsg(msg);
      setIsSaving(false);
    }
  }

  return (
    <div className="container-app mode-briefing">
      <div className="stack">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="title">Home Club</h1>
            <div className="meta">Default is 18 holes, par 4. Edit as needed, then Save.</div>
          </div>

          <Link href="/account" className="btn btn-ghost btn-inline">
            Back
          </Link>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="card card-pad">
            <div className="meta">Loading…</div>
          </div>
        ) : (
          <div className="card card-pad">
            {/* Club name */}
            <div>
              <div className="section-title">Club name</div>
              <input
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="input"
                placeholder="Home Club"
                style={{ marginTop: "var(--sp-2)" }}
              />
            </div>

            <div className="divider" style={{ marginTop: "var(--sp-5)" }} />

            {/* Holes header */}
            <div className="flex items-center justify-between" style={{ marginTop: "var(--sp-4)" }}>
              <div>
                <div className="section-title">Holes</div>
                <div className="meta">Add/remove holes and set par per hole.</div>
              </div>

              {/* GREEN primary add button */}
              <button type="button" onClick={addHole} className="btn btn-primary btn-inline">
                Add
              </button>
            </div>

            {/* Holes list */}
            <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
              {pars.map((par, idx) => (
                <div key={idx} className="row row-compact">
                  <div>
                    <div className="body">Hole {idx + 1}</div>
                    <div className="meta">Par</div>
                  </div>

                  <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                    <select
                      value={par}
                      onChange={(e) => updateParAt(idx, Number(e.target.value))}
                      className="input"
                      style={{ width: 84, minHeight: 44, padding: "8px 10px" }}
                      aria-label={`Par for hole ${idx + 1}`}
                    >
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                      <option value={6}>6</option>
                    </select>

                    {/* BIN ICON delete */}
                    <button
                      type="button"
                      onClick={() => removeHoleAt(idx)}
                      disabled={pars.length <= 1}
                      className="btn btn-ghost btn-inline"
                      aria-label={`Delete hole ${idx + 1}`}
                      title="Delete hole"
                      style={{ width: 44, paddingLeft: 0, paddingRight: 0 }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Messages */}
            {errorMsg ? (
              <div
                className="card"
                style={{
                  marginTop: "var(--sp-4)",
                  padding: "var(--sp-4)",
                  borderColor: "hsl(var(--danger))",
                  background: "hsl(var(--bg-surface))",
                }}
              >
                <div className="meta" style={{ color: "hsl(var(--danger))" }}>
                  {errorMsg}
                </div>
              </div>
            ) : null}

            {successMsg ? (
              <div
                className="card"
                style={{
                  marginTop: "var(--sp-4)",
                  padding: "var(--sp-4)",
                  borderColor: "hsl(var(--success))",
                  background: "hsl(var(--bg-surface))",
                }}
              >
                <div className="meta" style={{ color: "hsl(var(--success))" }}>
                  {successMsg}
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="stack-xs" style={{ marginTop: "var(--sp-5)" }}>
              <button
                type="button"
                onClick={saveHomeClub}
                disabled={isSaving}
                className="btn btn-primary"
                style={{ width: "100%" }}
              >
                {isSaving ? "Saving…" : "Save Home Club"}
              </button>

              <div className="meta">Note: changes apply to future rounds only (v1).</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}