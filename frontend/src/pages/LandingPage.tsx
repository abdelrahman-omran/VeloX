import { Link } from 'react-router-dom';
import { HeroGlassMock } from '../components/marketing/HeroGlassMock';
import { ImpactChain } from '../components/marketing/ImpactChain';
import { MarketingFooter } from '../components/marketing/MarketingFooter';
import { MarketingHeader } from '../components/marketing/MarketingHeader';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/Logo';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-velox-bg text-velox-text">
      <MarketingHeader />

      <main>
        {/* Hero: brand + headline + support + CTAs + full-bleed product visual */}
        <section className="relative" aria-labelledby="hero-heading">
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16">
            <div className="mb-6 inline-flex md:hidden">
              <Logo size={32} gradientId="hero-grad-mobile" />
            </div>
            <p className="mb-3 hidden font-mono text-xs uppercase tracking-[0.14em] text-velox-muted md:block">
              VeloX · for Team Leads
            </p>
            <h1
              id="hero-heading"
              className="max-w-3xl text-[2rem] font-bold leading-[1.15] tracking-tight text-velox-text sm:text-5xl"
            >
              Engineering intelligence before the merge.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-velox-muted sm:text-lg">
              Turn GitHub PR noise into a risk-sorted triage inbox — blast radius and
              sprint pressure, not line nitpicks.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/signup">
                <Button variant="primary">Open Glass</Button>
              </Link>
              <a
                href="#how"
                className="text-sm font-medium text-velox-muted transition-colors duration-150 hover:text-velox-text"
              >
                See how it works
              </a>
            </div>
          </div>
          <HeroGlassMock />
        </section>

        {/* Gap */}
        <section
          id="product"
          className="scroll-mt-20 border-t border-velox-border"
          aria-labelledby="product-heading"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2
              id="product-heading"
              className="max-w-2xl text-2xl font-bold tracking-tight text-velox-text sm:text-3xl"
            >
              Stuck between CodeRabbit and LinearB?
            </h2>
            <p className="mt-3 max-w-2xl text-base text-velox-muted">
              Built for Team Leads stuck between CodeRabbit and LinearB.
            </p>

            <div className="mt-12 grid gap-0 border border-velox-border md:grid-cols-[1fr_auto_1fr]">
              <div className="p-6 sm:p-8">
                <p className="font-mono text-[11px] uppercase tracking-wide text-velox-muted">
                  AI PR reviewers
                </p>
                <p className="mt-3 text-sm leading-relaxed text-velox-text">
                  Micro, line-by-line, IC-facing. Great for nits — silent on sprint
                  deadlines and system impact.
                </p>
              </div>
              <div
                className="flex items-center justify-center border-y border-velox-border bg-velox-elevated px-4 py-6 md:border-x md:border-y-0"
                aria-hidden
              >
                <span className="font-mono text-xs text-velox-brand">gap</span>
              </div>
              <div className="p-6 sm:p-8">
                <p className="font-mono text-[11px] uppercase tracking-wide text-velox-muted">
                  Eng metrics platforms
                </p>
                <p className="mt-3 text-sm leading-relaxed text-velox-text">
                  Macro DORA charts after the fact. They show cycle time is bad —
                  not which PR, or why.
                </p>
              </div>
            </div>

            <p className="mt-8 text-base font-semibold text-velox-text">
              VeloX: triage from the actual diff.
            </p>
            <div className="mt-6">
              <Link to="/signup">
                <Button variant="primary">Open Glass</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Impact chain */}
        <section
          id="how"
          className="scroll-mt-20 border-t border-velox-border bg-velox-card/40"
          aria-labelledby="how-heading"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2
              id="how-heading"
              className="text-2xl font-bold tracking-tight text-velox-text sm:text-3xl"
            >
              Micro to macro in one inbox
            </h2>
            <p className="mt-3 max-w-xl text-base text-velox-muted">
              Watch the chain: the diff, the blast radius, and why it matters for
              delivery — without a status meeting.
            </p>
            <div className="mt-10">
              <ImpactChain />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section
          className="border-t border-velox-border"
          aria-labelledby="cta-heading"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2
              id="cta-heading"
              className="text-2xl font-bold tracking-tight text-velox-text sm:text-3xl"
            >
              Morning triage without the status meeting.
            </h2>
            <div className="mt-8 flex flex-col items-center gap-4">
              <Link to="/signup">
                <Button variant="primary">Open Glass</Button>
              </Link>
              <Link
                to="/app"
                className="text-sm text-velox-muted transition-colors hover:text-velox-text"
              >
                Skip to demo dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
