import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/Footer";
import Section from "@/components/marketing/Section";
import Card from "@/components/marketing/Card";
import QuoteCards from "@/components/marketing/QuoteCards";
import PricingCards from "@/components/marketing/PricingCards";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />

      <main className="mx-auto max-w-md px-4">
        {/* Hero */}
        <section className="pt-8 pb-6">
          <p className="inline-flex items-center rounded-full border border-slate-200/70 bg-white px-3 py-1 text-xs text-slate-600">
            Mental-performance training for real rounds
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight leading-tight">
            Train the part of your game that actually scores.
          </h1>

          <p className="mt-3 text-base text-slate-700 leading-relaxed">
            Golf Brain is a modern mental-performance system that helps golfers build consistency,
            confidence, and calm — round after round.
          </p>

          <div className="mt-4 flex gap-2">
            <a
              href="/login"
              className="flex-1 text-center px-4 py-3 rounded-2xl bg-slate-900 text-white font-medium"
            >
              Start training free
            </a>
            <a
              href="/product"
              className="flex-1 text-center px-4 py-3 rounded-2xl border border-slate-200/70 bg-white text-slate-900 font-medium"
            >
              See how it works
            </a>
          </div>

          <p className="mt-3 text-xs text-slate-600">
            Designed for real rounds. No swing tips. No distractions.
          </p>

          {/* Softly framed preview */}
          <div className="mt-5 rounded-3xl border border-slate-200/70 bg-white p-3">
            <div className="rounded-2xl bg-slate-50/70 border border-slate-200/60 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Today</div>
                <div className="text-xs text-slate-600">Focus: Calm tempo</div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white border border-slate-200/60 p-3">
                  <div className="text-xs text-slate-600">Round</div>
                  <div className="mt-1 text-lg font-semibold">+2</div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-2/3 rounded-full bg-slate-300" />
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200/60 p-3">
                  <div className="text-xs text-slate-600">Stability</div>
                  <div className="mt-1 text-lg font-semibold">Good</div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-1/2 rounded-full bg-slate-300" />
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-white border border-slate-200/60 p-3">
                <div className="text-xs text-slate-600">Quick reflection</div>
                <div className="mt-1 text-sm text-slate-800">
                  Stayed committed under pressure on 15–18.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="py-8">
          <h2 className="text-xl font-semibold tracking-tight">
            Most golfers don’t lose strokes because of their swing.
          </h2>
          <div className="mt-3 space-y-3 text-slate-700 leading-relaxed">
            <p>You’ve hit great shots before. You know what good golf feels like.</p>
            <p>
              But under pressure, it disappears. Practice doesn’t transfer. Focus drifts. Good rounds
              feel random.
            </p>
            <p>The difference isn’t talent — it’s consistency. And consistency is mental.</p>
          </div>
        </section>

        {/* Solution */}
        <Section
          title="Golf Brain trains consistency — not technique."
          subtitle="A simple mental framework that fits naturally into how you already play."
        >
          <div className="grid grid-cols-1 gap-3">
            {[
              { t: "Mental routines that stick", d: "Build repeatable habits you can rely on when it matters most." },
              { t: "Focus without interference", d: "No swing thoughts. No mid-round analysis. Just awareness and execution." },
              { t: "Reflection that compounds", d: "Short, structured reflections that feed your next focus automatically." },
              { t: "Built for the course", d: "Designed to support real rounds — not distract from them." },
            ].map((c) => (
              <Card key={c.t}>
                <div className="text-base font-semibold">{c.t}</div>
                <div className="mt-2 text-sm text-slate-700 leading-relaxed">{c.d}</div>
              </Card>
            ))}
          </div>
        </Section>

        {/* How it works */}
        <Section title="A simple system. Used repeatedly. Trusted over time.">
          <div className="space-y-3">
            {[
              { n: "01", t: "Set your focus", d: "Choose a single mental intention before your round." },
              { n: "02", t: "Play", d: "Golf Brain stays out of the way while you play." },
              { n: "03", t: "Reflect", d: "Capture what mattered — or skip when needed." },
              { n: "04", t: "Improve", d: "Your insights shape your next focus, round after round." },
            ].map((s) => (
              <Card key={s.n}>
                <div className="flex items-baseline justify-between">
                  <div className="text-base font-semibold">{s.t}</div>
                  <div className="text-xs text-slate-500">{s.n}</div>
                </div>
                <div className="mt-2 text-sm text-slate-700 leading-relaxed">{s.d}</div>
              </Card>
            ))}
          </div>
        </Section>

        {/* Who it’s for */}
        <Section title="Built for golfers who want more than good swings.">
          <ul className="space-y-2 text-slate-700">
            <li>• Serious amateurs chasing consistency</li>
            <li>• Competitive club golfers</li>
            <li>• Players stuck between lessons</li>
            <li>• Golfers aiming for single-digit or scratch</li>
          </ul>
          <p className="mt-4 text-sm text-slate-600">Works alongside coaching. Never replaces it.</p>
        </Section>

        {/* Differentiation */}
        <Section title="Why Golf Brain is different">
          <div className="space-y-3">
            {[
              { t: "Not a swing app", d: "It doesn’t add thoughts mid-round. It protects focus." },
              { t: "Not a notes app", d: "Everything is structured around performance — not memory." },
              { t: "Not generic mindset training", d: "Golf-specific, round-aware, and practical." },
            ].map((b) => (
              <Card key={b.t}>
                <div className="text-base font-semibold">{b.t}</div>
                <div className="mt-2 text-sm text-slate-700 leading-relaxed">{b.d}</div>
              </Card>
            ))}
          </div>
        </Section>

        {/* Social proof */}
        <Section title="Designed by golfers who were tired of inconsistency.">
          <QuoteCards count={4} />
        </Section>

        {/* Pricing preview */}
        <Section title="Pricing" subtitle="Start free. Upgrade when you’re ready.">
          <PricingCards />
        </Section>

        {/* Final CTA */}
        <section className="py-10">
          <div className="rounded-3xl border border-slate-200/70 bg-slate-50/60 p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              Your swing is trained. Your mind should be too.
            </h2>
            <a
              href="/login"
              className="mt-4 block text-center w-full px-4 py-3 rounded-2xl bg-slate-900 text-white font-medium"
            >
              Get started free
            </a>
            <p className="mt-3 text-xs text-slate-600">Upgrade when you’re ready. No pressure.</p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}