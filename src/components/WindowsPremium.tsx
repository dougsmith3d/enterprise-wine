"use client";

import { useEffect, useRef, useState } from "react";

const rows = [
  { item: "EC2 Instance (m6i.12xlarge, on-demand)", windows: "$4.512/hr", linux: "$2.304/hr", savings: "49%" },
  { item: "EC2 Instance (m6i.12xlarge, spot)", windows: "$2.498/hr", linux: "$0.687/hr", savings: "72%" },
  { item: "Windows Server CALs (per user/yr)", windows: "$40", linux: "$0", savings: "100%" },
  { item: "RDS CALs — Remote Desktop (per user/yr)", windows: "$120", linux: "$0", savings: "100%" },
  { item: "SQL Server Standard (per core/yr)", windows: "$3,945", linux: "$0*", savings: "100%" },
  { item: "Typical 3-Year TCO (200 instances)", windows: "$23.7M", linux: "$12.1M", savings: "49%" },
];

function useScrollReveal(threshold = 0.4) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); obs.disconnect(); } },
      { threshold }
    );
    const timer = setTimeout(() => obs.observe(el), 60);
    return () => { clearTimeout(timer); obs.disconnect(); };
  }, [threshold]);
  return { ref, revealed };
}

function useCountUp(end: number, duration: number, started: boolean, decimals = 2) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(parseFloat((eased * end).toFixed(decimals)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration, decimals]);
  return value;
}

function PremiumCard({
  label,
  multiplier,
  linuxFraction,
  revealed,
  delay,
}: {
  label: string;
  multiplier: number;
  linuxFraction: number; // e.g. 0.51 means Linux is 51% of Windows cost
  revealed: boolean;
  delay: number;
}) {
  const count = useCountUp(multiplier, 1800, revealed);
  const barDelay = delay + 600; // bars start after number rolls up

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 sm:p-8 text-center overflow-hidden flex flex-col h-full">
      <p className="text-sm font-bold tracking-wider text-text-primary uppercase flex-1 flex items-end justify-center pb-3">
        {label}
      </p>
      <p className="text-3xl sm:text-5xl font-bold text-danger mb-6">
        {revealed ? count.toFixed(2) : "0.00"}&times;
      </p>

      {/* Animated cost bars */}
      <div className="space-y-3 text-left">
        {/* Windows bar — always full width (the baseline) */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-secondary">Windows</span>
            <span className="text-danger font-medium">{multiplier.toFixed(2)}&times;</span>
          </div>
          <div className="h-3 rounded-full bg-border/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all ease-out"
              style={{
                width: revealed ? "100%" : "0%",
                transitionDuration: "1.2s",
                transitionDelay: `${barDelay}ms`,
                background: "linear-gradient(90deg, #dc2626, #f87171)",
              }}
            />
          </div>
        </div>

        {/* Linux bar — proportional to show the savings */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-secondary">Linux</span>
            <span className="text-accent font-medium">1.00&times;</span>
          </div>
          <div className="h-3 rounded-full bg-border/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all ease-out"
              style={{
                width: revealed ? `${linuxFraction * 100}%` : "0%",
                transitionDuration: "1.2s",
                transitionDelay: `${barDelay + 200}ms`,
                background: "linear-gradient(90deg, #0d9488, #5eead4)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileTable({ revealed }: { revealed: boolean }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tcoVisible, setTcoVisible] = useState(false);

  // Observe the wrapper (which has layout height) not the hidden row
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTcoVisible(true); obs.disconnect(); } },
      { threshold: 0.8 }
    );
    const timer = setTimeout(() => obs.observe(el), 60);
    return () => { clearTimeout(timer); obs.disconnect(); };
  }, []);

  const normalRows = rows.slice(0, -1);
  const tcoRow = rows[rows.length - 1];

  return (
    <div ref={wrapperRef} className="md:hidden rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 bg-bg-card px-4 py-3 border-b border-border">
        <span className="text-xs font-semibold text-text-secondary">Cost Item</span>
        <span className="text-xs font-semibold text-danger w-16 text-right">Windows</span>
        <span className="text-xs font-semibold text-accent w-16 text-right">Linux</span>
        <span className="text-xs font-semibold text-text-secondary w-12 text-right">Save</span>
      </div>
      {normalRows.map((r, i) => (
        <div
          key={r.item}
          className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 px-4 py-3 border-b border-border/40"
        >
          <span className="text-xs text-text-primary">{r.item}</span>
          <span className="text-xs text-danger w-16 text-right">{r.windows}</span>
          <span className="text-xs text-accent w-16 text-right">{r.linux}</span>
          <span className="text-xs text-right w-12 text-success font-semibold">{r.savings}</span>
        </div>
      ))}
      {/* TCO row — slides up from under the previous row */}
      <div className="relative overflow-hidden">
        <div
          className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 px-4 py-4 bg-accent/10 border-t-2 border-accent/30"
          style={{
            transform: tcoVisible ? "translateY(0)" : "translateY(100%)",
            opacity: tcoVisible ? 1 : 0,
            transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s, opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s",
          }}
        >
          <span className="text-xs font-bold text-accent">{tcoRow.item}</span>
          <span className="text-xs text-danger w-16 text-right font-bold">{tcoRow.windows}</span>
          <span className="text-xs text-accent w-16 text-right font-bold">{tcoRow.linux}</span>
          <span className="text-sm text-right w-12 font-bold text-success">{tcoRow.savings}</span>
        </div>
      </div>
    </div>
  );
}

