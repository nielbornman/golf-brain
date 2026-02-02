import PricingCards from "@/components/marketing/PricingCards";
import Card from "@/components/marketing/Card";

export default function PricingPage() {
  return (
    <div className="stack" style={{ paddingTop: "var(--sp-6)" }}>
      <PricingCards showHeading />

      <Card>
        <div className="section-title">Notes</div>
        <div className="meta" style={{ marginTop: "var(--sp-2)", lineHeight: 1.5 }}>
          Plus is the consumer premium tier. Pro is for golf professionals (coaches, academies).
          “Register interest” captures demand without billing or tier logic yet.
        </div>
      </Card>
    </div>
  );
}