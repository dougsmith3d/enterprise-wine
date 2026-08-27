"use client";

import { useState, useMemo } from "react";
import { SimulatorInputs, SimulationResult, Horizon } from "@/types";
import { runSimulation } from "@/lib/simulator";

const DEFAULT_INPUTS: SimulatorInputs = {
  compute: {
    instanceFamily: "general",
    instanceType: "m6i.12xlarge",
    instanceCount: 200,
    utilization: 70,
    pricingModel: "on-demand",
    annualGrowthRate: 10,
  },
  licensing: {
    windowsCalCount: 2000,
    rdsCalCount: 500,
    sqlEdition: "standard",
    sqlLicensedCores: 16,
    sqlLicensingModel: "core",
  },
};

export function useSimulator() {
  const [inputs, setInputs] = useState<SimulatorInputs>(DEFAULT_INPUTS);
  const [horizon, setHorizon] = useState<Horizon>(5);

  const result: SimulationResult = useMemo(() => runSimulation(inputs), [inputs]);

  const updateCompute = (partial: Partial<SimulatorInputs["compute"]>) =>
    setInputs((prev) => ({ ...prev, compute: { ...prev.compute, ...partial } }));

  const updateLicensing = (partial: Partial<SimulatorInputs["licensing"]>) =>
    setInputs((prev) => ({ ...prev, licensing: { ...prev.licensing, ...partial } }));

  return { inputs, result, horizon, setHorizon, updateCompute, updateLicensing };
}
