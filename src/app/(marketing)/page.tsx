import Link from "next/link";
import Section from "@/components/marketing/Section";
import Card from "@/components/marketing/Card";
import QuoteCards from "@/components/marketing/QuoteCards";
import PricingCards from "@/components/marketing/PricingCards";

export default function HomePage() {
  return (
    <div>
            {/* Hero */}
      <section className="pt-10 pb-6">
        <p className="inline-flex items-center rounded-full border border-slate-200/70 bg-white px-3 py-1 text-xs font-medium text-slate-600">
          Mental-performance training for real rounds
        </p>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight leading-tight text-slate-900">
          Train the part of your game that actually scores.
        </h1>

        <p className="mt-4 text-lg text-slate-700 leading-relaxed">
          Golf Brain is a modern mental-performance system that helps golfers build consistency,
          confidence, and calm — round after round.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="flex-1 rounded-2xl bg-emerald-600 px-5 py-4 text-center text-base font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Start training free
          </Link>

          <a
            href="#how-it-works"
            className="flex-1 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 text-center text-base font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
          >
            See how it works
          </a>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Designed for real rounds. No swing tips. No distractions.
        </p>
      </section>

      {/* Screenshot rail */}
      <section className="py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              See the system in action
            </h2>
            <p className="mt-2 text-slate-700">
              Calm, lightweight screens designed for real rounds — not distractions.
            </p>
          </div>

          <Link
            href="/product"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            Explore features →
          </Link>
        </div>

        <div className="mt-5 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {[
              { src: "/marketing/shots/dashboard.webp", label: "Dashboard" },
              { src: "/marketing/shots/scorecard.webp", label: "Scorecard" },
              { src: "/marketing/shots/reflection.webp", label: "Reflection" },
            ].map((s) => (
              <div
                key={s.src}
                className="w-[260px] shrink-0 rounded-3xl border border-slate-200/70 bg-white p-3"
              >
                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 overflow-hidden">
                  <img src={s.src} alt={s.label} className="w-full h-auto block" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">{s.label}</div>
                  <div className="text-xs text-slate-500">Real screen</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200/70 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Why this matters</div>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            Most tools add noise. Golf Brain stays quiet during play, then helps you capture the one
            thing that will compound next time.
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="py-8">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
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

      {/* How it works */}
      <div id="how-it-works" />
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
                <div className="text-base font-semibold text-slate-900">{s.t}</div>
                <div className="text-xs text-slate-500">{s.n}</div>
              </div>
              <div className="mt-2 text-sm text-slate-700 leading-relaxed">{s.d}</div>
            </Card>
          ))}
        </div>
      </Section>

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
              <div className="text-base font-semibold text-slate-900">{c.t}</div>
              <div className="mt-2 text-sm text-slate-700 leading-relaxed">{c.d}</div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Social proof */}
      <Section title="Designed by golfers who were tired of inconsistency.">
        <QuoteCards count={4} />
      </Section>

      {/* Before / During / After */}
      <section className="py-10">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          A round-aware system — before, during, after
        </h2>
        <p className="mt-2 text-slate-700">
          One intention before you play. Zero interference during the round. Reflection after.
        </p>

        <div className="mt-5 space-y-3">
          {[
            {
              step: "Before",
              title: "Set one focus",
              desc: "Pick a single intention you can actually execute under pressure.",
              pill: "Focus",
              chips: ["Tempo", "Commit", "Acceptance"],
            },
            {
              step: "During",
              title: "Play — stay in execution",
              desc: "No swing thoughts. No analytics. Just your routine and one cue.",
              pill: "Routine",
              chips: ["Target", "Breathe", "Commit"],
            },
            {
              step: "After",
              title: "Reflect in 60 seconds",
              desc: "Capture what mattered. Your next focus gets smarter automatically.",
              pill: "Reflection",
              chips: ["What worked", "What broke", "Next focus"],
            },
          ].map((x) => (
            <div key={x.step} className="rounded-3xl border border-slate-200/70 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500">{x.step}</div>
                  <div className="mt-1 text-base font-semibold text-slate-900">{x.title}</div>
                  <div className="mt-2 text-sm text-slate-700 leading-relaxed">{x.desc}</div>
                </div>

                <div className="shrink-0 rounded-full border border-slate-200/70 bg-white px-3 py-1 text-xs text-slate-700">
                  {x.pill}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200/60 bg-slate-50/70 p-3">
                <div className="flex flex-wrap gap-2">
                  {x.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-slate-200/70 bg-white px-3 py-1 text-xs text-slate-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <div className="flex-1 rounded-xl bg-white border border-slate-200/60 px-3 py-2 text-xs text-slate-600">
                    Minimal prompts
                  </div>
                  <div className="flex-1 rounded-xl bg-white border border-slate-200/60 px-3 py-2 text-xs text-slate-600">
                    No clutter
                  </div>
                  <div className="flex-1 rounded-xl bg-white border border-slate-200/60 px-3 py-2 text-xs text-slate-600">
                    Compounds
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <Link
            href="/login"
            className="flex-1 rounded-2xl bg-emerald-600 px-5 py-4 text-center text-base font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Start free
          </Link>
          <Link
            href="/why-mental"
            className="flex-1 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 text-center text-base font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
          >
            Why mental?
          </Link>
        </div>
      </section>

      {/* Pricing preview */}
      <Section title="Pricing" subtitle="Start free. Upgrade when you’re ready.">
        <PricingCards />
      </Section>

      {/* Final CTA */}
      <section className="py-10">
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50/60 p-5">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Your swing is trained. Your mind should be too.
          </h2>
          <Link
            href="/login"
            className="mt-4 block w-full rounded-2xl bg-emerald-600 px-4 py-4 text-center text-base font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Get started free
          </Link>
          <p className="mt-3 text-xs text-slate-600">Upgrade when you’re ready. No pressure.</p>
        </div>
      </section>
    </div>
  );
}