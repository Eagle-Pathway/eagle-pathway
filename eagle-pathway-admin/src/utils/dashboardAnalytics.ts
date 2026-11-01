/**
 * Utilities for bucketing and formatting time-series data for the Admin Dashboard.
 */

export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toLocaleString();
}

export function formatCurrencyETB(amount: number): string {
  if (amount >= 1_000_000) {
    return `ETB ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `ETB ${(amount / 1_000).toFixed(1)}k`;
  }
  return `ETB ${Math.round(amount).toLocaleString()}`;
}

export interface DateBucket {
  dateStr: string;
  label: string;
}

/**
 * Generates an array of contiguous date buckets for a given range.
 */
export function generateDateBuckets(range: '7d' | '30d' | '90d' | 'all'): DateBucket[] {
  const dayCount = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const buckets: DateBucket[] = [];
  const today = new Date();

  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = toLocalDateStr(d);

    let label: string;
    if (dayCount <= 7) {
      label = dayNames[d.getDay()];
    } else {
      label = `${monthNames[d.getMonth()]} ${d.getDate()}`;
    }

    buckets.push({ dateStr, label });
  }

  return buckets;
}

export function categorizeSignupSource(u: {
  signup_source?: string | null;
  referral_code?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
}): 'Referral' | 'Social' | 'Organic' | 'Direct' | 'Paid' {
  if (u.referral_code) return 'Referral';

  const source = (u.utm_source || '').toLowerCase().trim();
  const campaign = (u.utm_campaign || '').toLowerCase().trim();
  const signup = (u.signup_source || '').toLowerCase().trim();

  const paidIndicators = ['cpc', 'ppc', 'paid', 'sponsored', 'promo', 'ad', 'ads'];
  if (campaign && paidIndicators.some((p) => campaign.includes(p))) return 'Paid';

  const socialSources = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'snapchat', 'pinterest', 'telegram'];
  if (socialSources.some((s) => source.includes(s) || signup.includes(s))) return 'Social';

  if (source === 'organic' || signup === 'organic' || source === 'google') return 'Organic';

  return 'Direct';
}

