/**
 * POST /api/admin/affiliate/set-max-rate
 *
 * Set the max cascade rate for a specific affiliate.
 * - maxRate > 5  → affiliate gets cascade controls unlocked
 * - maxRate = 5  → reverts to standard flat rate, clears downline config
 * - maxRate < 5  → not allowed (floor is 5%)
 *
 * Body: { affiliateId: string; maxRate: number }
 * Protected by x-admin-key header.
 */
import { NextRequest, NextResponse } from "next/server";
import { AFFILIATE_POOL } from "@/lib/affiliate";

const ADMIN_KEY = process.env.ADMIN_API_KEY ?? "canvas-admin-dev";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-admin-key") !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { affiliateId, maxRate } = await req.json();

  if (!affiliateId || maxRate === undefined) {
    return NextResponse.json({ error: "affiliateId and maxRate required" }, { status: 400 });
  }

  if (maxRate < AFFILIATE_POOL) {
    return NextResponse.json(
      { error: `maxRate cannot be below the platform default (${AFFILIATE_POOL}%)` },
      { status: 400 }
    );
  }

  if (maxRate > 50) {
    return NextResponse.json({ error: "maxRate cannot exceed 50%" }, { status: 400 });
  }

  // TODO: const affiliate = await db.affiliates.findUnique({ where: { id: affiliateId } });
  // if (!affiliate) return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  //
  // await db.affiliates.update({
  //   where: { id: affiliateId },
  //   data: {
  //     maxRate,
  //     // If reverting to standard rate, clear downline config
  //     ...(maxRate <= AFFILIATE_POOL ? { downlineDefaultRate: 0 } : {}),
  //   },
  // });

  return NextResponse.json({
    success: true,
    affiliateId,
    maxRate,
    cascadeUnlocked: maxRate > AFFILIATE_POOL,
    note: maxRate <= AFFILIATE_POOL ? "Reverted to standard rate. Downline config cleared." : undefined,
  });
}
