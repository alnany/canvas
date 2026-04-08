/**
 * GET /api/affiliate/downlines?wallet=ADDRESS&depth=1
 *
 * Fetch the affiliate's direct downline members (depth=1) or full tree (depth=15).
 * Default: depth=1 (direct invitees only).
 *
 * Response: { downlines: DownlineMember[] }
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const depth = parseInt(req.nextUrl.searchParams.get("depth") ?? "1", 10);

  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  // TODO:
  // Recursively fetch downline up to `depth` levels.
  // For each member, include:
  //   - affiliate record
  //   - effectiveRate (customRate ?? parent.downlineDefaultRate)
  //   - spendVolume (SUM of purchases by all users under them)
  //   - earnings (SUM of cascade + direct bonus earned by them)
  //   - subCount (count of their direct invitees)
  //
  // const downlines = await getDownlineTree(wallet, depth);
  // return NextResponse.json({ downlines });

  return NextResponse.json({ downlines: [] }); // stub
}
