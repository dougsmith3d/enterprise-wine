"use client";

import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "24/7 Support",
    desc: "Round-the-clock engineering support with 1-hour SLA for critical issues. Direct Slack/Teams channel to your dedicated team.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Rapid Security Patching",
    desc: "Critical CVEs patched within 48 hours. We maintain custom security backports for your specific Wine configuration.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Maintainer Access",
    desc: "Direct access to Wine core maintainers. Your issues get upstream priority. No black-box vendor support.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
      </svg>
    ),
    title: "Windows Fallback",
    desc: "Dual-boot capability maintained throughout migration. Instant rollback to Windows if any issue surfaces in production.",
  },
];

export default function EnterpriseSupport() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>(new Array(features.length).fill(false));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement);
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

    // Delay observe so the browser paints the initial hidden state first
    const timer = setTimeout(() => {
      for (const el of cardRefs.current) {
        if (el) observer.observe(el);
      }
    }, 60);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  return (
    <section id="enterprise-support" className="relative px-6 py-24">
      <div className="relative mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-medium tracking-widest text-accent uppercase">
          Enterprise Grade
        </p>
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
          Enterprise Support
        </h2>
        <p className="mb-12 max-w-2xl text-text-secondary">
          Production support comes directly from the engineers who build Wine.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="rounded-xl border border-border bg-bg-card p-4 sm:p-8 transition-all hover:border-accent/30"
              style={{
                opacity: revealed[i] ? 1 : 0,
                transform: revealed[i] ? "translateY(0)" : "translateY(24px)",
                transition: `opacity var(--reveal-duration) var(--reveal-easing) ${i * 120}ms, transform var(--reveal-duration) var(--reveal-easing) ${i * 120}ms`,
              }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
