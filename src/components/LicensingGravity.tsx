"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const timeline = [
  {
    year: "2019",
    title: "BYOL Licensing Revoked on Public Cloud",
    desc: "Microsoft restricts Bring Your Own License without Software Assurance on AWS, Google Cloud, and Alibaba.",
  },
  {
    year: "2021",
    title: "Per-Core Licensing Drives Cost Increases",
    desc: "Windows Server and SQL Server expand per-core licensing. Costs rise dramatically on modern multi-core hardware.",
  },
  {
    year: "2022",
    title: "Azure Hybrid Licensing Push",
    desc: "Microsoft pushes Azure hybrid adoption with licensing discounts unavailable in traditional on-prem deployments.",
  },
  {
    year: "2023",
    title: "Copilot Tax & M365 Bundling",
    desc: "AI features bundled into premium SKUs and enterprise agreements. Microsoft expands platform pricing across the stack.",
  },
  {
    year: "2025",
    title: "Azure Hybrid Benefit Compliance Crackdown",
    desc: "SA expiration traps and license audits catch enterprises off guard.",
  },
];

const rings = [
  { label: "OS Licensing", radius: 75 },
  { label: "Server CALs", radius: 137 },
  { label: "SQL Per-Core", radius: 200 },
  { label: "Azure Hybrid", radius: 262 },
  { label: "Copilot / M365", radius: 325 },
];

