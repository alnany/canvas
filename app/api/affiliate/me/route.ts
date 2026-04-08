/**
 * GET /api/affiliate/me?wallet=ADDRESS
 *
 * Fetch the current user's affiliate profile.
 * Returns null if not registered.
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  // TODO: const affiliate = await db.affiliates.findUnique({ where: { id: wallet } });
  // if (!affiliate) return NextResponse.json({ affiliate: null });
  // return NextResponse.json({ affiliate });

  return NextResponse.json({ affiliate: null }); // stub
}
