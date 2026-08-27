"use client";

import { useState, useEffect, useRef } from "react";
import { useSimulator } from "@/hooks/useSimulator";
import {
  ComputeInputs,
  LicensingInputs,
  InstanceFamily,
  SqlEdition,
  SqlLicensingModel,
  Horizon,
  AnnualCostBreakdown,
  SimulationResult,
} from "@/types";
import {
  getInstancesByFamily,
  INSTANCE_FAMILY_LABELS,
} from "@/lib/pricing-data";
import { formatCurrency, formatCurrencyFull, formatPercent } from "@/lib/formatters";
import {
  ComposedChart,
  Line,
  Area,
  AreaChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ── Tiny UI primitives ───────────────────────────────────────── */

function RadioGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-text-secondary">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              value === o.value
                ? "bg-accent text-bg-primary"
                : "bg-bg-primary text-text-secondary border border-border hover:border-text-secondary"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderInput({
  label,
  value,
  min,
  max,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-text-secondary">{label}</label>
        <span className="text-sm font-mono text-accent">
          {value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  min = 0,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const [display, setDisplay] = useState(String(value));

  // Sync display when value changes externally
  useEffect(() => {
    setDisplay((prev) => {
      if (prev === "" || prev === "-") return prev;
      return String(value);
    });
  }, [value]);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-text-secondary">{label}</label>
      <input
        type="number"
        value={display}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const raw = e.target.value;
          setDisplay(raw);
          if (raw !== "" && raw !== "-") {
            onChange(Number(raw));
          }
        }}
        onBlur={() => {
          if (display === "" || display === "-") {
            setDisplay(String(min));
            onChange(min);
          }
        }}
        className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-text-secondary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-card border border-border rounded-lg p-3 flex flex-col h-full">
      {title && (
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
          {title}
        </h3>
      )}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

/* ── Input Panel ──────────────────────────────────────────────── */

const FAMILY_OPTIONS = (
  Object.entries(INSTANCE_FAMILY_LABELS) as [InstanceFamily, string][]
).map(([value, label]) => ({ value, label }));

const PRICING_OPTIONS = [
  { value: "on-demand", label: "On-Demand" },
  { value: "reserved-1yr", label: "Reserved 1yr" },
  { value: "reserved-3yr", label: "Reserved 3yr" },
  { value: "spot", label: "Spot" },
];

const SQL_EDITION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "standard", label: "Standard" },
  { value: "enterprise", label: "Enterprise" },
];

const SQL_LICENSING_OPTIONS = [
  { value: "core", label: "Core Licensing" },
  { value: "included", label: "Included in Price" },
];

