"use client";

import { useEffect, useRef, useState } from "react";

const cases = [
  {
    title: "Valve / Steam (Proton)",
    category: "Gaming & Graphics",
    desc: "Proton (built on Wine) runs thousands of Windows games on Linux with near-native performance. Steam Deck ships Linux-only.",
    stat: "21,000+ verified titles",
    href: "#",
    icon: (
      <svg className="h-full w-full" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 8l-2 6h12l-2-6M14 14h20l2 8H12l2-8zM10 22h28v4a4 4 0 01-4 4H14a4 4 0 01-4-4v-4z" />
        <circle cx="18" cy="34" r="2" /><circle cx="30" cy="34" r="2" />
        <path strokeLinecap="round" d="M18 36v4M30 36v4M14 40h20" />
      </svg>
    ),
    gradient: "from-violet-500/20 to-blue-500/20",
  },
  {
    title: "Financial HPC Workloads",
    category: "High-Performance Computing",
    desc: "Quantitative trading firms use Wine to run Windows-compiled risk engines on Linux HPC clusters, eliminating per-node Windows licensing.",
    stat: "Sub-microsecond overhead",
    href: "#",
    icon: (
      <svg className="h-full w-full" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 38l8-12 6 6 8-16 6 8 8-10" />
        <path strokeLinecap="round" d="M6 42h36M6 6v36" />
        <circle cx="14" cy="26" r="1.5" fill="currentColor" />
        <circle cx="20" cy="32" r="1.5" fill="currentColor" />
        <circle cx="28" cy="16" r="1.5" fill="currentColor" />
        <circle cx="34" cy="24" r="1.5" fill="currentColor" />
        <circle cx="42" cy="14" r="1.5" fill="currentColor" />
      </svg>
    ),
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    title: "Unreal Engine Pipelines",
    category: "3D / Rendering",
    desc: "Studios run Windows-only DCC tools and Unreal build pipelines on Linux render farms via Wine, cutting cloud compute licensing costs.",
    stat: "60%+ infra savings",
    href: "#",
    icon: (
      <svg className="h-full w-full" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1}>
        <rect x="8" y="6" width="32" height="24" rx="2" />
        <path strokeLinecap="round" d="M20 18l8 0M20 14l12 0M20 22l6 0" />
        <rect x="10" y="8" width="8" height="8" rx="1" fill="currentColor" opacity="0.15" />
        <path strokeLinecap="round" d="M16 34h16M20 30h8v4H20z" />
        <path d="M12 38h24" strokeLinecap="round" />
      </svg>
    ),
    gradient: "from-cyan-500/20 to-green-500/20",
  },
  {
    title: "SQL Server on Wine",
    category: "Database",
    desc: "Legacy SQL Server 2012/2014 instances that can't migrate to newer versions run on Linux via Wine, avoiding ESU costs entirely.",
    stat: "Zero license fees",
    href: "#",
    icon: (
      <svg className="h-full w-full" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1}>
        <ellipse cx="24" cy="12" rx="14" ry="5" />
        <path d="M10 12v8c0 2.76 6.27 5 14 5s14-2.24 14-5v-8" />
        <path d="M10 20v8c0 2.76 6.27 5 14 5s14-2.24 14-5v-8" />
        <path d="M10 28v8c0 2.76 6.27 5 14 5s14-2.24 14-5v-8" />
      </svg>
    ),
    gradient: "from-green-500/20 to-teal-500/20",
  },
];

export default function ProofAndValidation() {
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>(new Array(cases.length).fill(false));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLAnchorElement);
            if (idx !== -1) {
              setRevealed((prev) => {
                const next = [...prev];
                next[idx] = true;
                return next;
              });
            }
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
    );

    const timer = setTimeout(() => {
      for (const el of cardRefs.current) {
        if (el) observer.observe(el);
      }
    }, 60);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  return (
    <section id="proof" className="relative px-6 py-24">
      {/* AO shadow at top — depth after The Technology section */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 z-10 bg-gradient-to-t from-transparent to-black/40" />
      <div className="relative mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-medium tracking-widest text-accent uppercase">
          Real-World Proof
        </p>
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
          Proof &amp; Validation
        </h2>
        <p className="mb-12 max-w-2xl text-text-secondary">
          Proven in some of the world&rsquo;s most demanding software
          environments.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {cases.map((c, i) => (
            <a
              key={c.title}
              ref={(el) => { cardRefs.current[i] = el; }}
              href={c.href}
              className="group rounded-xl border border-border bg-bg-card overflow-hidden transition-all hover:border-accent/30 hover:bg-bg-card-hover"
              style={{
                opacity: revealed[i] ? 1 : 0,
                transform: revealed[i] ? "translateY(0)" : "translateY(24px)",
                transition: `opacity var(--reveal-duration) var(--reveal-easing) ${i * 120}ms, transform var(--reveal-duration) var(--reveal-easing) ${i * 120}ms`,
              }}
            >
              {/* Thumbnail graphic — compact on mobile */}
              <div className={`relative h-20 sm:h-32 bg-gradient-to-br ${c.gradient} flex items-center justify-center overflow-hidden`}>
                <div className="h-10 w-10 sm:h-16 sm:w-16 text-accent/40">
                  {c.icon}
                </div>
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>

              <div className="p-4 sm:p-8">
                <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-accent uppercase">
                  {c.category}
                </span>
                <h3 className="mt-1 sm:mt-2 text-base sm:text-xl font-bold">{c.title}</h3>
                <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm text-text-secondary line-clamp-2 sm:line-clamp-none">{c.desc}</p>
                <div className="mt-2 sm:mt-4 flex items-center justify-between">
                  <p className="font-geist-mono text-sm sm:text-lg font-bold text-accent">
                    {c.stat}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-accent transition-opacity group-hover:opacity-80">
                    Read more
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
