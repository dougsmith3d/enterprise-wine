"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const phases = [
  {
    step: "01",
    title: "Proof of Concept",
    duration: "4–6 weeks",
    desc: "Validate compatibility and performance. Your application runs on Linux via Enterprise Wine in a controlled environment, benchmarked against the Windows baseline.",
  },
  {
    step: "02",
    title: "Production Hardening",
    duration: "4–8 weeks",
    desc: "Develop required compatibility improvements and finalize a production-ready build of your workload on Enterprise Wine.",
  },
  {
    step: "03",
    title: "Production Soak",
    duration: "4–8 weeks",
    desc: "Run Linux and Windows environments side-by-side before full cutover. Gradual traffic migration with rollback capability.",
  },
  {
    step: "04",
    title: "Full Production",
    duration: "Ongoing",
    desc: "Complete production cutover with 24/7 support, rapid patching, and direct access to Wine maintainers.",
  },
];

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function EngagementModel() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const mobileGridRef = useRef<HTMLDivElement>(null);
  const mobilePhaseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lineProgress, setLineProgress] = useState(0);
  const [mobileLineHeight, setMobileLineHeight] = useState<string>("100%");
  const [revealed, setRevealed] = useState<boolean[]>(
    () => new Array(phases.length).fill(false)
  );

  const handleScroll = useCallback(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    if (!section || !grid) return;

    // Use whichever grid is visible (desktop or mobile)
    const activeGrid = grid?.offsetParent !== null ? grid : mobileGridRef.current;
    if (!activeGrid) return;
    const sRect = section.getBoundingClientRect();
    const gRect = activeGrid.getBoundingClientRect();
    const vh = window.innerHeight;

    // Progress tracks how far through the grid the viewport scan line has
    // scrolled. On mobile (tall vertical layout) use a higher scan point so
    // cards appear earlier — the user shouldn't have to scroll past a card
    // before it reveals.
    const gridTop = gRect.top;
    const gridHeight = gRect.height;
    const isMobile = window.innerWidth < 768;
    const viewMid = vh * (isMobile ? 0.75 : 0.55);
    const raw = (viewMid - gridTop) / gridHeight;
    const progress = Math.max(0, Math.min(1, raw));
    setLineProgress(progress);

    // Reveal/hide phases based on line progress — evenly spaced across 0.05–0.95
    setRevealed((prev) => {
      const next = phases.map((_, i) => {
        const threshold = 0.05 + (i / (phases.length - 1)) * 0.9;
        return progress >= threshold;
      });
      // Only update if changed
      if (next.every((v, i) => v === prev[i])) return prev;
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Measure mobile line height: from top of grid to center of last circle
  useEffect(() => {
    const measure = () => {
      const grid = mobileGridRef.current;
      const lastPhase = mobilePhaseRefs.current[phases.length - 1];
      if (!grid || !lastPhase) return;
      const gridTop = grid.getBoundingClientRect().top;
      const lastTop = lastPhase.getBoundingClientRect().top;
      // Circle is h-12 (48px), center at 24px
      const lineEnd = lastTop - gridTop + 24;
      setMobileLineHeight(`${lineEnd}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const lineEased = ease(lineProgress);
  // Core appears once line reaches the end (last card revealed)
  const coreOpacity = Math.max(0, Math.min(1, (lineProgress - 0.85) / 0.12));

  return (
    <section ref={sectionRef} id="engagement" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-medium tracking-widest text-accent uppercase">
          How We Work
        </p>
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
          Deployment Model
        </h2>
        <p className="mb-16 max-w-2xl text-text-secondary">
          Every engagement begins with a controlled proof-of-concept and
          progresses to production only after stability is demonstrated.
        </p>

        {/* Desktop: horizontal scroll-driven reveal */}
        <div ref={gridRef} className="relative hidden md:grid md:grid-cols-4 gap-8">
          {/* Animated connector line */}
          <div
            className="absolute top-6 left-6 right-6 h-px origin-left"
            style={{
              background:
                "linear-gradient(to right, rgba(94,234,212,0.4), rgba(59,130,246,0.4))",
              transform: `scaleX(${lineEased})`,
              transition: "none",
            }}
          />
          {/* Pulse dot at line tip */}
          <div
            className="absolute top-6 h-2 w-2 -translate-y-1/2 rounded-full bg-accent"
            style={{
              left: `calc(24px + (100% - 48px) * ${lineEased})`,
              opacity: lineProgress > 0.02 && lineProgress < 0.98 ? 0.8 : 0,
              boxShadow: "0 0 8px 2px rgba(94,234,212,0.5)",
              transition: "opacity 0.3s",
            }}
          />

          {/* Pulsing white core at line origin (circle 01) */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "24px",
              left: "24px",
              transform: "translate(-50%, -50%)",
              opacity: coreOpacity,
              transition: "opacity 0.6s ease-out",
            }}
          >
            {/* Outer pulse ring */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 28,
                height: 28,
                border: "1px solid rgba(255,255,255,0.2)",
                animation: coreOpacity > 0 ? "coreRingPulse 2.5s ease-in-out infinite" : "none",
              }}
            />
            {/* Glow halo */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 20,
                height: 20,
                background: "radial-gradient(circle, rgba(94,234,212,0.3) 0%, rgba(94,234,212,0.08) 50%, transparent 70%)",
                animation: coreOpacity > 0 ? "coreGlowPulse 2.5s ease-in-out infinite" : "none",
              }}
            />
            {/* White hot center */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
              style={{
                width: 6,
                height: 6,
                boxShadow: "0 0 8px 3px rgba(255,255,255,0.6), 0 0 16px 6px rgba(94,234,212,0.4)",
                animation: coreOpacity > 0 ? "coreDotPulse 2.5s ease-in-out infinite" : "none",
              }}
            />
          </div>

          {phases.map((phase, i) => {
            const isRevealed = revealed[i];
            return (
              <div
                key={phase.step}
                className="relative"
                style={{
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed
                    ? "translateY(0)"
                    : "translateY(16px)",
                  transition:
                    "opacity var(--reveal-duration) var(--reveal-easing), transform var(--reveal-duration) var(--reveal-easing)",
                }}
              >
                <div
                  className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-bg-primary text-sm font-bold"
                  style={{
                    borderColor: isRevealed
                      ? "rgb(94,234,212)"
                      : "rgb(55,65,81)",
                    color: isRevealed
                      ? "rgb(94,234,212)"
                      : "rgb(107,114,128)",
                    transition: "border-color 0.4s, color 0.4s",
                  }}
                >
                  {phase.step}
                </div>

                <h3 className="text-lg font-bold">{phase.title}</h3>
                <p className="mt-1 font-geist-mono text-xs text-accent">
                  {phase.duration}
                </p>
                <p className="mt-3 text-sm text-text-secondary">
                  {phase.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mobile: vertical scroll-driven reveal */}
        <div ref={mobileGridRef} className="relative md:hidden">
          {/* Vertical connector — stops at the center of the last circle */}
          <div
            className="absolute left-6 top-0 w-px origin-top"
            style={{
              height: mobileLineHeight,
              background:
                "linear-gradient(to bottom, rgba(94,234,212,0.4), rgba(59,130,246,0.4))",
              transform: `scaleY(${lineEased})`,
              transition: "none",
            }}
          />

          {/* Pulsing white core at line origin (circle 01) */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "24px",
              left: "24px",
              transform: "translate(-50%, -50%)",
              opacity: coreOpacity,
              transition: "opacity 0.6s ease-out",
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 28,
                height: 28,
                border: "1px solid rgba(255,255,255,0.2)",
                animation: coreOpacity > 0 ? "coreRingPulse 2.5s ease-in-out infinite" : "none",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 20,
                height: 20,
                background: "radial-gradient(circle, rgba(94,234,212,0.3) 0%, rgba(94,234,212,0.08) 50%, transparent 70%)",
                animation: coreOpacity > 0 ? "coreGlowPulse 2.5s ease-in-out infinite" : "none",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
              style={{
                width: 6,
                height: 6,
                boxShadow: "0 0 8px 3px rgba(255,255,255,0.6), 0 0 16px 6px rgba(94,234,212,0.4)",
                animation: coreOpacity > 0 ? "coreDotPulse 2.5s ease-in-out infinite" : "none",
              }}
            />
          </div>

          <div className="space-y-10">
            {phases.map((phase, i) => {
              const isRevealed = revealed[i];
              return (
                <div
                  key={phase.step}
                  ref={(el) => { mobilePhaseRefs.current[i] = el; }}
                  className="relative pl-16"
                  style={{
                    opacity: isRevealed ? 1 : 0,
                    transform: isRevealed
                      ? "translateY(0)"
                      : "translateY(16px)",
                    transition:
                      "opacity var(--reveal-duration) var(--reveal-easing), transform var(--reveal-duration) var(--reveal-easing)",
                  }}
                >
                  <div
                    className="absolute left-0 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-bg-primary text-sm font-bold"
                    style={{
                      borderColor: isRevealed
                        ? "rgb(94,234,212)"
                        : "rgb(55,65,81)",
                      color: isRevealed
                        ? "rgb(94,234,212)"
                        : "rgb(107,114,128)",
                      transition: "border-color 0.4s, color 0.4s",
                    }}
                  >
                    {phase.step}
                  </div>

                  <h3 className="text-lg font-bold">{phase.title}</h3>
                  <p className="mt-1 font-geist-mono text-xs text-accent">
                    {phase.duration}
                  </p>
                  <p className="mt-3 text-sm text-text-secondary">
                    {phase.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
