import Card from "@/components/marketing/Card";

const QUOTES: string[] = [
  "It didn’t change how I swing — it changed how often I played my best golf.",
  "For the first time, my good rounds stopped feeling accidental.",
  "I realised most of my bad holes were mental, not technical.",
  "Golf Brain doesn’t give advice. It gives awareness. That’s the difference.",
  "I stopped chasing fixes and started trusting a process.",
  "It fits into a round without getting in the way — which is exactly what I needed.",
  "This feels like something elite players would use quietly.",
  "It helped me stay calmer when the round mattered most.",
];

export default function QuoteCards({ count = 4 }: { count?: number }) {
  return (
    <div className="stack-xs">
      {QUOTES.slice(0, count).map((q) => (
        <Card key={q}>
          <div className="body" style={{ lineHeight: 1.35 }}>
            “{q}”
          </div>
          <div className="meta" style={{ marginTop: "var(--sp-3)" }}>
            Club golfer
          </div>
        </Card>
      ))}
    </div>
  );
}