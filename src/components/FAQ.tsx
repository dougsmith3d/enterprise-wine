"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  category: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    category: "Security, Reliability & Governance",
    items: [
      {
        q: "Is this as secure as running the application on Windows?",
        a: "The platform runs on Linux infrastructure with the Wine compatibility layer operating in user space. This removes many Windows-specific attack surfaces while allowing organizations to use mature Linux security tooling. In many cases the effective attack surface is smaller than a traditional Windows Server deployment.",
      },
      {
        q: "Will this pass security and compliance audits (SOX, PCI, FedRAMP, etc.)?",
        a: "Yes. Compliance frameworks typically evaluate infrastructure controls, logging, identity management, and operational governance rather than the application runtime itself. Because translated workloads run on standard Linux infrastructure and cloud platforms, they can be operated under the same compliance frameworks as other enterprise Linux systems.",
      },
      {
        q: "Will application performance be predictable?",
        a: "Performance is validated during testing before production deployment. Wine translates system calls rather than emulating an entire operating system, so overhead is typically minimal. Many enterprise workloads run at near-native performance.",
      },
      {
        q: "If something goes wrong in production, who provides support?",
        a: "Enterprise deployments include commercial support rather than relying on community forums. CodeWeavers supports the compatibility layer and workload behavior, while the Linux vendor or cloud provider supports the underlying infrastructure. This creates a clear enterprise support model across the stack.",
      },
      {
        q: "What happens if the Wine project stops being maintained?",
        a: "Wine has been continuously developed for more than 30 years and is supported by a large contributor ecosystem along with commercial organizations like CodeWeavers. Enterprise deployments use supported builds rather than raw community releases. The risk profile is similar to other widely adopted open-source infrastructure technologies.",
      },
    ],
  },
  {
    category: "Cost, ROI & Strategic Flexibility",
    items: [
      {
        q: "How is this different from renegotiating a Microsoft Enterprise Agreement?",
        a: "Renegotiating an EA may temporarily reduce pricing but it does not change the underlying dependency on Windows licensing. Translation removes the Windows infrastructure layer from many workloads entirely and shifts the cost structure toward Linux infrastructure. Software Assurance does not automatically cover Windows Server workloads running in non-Azure public clouds, which often require additional licensing considerations.",
      },
      {
        q: "How quickly do organizations typically see ROI?",
        a: "Many organizations see savings as soon as Windows Server licensing is removed from the infrastructure footprint. For larger workloads the payback period is often measured in months. Additional savings accumulate as environments standardize on Linux infrastructure.",
      },
      {
        q: "Does this remove all Microsoft licensing?",
        a: "In many cases it eliminates the need for Windows Server licensing entirely. Some Microsoft products such as SQL Server may still require licensing depending on the deployment model. Each workload is evaluated individually to determine what remains necessary.",
      },
      {
        q: "Why are Windows workloads more expensive in cloud infrastructure?",
        a: "Windows workloads typically include both the base infrastructure cost and the Windows Server licensing premium. Additional layers such as Client Access Licenses (CALs) or Remote Desktop Services licensing may also apply. These licensing structures are unique to Windows environments and often create higher operating costs compared to equivalent Linux workloads.",
      },
      {
        q: "Is this meant to be permanent or a bridge to modernization?",
        a: "It can be either. Some organizations run translated workloads long-term, while others use it as a bridge while gradually modernizing applications. The key advantage is gaining flexibility without forcing an immediate rewrite.",
      },
    ],
  },
  {
    category: "Real-World Use & Adoption",
    items: [
      {
        q: "We tried Wine years ago and it didn't work. Why would it work now?",
        a: "Wine has improved dramatically over the past decade as compatibility coverage expanded and commercial investment increased. Modern Windows APIs and frameworks are far better supported today. Many workloads that struggled previously now run reliably.",
      },
      {
        q: "What if we tried running our application with Wine and it failed?",
        a: "A simple Wine test rarely reflects a production environment. Enterprise workloads often require configuration adjustments, dependency analysis, and environment tuning. Many applications that initially fail can run reliably after targeted engineering work.",
      },
      {
        q: "Why not just rewrite the application?",
        a: "Rewriting enterprise software is expensive and often takes years. Many applications contain decades of embedded business logic that is difficult to reproduce. Translation allows organizations to reduce infrastructure costs immediately while modernization proceeds more gradually.",
      },
    ],
  },
  {
    category: "Application Compatibility",
    items: [
      {
        q: "Can this work with applications that depend on SQL Server?",
        a: "Often yes. Many organizations migrate to SQL Server for Linux, while others continue running existing deployments through translation. Each architecture is evaluated to balance compatibility, supportability, and cost.",
      },
      {
        q: "Can Windows services and scheduled tasks still run normally?",
        a: "Yes. Windows services can run within Wine and be integrated with Linux service managers such as systemd. Scheduled tasks are typically mapped to standard Linux scheduling mechanisms.",
      },
      {
        q: "What about applications that rely on COM or DCOM?",
        a: "Many COM components are already supported within the Wine compatibility layer. More complex dependencies may require configuration or engineering adjustments. These are identified early during compatibility evaluation.",
      },
      {
        q: "Are there applications that are not good candidates for translation?",
        a: "Applications that rely on specialized Windows kernel drivers or undocumented OS behavior may not be ideal candidates. Some tightly coupled Windows platform services can also be difficult to translate. The evaluation process identifies these cases early.",
      },
    ],
  },
  {
    category: "Graphics & High-Performance Workloads",
    items: [
      {
        q: "Can this support applications with complex graphics or UI?",
        a: "Yes. Wine supports modern Windows graphics APIs and many graphical applications run successfully through the compatibility layer. These workloads are typically validated during testing.",
      },
      {
        q: "Does GPU acceleration still work with DirectX or OpenGL?",
        a: "Wine supports translation layers that map DirectX workloads to Linux graphics stacks such as Vulkan and OpenGL. This allows many GPU-accelerated applications to run effectively on Linux infrastructure.",
      },
      {
        q: "Can this work for HPC workloads with strict latency requirements?",
        a: "Yes. Wine introduces minimal overhead because it translates system calls rather than emulating hardware. Many compute-heavy workloads perform near native levels when running on Linux infrastructure.",
      },
    ],
  },
  {
    category: "Deployment & Infrastructure",
    items: [
      {
        q: "Can this run both in the cloud and on-premises?",
        a: "Yes. The platform runs anywhere Linux infrastructure is available, including cloud, hybrid, and on-prem environments.",
      },
      {
        q: "Will this work in VDI environments?",
        a: "Yes. Applications delivered through VDI can run through Wine on Linux servers. This can reduce Windows licensing requirements associated with VDI infrastructure.",
      },
      {
        q: "Can this run directly on bare-metal servers?",
        a: "Yes. The platform can run directly on bare-metal Linux servers as well as virtualized or cloud environments.",
      },
    ],
  },
  {
    category: "Migration & Implementation",
    items: [
      {
        q: "What does the migration process typically look like?",
        a: "Most organizations start with a compatibility and architecture evaluation that validates application behavior, dependencies, and performance. Workloads can then be migrated incrementally.",
      },
      {
        q: "Will we need to modify our application code?",
        a: "In most cases, no. Wine translates Windows APIs so the application can run in a Linux environment without code changes.",
      },
      {
        q: "Can this act as a cost-relief bridge while a larger modernization effort takes place?",
        a: "Yes. Large modernization programs often take years to complete. Translation can remove Windows infrastructure costs while engineering teams refactor applications on a more realistic timeline.",
      },
    ],
  },
];

