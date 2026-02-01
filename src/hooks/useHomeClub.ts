"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

type HomeClubState =
  | { status: "loading" }
  | { status: "missing" }
  | {
      status: "present";
      id: string;
      clubId: string; // backward compatible
      name: string;
      holesCount: number;
      pars: number[];
    };

export function useHomeClub(userId: string | undefined): HomeClubState {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [state, setState] = useState<HomeClubState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!userId) {
        setState({ status: "loading" });
        return;
      }

      setState({ status: "loading" });

      // Preferred: home_clubs
      const { data: hc, error: hcErr } = await supabase
        .from("home_clubs")
        .select("id,name,holes_count")
        .eq("user_id", userId)
        .maybeSingle();

      if (!isMounted) return;

      if (!hcErr && hc) {
        const { data: holes, error: holesErr } = await supabase
          .from("home_club_holes")
          .select("hole_number,par")
          .eq("home_club_id", hc.id)
          .order("hole_number", { ascending: true });

        if (!isMounted) return;

        const holesCount = hc.holes_count as number;
        const pars =
          holesErr || !holes || holes.length === 0
            ? new Array(holesCount).fill(4)
            : holes.map((h: any) => (typeof h.par === "number" ? h.par : 4));

        setState({
          status: "present",
          id: hc.id,
          clubId: hc.id,
          name: hc.name,
          holesCount,
          pars,
        });
        return;
      }

      // Fallback: legacy clubs table
      const { data, error } = await supabase
        .from("clubs")
        .select("id,name,holes_count,is_home")
        .eq("user_id", userId)
        .eq("is_home", true)
        .limit(1);

      if (!isMounted) return;

      if (error) {
        setState({ status: "missing" });
        return;
      }

      const club = data?.[0];
      if (!club) {
        setState({ status: "missing" });
        return;
      }

      const holesCount = club.holes_count as number;

      setState({
        status: "present",
        id: club.id,
        clubId: club.id,
        name: club.name,
        holesCount,
        pars: new Array(holesCount).fill(4),
      });
    }

    void run();

    return () => {
      isMounted = false;
    };
  }, [supabase, userId]);

  return state;
}