function InputPanel({
  inputs,
  updateCompute,
  updateLicensing,
}: {
  inputs: { compute: ComputeInputs; licensing: LicensingInputs };
  updateCompute: (p: Partial<ComputeInputs>) => void;
  updateLicensing: (p: Partial<LicensingInputs>) => void;
}) {
  const [tab, setTab] = useState<"compute" | "licensing">("compute");
  const familyInstances = getInstancesByFamily(inputs.compute.instanceFamily);
  const instanceOptions = familyInstances.map((i) => ({
    value: i.instanceType,
    label: `${i.instanceType} (${i.vCPUs} vCPU, ${i.memoryGiB} GiB)`,
  }));

  const handleFamilyChange = (family: string) => {
    const f = family as InstanceFamily;
    const instances = getInstancesByFamily(f);
    updateCompute({ instanceFamily: f, instanceType: instances[0]?.instanceType });
  };

  const sqlDisabled = inputs.licensing.sqlEdition === "none";

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 flex-1 flex flex-col">
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Configuration
      </h2>

      <div className="flex gap-1 mb-4 bg-bg-primary rounded-lg p-1">
        {(["compute", "licensing"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === t
                ? "bg-accent text-bg-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t === "compute" ? "Compute" : "Licensing"}
          </button>
        ))}
      </div>

      {tab === "compute" ? (
        <div className="space-y-4">
          <RadioGroup
            label="Instance Family"
            value={inputs.compute.instanceFamily}
            options={FAMILY_OPTIONS}
            onChange={handleFamilyChange}
          />
          <SelectField
            label="Instance Type"
            value={inputs.compute.instanceType}
            options={instanceOptions}
            onChange={(v) => updateCompute({ instanceType: v })}
          />
          <NumberField
            label="Number of Instances"
            value={inputs.compute.instanceCount}
            min={1}
            max={500}
            onChange={(v) => updateCompute({ instanceCount: v })}
          />
          <SliderInput
            label="Average Utilization"
            value={inputs.compute.utilization}
            min={10}
            max={100}
            suffix="%"
            onChange={(v) => updateCompute({ utilization: v })}
          />
          <RadioGroup
            label="Pricing Model"
            value={inputs.compute.pricingModel}
            options={PRICING_OPTIONS}
            onChange={(v) => updateCompute({ pricingModel: v as ComputeInputs["pricingModel"] })}
          />
          <SliderInput
            label="Annual Growth Rate"
            value={inputs.compute.annualGrowthRate}
            min={0}
            max={50}
            suffix="%"
            onChange={(v) => updateCompute({ annualGrowthRate: v })}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[11px] text-text-secondary">
            Windows OS licensing is embedded in EC2 pricing. CALs and RDS CALs are additional per-user costs eliminated on Linux.
          </p>
          <NumberField
            label="Windows Server CALs"
            value={inputs.licensing.windowsCalCount}
            min={0}
            max={10000}
            onChange={(v) => updateLicensing({ windowsCalCount: v })}
          />
          <NumberField
            label="RDS CALs — Remote Desktop Services"
            value={inputs.licensing.rdsCalCount}
            min={0}
            max={10000}
            onChange={(v) => updateLicensing({ rdsCalCount: v })}
          />
          <div className="border-t border-border" />
          <RadioGroup
            label="SQL Server Edition"
            value={inputs.licensing.sqlEdition}
            options={SQL_EDITION_OPTIONS}
            onChange={(v) => updateLicensing({ sqlEdition: v as SqlEdition })}
          />
          <div className={sqlDisabled ? "opacity-40 pointer-events-none" : ""}>
            <NumberField
              label="SQL Server Licensed Cores"
              value={inputs.licensing.sqlLicensedCores}
              min={4}
              max={256}
              step={2}
              onChange={(v) => updateLicensing({ sqlLicensedCores: v })}
            />
          </div>
          <div className={sqlDisabled ? "opacity-40 pointer-events-none" : ""}>
            <RadioGroup
              label="SQL Server Licensing"
              value={inputs.licensing.sqlLicensingModel}
              options={SQL_LICENSING_OPTIONS}
              onChange={(v) => updateLicensing({ sqlLicensingModel: v as SqlLicensingModel })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Horizon Toggle ───────────────────────────────────────────── */

function HorizonToggle({ horizon, onChange }: { horizon: Horizon; onChange: (h: Horizon) => void }) {
  return (
    <div className="flex gap-1 bg-bg-primary rounded-lg p-1">
      {([1, 3, 5] as Horizon[]).map((h) => (
        <button
          key={h}
          onClick={() => onChange(h)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            horizon === h
              ? "bg-accent text-bg-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {h} Year{h > 1 ? "s" : ""}
        </button>
      ))}
    </div>
  );
}

/* ── Summary Cards ────────────────────────────────────────────── */

function AnimatedValue({ value, formatter }: { value: number; formatter: (n: number) => string }) {
  const displayRef = useRef(value);
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const start = displayRef.current;
    const end = value;
    if (start === end) return;
    const duration = 500;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = start + (end - start) * eased;
      displayRef.current = current;
      setDisplay(current);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <>{formatter(display)}</>;
}

function SummaryCards({ result, horizon }: { result: SimulationResult; horizon: Horizon }) {
  const sliced = result.annualBreakdowns.slice(0, horizon);
  const cumulativeSavings = sliced[sliced.length - 1].cumulativeSavings;
  const avgAnnualSavings = cumulativeSavings / horizon;
  const totalWin = sliced.reduce((s, y) => s + y.windows.total, 0);
  const totalLin = sliced.reduce((s, y) => s + y.linux.total, 0);
  const pct = totalWin > 0 ? ((totalWin - totalLin) / totalWin) * 100 : 0;

  const cards = [
    { label: "Avg. Annual Savings", raw: avgAnnualSavings, formatter: formatCurrency, color: "text-success" },
    { label: "Cost Reduction", raw: pct, formatter: formatPercent, color: "text-success" },
    { label: `${horizon}-Year Cumulative`, raw: cumulativeSavings, formatter: formatCurrency, color: "text-accent" },
    {
      label: "Annual Windows Tax",
      raw: result.windowsTax.total,
      formatter: formatCurrency,
      color: "text-danger",
      subRaw: result.windowsTax.percentage,
      subFormatter: (v: number) => `${formatPercent(v)} of spend`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-text-secondary mb-0.5">{c.label}</p>
          <p className={`text-xl font-semibold ${c.color}`}>
            <AnimatedValue value={c.raw} formatter={c.formatter} />
          </p>
          {"subRaw" in c && c.subRaw != null && (
            <p className="text-xs text-text-secondary mt-1">
              <AnimatedValue value={c.subRaw} formatter={c.subFormatter!} />
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Charts ───────────────────────────────────────────────────── */

const tooltipStyle = {
  backgroundColor: "#1f2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  fontSize: "12px",
};

function CostComparisonChart({ data }: { data: AnnualCostBreakdown[] }) {
  const cd = data.map((d) => ({
    name: d.year === 0 ? "Current" : `Year ${d.year}`,
    windows: d.windows.total,
    linux: d.linux.total,
  }));
  return (
    <Card title="Infrastructure Cost Over Time">
      <div style={{ minHeight: 176 }}>
        <ResponsiveContainer width="100%" height={176}>
          <ComposedChart data={cd}>
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#f9fafb" }}
              formatter={(value: number | undefined, name: string | undefined) => [
                value != null ? formatCurrencyFull(value) : "",
                name === "windows" ? "Windows" : "Linux + Wine",
              ]}
            />
            <Area type="monotone" dataKey="windows" fill="#3b82f6" fillOpacity={0.05} stroke="none" tooltipType="none" />
            <Line type="monotone" dataKey="windows" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} name="windows" />
            <Line type="monotone" dataKey="linux" stroke="#5eead4" strokeWidth={2} dot={{ fill: "#5eead4", r: 4 }} name="linux" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function CumulativeSavingsChart({ data }: { data: AnnualCostBreakdown[] }) {
  const cd = data.map((d) => ({
    name: d.year === 0 ? "Current" : `Year ${d.year}`,
    savings: d.cumulativeSavings,
  }));
  return (
    <Card title="Cumulative Savings">
      <div style={{ minHeight: 176 }}>
        <ResponsiveContainer width="100%" height={176}>
          <AreaChart data={cd}>
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#f9fafb" }}
              formatter={(value: number | undefined) => [value != null ? formatCurrencyFull(value) : "", "Cumulative Savings"]}
            />
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5eead4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#5eead4" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="savings" stroke="#5eead4" strokeWidth={2} fill="url(#savingsGrad)" dot={{ fill: "#5eead4", r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface TooltipPayloadItem { name: string; value: number; color: string }

function BreakdownTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload) return null;
  const nonZero = payload.filter((p) => p.value > 0);
  if (!nonZero.length) return null;
  return (
    <div style={{ ...tooltipStyle, padding: "8px 12px", fontSize: "11px" }}>
      <p style={{ color: "#f9fafb", marginBottom: 4 }}>{label}</p>
      {nonZero.map((e) => (
        <div key={e.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, color: e.color }}>
          <span>{e.name}</span>
          <span>{formatCurrencyFull(e.value)}</span>
        </div>
      ))}
    </div>
  );
}

function CostBreakdownChart({ data }: { data: AnnualCostBreakdown }) {
  const cd = [
    {
      name: "Windows",
      "Base Compute": data.windows.baseCompute,
      "Win License": data.windows.embeddedLicense,
      "Windows CALs": data.windows.windowsCals,
      "RDS CALs": data.windows.rdsCals,
      "SQL Server": data.windows.sqlServer,
    },
    {
      name: "Linux + Wine",
      "Base Compute": data.linux.compute,
      "Win License": 0,
      "Windows CALs": 0,
      "RDS CALs": 0,
      "Wine Support": data.linux.wineSupport,
      "SQL Server": data.linux.sqlServer,
    },
  ];
  return (
    <Card title="Year 1 Cost Breakdown">
      <div className="flex-1" style={{ minHeight: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={cd} barGap={8}>
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={formatCurrency} />
            <Tooltip content={<BreakdownTooltip />} cursor={false} />
            <Legend wrapperStyle={{ fontSize: "10px" }} />
            <Bar dataKey="Base Compute" stackId="a" fill="#5eead4" activeBar={{ fill: "#5eead4" }} />
            <Bar dataKey="Win License" stackId="a" fill="#3b82f6" activeBar={{ fill: "#3b82f6" }} />
            <Bar dataKey="Windows CALs" stackId="a" fill="#f59e0b" activeBar={{ fill: "#f59e0b" }} />
            <Bar dataKey="RDS CALs" stackId="a" fill="#a78bfa" activeBar={{ fill: "#a78bfa" }} />
            <Bar dataKey="Wine Support" stackId="a" fill="#34d399" activeBar={{ fill: "#34d399" }} />
            <Bar dataKey="SQL Server" stackId="a" fill="#06b6d4" radius={[4, 4, 0, 0]} activeBar={{ fill: "#06b6d4" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function WindowsTaxGauge({
  total,
  percentage,
  breakdown,
}: {
  total: number;
  percentage: number;
  breakdown: { instancePremium: number; windowsCals: number; rdsCals: number; sqlServerSavings: number };
}) {
  const pct = Math.min(Math.max(percentage, 0), 100);
  const circumference = Math.PI * 60;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <Card title="Windows Tax Meter">
      <div className="flex flex-col items-center">
        <svg width="150" height="90" viewBox="0 0 150 90">
          <path d="M 15 75 A 60 60 0 0 1 135 75" fill="none" stroke="#374151" strokeWidth="10" strokeLinecap="round" />
          <path
            d="M 15 75 A 60 60 0 0 1 135 75"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
          <text x="75" y="62" textAnchor="middle" fill="#3b82f6" fontSize="20" fontWeight="bold">
            <AnimatedValue value={pct} formatter={formatPercent} />
          </text>
          <text x="75" y="78" textAnchor="middle" fill="#9ca3af" fontSize="9">
            of annual spend
          </text>
        </svg>
        <p className="text-lg font-bold text-danger mt-1">
          <AnimatedValue value={total} formatter={formatCurrency} />
          <span className="text-xs font-normal text-text-secondary">/yr</span>
        </p>
        <div className="w-full mt-2 space-y-1 text-[11px]">
          {[
            ["EC2 Windows Premium", breakdown.instancePremium],
            ["Windows Server CALs", breakdown.windowsCals],
            ["RDS CALs", breakdown.rdsCals],
            ["SQL Server Savings", breakdown.sqlServerSavings],
          ].map(([label, val]) => (
            <div key={label as string} className="flex justify-between text-text-secondary">
              <span>{label as string}</span>
              <span className="text-text-primary">{formatCurrency(val as number)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ── Results Section ──────────────────────────────────────────── */

function ChartShimmer() {
  return (
    <div className="animate-pulse space-y-3 p-3">
      <div className="h-3 w-24 rounded bg-border/40" />
      <div className="h-36 rounded bg-border/20" />
    </div>
  );
}

function ChartReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    const timer = setTimeout(() => observer.observe(el), 60);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  return (
    <div ref={ref} className="h-full">
      <div
        className="transition-all duration-700 ease-out h-full"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
          transitionDelay: `${delay}ms`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ResultsSection({
  result,
  horizon,
  setHorizon,
}: {
  result: SimulationResult;
  horizon: Horizon;
  setHorizon: (h: Horizon) => void;
}) {
  const sliced = result.annualBreakdowns.slice(0, horizon);
  const year0: AnnualCostBreakdown = {
    year: 0,
    windows: { ...sliced[0].windows },
    linux: { ...sliced[0].linux },
    savings: 0,
    cumulativeSavings: 0,
  };
  const chartData = [year0, ...sliced];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
        <h2 className="text-lg font-semibold">Projected Savings</h2>
        <HorizonToggle horizon={horizon} onChange={setHorizon} />
      </div>
      <div className="space-y-3">
        <ChartReveal>
          <SummaryCards result={result} horizon={horizon} />
        </ChartReveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ChartReveal delay={100}>
            <CostComparisonChart data={chartData} />
          </ChartReveal>
          <ChartReveal delay={200}>
            <CumulativeSavingsChart data={chartData} />
          </ChartReveal>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ChartReveal delay={300}>
            <CostBreakdownChart data={result.annualBreakdowns[0]} />
          </ChartReveal>
          <ChartReveal delay={400}>
            <WindowsTaxGauge
              total={result.windowsTax.total}
              percentage={result.windowsTax.percentage}
              breakdown={result.windowsTax}
            />
          </ChartReveal>
        </div>
      </div>
    </div>
  );
}

/* ── Main Export ───────────────────────────────────────────────── */

export default function CostModeling() {
  const { inputs, result, horizon, setHorizon, updateCompute, updateLicensing } =
    useSimulator();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [inSection, setInSection] = useState(false);

  // Track whether cost-modeling section is in viewport (for sticky button visibility)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInSection(entry.isIntersecting),
      { threshold: 0.15, rootMargin: "-10% 0px -10% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="cost-modeling" className="relative px-6 py-24">
      {/* AO shadow at bottom — depth before The Technology section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 z-10 bg-gradient-to-b from-transparent to-black/40" />
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-3 text-sm font-medium tracking-widest text-accent uppercase">
          Interactive Calculator
        </p>
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
          What Is Windows Costing You?
        </h2>
        <p className="mb-12 max-w-2xl text-text-secondary">
          Model your current infrastructure and see the cost impact of Windows
          licensing across compute, SQL Server, CALs, and support.
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
          {/* Desktop: inline config panel */}
          <div className="hidden xl:flex flex-col">
            <InputPanel
              inputs={inputs}
              updateCompute={updateCompute}
              updateLicensing={updateLicensing}
            />
          </div>
          <ResultsSection
            result={result}
            horizon={horizon}
            setHorizon={setHorizon}
          />
        </div>

        <p className="mt-6 text-center text-xs text-text-muted">
          Your data stays in your browser — nothing is sent to any server.
        </p>
      </div>

      {/* Mobile: sticky bottom drawer for config */}
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="xl:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      {/* Drawer */}
      <div
        className={`xl:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-border bg-bg-primary transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "75vh" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <span className="text-sm font-semibold text-text-primary">Configuration</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1 rounded-md text-text-muted hover:text-text-primary"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(75vh - 52px)" }}>
          <InputPanel
            inputs={inputs}
            updateCompute={updateCompute}
            updateLicensing={updateLicensing}
          />
        </div>
      </div>

      {/* Floating configure button — slides up/down when entering/leaving section */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="xl:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-bg-primary transition-all duration-500 ease-out hover:opacity-90 active:scale-95"
        style={{
          transform: inSection && !drawerOpen ? "translateY(0)" : "translateY(calc(100% + 3rem))",
          opacity: inSection && !drawerOpen ? 1 : 0,
          animation: inSection && !drawerOpen ? "configBtnGlow 1.8s ease-in-out infinite" : "none",
          pointerEvents: inSection && !drawerOpen ? "auto" : "none",
        }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        Configure
      </button>
    </section>
  );
}
