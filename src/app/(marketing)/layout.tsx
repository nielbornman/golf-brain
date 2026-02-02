import type { ReactNode } from "react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/Footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))", color: "hsl(var(--text))" }}>
      <MarketingHeader />
      <main className="container-app mode-briefing">
        <div className="stack">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  );
}