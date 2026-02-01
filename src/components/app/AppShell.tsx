"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TabBar } from "@/components/app/TabBar";
import { useSession } from "@/hooks/useSession";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading, supabase } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!session && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isLoading, session, pathname, router]);

  async function onLogout() {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container-app mode-briefing">
        <div className="stack">
          <div className="meta">Loading…</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container-app mode-briefing">
        <div className="stack">
          <div className="meta">Redirecting…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Sticky header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(8px)",
          background: "hsla(var(--bg-page), 0.9)",
          borderBottom: "1px solid hsl(var(--divider))",
        }}
      >
        <div className="container-app" style={{ paddingTop: "var(--sp-4)", paddingBottom: "var(--sp-4)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Golf Brain</div>
              <div className="meta">Remind • Record • Reduce Strokes</div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              disabled={isSigningOut}
              className="btn btn-ghost"
              aria-label="Logout"
              title="Logout"
            >
              {isSigningOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container-app" style={{ paddingTop: "var(--sp-5)", paddingBottom: 96 }}>
        {children}
      </main>

      {/* Bottom tabs */}
      <TabBar />
    </div>
  );
}
