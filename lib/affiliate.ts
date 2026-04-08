/**
 * Canvas Affiliate Program — Core Business Logic
 *
 * Model: Infinite funnel cascade (based on Orderly DEX affiliate model)
 *
 * Each affiliate earns the DELTA between their allocated rate and what they pass to their downline.
 * The total paid out never exceeds Canvas's pool (5% cascade + 5% direct bonus).
 *
 * Constants:
 *  AFFILIATE_POOL  = 5%   (Canvas's default max cascade pool for L1 affiliates)
 *  DIRECT_BONUS    = 5%   (Guaranteed to the IMMEDIATE referrer, regardless of cascade)
 *  MAX_DEPTH       = 15   (Max referral chain depth)
 *  MIN_RATE_FLOOR  = 10%  (Min downline rate = 10% of your own rate, or 0 if your rate < 10%)
 */

export const AFFILIATE_POOL   = 5;   // % of purchase → cascade pool
export const DIRECT_BONUS     = 5;   // % of purchase → immediate referrer (guaranteed)
export const MAX_DEPTH        = 15;
export const MIN_RATE_FLOOR   = 10;  // 10% of your own rate is the minimum you must give downline

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Affiliate {
  id: string;           // wallet address
  referralCode: string; // short shareable code (fallback)
  username: string | null; // custom @username for referral links (e.g. domain.com/@alice)
  referrerId: string | null; // parent affiliate id (null = direct Canvas invite)
  maxRate: number;      // max % this affiliate can earn — set by their parent/Canvas
  downlineDefaultRate: number; // default % given to their invitees (0 to maxRate)
  totalEarned: number;  // all-time USDT earned
  totalClaimed: number; // all-time USDT claimed
  createdAt: string;
}

export interface AffiliateWithDepth extends Affiliate {
  depth: number;        // depth in tree (1 = L1 direct under Canvas)
}

export interface DownlineMember {
  affiliate: Affiliate;
  customRate?: number;  // if parent set a custom rate for this specific member
  effectiveRate: number; // customRate ?? parent.downlineDefaultRate
  spendVolume: number;  // total USDT spend by users under this member
  earnings: number;     // total earnings by this member
  subCount: number;     // count of their downline
}

export interface EarningRecord {
  id: string;
  affiliateId: string;
  playerId: string;        // the user who made the purchase
  purchaseAmount: number;  // USDT
  cascadeEarning: number;  // from cascade portion
  directBonus: number;     // from direct bonus (non-zero only if immediate referrer)
  totalEarning: number;    // cascadeEarning + directBonus
  purchaseTx: string;
  weekBucket: string;      // e.g. "2026-W15"
  claimed: boolean;
  claimedAt?: string;
  createdAt: string;
}

export interface ClaimRecord {
  id: string;
  affiliateId: string;
  amount: number;
  weekBuckets: string[];
  claimedAt: string;
  txId: string;
}

// ─── Commission Calculation ───────────────────────────────────────────────────

export interface AncestorNode {
  affiliateId: string;
  rate: number;   // max rate allocated to this node
  depth: number;  // 1 = L1
}

/**
 * Given an ordered chain from L1 down to the immediate referrer (closest first = highest depth),
 * calculate how much each ancestor earns from a single purchase.
 *
 * Chain format: [L1, L2, L3, ..., immediateReferrer]
 * Each node has rate = max % allocated to them by their parent
 *
 * Rule: node earns (their rate - their child's rate).
 * immediateReferrer earns their rate (no child below in chain).
 *
 * Returns: Map<affiliateId, { cascade, directBonus, total }>
 */
export function calculateEarnings(
  purchaseAmount: number,
  chain: AncestorNode[], // [L1 → ... → immediateReferrer], max 15 entries
  immediateReferrerId: string
): Map<string, { cascade: number; directBonus: number; total: number }> {
  const result = new Map<string, { cascade: number; directBonus: number; total: number }>();

  const capped = chain.slice(0, MAX_DEPTH);

  // Cascade distribution: each node earns (their_rate - downline_rate)
  for (let i = 0; i < capped.length; i++) {
    const node = capped[i];
    const downlineRate = i + 1 < capped.length ? capped[i + 1].rate : 0;
    const cascadePct = Math.max(0, node.rate - downlineRate);
    const cascadeEarning = (purchaseAmount * cascadePct) / 100;
    result.set(node.affiliateId, {
      cascade: cascadeEarning,
      directBonus: 0,
      total: cascadeEarning,
    });
  }

  // Direct bonus: always goes to the immediate referrer (5% of purchase)
  const directBonusAmount = (purchaseAmount * DIRECT_BONUS) / 100;
  const existing = result.get(immediateReferrerId);
  if (existing) {
    existing.directBonus = directBonusAmount;
    existing.total = existing.cascade + directBonusAmount;
  } else {
    // Immediate referrer not in cascade chain (shouldn't happen, but defensive)
    result.set(immediateReferrerId, {
      cascade: 0,
      directBonus: directBonusAmount,
      total: directBonusAmount,
    });
  }

  return result;
}

/**
 * Validate whether an affiliate can set a given downline rate.
 *
 * Rules:
 * - Range: 0 to maxRate
 * - If maxRate >= 10: minimum is 10% of maxRate (i.e., floor = maxRate * 0.10)
 * - If maxRate < 10: can set to 0
 */
export function validateDownlineRate(proposedRate: number, myMaxRate: number): {
  valid: boolean;
  min: number;
  max: number;
  message?: string;
} {
  const max = myMaxRate;
  const min = myMaxRate >= 10 ? +(myMaxRate * (MIN_RATE_FLOOR / 100)).toFixed(2) : 0;

  if (proposedRate < 0 || proposedRate > max) {
    return { valid: false, min, max, message: `Rate must be between ${min}% and ${max}%` };
  }
  if (proposedRate > 0 && proposedRate < min) {
    return { valid: false, min, max, message: `Minimum rate is ${min}% (or 0 to disable downline)` };
  }
  return { valid: true, min, max };
}

/**
 * Summary display for UI rate preview:
 * "You keep X% | Downline gets Y%"
 */
export function getRateSummary(myMaxRate: number, downlineRate: number): {
  iKeep: number;
  downlineGets: number;
  directBonusNote: string;
} {
  return {
    iKeep: +(myMaxRate - downlineRate).toFixed(2),
    downlineGets: +downlineRate.toFixed(2),
    directBonusNote: `+ ${DIRECT_BONUS}% direct bonus guaranteed to each invitee`,
  };
}

/**
 * Generate a short alphanumeric referral code.
 * Format: 6 chars uppercase (e.g. "X7KP2Q")
 */
export function generateReferralCode(seed?: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusable chars
  if (seed) {
    // Deterministic from seed (wallet address)
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    return Array.from({ length: 6 }, (_, i) => chars[(Math.abs(hash >> (i * 4)) % chars.length)]).join("");
  }
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/**
 * Get ISO week bucket for a date (e.g., "2026-W15")
 */
/** Validate a custom username. Returns null if valid, error string if not. */
export function validateUsername(username: string): string | null {
  if (!username) return 'Username required';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/.test(username))
    return 'Username must be 3–30 chars, start with a letter or digit, use only letters/digits/_/-';
  return null;
}

/** Build the affiliate referral link for a given affiliate. */
export function getReferralLink(affiliate: Pick<Affiliate, 'referralCode' | 'username'>, origin: string): string {
  return affiliate.username
    ? `${origin}/@${affiliate.username}`
    : `${origin}/play?ref=${affiliate.referralCode}`;
}

export function getWeekBucket(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
