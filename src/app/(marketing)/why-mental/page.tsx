import Section from "@/components/marketing/Section";
import Card from "@/components/marketing/Card";

export default function WhyMentalPage() {
  return (
    <div className="stack" style={{ paddingTop: "var(--sp-6)" }}>
      <div className="stack-xs">
        <div className="title">Why the mental game</div>
        <div className="meta">
          The difference between talent and consistency is what shows up under pressure.
        </div>
      </div>

      <Section title="Good golf isn’t missing. It’s inconsistent.">
        <Card>
          <div className="stack-xs">
            <div className="body">You already have the shots.</div>
            <div className="body">
              The question is whether they appear when the round matters — and whether you can repeat it.
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Why most solutions fail">
        <div className="stack-xs">
          {[
            "More swing thoughts adds noise.",
            "Generic mindset content is too abstract.",
            "Most tools aren’t built for the flow of a real round.",
          ].map((t) => (
            <Card key={t}>
              <div className="meta" style={{ lineHeight: 1.45 }}>
                {t}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="What Golf Brain does differently">
        <div className="stack-xs">
          {[
            "It stays out of the way while you play.",
            "It builds awareness you can repeat.",
            "It turns reflection into practical next steps.",
          ].map((t) => (
            <Card key={t}>
              <div className="meta" style={{ lineHeight: 1.45 }}>
                {t}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <a href="/pricing" className="btn btn-ghost" style={{ width: "100%" }}>
        See pricing
      </a>
    </div>
  );
}