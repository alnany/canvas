/**
 * POST /api/admin/affiliate/set-max-rate
 *
 * Platform-only endpoint — elevate (or reduce) an affiliate's maxRate above the
 * default 5% (AFFILIATE_POOL). This is the ONLY way cascade settings become
 * available to an affiliate.
 *
 * Auth: Must present a valid admin API key via the `x-admin-key` header.
 *       In production, replace the env-var check with your preferred auth
 *       strategy (e.g. Clerk admin role, JWT scope, internal service token).
 *
 * Body: {
 *   affiliateId: string;   // wallet address / user ID of the affiliate
 *   maxRate: number;       // new max rate in % (1–100)
 *                          //   5  → standard (reverts to default, disables cascade)
 *                          //   >5 → elevated, cascade controls become available
 * }
 *
 * Response: { success: true; affiliate: { id, maxRate } }
 *
 * TODO (dev): Wire to your DB adapter (Prisma / Drizzle / raw SQL).
 */
import { NextRequest, NextResponse } from "next/server";
import { AFFILIATE_POOL } from "@/lib/affiliate";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY; // set in .env.local / Vercel env vars

export async function POST(req: NextRequest) {
  // ── Auth gate ──────────────────────────────────────────────────────────────
  const adminKey = req.headers.get("x-admin-key");
  if (!ADMIN_API_KEY || adminKey !== ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Validate input ─────────────────────────────────────────────────────────
  const { affiliateId, maxRate } = await req.json();

  if (!affiliateId) {
    return NextResponse.json({ error: "affiliateId required" }, { status: 400 });
  }
  if (typeof maxRate !== "number" || maxRate < 1 || maxRate > 100) {
    return NextResponse.json(
      { error: "maxRate must be a number between 1 and 100" },
      { status: 400 }
    );
  }

  // ── Guard: if reducing back to ≤ AFFILIATE_POOL, also reset downlineDefaultRate ──
  // When an elevated affiliate is brought back to 5%, their cascade config
  // becomes meaningless — reset it too so the UI stays consistent.
  const isElevated = maxRate > AFFILIATE_POOL;

  // TODO: const affiliate = await db.affiliates.findUnique({ where: { id: affiliateId } });
  // if (!affiliate) return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });

  // TODO: await db.affiliates.update({
  //   where: { id: affiliateId },
  //   data: {
  //     maxRate,
  //     // If being reduced back to standard, clear any cascade config
  //     ...(isElevated ? {} : { downlineDefaultRate: 0 }),
  //   },
  // });

  // TODO: Optionally notify the affiliate (email / in-app) that their rate changed.

  return NextResponse.json({
    success: true,
    affiliate: {
      id: affiliateId,
      maxRate,
      cascadeEnabled: isElevated,
    },
  });
}
