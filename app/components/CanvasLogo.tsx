"use client";
import React from "react";

// 7×7 pixel grid icon.
// Inner 3×3 = game palette colors, center pixel pulses (active cursor metaphor).
// Outer ring = dark canvas frame.

type Size = "sm" | "md" | "lg" | "hero";

const CELL: Record<Size, number> = { sm: 5, md: 7, lg: 10, hero: 13 };
const GAP = 1;
const COLS = 7;

const DK = "#1a1f2e";   // frame
const EM = "#0b0e18";   // empty inner

const INNER: (string | null)[][] = [
  ["#ef4444", "#f97316", "#eab308"],  // red  orange  yellow
  ["#a855f7", "#ffffff", "#22c55e"],  // purple  WHITE(cursor)  green
  ["#6366f1", "#3b82f6", "#06b6d4"],  // indigo  blue  cyan
];

function buildGrid(px: number) {
  const n = COLS;
  const dim = n * px + (n - 1) * GAP;

  const rects: React.ReactNode[] = [];

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = c * (px + GAP);
      const y = r * (px + GAP);

      let fill: string | null = null;

      if (r === 0 || r === n - 1 || c === 0 || c === n - 1) {
        fill = DK;
      } else if (r === 1 || r === n - 2 || c === 1 || c === n - 2) {
        fill = EM;
      } else {
        // inner 3×3 (rows 2-4, cols 2-4)
        const ir = r - 2;
        const ic = c - 2;
        fill = INNER[ir][ic];
      }

      if (!fill) continue;

      const isCenter = r === 3 && c === 3;

      rects.push(
        <rect
          key={`${r}-${c}`}
          x={x}
          y={y}
          width={px}
          height={px}
          fill={fill}
          className={isCenter ? "canvas-logo-pulse" : undefined}
        />
      );
    }
  }

  return { rects, dim };
}

interface CanvasLogoProps {
  size?: Size;
  /** Show the CANVAS wordmark alongside the icon */
  showText?: boolean;
  /** Use vertical stacking (icon above text). Default: horizontal */
  vertical?: boolean;
  /** Show ← back arrow before the text (for in-game nav) */
  backArrow?: boolean;
}

export function CanvasLogo({
  size = "md",
  showText = true,
  vertical = false,
  backArrow = false,
}: CanvasLogoProps) {
  const px = CELL[size];
  const { rects, dim } = buildGrid(px);

  const textSizes: Record<Size, number> = { sm: 10, md: 12, lg: 16, hero: 28 };
  const gapPx: Record<Size, number>     = { sm: 8,  md: 10, lg: 14, hero: 18 };
  const fontSize = textSizes[size];
  const spacing  = gapPx[size];

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: vertical ? "column" : "row",
        alignItems: "center",
        gap: spacing,
        userSelect: "none",
      }}
    >
      {/* CSS for center-pixel pulse */}
      <style>{`
        @keyframes canvasCursorPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
        .canvas-logo-pulse {
          animation: canvasCursorPulse 1.6s ease-in-out infinite;
        }
      `}</style>

      {/* Icon */}
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        style={{
          display: "block",
          flexShrink: 0,
          filter: "drop-shadow(0 0 6px rgba(168,85,247,0.55))",
        }}
      >
        {rects}
      </svg>

      {/* Wordmark */}
      {showText && (
        <span
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize,
            letterSpacing: size === "hero" ? 5 : 3,
            lineHeight: 1,
            background:
              "linear-gradient(120deg, #a855f7 0%, #ec4899 55%, #f97316 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
            whiteSpace: "nowrap",
          }}
        >
          {backArrow ? "← CANVAS" : "CANVAS"}
        </span>
      )}
    </div>
  );
}
