/**
 * POST /api/affiliate/set-rate
 *
 * Set the default downline rate for this affiliate.
 * Optionally set a custom rate for a specific downline member.
 *
 * Body: {
 *   walletAddress: string;
 *   downlineRate: number;       // new default rate for all new invitees
 *   customFor?: string;         // optional: set custom rate for a specific downline wallet
 * }
 *
 * Validation: see validateDownlineRate() in lib/affiliate.ts
 */
import { NextRequest, NextResponse } from "next/server";
import { validateDownlineRate, hasCascadeAccess, AFFILIATE_POOL } from "@/lib/affiliate";

export async function POST(req: NextRequest) {
  const { walletAddress, downlineRate, customFor } = await req.json();
  if (!walletAddress || downlineRate === undefined) {
    return NextResponse.json({ error: "walletAddress and downlineRate required" }, { status: 400 });
  }

  // Cascade settings are only available to affiliates with maxRate > AFFILIATE_POOL (5%).
  // Standard affiliates have a flat 5% — no cascade to configure.
  // TODO: const affiliate = await db.affiliates.findUnique({ where: { id: walletAddress } });
  // if (!affiliate) return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });
  // if (!hasCascadeAccess(affiliate)) {
  //   return NextResponse.json(
  //     { error: "Cascade settings are only available to affiliates with an elevated rate above 5%" },
  //     { status: 403 }
  //   );
  // }

  // TODO: const affiliate = await db.affiliates.findUnique({ where: { id: walletAddress } });
  // if (!affiliate) return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });
  //
  // const { valid, message } = validateDownlineRate(downlineRate, affiliate.maxRate);
  // if (!valid) return NextResponse.json({ error: message }, { status: 400 });
  //
  // if (customFor) {
  //   // Set per-member custom rate
  //   await db.affiliateCustomRates.upsert({
  //     where: { affiliateId_downlineId: { affiliateId: walletAddress, downlineId: customFor } },
  //     create: { affiliateId: walletAddress, downlineId: customFor, customRate: downlineRate },
  //     update: { customRate: downlineRate },
  //   });
  // } else {
  //   await db.affiliates.update({
  //     where: { id: walletAddress },
  //     data: { downlineDefaultRate: downlineRate },
  //   });
  // }
  //
  // return NextResponse.json({ success: true });

  return NextResponse.json({ success: true }); // stub
}
