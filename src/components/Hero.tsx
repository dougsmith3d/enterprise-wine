"use client";

import RadialBurst from "./RadialBurst";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
      {/* Animated radial burst background */}
      <RadialBurst />

      {/* Subtle top gradient overlay for text contrast */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center_40%,_rgba(11,15,20,0.4)_0%,_transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <p
          className="mb-4 text-sm font-medium tracking-widest text-accent uppercase"
          style={{ animation: "heroFadeIn 0.8s 0.1s both ease-out" }}
        >
          CodeWeavers Enterprise Wine
        </p>
        <h1
          className="mb-6 text-2xl leading-tight font-bold tracking-tight sm:text-4xl md:text-6xl"
          style={{ animation: "heroFadeIn 0.8s 0.3s both ease-out" }}
        >
          Run Windows Workloads on Linux.{" "}
          <span className="text-accent">Cut Costs by 60%+.</span>
        </h1>
        <p
          className="mx-auto mb-10 max-w-2xl text-lg text-text-secondary md:text-xl"
          style={{ animation: "heroFadeIn 0.8s 0.5s both ease-out" }}
        >
          Your existing Windows applications run on Linux — no rewrites required.
        </p>

        <div
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          style={{ animation: "heroFadeIn 0.8s 0.7s both ease-out" }}
        >
          <a
            href="#cost-modeling"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-3.5 text-base font-semibold text-bg-primary transition-all hover:opacity-90 hover:shadow-lg hover:shadow-accent/20 w-full sm:w-auto"
          >
            Run the Cost Model
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </a>
          <a
            href="#what-is-wine"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-8 py-3.5 text-base font-semibold text-text-primary transition-all hover:border-accent hover:text-accent backdrop-blur-sm w-full sm:w-auto"
          >
            How Enterprise Wine Works
          </a>
        </div>

        {/* Trust line */}
        <p
          className="mt-16 text-sm text-text-muted"
          style={{ animation: "heroFadeIn 0.8s 0.9s both ease-out" }}
        >
          Trusted by Fortune 500 enterprises · 20+ years of Wine development ·
          640+ Windows libraries supported
        </p>
      </div>

      {/* Bottom divider line */}
      <div className="absolute bottom-0 left-0 right-0 h-px z-20 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
    </section>
  );
}
