export type InstanceFamily = "general" | "compute" | "memory";

export type PricingModel = "on-demand" | "reserved-1yr" | "reserved-3yr" | "spot";

export type SqlEdition = "none" | "standard" | "enterprise";

export type SqlLicensingModel = "core" | "included";

export interface ComputeInputs {
  instanceFamily: InstanceFamily;
  instanceType: string;
  instanceCount: number;
  utilization: number;
  pricingModel: PricingModel;
  annualGrowthRate: number;
}

export interface LicensingInputs {
  windowsCalCount: number;
  rdsCalCount: number;
  sqlEdition: SqlEdition;
  sqlLicensedCores: number;
  sqlLicensingModel: SqlLicensingModel;
}

export interface SimulatorInputs {
  compute: ComputeInputs;
  licensing: LicensingInputs;
}

export interface InstancePricing {
  instanceType: string;
  family: InstanceFamily;
  vCPUs: number;
  memoryGiB: number;
  linuxOnDemandHourly: number;
  windowsOnDemandHourly: number;
}

export interface AnnualCostBreakdown {
  year: number;
  windows: {
    baseCompute: number;
    embeddedLicense: number;
    windowsCals: number;
    rdsCals: number;
    sqlServer: number;
    total: number;
  };
  linux: {
    compute: number;
    wineSupport: number;
    sqlServer: number;
    total: number;
  };
  savings: number;
  cumulativeSavings: number;
}

export interface SimulationResult {
  annualBreakdowns: AnnualCostBreakdown[];
  windowsTax: {
    instancePremium: number;
    windowsCals: number;
    rdsCals: number;
    sqlServerSavings: number;
    total: number;
    percentage: number;
  };
  summary: {
    year1Savings: number;
    year3CumulativeSavings: number;
    year5CumulativeSavings: number;
    savingsPercentage: number;
  };
}

export type Horizon = 1 | 3 | 5;
