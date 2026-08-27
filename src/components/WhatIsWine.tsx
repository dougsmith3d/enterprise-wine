"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import MeshGradient from "./MeshGradient";

const stats = [
  { value: "640+", label: "Windows libraries implemented", numericEnd: 640, suffix: "+" },
  { value: "20+", label: "Years of development", numericEnd: 20, suffix: "+" },
  { value: "1M+", label: "Lines of code", numericEnd: 1, suffix: "M+", highlight: false },
  { value: "0", label: "Source code changes required", numericEnd: 0, suffix: "", highlight: true },
];

function CountUp({ end, suffix, duration = 1600 }: { end: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || end === 0) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setCount(Math.round(eased * end));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return <span ref={ref}>{started ? count : 0}{suffix}</span>;
}

/*
  IntersectionObserver that keeps observing — elements hide when
  they leave and re-animate when they scroll back in.
*/

function FlowingArrow({ label }: { label: string }) {
  return (
    <div className="flex justify-center">
      <div className="flex flex-col items-center">
        <div className="relative h-10 w-[3px] rounded-t-full overflow-hidden">
          <div
            className="absolute inset-x-0 h-[200%] w-full"
            style={{
              background:
                "repeating-linear-gradient(to bottom, rgba(94,234,212,0.2) 0px, rgba(94,234,212,0.45) 8px, rgba(94,234,212,0.6) 16px, rgba(94,234,212,0.2) 24px)",
              animation: "flowDown 3s linear infinite",
            }}
          />
        </div>
        <svg
          className="h-4 w-4 text-accent -mt-[3px]"
          fill="currentColor"
          viewBox="0 0 12 12"
        >
          <path d="M6 12L0 6h12L6 12z" />
        </svg>
        <span className="mt-1 text-xs text-accent">{label}</span>
      </div>
    </div>
  );
}

export default function WhatIsWine() {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-revealed");
          } else {
            // Reset when scrolled away so it re-animates on return
            (entry.target as HTMLElement).classList.remove("is-revealed");
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    const timer = setTimeout(() => {
      for (const el of itemRefs.current) {
        if (el) observer.observe(el);
      }
    }, 60);

    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  const setRef = (i: number) => (el: HTMLDivElement | null) => {
    itemRefs.current[i] = el;
  };

  return (
    <section
      id="what-is-wine"
      className="relative overflow-hidden px-6 py-24"
    >
      {/* Divider lines */}
      <div className="absolute top-0 left-0 right-0 h-px z-20 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px z-20 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <MeshGradient />
      <style>{`
        @keyframes flowDown {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0%); }
        }
        .reveal-item {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity var(--reveal-duration) var(--reveal-easing),
                      transform var(--reveal-duration) var(--reveal-easing);
        }
        .reveal-item.is-revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 { transition-delay: 80ms; }
        .reveal-delay-2 { transition-delay: 160ms; }
        .reveal-delay-3 { transition-delay: 240ms; }
      `}</style>
      <div className="relative z-10 mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-medium tracking-widest text-accent uppercase">
          The Technology
        </p>
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
          How Enterprise Wine Works
        </h2>
        <p className="mb-16 max-w-2xl text-text-secondary">
          Enterprise Wine is a compatibility layer that translates Windows system
          calls into native Linux equivalents in real time. Applications run
          directly on Linux infrastructure without virtualization.
        </p>

        {/* Architecture diagram — sequential scroll reveal */}
        <div className="mb-16 flex justify-center">
          <div className="w-full max-w-2xl space-y-4">
            {/* App layer */}
            <div
              ref={setRef(0)}
              className="reveal-item rounded-lg border border-border bg-bg-card p-6 text-center"
            >
              <p className="mt-1 text-lg font-bold">
                Your Application
              </p>
              <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                .exe / .dll (unmodified)
              </p>
            </div>

            {/* Arrow + Wine layer */}
            <div ref={setRef(1)} className="reveal-item space-y-4">
              <FlowingArrow label="Win32 API calls" />
              <div className="rounded-lg border-2 border-accent bg-accent/10 p-6 text-center animate-pulse-glow">
                <p className="text-lg font-bold text-accent">
                  Enterprise Wine Translation Layer
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  ntdll.dll &rarr; libc &middot; kernel32 &rarr; Linux kernel
                  &middot; GDI &rarr; X11/Wayland
                </p>
              </div>
            </div>

            {/* Arrow + Linux layer */}
            <div ref={setRef(2)} className="reveal-item space-y-4">
              <FlowingArrow label="Linux syscalls" />
              <div className="rounded-lg border border-border bg-bg-card p-6 text-center">
                <p className="text-lg font-bold">
                  Linux Kernel
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Any distro &middot; Any cloud &middot; Any hardware
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid — staggered reveal */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              ref={setRef(3 + i)}
              className={`reveal-item reveal-delay-${i} rounded-xl border p-4 sm:p-6 text-center ${"highlight" in s && s.highlight ? "border-accent/40 bg-accent/5 animate-pulse-glow-dim" : "border-border bg-bg-card"}`}
            >
              <p className="text-3xl font-bold text-accent"><CountUp end={s.numericEnd} suffix={s.suffix} /></p>
              <p className={`mt-1 text-sm ${"highlight" in s && s.highlight ? "font-bold text-text-primary" : "text-text-secondary"}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