export default function WindowsPremium() {
  const { ref, revealed } = useScrollReveal(0.3);

  return (
    <section id="windows-premium" className="relative px-6 py-24">
      <div ref={ref} className="relative mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-medium tracking-widest text-accent uppercase">
          The Windows Premium
        </p>
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
          Why Windows Infrastructure Costs 2–4&times; More
        </h2>
        <p className="mb-12 max-w-2xl text-text-secondary">
          The Windows licensing premium shows up directly in infrastructure cost.
        </p>

        {/* Callout cards — always side-by-side */}
        <div className="mb-12 grid grid-cols-2 gap-4 sm:gap-6">
          <PremiumCard
            label="On-Demand Windows Premium"
            multiplier={1.96}
            linuxFraction={1 / 1.96}
            revealed={revealed}
            delay={0}
          />
          <PremiumCard
            label="Spot Windows Premium"
            multiplier={3.64}
            linuxFraction={1 / 3.64}
            revealed={revealed}
            delay={200}
          />
        </div>

        {/* Mobile: unified table */}
        <MobileTable revealed={revealed} />

        {/* Desktop: table layout */}
        <div className="hidden md:block rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-card">
                <th className="px-6 py-4 font-semibold text-text-secondary">
                  Cost Item
                </th>
                <th className="px-6 py-4 font-semibold text-danger">
                  Windows
                </th>
                <th className="px-6 py-4 font-semibold text-accent">Linux</th>
                <th className="px-6 py-4 font-semibold text-text-secondary">
                  Savings
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isLast = i === rows.length - 1;
                return (
                  <tr
                    key={r.item}
                    className={`border-b border-border/50 transition-colors hover:bg-bg-card/50 ${isLast ? "bg-accent/5 font-bold" : ""}`}
                    style={{
                      opacity: revealed ? 1 : 0,
                      transform: revealed ? "translateX(0)" : "translateX(-12px)",
                      transition: `opacity 0.5s ease-out ${0.8 + i * 0.12}s, transform 0.5s ease-out ${0.8 + i * 0.12}s`,
                    }}
                  >
                    <td className={`px-6 py-3 ${isLast ? "text-accent" : "text-text-primary"}`}>{r.item}</td>
                    <td className="px-6 py-3 text-danger">{r.windows}</td>
                    <td className="px-6 py-3 text-accent">{r.linux}</td>
                    <td className={`px-6 py-3 text-success font-semibold ${isLast ? "text-lg" : ""}`}>
                      {r.savings}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-text-muted">
          * PostgreSQL or open-source alternative on Linux. Prices based on
          us-east-1 as of 2025. Spot savings reflect Windows license premium
          not being discounted.
        </p>
      </div>
    </section>
  );
}
