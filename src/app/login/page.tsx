"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useSession } from "@/hooks/useSession";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 48 48"
      focusable="false"
      style={{ display: "block" }}
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.656 32.629 29.234 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.045 6.053 29.273 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 19.01 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.045 6.053 29.273 4 24 4c-7.682 0-14.35 4.327-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.135 0 9.835-1.967 13.382-5.176l-6.187-5.238C29.182 35.091 26.715 36 24 36c-5.212 0-9.62-3.341-11.287-7.985l-6.52 5.02C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.243-2.231 4.149-4.108 5.586l.003-.002 6.187 5.238C36.941 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { session, isLoading } = useSession();
  const [isStarting, setIsStarting] = useState(false);

  if (!isLoading && session) {
    router.replace("/dashboard");
    return null;
  }

  async function signInWithGoogle() {
    setIsStarting(true);
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setIsStarting(false);
      // eslint-disable-next-line no-alert
      alert(error.message);
    }
  }

  return (
    <div className="container-app mode-briefing">
      <div className="stack" style={{ minHeight: "calc(100vh - var(--sp-6))" }}>
        <div style={{ marginTop: "auto" }} />
        <div className="card card-pad">
          <div className="stack-xs">
            <div>
              <h1 className="title">Golf Brain</h1>
              <div className="meta">Remind • Record • Reduce Strokes</div>
            </div>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={isStarting}
              className="btn btn-ghost"
              style={{
                width: "100%",
                minHeight: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--surface))",
              }}
            >
              <GoogleIcon />
              <span className="body" style={{ fontWeight: 600 }}>
                {isStarting ? "Starting…" : "Continue with Google"}
              </span>
            </button>

            <div className="meta">Google OAuth via Supabase.</div>
          </div>
        </div>
        <div style={{ marginBottom: "auto" }} />
      </div>
    </div>
  );
}