// Ring colors: electric blue → green
// Inner rings: electric blue (59,130,246) → outer rings: strong green (52,211,153)
function ringColor(i: number, count: number, alpha: number): string {
  const t = count > 1 ? i / (count - 1) : 0;
  const r = Math.round(59 + (52 - 59) * t);
  const g = Math.round(130 + (211 - 130) * t);
  const b = Math.round(246 + (153 - 246) * t);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ringGlowColor(i: number, count: number): string {
  const t = count > 1 ? i / (count - 1) : 0;
  const r = Math.round(59 + (52 - 59) * t);
  const g = Math.round(130 + (211 - 130) * t);
  const b = Math.round(246 + (153 - 246) * t);
  return `rgba(${r},${g},${b},0.08)`;
}

function ease(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ── Combined Timeline + Rings ────────────────────────────────── */

function TimelineAndRings() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ringsSvgRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);

  // Track container width for responsive SVG text sizing
  const [svgWidth, setSvgWidth] = useState(700);

  // The single pixel height of the line from wrapper top
  const [lineHeight, setLineHeight] = useState(0);
  // Each event's pixel offset from wrapper top (stable layout measurement)
  const [eventYs, setEventYs] = useState<number[]>([]);
  const [ringsProgress, setRingsProgress] = useState(0);
  const ringsTargetRef = useRef(0);
  const ringsCurrentRef = useRef(0);
  const rafIdRef = useRef(0);

  // Smooth animation loop — lerps ringsProgress toward scroll target
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const target = ringsTargetRef.current;
      const current = ringsCurrentRef.current;
      const diff = target - current;
      // Lerp factor — lower = smoother/slower
      const next = Math.abs(diff) < 0.001 ? target : current + diff * 0.08;
      if (next !== current) {
        ringsCurrentRef.current = next;
        setRingsProgress(next);
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafIdRef.current); };
  }, []);

  const measure = useCallback(() => {
    const wEl = wrapperRef.current;
    if (!wEl) return;
    const wTop = wEl.getBoundingClientRect().top;

    // Measure event dot positions (top of each event div + 4px for the dot)
    const ys = eventRefs.current.map((el) => {
      if (!el) return 0;
      return el.getBoundingClientRect().top - wTop + 4;
    });
    setEventYs(ys);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight;
      const wEl = wrapperRef.current;
      const svgEl = ringsSvgRef.current;

      // Re-measure event positions each frame
      measure();

      if (wEl && svgEl) {
        const wRect = wEl.getBoundingClientRect();
        const svgRect = svgEl.getBoundingClientRect();
        const totalDist = (svgRect.top - wRect.top) + svgRect.height / 2;

        // Line tip tracks vh * 0.6
        const tipInWrapper = vh * 0.6 - wRect.top;
        setLineHeight(Math.max(0, Math.min(totalDist, tipInWrapper)));

        // Track rendered width for responsive text sizing
        setSvgWidth(svgRect.width);
      }

      // Rings scroll progress — set target, animation loop lerps to it
      const rEl = ringsRef.current;
      if (rEl) {
        const rRect = rEl.getBoundingClientRect();
        const rStart = vh * 0.55;
        const rEnd = vh * 0.1;
        ringsTargetRef.current = Math.max(0, Math.min(1, (rStart - rRect.top) / (rStart - rEnd)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [measure]);

  // Title: fade in from halfway through rings to last ring done
  const midRingIdx = Math.floor(rings.length / 2);
  const midRingStart = 0.15 + (midRingIdx / rings.length) * 0.55;
  const lastRingIdx = rings.length - 1;
  const lastRingEnd = 0.15 + (lastRingIdx / rings.length) * 0.55 + 0.18;
  const titleRaw = (ringsProgress - midRingStart) / (lastRingEnd - midRingStart);
  const titleEased = ease(Math.max(0, Math.min(1, titleRaw)));

  // Copilot/M365 label extra dim after title fully appears
  const titleFullyVisible = titleEased >= 1;

  return (
    <div ref={wrapperRef} className="relative">
      {/* Single continuous line — starts at first dot, draws to rings center */}
      <div
        className="absolute left-1/2 w-px bg-border origin-top z-0"
        style={{
          top: `${eventYs[0] ?? 0}px`,
          height: `${Math.max(0, lineHeight - (eventYs[0] ?? 0))}px`,
          transition: "height 0.05s linear",
        }}
      />

      {/* Timeline */}
      <div className="relative">
        <div className="space-y-12">
          {timeline.map((item, i) => {
            const dotY = eventYs[i] ?? 0;
            // How far past this dot the line has drawn (in px)
            // 30px approach zone: starts revealing when line is 30px away
            const distPast = lineHeight - dotY;
            const reach = dotY > 0 ? Math.max(0, Math.min(1, (distPast + 30) / 60)) : 0;
            const eventEased = ease(reach);

            // Pulse fires when line arrives at the dot (distPast crosses 0)
            const pulseNorm = dotY > 0 ? distPast / 60 : -1;
            const pulseProgress = Math.max(0, Math.min(1, pulseNorm));
            const pulseScale = 1 + pulseProgress * 6;
            const pulseOpacity = pulseNorm < 0 ? 0 : Math.max(0, 1 - pulseProgress);

            return (
              <div
                ref={(el) => { eventRefs.current[i] = el; }}
                key={item.year}
                className={`relative flex ${
                  i % 2 === 0 ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {/* Pulse glow */}
                <div
                  className="absolute left-1/2 z-0 pointer-events-none"
                  style={{
                    top: "0.25rem",
                    width: "0.75rem",
                    height: "0.75rem",
                    borderRadius: "50%",
                    transformOrigin: "center center",
                    transform: `translate(-50%, 0) scale(${pulseScale})`,
                    boxShadow: `0 0 ${12 * pulseScale}px ${4 * pulseScale}px rgba(94,234,212,${pulseOpacity * 0.6})`,
                    background: `rgba(94,234,212,${pulseOpacity * 0.3})`,
                    opacity: pulseOpacity,
                  }}
                />

                {/* Dot */}
                <div
                  className="absolute top-1 left-1/2 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-accent bg-bg-primary"
                  style={{ opacity: eventEased }}
                />

                {/* Content */}
                <div
                  className={`w-1/2 ${
                    i % 2 === 0 ? "pr-6 md:pr-12 text-right" : "pl-6 md:pl-12 ml-auto"
                  }`}
                  style={{
                    opacity: eventEased,
                    transform: `translateY(${(1 - eventEased) * 12}px)`,
                    transition: "none",
                  }}
                >
                  <span className="font-geist-mono text-sm font-bold text-accent">
                    {item.year}
                  </span>
                  <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Concentric Rings */}
      <div ref={ringsRef} className="mt-4">
        <div ref={ringsSvgRef} className="relative mx-auto aspect-square" style={{ maxWidth: 700 }}>
          {/* Subtle outer glow ring — 2× outermost ring */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              width: "139%",
              height: "139%",
              border: "1px solid rgba(52,211,153,0.07)",
              boxShadow: "0 0 60px 20px rgba(59,130,246,0.04), 0 0 120px 40px rgba(52,211,153,0.03)",
              opacity: Math.min(1, ringsProgress * 1.2),
              transition: "opacity 0.8s ease-out",
            }}
          />
          {/* Ring pulse overlays — HTML divs matching timeline pulse style */}
          {rings.map((ring, i) => {
            const ringCount = rings.length;
            const ringStart = 0.15 + (i / ringCount) * 0.55;
            const ringEnd = ringStart + 0.18;
            const rawProgress = Math.max(0, Math.min(1, (ringsProgress - ringStart) / (ringEnd - ringStart)));

            const pulseRaw = rawProgress / 0.5;
            const pulseProgress = Math.max(0, Math.min(1, pulseRaw));
            const pulseScale = 1 + pulseProgress * 6;
            const pulseOpacity = rawProgress > 0 && pulseProgress < 1
              ? Math.max(0, 1 - pulseProgress)
              : 0;

            return (
              <div
                key={`pulse-${ring.label}`}
                className="absolute pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  width: "0.75rem",
                  height: "0.75rem",
                  borderRadius: "50%",
                  transformOrigin: "center center",
                  transform: `translate(-50%, -50%) scale(${pulseScale})`,
                  boxShadow: `0 0 ${12 * pulseScale}px ${4 * pulseScale}px rgba(94,234,212,${pulseOpacity * 0.6})`,
                  background: `rgba(94,234,212,${pulseOpacity * 0.3})`,
                  opacity: pulseOpacity,
                }}
              />
            );
          })}

          <svg
            viewBox="0 0 700 700"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Pulsing core glow */}
            <circle cx={350} cy={350} r={20} fill="none" opacity={Math.min(1, ringsProgress * 5)}>
              <animate attributeName="r" values="12;22;12" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="fill" values="rgba(94,234,212,0.15);rgba(94,234,212,0.05);rgba(94,234,212,0.15)" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={350} cy={350} r={18} fill="none" stroke="rgba(94,234,212,0.25)" strokeWidth={1} opacity={Math.min(1, ringsProgress * 5)}>
              <animate attributeName="r" values="14;24;14" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.3;0.08;0.3" dur="2.5s" repeatCount="indefinite" />
            </circle>

            {rings.map((ring, i) => {
              const ringCount = rings.length;
              const ringStart = 0.15 + (i / ringCount) * 0.55;
              const ringEnd = ringStart + 0.18;

              const rawProgress = Math.max(0, Math.min(1, (ringsProgress - ringStart) / (ringEnd - ringStart)));
              const ringProgress = ease(rawProgress);
              const scale = ringProgress;

              // Count how many later rings have appeared (each fades this ring by 5%)
              let laterVisible = 0;
              for (let j = i + 1; j < rings.length; j++) {
                const lStart = 0.15 + (j / ringCount) * 0.55;
                const lEnd = lStart + 0.18;
                const lp = ease(Math.max(0, Math.min(1, (ringsProgress - lStart) / (lEnd - lStart))));
                laterVisible += lp;
              }
              const opacity = ringProgress * Math.max(0, 1 - laterVisible * 0.05);

              const cx = 350;
              const cy = 350;
              const r = ring.radius * scale;

              const laterDimNorm = Math.min(1, laterVisible / Math.max(1, rings.length - i - 1));

              // For last ring (Copilot/M365): once title is fully visible, dim to match others
              const isLastRing = i === rings.length - 1;
              const isFirstRing = i === 0;
              let labelOpacity =
                Math.max(0, (ringProgress - 0.5) * 2) *
                (1 - laterDimNorm * 0.6);
              if (isFirstRing) {
                // OS Licensing stays prominent — never dim below 0.7
                labelOpacity = Math.max(labelOpacity, ringProgress > 0.5 ? 0.7 : labelOpacity);
              }
              if (isLastRing && titleFullyVisible) {
                // Fade to same level as a dimmed ring label (~0.4 opacity)
                labelOpacity = Math.min(labelOpacity, 0.4);
              }

              const highlightFactor = 1 - laterDimNorm;
              // Desktop: progressively smaller outward for visual hierarchy
              // Mobile: uniform size for readability at small rendered pixels
              const isMobileSvg = svgWidth < 500;
              const sizeByRing = isMobileSvg
                ? 30 - (i / Math.max(1, rings.length - 1)) * 10
                : 28 - (i / Math.max(1, rings.length - 1)) * 12;
              const fontSize = sizeByRing + highlightFactor * (sizeByRing * 0.15);

              return (
                <g key={ring.label}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={ringColor(i, ringCount, 0.02 + i * 0.01)}
                    stroke={ringColor(i, ringCount, 0.2 + i * 0.06)}
                    strokeWidth={1.5}
                    opacity={opacity}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={ringGlowColor(i, ringCount)}
                    strokeWidth={6}
                    opacity={opacity}
                    style={{ filter: "blur(3px)" }}
                  />
                  <text
                    x={cx}
                    y={cy - r + 30}
                    textAnchor="middle"
                    fill="#f9fafb"
                    fontSize={fontSize}
                    fontWeight="500"
                    opacity={labelOpacity}
                  >
                    {ring.label}
                  </text>
                </g>
              );
            })}

            {/* White core */}
            <circle
              cx={350}
              cy={350}
              r={6}
              fill="white"
              opacity={Math.min(1, ringsProgress * 5)}
            />

            {/* Title centered below core — larger in SVG units on mobile
                so physical pixels stay readable when the viewBox scales down */}
            {(() => {
              const isMobile = svgWidth < 500;
              const titleSize = isMobile ? 48 : 36;
              const subtitleSize = isMobile ? 32 : 22;
              const descSize = isMobile ? 24 : 18;
              const titleY = 370;
              const subtitleY = isMobile ? 416 : 404;
              const desc1Y = isMobile ? 456 : 436;
              const desc2Y = isMobile ? 486 : 458;
              // Max text width to prevent clipping (leave 40px margin each side)
              const maxWidth = 620;
              return (
                <>
                  <text
                    x={350}
                    y={titleY}
                    textAnchor="middle"
                    fill="#f9fafb"
                    fontSize={titleSize}
                    fontWeight="700"
                    opacity={titleEased}
                    textLength={isMobile ? maxWidth : undefined}
                    lengthAdjust="spacingAndGlyphs"
                  >
                    Microsoft&apos;s Expanding Capture
                  </text>
                  <text
                    x={350}
                    y={subtitleY}
                    textAnchor="middle"
                    fill="#5eead4"
                    fontSize={subtitleSize}
                    fontWeight="600"
                    opacity={titleEased}
                  >
                    1.8× – 3.1× Total Cost Multiplier
                  </text>
                  <text
                    x={350}
                    y={desc1Y}
                    textAnchor="middle"
                    fill="#9da7b3"
                    fontSize={descSize}
                    fontStyle="italic"
                    opacity={titleEased}
                  >
                    Running Windows workloads outside Azure has become
                  </text>
                  <text
                    x={350}
                    y={desc2Y}
                    textAnchor="middle"
                    fill="#9da7b3"
                    fontSize={descSize}
                    fontStyle="italic"
                    opacity={titleEased}
                  >
                    steadily more expensive and complex.
                  </text>
                </>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Main Section ─────────────────────────────────────────────── */

export default function LicensingGravity() {
  return (
    <section id="licensing-gravity" className="relative px-6 py-24">
      {/* AO shadow at top — depth after Hero/sunburst */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 z-10 bg-gradient-to-t from-transparent to-black/40" />
      {/* Divider line at top — above the AO shadow so it's visible */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-20 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-medium tracking-widest text-accent uppercase">
          The Problem
        </p>
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
          Microsoft&rsquo;s Licensing Gravity
        </h2>
        <p className="mb-16 max-w-2xl text-text-secondary">
          Every year, Microsoft tightens the licensing ratchet. Costs go up,
          optionality goes down, and the exit door gets harder to find.
        </p>

        <TimelineAndRings />
      </div>

    </section>
  );
}
