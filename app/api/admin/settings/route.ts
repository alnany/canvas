/**
 * GET  /api/admin/settings  — fetch current platform settings
 * POST /api/admin/settings  — update platform settings
 *
 * Protected by x-admin-key header (ADMIN_API_KEY env var)
 *
 * Settings object:
 * {
 *   rtp:               number;  // Return-to-player %, e.g. 96
 *   platformFeeRate:   number;  // Platform fee %, e.g. 4
 *   brushTiers:        [number, number, number]; // USDT per tier
 *   strikeOdds:        { common: number; rare: number; legendary: number }; // % chance
 *   strikeMultipliers: { common: number; rare: number; legendary: number };
 *   shieldCostPerPixel: number; // $CANVAS per pixel
 *   shieldDurationHours: number;
 * }
 */
import { NextRequest, NextResponse } from "next/server";

const ADMIN_KEY = process.env.ADMIN_API_KEY ?? "canvas-admin-dev";

function isAuthed(req: NextRequest) {
  return req.headers.get("x-admin-key") === ADMIN_KEY;
}

// Default platform settings (in production, read from DB)
const DEFAULT_SETTINGS = {
  rtp: 96,
  platformFeeRate: 4,
  brushTiers: [1, 10, 100] as [number, number, number],
  strikeOdds: { common: 5, rare: 1, legendary: 0.1 },
  strikeMultipliers: { common: 5, rare: 25, legendary: 200 },
  shieldCostPerPixel: 3,
  shieldDurationHours: 8,
};

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: const settings = await db.platformSettings.findFirst();
  // return NextResponse.json({ settings: settings ?? DEFAULT_SETTINGS });

  return NextResponse.json({ settings: DEFAULT_SETTINGS });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Validate rtp + platformFeeRate must sum to 100
  if (body.rtp !== undefined && body.platformFeeRate !== undefined) {
    if (Math.abs(body.rtp + body.platformFeeRate - 100) > 0.001) {
      return NextResponse.json({ error: "rtp + platformFeeRate must equal 100" }, { status: 400 });
    }
  }

  // TODO: Persist to DB
  // await db.platformSettings.upsert({ ... });

  return NextResponse.json({ success: true, settings: { ...DEFAULT_SETTINGS, ...body } });
}
