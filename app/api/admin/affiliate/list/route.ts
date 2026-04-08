/**
 * GET /api/admin/affiliate/list
 *
 * Platform-only endpoint — list all affiliates with their current rates.
 * Useful for the admin panel to see who has standard vs elevated rates.
 *
 * Auth: Must present a valid admin API key via the `x-admin-key` header.
 *
 * Query params:
 *   ?elevated=true   — filter to only elevated affiliates (maxRate > 5%)
 *   ?page=1          — pagination (20 per page)
 *
 * TODO (dev): Wire to your DB adapter.
 */
import { NextRequest, NextResponse } from "next/server";
import { AFFILIATE_POOL } from "@/lib/affiliate";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function GET(req: NextRequest) {
  // ── Auth gate ──────────────────────────────────────────────────────────────
  const adminKey = req.headers.get("x-admin-key");
  if (!ADMIN_API_KEY || adminKey !== ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const elevatedOnly = searchParams.get("elevated") === "true";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const PAGE_SIZE = 20;

  // TODO: const affiliates = await db.affiliates.findMany({
  //   where: elevatedOnly ? { maxRate: { gt: AFFILIATE_POOL } } : {},
  //   orderBy: { maxRate: "desc" },
  //   skip: (page - 1) * PAGE_SIZE,
  //   take: PAGE_SIZE,
  // });

  // Stub response
  return NextResponse.json({
    affiliates: [], // TODO: replace with db result
    page,
    elevated_only: elevatedOnly,
    cascade_threshold: AFFILIATE_POOL, // affiliates above this get cascade controls
  });
}
