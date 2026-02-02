import Section from "@/components/marketing/Section";
import Card from "@/components/marketing/Card";

export default function AboutPage() {
  return (
    <div className="stack" style={{ paddingTop: "var(--sp-6)" }}>
      <div className="stack-xs">
        <div className="title">About</div>
        <div className="meta">
          Golf Brain is built for golfers who value calm focus, consistency, and a repeatable process.
        </div>
      </div>

      <Section title="Philosophy">
        <Card>
          <div className="stack-xs">
            <div className="meta">• Simple by design</div>
            <div className="meta">• Quiet confidence over hype</div>
            <div className="meta">• Real-round utility over theory</div>
            <div className="meta">• Works alongside coaching. Never replaces it</div>
          </div>
        </Card>
      </Section>

      <a href="/product" className="btn btn-ghost" style={{ width: "100%" }}>
        See the product
      </a>
    </div>
  );
}