import Section from "@/components/marketing/Section";
import Card from "@/components/marketing/Card";

function Shot({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="card"
      style={{
        overflow: "hidden",
        padding: 0,
        borderRadius: "var(--r-xl)",
      }}
    >
      <img src={src} alt={alt} style={{ display: "block", width: "100%", height: "auto" }} />
    </div>
  );
}

export default function ProductPage() {
  return (
    <div className="stack" style={{ paddingTop: "var(--sp-6)" }}>
      <div className="stack-xs">
        <div className="title">Product</div>
        <div className="meta">
          Golf Brain improves consistency by training repeatable mental habits — quietly.
        </div>
      </div>

      <Section title="What Golf Brain helps you do">
        <div className="stack-xs">
          {[
            {
              t: "Mental Scorecard",
              d: "Track what matters mentally, hole by hole — without distraction.",
            },
            {
              t: "Focus & Routines",
              d: "Lock a single intention and protect it under pressure.",
            },
            {
              t: "Reflections",
              d: "Optional reflection that feeds your future focus.",
            },
            {
              t: "Insights (Coming soon)",
              d: "Long-term patterns that translate into scoring.",
            },
          ].map((f) => (
            <Card key={f.t}>
              <div className="body" style={{ fontWeight: 800 }}>
                {f.t}
              </div>
              <div className="meta" style={{ marginTop: "var(--sp-2)", lineHeight: 1.45 }}>
                {f.d}
              </div>
            </Card>
          ))}
        </div>

        <div className="stack-xs" style={{ marginTop: "var(--sp-4)" }}>
          <div className="meta">Examples (drop images into public/marketing):</div>
          <Shot src="/marketing/shot-scorecard.png" alt="Scorecard example" />
          <Shot src="/marketing/shot-dashboard.png" alt="Dashboard example" />
        </div>
      </Section>

      <a href="/login" className="btn btn-primary" style={{ width: "100%" }}>
        Start free
      </a>
    </div>
  );
}