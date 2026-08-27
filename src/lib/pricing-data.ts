import { InstancePricing, InstanceFamily, PricingModel } from "@/types";

export const INSTANCE_PRICING: InstancePricing[] = [
  { instanceType: "m6i.xlarge",   family: "general", vCPUs: 4,  memoryGiB: 16,  linuxOnDemandHourly: 0.192, windowsOnDemandHourly: 0.376 },
  { instanceType: "m6i.2xlarge",  family: "general", vCPUs: 8,  memoryGiB: 32,  linuxOnDemandHourly: 0.384, windowsOnDemandHourly: 0.752 },
  { instanceType: "m6i.4xlarge",  family: "general", vCPUs: 16, memoryGiB: 64,  linuxOnDemandHourly: 0.768, windowsOnDemandHourly: 1.504 },
  { instanceType: "m6i.8xlarge",  family: "general", vCPUs: 32, memoryGiB: 128, linuxOnDemandHourly: 1.536, windowsOnDemandHourly: 3.008 },
  { instanceType: "m6i.12xlarge", family: "general", vCPUs: 48, memoryGiB: 192, linuxOnDemandHourly: 2.304, windowsOnDemandHourly: 4.512 },
  { instanceType: "c6i.xlarge",   family: "compute", vCPUs: 4,  memoryGiB: 8,   linuxOnDemandHourly: 0.170, windowsOnDemandHourly: 0.354 },
  { instanceType: "c6i.2xlarge",  family: "compute", vCPUs: 8,  memoryGiB: 16,  linuxOnDemandHourly: 0.340, windowsOnDemandHourly: 0.708 },
  { instanceType: "c6i.4xlarge",  family: "compute", vCPUs: 16, memoryGiB: 32,  linuxOnDemandHourly: 0.680, windowsOnDemandHourly: 1.416 },
  { instanceType: "c6i.8xlarge",  family: "compute", vCPUs: 32, memoryGiB: 64,  linuxOnDemandHourly: 1.360, windowsOnDemandHourly: 2.832 },
  { instanceType: "r6i.xlarge",   family: "memory",  vCPUs: 4,  memoryGiB: 32,  linuxOnDemandHourly: 0.252, windowsOnDemandHourly: 0.436 },
  { instanceType: "r6i.2xlarge",  family: "memory",  vCPUs: 8,  memoryGiB: 64,  linuxOnDemandHourly: 0.504, windowsOnDemandHourly: 0.872 },
  { instanceType: "r6i.4xlarge",  family: "memory",  vCPUs: 16, memoryGiB: 128, linuxOnDemandHourly: 1.008, windowsOnDemandHourly: 1.744 },
  { instanceType: "r6i.8xlarge",  family: "memory",  vCPUs: 32, memoryGiB: 256, linuxOnDemandHourly: 2.016, windowsOnDemandHourly: 3.488 },
];

export const PRICING_MODEL_DISCOUNTS: Record<PricingModel, number> = {
  "on-demand":    1.00,
  "reserved-1yr": 0.60,
  "reserved-3yr": 0.40,
  "spot":         0.35,
};

export const SQL_SERVER_PRICING = {
  standard:   { perCorePerYear: 3_945 },
  enterprise: { perCorePerYear: 15_123 },
} as const;

export const WINDOWS_CAL_PRICE_PER_USER_YEAR = 40;
export const RDS_CAL_PRICE_PER_USER_YEAR = 120;
export const WINE_SUPPORT_RATE = 0.15;
export const HOURS_PER_YEAR = 8_760;

export const INSTANCE_FAMILY_LABELS: Record<InstanceFamily, string> = {
  general: "General Purpose (m6i)",
  compute: "Compute Optimized (c6i)",
  memory: "Memory Optimized (r6i)",
};

export function getInstancePricing(instanceType: string): InstancePricing | undefined {
  return INSTANCE_PRICING.find((i) => i.instanceType === instanceType);
}

export function getInstancesByFamily(family: InstanceFamily): InstancePricing[] {
  return INSTANCE_PRICING.filter((i) => i.family === family);
}