function AccordionItem({ itemKey, q, a, isOpen, toggle }: { itemKey: string; q: string; a: string; isOpen: boolean; toggle: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(isOpen ? undefined : 0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (isOpen) {
      setHeight(el.scrollHeight);
      const timer = setTimeout(() => setHeight(undefined), 300);
      return () => clearTimeout(timer);
    } else {
      // Set explicit height first so transition works
      setHeight(el.scrollHeight);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight(0));
      });
    }
  }, [isOpen]);

  return (
    <div className="rounded-lg border border-border bg-bg-card overflow-hidden">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-bg-card-hover"
      >
        <span className="pr-4 text-sm font-medium">{q}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        ref={contentRef}
        className="transition-[height] duration-300 ease-out overflow-hidden"
        style={{ height: height === undefined ? "auto" : height }}
      >
        <div className="border-t border-border/50 px-6 py-4">
          <p className="text-sm text-text-secondary leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<string>>(
    () => new Set()
  );

  const toggle = useCallback((key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Collect all animatable elements: category headings + accordion items
  const elRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);

  // Build a flat index mapping: each category heading + each item within it
  const totalElements = faqData.reduce((sum, cat) => sum + 1 + cat.items.length, 0);

  useEffect(() => {
    setRevealed(new Array(totalElements).fill(false));
  }, [totalElements]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = elRefs.current.indexOf(entry.target as HTMLDivElement);
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
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );

    const timer = setTimeout(() => {
      for (const el of elRefs.current) {
        if (el) observer.observe(el);
      }
    }, 60);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  let flatIdx = 0;

  return (
    <section id="faq" className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-sm font-medium tracking-widest text-accent uppercase">
          Common Questions
        </p>
        <h2 className="mb-12 text-2xl font-bold sm:text-3xl md:text-4xl">
          Frequently Asked Questions
        </h2>

        <div className="space-y-8">
          {faqData.map((cat) => {
            const headingIdx = flatIdx++;
            return (
              <div key={cat.category}>
                <h3
                  ref={(el) => { elRefs.current[headingIdx] = el; }}
                  className="mb-4 text-lg font-semibold text-accent"
                  style={{
                    opacity: revealed[headingIdx] ? 1 : 0,
                    transform: revealed[headingIdx] ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity var(--reveal-duration) var(--reveal-easing), transform var(--reveal-duration) var(--reveal-easing)",
                  }}
                >
                  {cat.category}
                </h3>
                <div className="space-y-2">
                  {cat.items.map((item, itemIdx) => {
                    const elIdx = flatIdx++;
                    const key = `${cat.category}-${item.q}`;
                    return (
                      <div
                        key={key}
                        ref={(el) => { elRefs.current[elIdx] = el; }}
                        style={{
                          opacity: revealed[elIdx] ? 1 : 0,
                          transform: revealed[elIdx] ? "translateY(0)" : "translateY(20px)",
                          transition: `opacity var(--reveal-duration) var(--reveal-easing) ${itemIdx * 80}ms, transform var(--reveal-duration) var(--reveal-easing) ${itemIdx * 80}ms`,
                        }}
                      >
                        <AccordionItem
                          itemKey={key}
                          q={item.q}
                          a={item.a}
                          isOpen={openItems.has(key)}
                          toggle={() => toggle(key)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
