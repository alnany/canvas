/**
 * POST /api/affiliate/register
 *
 * Register the current user as an affiliate.
 * If they arrived via a referral link (?ref=CODE), they are placed under that affiliate.
 *
 * Body: { walletAddress: string; referralCode?: string }
 * Response: { affiliate: Affiliate }
 *
 * TODO (dev): Replace db.* stubs with your DB adapter (Prisma / Drizzle / raw SQL)
 */
import { NextRequest, NextResponse } from "next/server";
import { generateReferralCode, Affiliate, AFFILIATE_POOL } from "@/lib/affiliate";

export async function POST(req: NextRequest) {
  const { walletAddress, referralCode } = await req.json();

  if (!walletAddress) {
    return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
  }

  // TODO: Check if already registered
  // const existing = await db.affiliates.findUnique({ where: { id: walletAddress } });
  // if (existing) return NextResponse.json({ affiliate: existing });

  // Resolve parent affiliate from referral code
  let referrerId: string | null = null;
  let maxRate = AFFILIATE_POOL; // Canvas default: 5%

  if (referralCode) {
    // TODO: const parent = await db.affiliates.findUnique({ where: { referralCode } });
    // if (parent) {
    //   referrerId = parent.id;
    //   maxRate = parent.downlineDefaultRate; // inherits parent's configured downline rate
    // }
  }

  const code = generateReferralCode(walletAddress);
  const affiliate: Affiliate = {
    id: walletAddress,
    referralCode: code,
    username: null,
    referrerId,
    maxRate,
    downlineDefaultRate: 0,
    totalEarned: 0,
    totalClaimed: 0,
    createdAt: new Date().toISOString(),
  };

  // TODO: await db.affiliates.create({ data: affiliate });

  return NextResponse.json({ affiliate });
}
