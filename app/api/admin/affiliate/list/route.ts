/**
 * GET /api/admin/affiliate/list
 *
 * List all affiliates with current maxRate, volume, and earnings.
 * Query params:
 *   ?elevated=true   — only affiliates with maxRate > 5
 *   ?search=query    — filter by id or referralCode
 *   ?limit=50        — page size (default 50)
 *   ?cursor=ID       — pagination cursor
 *
 * Protected by x-admin-key header.
 */
import { NextRequest, NextResponse } from "next/server";
import { AFFILIATE_POOL } from "@/lib/affiliate";

const ADMIN_KEY = process.env.ADMIN_API_KEY ?? "canvas-admin-dev";

// Mock data for UI preview
const MOCK_AFFILIATES = [
  { id: "@gigabrain_xyz",  referralCode: "BRAIN1", maxRate: 15, downlineDefaultRate: 8,  totalEarned: 3420.50, totalClaimed: 2100.00, volume: 85512, subCount: 142, createdAt: "2026-01-15T00:00:00Z" },
  { id: "@pepearmy_sol",   referralCode: "PEPER2", maxRate: 10, downlineDefaultRate: 5,  totalEarned: 1180.20, totalClaimed: 900.00,  volume: 29505, subCount: 61,  createdAt: "2026-02-01T00:00:00Z" },
  { id: "@solqueen_99",    referralCode: "QUEEN3", maxRate: 5,  downlineDefaultRate: 0,  totalEarned: 441.80,  totalClaimed: 441.80,  volume: 22090, subCount: 23,  createdAt: "2026-02-14T00:00:00Z" },
  { id: "0x7f4…a9c",       referralCode: "CNVS42", maxRate: 5,  downlineDefaultRate: 3,  totalEarned: 182.40,  totalClaimed: 135.00,  volume: 4560,  subCount: 4,   createdAt: "2026-03-01T00:00:00Z" },
  { id: "@alice_sol",      referralCode: "ALIC5",  maxRate: 3,  downlineDefaultRate: 1,  totalEarned: 44.20,   totalClaimed: 22.10,   volume: 1474,  subCount: 4,   createdAt: "2026-03-05T00:00:00Z" },
  { id: "@bob_xyz",        referralCode: "BOBX6",  maxRate: 3,  downlineDefaultRate: 0,  totalEarned: 18.60,   totalClaimed: 18.60,   volume: 620,   subCount: 0,   createdAt: "2026-03-10T00:00:00Z" },
  { id: "@carol_gg",       referralCode: "CARO7",  maxRate: 3,  downlineDefaultRate: 2,  totalEarned: 31.50,   totalClaimed: 0,       volume: 1050,  subCount: 2,   createdAt: "2026-03-15T00:00:00Z" },
  { id: "@dave_px",        referralCode: "DAVE8",  maxRate: 3,  downlineDefaultRate: 0,  totalEarned: 5.10,    totalClaimed: 5.10,    volume: 170,   subCount: 0,   createdAt: "2026-03-20T00:00:00Z" },
];

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-key") !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const elevated = req.nextUrl.searchParams.get("elevated") === "true";
  const search   = req.nextUrl.searchParams.get("search")?.toLowerCase() ?? "";

  // TODO: Replace with real DB query
  let affiliates = MOCK_AFFILIATES;
  if (elevated) affiliates = affiliates.filter(a => a.maxRate > AFFILIATE_POOL);
  if (search)   affiliates = affiliates.filter(a =>
    a.id.toLowerCase().includes(search) || a.referralCode.toLowerCase().includes(search)
  );

  return NextResponse.json({
    affiliates,
    total: affiliates.length,
    cascade_threshold: AFFILIATE_POOL,
  });
}
