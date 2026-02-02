export default function MarketingHomePageMock() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-slate-900" />
            <span className="text-sm font-semibold tracking-tight">Golf Brain</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-2 py-2 text-sm text-slate-600 hover:text-slate-900">
              Log in
            </button>
            <button className="px-3 py-2 rounded-xl text-sm font-medium bg-slate-900 text-white">
              Start free
            </button>
            <button
              className="ml-1 h-10 w-10 rounded-xl border border-slate-200 bg-white"
              aria-label="Open menu"
            >
              <div className="mx-auto w-4 space-y-1">
                <div className="h-0.5 bg-slate-900" />
                <div className="h-0.5 bg-slate-900" />
                <div className="h-0.5 bg-slate-900" />
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4">
        {/* Hero */}
        <section className="pt-8 pb-6">
          <div className="space-y-4">
            <p className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              Mental-performance training for real rounds
            </p>

            <h1 className="text-3xl font-semibold tracking-tight leading-tight">
              Train the part of your game that actually scores.
            </h1>

            <p className="text-base text-slate-700 leading-relaxed">
              Golf Brain is a modern mental-performance system that helps golfers build
              consistency, confidence, and calm — round after round.
            </p>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 text-white font-medium">
                Start training free
              </button>
              <button className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-medium">
                See how it works
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Designed for real rounds. No swing tips. No distractions.
            </p>

            {/* Product preview frame */}
            <div className="mt-5 rounded-3xl border border-slate-200 bg-white shadow-sm p-3">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Today</div>
                  <div className="text-xs text-slate-600">Focus: Calm tempo</div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white border border-slate-200 p-3">
                    <div className="text-xs text-slate-600">Round</div>
                    <div className="mt-1 text-lg font-semibold">+2</div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div className="h-2 w-2/3 rounded-full bg-slate-300" />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200 p-3">
                    <div className="text-xs text-slate-600">Stability</div>
                    <div className="mt-1 text-lg font-semibold">Good</div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div className="h-2 w-1/2 rounded-full bg-slate-300" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-white border border-slate-200 p-3">
                  <div className="text-xs text-slate-600">Quick reflection</div>
                  <div className="mt-1 text-sm">
                    Stayed committed under pressure on 15–18.
                  </div>
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
              But under pressure, it disappears. Practice doesn’t transfer. Focus drifts.
              Good rounds feel random.
            </p>
            <p>
              The difference isn’t talent — it’s consistency. And consistency is mental.
            </p>
          </div>
        </section>

        {/* Solution cards */}
        <section className="py-8">
          <h2 className="text-xl font-semibold tracking-tight">
            Golf Brain trains consistency — not technique.
          </h2>
          <p className="mt-2 text-slate-700">
            A simple mental framework that fits naturally into how you already play.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3">
            {[
              {
                t: "Mental routines that stick",
                d: "Build repeatable mental habits you can rely on when it matters most.",
              },
              {
                t: "Focus without interference",
                d: "No swing thoughts. No mid-round analysis. Just awareness and execution.",
              },
              {
                t: "Reflection that compounds",
                d: "Short, structured reflections that feed your future focus automatically.",
              },
              {
                t: "Built for the course",
                d: "Designed to support real rounds — not distract from them.",
              },
            ].map((c) => (
              <div
                key={c.t}
                className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4"
              >
                <div className="text-base font-semibold">{c.t}</div>
                <div className="mt-2 text-sm text-slate-700 leading-relaxed">{c.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-8">
          <h2 className="text-xl font-semibold tracking-tight">
            A simple system. Used repeatedly. Trusted over time.
          </h2>

          <div className="mt-5 space-y-3">
            {[
              { n: "01", t: "Set your focus", d: "Choose a single mental intention before your round." },
              { n: "02", t: "Play", d: "Golf Brain stays out of the way while you play." },
              { n: "03", t: "Reflect", d: "Capture what mattered — or skip when needed." },
              { n: "04", t: "Improve", d: "Your insights shape your next focus, round after round." },
            ].map((s) => (
              <div key={s.n} className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-base font-semibold">{s.t}</div>
                  <div className="text-xs text-slate-500">{s.n}</div>
                </div>
                <div className="mt-2 text-sm text-slate-700 leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-8">
          <h2 className="text-xl font-semibold tracking-tight">
            Built for golfers who want more than good swings.
          </h2>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>• Serious amateurs chasing consistency</li>
            <li>• Competitive club golfers</li>
            <li>• Players stuck between lessons</li>
            <li>• Golfers aiming for single-digit or scratch</li>
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            Works alongside coaching. Never replaces it.
          </p>
        </section>

        {/* Differentiation */}
        <section className="py-8">
          <h2 className="text-xl font-semibold tracking-tight">Why Golf Brain is different</h2>

          <div className="mt-5 space-y-3">
            {[
              { t: "Not a swing app", d: "It doesn’t add thoughts mid-round. It protects focus." },
              { t: "Not a notes app", d: "Everything is structured around performance — not memory." },
              { t: "Not generic mindset training", d: "Golf-specific, round-aware, and practical." },
            ].map((b) => (
              <div key={b.t} className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4">
                <div className="text-base font-semibold">{b.t}</div>
                <div className="mt-2 text-sm text-slate-700 leading-relaxed">{b.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof */}
        <section className="py-8">
          <h2 className="text-xl font-semibold tracking-tight">
            Designed by golfers who were tired of inconsistency.
          </h2>

          <div className="mt-5 space-y-3">
            {[
              "It didn’t change how I swing — it changed how often I played my best golf.",
              "For the first time, my good rounds stopped feeling accidental.",
              "Golf Brain doesn’t give advice. It gives awareness. That’s the difference.",
              "It fits into a round without getting in the way — which is exactly what I needed.",
            ].map((q) => (
              <div key={q} className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4">
                <p className="text-sm text-slate-800 leading-relaxed">“{q}”</p>
                <p className="mt-3 text-xs text-slate-500">Club golfer</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing preview */}
        <section className="py-8">
          <h2 className="text-xl font-semibold tracking-tight">Simple pricing</h2>
          <p className="mt-2 text-slate-700">Start free. Upgrade when you’re ready.</p>

          <div className="mt-5 space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">Free</div>
                <div className="text-sm text-slate-600">£0</div>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>• Mental scorecard</li>
                <li>• Focus tracking</li>
                <li>• Basic reflections</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">Premium</div>
                <div className="text-sm text-slate-600">Coming soon</div>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>• Deeper insights & patterns</li>
                <li>• Trends over time</li>
                <li>• Advanced routines</li>
              </ul>
              <button className="mt-4 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-medium">
                Register interest
              </button>
              <p className="mt-2 text-xs text-slate-600">No commitment. Be first to know.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">Pro</div>
                <div className="text-sm text-slate-600">For professionals</div>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>• Coach / academy workflows</li>
                <li>• Player management</li>
                <li>• Shared language & progress</li>
              </ul>
              <button className="mt-4 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-medium">
                Register interest
              </button>
              <p className="mt-2 text-xs text-slate-600">
                Early access list for coaches and facilities.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-10">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              Your swing is trained. Your mind should be too.
            </h2>
            <button className="mt-4 w-full px-4 py-3 rounded-2xl bg-slate-900 text-white font-medium">
              Get started free
            </button>
            <p className="mt-3 text-xs text-slate-600">
              Upgrade when you’re ready. No pressure.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 text-xs text-slate-500">
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
          <p className="mt-3">© {new Date().getFullYear()} Golf Brain</p>
        </footer>
      </main>
    </div>
  );
}