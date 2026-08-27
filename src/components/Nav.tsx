"use client";

import { useState, useEffect } from "react";

const links = [
  { label: "Problem", href: "#licensing-gravity" },
  { label: "Options", href: "#fork-in-the-road" },
  { label: "Cost Model", href: "#cost-modeling" },
  { label: "How It Works", href: "#what-is-wine" },
  { label: "Proof", href: "#proof" },
  { label: "Engagement", href: "#engagement" },
  { label: "FAQ", href: "#faq" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = links.map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg-primary/90 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="text-lg font-bold tracking-tight">
          <span className="text-accent">CodeWeavers</span>{" "}
          <span className="text-text-secondary">Enterprise Wine</span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => handleClick(e, l.href)}
              className={`text-sm transition-colors ${
                activeId === l.href.slice(1)
                  ? "text-accent"
                  : "text-text-secondary hover:text-accent"
              }`}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#final-cta"
            onClick={(e) => handleClick(e, "#final-cta")}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90"
          >
            Get Started
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-6 bg-text-primary transition-transform ${
              mobileOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-text-primary transition-opacity ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-text-primary transition-transform ${
              mobileOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-b border-border bg-bg-primary/95 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-4 px-6 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => handleClick(e, l.href)}
                className={`text-sm transition-colors ${
                  activeId === l.href.slice(1)
                    ? "text-accent"
                    : "text-text-secondary hover:text-accent"
                }`}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#final-cta"
              onClick={(e) => handleClick(e, "#final-cta")}
              className="rounded-lg bg-accent px-4 py-2 text-center text-sm font-semibold text-bg-primary"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
