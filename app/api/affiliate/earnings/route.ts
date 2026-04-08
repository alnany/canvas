/**
 * GET /api/affiliate/earnings?wallet=ADDRESS&status=pending|claimed|all
 *
 * Fetch earning records for this affiliate.
 * Default: status=pending (unclaimed only)
 *
 * Response: {
 *   claimable: number;      // total USDT ready to claim
 *   allTime: number;        // total USDT ever earned
 *   records: EarningRecord[];
 * }
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const status = req.nextUrl.searchParams.get("status") ?? "pending";

  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  // TODO:
  // const records = await db.affiliateEarnings.findMany({
  //   where: {
  //     affiliateId: wallet,
  //     ...(status === "pending" ? { claimed: false } : {}),
  //     ...(status === "claimed" ? { claimed: true } : {}),
  //   },
  //   orderBy: { createdAt: "desc" },
  // });
  //
  // const claimable = records.filter(r => !r.claimed).reduce((s, r) => s + r.totalEarning, 0);
  // const allTime = await db.affiliates.findUnique({ where: { id: wallet }, select: { totalEarned: true } });
  //
  // return NextResponse.json({ claimable, allTime: allTime?.totalEarned ?? 0, records });

  return NextResponse.json({ claimable: 0, allTime: 0, records: [] }); // stub
}
