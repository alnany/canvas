"use client";
import React from "react";

// ── Spectrum logo ──────────────────────────────────────────────────────────
// No icon — each letter a different game-palette color with neon glow.
// Each call-site that was using the old Grid logo now renders Spectrum.

type Size = "sm" | "md" | "lg" | "hero";

const SPECTRUM = [
  { ch: "C", color: "#ef4444", glow: "rgba(239,68,68,0.75)" },
  { ch: "A", color: "#f97316", glow: "rgba(249,115,22,0.75)" },
  { ch: "N", color: "#eab308", glow: "rgba(234,179,8,0.75)" },
  { ch: "V", color: "#22c55e", glow: "rgba(34,197,94,0.75)" },
  { ch: "A", color: "#3b82f6", glow: "rgba(59,130,246,0.75)" },
  { ch: "S", color: "#a855f7", glow: "rgba(168,85,247,0.75)" },
];

const FONT_SIZE: Record<Size, number> = { sm: 10, md: 13, lg: 17, hero: 30 };
const LETTER_GAP: Record<Size, number> = { sm: 2, md: 2, lg: 3, hero: 5 };

interface CanvasLogoProps {
  size?: Size;
  /** Kept for API compatibility — Spectrum is text-only, no standalone icon. */
  showText?: boolean;
  /** Kept for API compatibility — layout is always horizontal. */
  vertical?: boolean;
  /** Show ← back arrow before the wordmark (for in-game nav). */
  backArrow?: boolean;
}

export function CanvasLogo({
  size = "md",
  backArrow = false,
}: CanvasLogoProps) {
  const fontSize = FONT_SIZE[size];
  const gap = LETTER_GAP[size];

  const letters = backArrow
    ? [
        { ch: "←", color: "#94a3b8", glow: "rgba(148,163,184,0.5)" },
        { ch: " ", color: "transparent", glow: "transparent" },
        ...SPECTRUM,
      ]
    : SPECTRUM;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap,
        userSelect: "none",
      }}
    >
      {letters.map(({ ch, color, glow }, i) => (
        <span
          key={i}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize,
            lineHeight: 1,
            color,
            textShadow:
              ch === " " || ch === "←"
                ? undefined
                : `0 0 8px ${glow}, 0 0 18px ${glow}`,
            letterSpacing: 0,
            whiteSpace: "pre",
          }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}
