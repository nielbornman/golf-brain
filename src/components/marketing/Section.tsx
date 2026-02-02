import type { ReactNode } from "react";

export default function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section style={{ paddingTop: "var(--sp-6)", paddingBottom: "var(--sp-6)" }}>
      <div className="section-title">{title}</div>
      {subtitle ? (
        <div className="meta" style={{ marginTop: "var(--sp-2)" }}>
          {subtitle}
        </div>
      ) : null}
      <div style={{ marginTop: "var(--sp-4)" }}>{children}</div>
    </section>
  );
}