import type { PackageTier } from '../types';

export interface PackagePricing {
  etb: number;
  usd: number;
}

// Single source of truth for consultation package prices, used by both
// PackagesScreen (display) and ApplyScreen (the amount sent to payments).
export const PACKAGE_PRICING: Record<PackageTier, PackagePricing> = {
  basic: { etb: 10000, usd: 85 },
  standard: { etb: 28000, usd: 225 },
  premium: { etb: 55000, usd: 450 },
};

export const formatEtb = (n: number): string => n.toLocaleString('en-US');
