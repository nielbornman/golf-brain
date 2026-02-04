"use client";

import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { useHomeClub } from "@/hooks/useHomeClub";

export default function AccountPage() {
  const { session, isLoading } = useSession();
  const homeClub = useHomeClub(session?.user.id);

  const homeClubStatus =
    homeClub.status === "present"
      ? `Home Club set: ${homeClub.name}`
      : homeClub.status === "missing"
      ? "Home Club missing"
      : "Checking Home Club…";

  return (
    <div className="container-app mode-briefing">
      <div className="stack">
        {/* Header */}
        <div className="stack-xs">
          <div className="title">Account</div>
          <div className="meta">Setup & memory.</div>
        </div>


        {/* Setup */}
        <div className="card card-pad">
          
          <div className="section-title">Status</div>
          <div className="stack-xs" style={{ marginTop: "var(--sp-3)" }}>
            <div className="meta">
              Signed in as: {isLoading ? "Loading…" : session?.user.email ?? "—"}
            </div>
          </div>
          <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
            Configure the foundations that unlocks the Scorecard + Dashboard features of the Golf Brain app.
          </div>

          <div style={{ marginTop: "var(--sp-4)" }}>
            <div className="inset-list">
              <Link href="/account/mental-elements" className="inset-row">
                <div className="stack-xs" style={{ gap: "4px" }}>
                  <div className="body">Mental Elements</div>
                  <div className="meta">Cues you want to track (e.g., Commitment).</div>
                </div>
                <div className="meta">›</div>
              </Link>

              <Link href="/account/bag" className="inset-row">
                <div className="stack-xs" style={{ gap: "4px" }}>
                  <div className="body">Bag & Best Shot Memory</div>
                  <div className="meta">Clubs + BSM cue per club.</div>
                </div>
                <div className="meta">›</div>
              </Link>
              <Link href="/account/home-club" className="inset-row">
                <div className="stack-xs" style={{ gap: "4px" }}>
                  <div className="body">Home Club</div>
                  <div className="meta">Holes + par per hole.</div>
                </div>
                <div className="meta">›</div>
              </Link>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
