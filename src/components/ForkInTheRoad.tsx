"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

const icons: Record<string, ReactNode> = {
  rewrite: (
    <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  ),
  cloud: (
    <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
    </svg>
  ),
  wine: (
    <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 2h8v1H8V2zm-1 1v4c0 2.8 2.2 5 5 5s5-2.2 5-5V3h-1v4c0 2.2-1.8 4-4 4S8 9.2 8 7V3H7zm5 10v7m-3 0h6" />
    </svg>
  ),
};

const options = [
  {
    title: "Rewrite for Linux",
    icon: "rewrite",
    timeline: "18–36 months",
    risk: "High",
    cost: "$$$$$",
    pros: ["Native performance", "Full Linux ecosystem"],
    cons: [
      "Massive engineering investment",
      "Feature freeze during rewrite",
      "Regression risk on complex apps",
    ],
    highlighted: false,
  },
  {
    title: "Stay on Azure / Windows",
    icon: "cloud",
    timeline: "Ongoing",
    risk: "Low (short term)",
    cost: "$$$$",
    pros: ["No code changes", "Microsoft support"],
    cons: [
      "Escalating license costs",
      "Vendor lock-in deepens",
      "Azure dependency grows",
    ],
    highlighted: false,
  },
  {
    title: "Translate with Enterprise Wine",
    icon: "wine",
    timeline: "4–8 weeks (POC)",
    risk: "Low",
    cost: "$$",
    pros: [
      "No source code changes",
      "Run on any Linux infra",
      "60%+ cost reduction",
      "Keep existing CI/CD",
    ],
    cons: ["Not all Windows APIs covered", "Requires validation per workload"],
    highlighted: true,
  },
];

export default function ForkInTheRoad() {
  const highlightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [glowing, setGlowing] = useState(false);
  const hasAutoScrolled = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setGlowing(true);
          else setGlowing(false);
        }
      },
      { threshold: 0.6 }
    );

    for (const el of highlightRefs.current) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // Auto-scroll mobile carousel to the highlighted (last) card
  // Lock touch during the scroll so accidental touches don't interrupt
  const [scrollLocked, setScrollLocked] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || hasAutoScrolled.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAutoScrolled.current) {
          hasAutoScrolled.current = true;
          setScrollLocked(true);
          setTimeout(() => {
            container.scrollTo({
              left: container.scrollWidth,
              behavior: "smooth",
            });
            // Unlock after the smooth scroll completes (~600ms)
            setTimeout(() => setScrollLocked(false), 800);
          }, 400);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const setHighlightRef = (i: number) => (el: HTMLDivElement | null) => {
    highlightRefs.current[i] = el;
  };

  return (
    <section id="fork-in-the-road" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-medium tracking-widest text-accent uppercase">
          Your Options
        </p>
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
          A Fork in the Road
        </h2>
        <p className="mb-12 max-w-2xl text-text-secondary">
          When Windows licensing pressure rises, enterprises face three choices.
        </p>

        {/* Mobile: horizontal scroll cards */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 md:hidden"
          style={{ touchAction: scrollLocked ? "none" : undefined, overflowX: scrollLocked ? "hidden" : undefined }}
        >
          {options.map((opt, i) => (
            <div
              key={opt.title}
              ref={opt.highlighted ? setHighlightRef(i) : undefined}
              className={`relative rounded-xl border p-4 snap-center shrink-0 w-[75vw] transition-all duration-700 ${
                opt.highlighted
                  ? glowing
                    ? "border-accent bg-accent/5 animate-pulse-glow"
                    : "border-border bg-bg-card"
                  : "border-border bg-bg-card"
              }`}
              style={{
                opacity: !opt.highlighted && glowing ? 0.45 : 1,
                transition: "opacity 0.7s ease, border-color 0.7s, background-color 0.7s, box-shadow 0.7s",
              }}
            >
              <h3 className="relative mb-3 text-base font-bold">{opt.title}</h3>
              <div className="mb-3 h-px bg-border/50" />

              <div className="mb-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Timeline</span>
                  <span className="text-text-primary">{opt.timeline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Risk</span>
                  <span className="text-text-primary">{opt.risk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Cost</span>
                  <span className="text-text-primary">{opt.cost}</span>
                </div>
              </div>

              <div className="mb-3 h-px bg-border/50" />
              <div className="mb-3">
                <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-success uppercase">Pros</p>
                <ul className="space-y-0.5">
                  {opt.pros.map((p) => (
                    <li key={p} className="flex items-start gap-1.5 text-xs text-text-secondary">
                      <span className="mt-0.5 text-success">+</span> {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-danger uppercase">Cons</p>
                <ul className="space-y-0.5">
                  {opt.cons.map((c) => (
                    <li key={c} className="flex items-start gap-1.5 text-xs text-text-secondary">
                      <span className="mt-0.5 text-danger">&minus;</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: grid layout */}
        <div className="hidden md:grid gap-6 md:grid-cols-3">
          {options.map((opt, i) => (
            <div
              key={opt.title}
              ref={opt.highlighted ? setHighlightRef(i + 3) : undefined}
              className={`relative rounded-xl border p-8 transition-all duration-700 ${
                opt.highlighted
                  ? glowing
                    ? "border-accent bg-accent/5 animate-pulse-glow"
                    : "border-border bg-bg-card"
                  : "border-border bg-bg-card hover:border-border-accent/30"
              }`}
              style={{
                opacity: !opt.highlighted && glowing ? 0.45 : 1,
                transition: "opacity 0.7s ease, border-color 0.7s, background-color 0.7s, box-shadow 0.7s",
              }}
            >
              {/* Large background icon */}
              <div className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl ${opt.highlighted ? "text-accent" : "text-text-muted"}`}>
                <div className="h-48 w-48 opacity-[0.04]">
                  {icons[opt.icon]}
                </div>
              </div>

              <h3 className="relative mb-4 text-xl font-bold">{opt.title}</h3>
              <div className="mb-4 h-px bg-border/50" />

              <div className="mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Timeline</span>
                  <span className="text-text-primary">{opt.timeline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Risk</span>
                  <span className="text-text-primary">{opt.risk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Cost</span>
                  <span className="text-text-primary">{opt.cost}</span>
                </div>
              </div>

              <div className="mb-4 h-px bg-border/50" />
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold tracking-wider text-success uppercase">
                  Pros
                </p>
                <ul className="space-y-1">
                  {opt.pros.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="mt-0.5 text-success">+</span> {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider text-danger uppercase">
                  Cons
                </p>
                <ul className="space-y-1">
                  {opt.cons.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="mt-0.5 text-danger">&minus;</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
