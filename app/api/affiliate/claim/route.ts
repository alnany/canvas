/**
 * POST /api/affiliate/claim
 *
 * Claim all pending earnings for this affiliate.
 * Triggers a USDT payout via Fireblocks.
 *
 * Body: { walletAddress: string }
 * Response: { success: boolean; amount: number; txId: string }
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { walletAddress } = await req.json();
  if (!walletAddress) return NextResponse.json({ error: "walletAddress required" }, { status: 400 });

  // TODO:
  // 1. Fetch all unclaimed earning records for walletAddress
  // const unclaimed = await db.affiliateEarnings.findMany({
  //   where: { affiliateId: walletAddress, claimed: false },
  // });
  // if (unclaimed.length === 0) return NextResponse.json({ error: "Nothing to claim" }, { status: 400 });
  //
  // 2. Sum the total claimable amount
  // const total = unclaimed.reduce((s, r) => s + r.totalEarning, 0);
  //
  // 3. Initiate Fireblocks USDT transfer
  // const tx = await fireblocks.createTransaction({
  //   assetId: "USDT",
  //   amount: total.toString(),
  //   destination: { type: "ONE_TIME_ADDRESS", oneTimeAddress: { address: walletAddress } },
  //   note: `Canvas affiliate claim — ${unclaimed.length} records`,
  // });
  //
  // 4. Mark records as claimed
  // await db.affiliateEarnings.updateMany({
  //   where: { id: { in: unclaimed.map(r => r.id) } },
  //   data: { claimed: true, claimedAt: new Date(), claimTx: tx.id },
  // });
  //
  // 5. Update affiliate totalClaimed
  // await db.affiliates.update({
  //   where: { id: walletAddress },
  //   data: { totalClaimed: { increment: total } },
  // });
  //
  // return NextResponse.json({ success: true, amount: total, txId: tx.id });

  return NextResponse.json({ success: true, amount: 0, txId: "stub" }); // stub
}
