export default function FinalCTA() {
  return (
    <section id="final-cta" className="relative overflow-hidden px-6 py-32">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(94,234,212,0.08)_0%,_transparent_70%)]" />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="mb-6 text-2xl font-bold sm:text-3xl md:text-5xl">
          Ready to Break Free from{" "}
          <span className="text-accent">Windows Licensing?</span>
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg text-text-secondary">
          Start with a free assessment. We&rsquo;ll map your workload,
          identify coverage, and give you a clear go/no-go — no commitment
          required.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="mailto:enterprise@codeweavers.com"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-semibold text-bg-primary transition-all hover:opacity-90 hover:shadow-lg hover:shadow-accent/20 w-full sm:w-auto"
          >
            Request an Assessment
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </a>
          <a
            href="#cost-modeling"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-8 py-4 text-base font-semibold text-text-primary transition-all hover:border-accent hover:text-accent w-full sm:w-auto"
          >
            Run the Cost Model
          </a>
        </div>
      </div>
    </section>
  );
}
