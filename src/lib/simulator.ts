import {
  SimulatorInputs,
  SimulationResult,
  AnnualCostBreakdown,
} from "@/types";
import {
  getInstancePricing,
  PRICING_MODEL_DISCOUNTS,
  SQL_SERVER_PRICING,
  WINDOWS_CAL_PRICE_PER_USER_YEAR,
  RDS_CAL_PRICE_PER_USER_YEAR,
  WINE_SUPPORT_RATE,
  HOURS_PER_YEAR,
} from "./pricing-data";

export function runSimulation(inputs: SimulatorInputs): SimulationResult {
  const instance = getInstancePricing(inputs.compute.instanceType);
  if (!instance) return emptyResult();

  const discount = PRICING_MODEL_DISCOUNTS[inputs.compute.pricingModel];
  const utilizationFactor = inputs.compute.utilization / 100;
  const growthRate = inputs.compute.annualGrowthRate / 100;
  const isSpot = inputs.compute.pricingModel === "spot";

  // For spot pricing, only the compute portion is discounted —
  // the Windows license premium stays at full price.
  const windowsLicensePremiumHourly = instance.windowsOnDemandHourly - instance.linuxOnDemandHourly;
  const baseHours = HOURS_PER_YEAR * inputs.compute.instanceCount * utilizationFactor;

  const baseLinuxCompute = instance.linuxOnDemandHourly * discount * baseHours;
  const baseWindowsCompute = isSpot
    ? (instance.linuxOnDemandHourly * discount + windowsLicensePremiumHourly) * baseHours
    : instance.windowsOnDemandHourly * discount * baseHours;

  const baseWindowsCals = inputs.licensing.windowsCalCount * WINDOWS_CAL_PRICE_PER_USER_YEAR;
  const baseRdsCals = inputs.licensing.rdsCalCount * RDS_CAL_PRICE_PER_USER_YEAR;
  const baseWindowsLicensing = baseWindowsCals + baseRdsCals;

  let baseSqlCostWindows = 0;
  let baseSqlCostLinux = 0;
  if (inputs.licensing.sqlEdition !== "none") {
    const sqlRate = SQL_SERVER_PRICING[inputs.licensing.sqlEdition].perCorePerYear;
    baseSqlCostWindows = sqlRate * inputs.licensing.sqlLicensedCores;
    baseSqlCostLinux = baseSqlCostWindows * 0.5;
  }

  const baseWineSupport = baseLinuxCompute * WINE_SUPPORT_RATE;

  const annualBreakdowns: AnnualCostBreakdown[] = [];
  let cumulativeSavings = 0;

  for (let year = 1; year <= 5; year++) {
    const g = Math.pow(1 + growthRate, year - 1);

    const winBaseCompute = baseLinuxCompute * g;
    const winEmbeddedLicense = (baseWindowsCompute - baseLinuxCompute) * g;
    const winCals = baseWindowsCals * g;
    const winRdsCals = baseRdsCals * g;
    const winSql = baseSqlCostWindows * g;
    const winTotal = winBaseCompute + winEmbeddedLicense + winCals + winRdsCals + winSql;

    const linCompute = baseLinuxCompute * g;
    const linWine = baseWineSupport * g;
    const linSql = baseSqlCostLinux * g;
    const linTotal = linCompute + linWine + linSql;

    const savings = winTotal - linTotal;
    cumulativeSavings += savings;

    annualBreakdowns.push({
      year,
      windows: { baseCompute: winBaseCompute, embeddedLicense: winEmbeddedLicense, windowsCals: winCals, rdsCals: winRdsCals, sqlServer: winSql, total: winTotal },
      linux: { compute: linCompute, wineSupport: linWine, sqlServer: linSql, total: linTotal },
      savings,
      cumulativeSavings,
    });
  }

  const instancePremium = baseWindowsCompute - baseLinuxCompute;
  const windowsTaxTotal = instancePremium + baseWindowsLicensing + (baseSqlCostWindows - baseSqlCostLinux);
  const year1WindowsTotal = annualBreakdowns[0].windows.total;

  return {
    annualBreakdowns,
    windowsTax: {
      instancePremium,
      windowsCals: baseWindowsCals,
      rdsCals: baseRdsCals,
      sqlServerSavings: baseSqlCostWindows - baseSqlCostLinux,
      total: windowsTaxTotal,
      percentage: year1WindowsTotal > 0 ? (windowsTaxTotal / year1WindowsTotal) * 100 : 0,
    },
    summary: {
      year1Savings: annualBreakdowns[0].savings,
      year3CumulativeSavings: annualBreakdowns[2].cumulativeSavings,
      year5CumulativeSavings: annualBreakdowns[4].cumulativeSavings,
      savingsPercentage: year1WindowsTotal > 0 ? (annualBreakdowns[0].savings / year1WindowsTotal) * 100 : 0,
    },
  };
}

function emptyResult(): SimulationResult {
  const empty: AnnualCostBreakdown = {
    year: 0,
    windows: { baseCompute: 0, embeddedLicense: 0, windowsCals: 0, rdsCals: 0, sqlServer: 0, total: 0 },
    linux: { compute: 0, wineSupport: 0, sqlServer: 0, total: 0 },
    savings: 0,
    cumulativeSavings: 0,
  };
  return {
    annualBreakdowns: Array.from({ length: 5 }, (_, i) => ({ ...empty, year: i + 1 })),
    windowsTax: { instancePremium: 0, windowsCals: 0, rdsCals: 0, sqlServerSavings: 0, total: 0, percentage: 0 },
    summary: { year1Savings: 0, year3CumulativeSavings: 0, year5CumulativeSavings: 0, savingsPercentage: 0 },
  };
}
