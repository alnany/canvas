"use client";
import React from "react";

// ─────────────────────────────────────────────
// V1 – "Grid" (current): 7×7 pixel grid frame + rainbow inner matrix + gradient wordmark
// ─────────────────────────────────────────────
const V1_DK = "#1a1f2e";
const V1_EM = "#0b0e18";
const V1_INNER = [
  ["#ef4444", "#f97316", "#eab308"],
  ["#a855f7", "#ffffff", "#22c55e"],
  ["#6366f1", "#3b82f6", "#06b6d4"],
];

export function LogoV1({ scale = 1 }: { scale?: number }) {
  const px = Math.round(7 * scale);
  const gap = 1;
  const n = 7;
  const dim = n * px + (n - 1) * gap;
  const fontSize = Math.round(12 * scale);
  const spacing = Math.round(10 * scale);

  const rects: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = c * (px + gap);
      const y = r * (px + gap);
      let fill: string | null = null;

      if (r === 0 || r === n - 1 || c === 0 || c === n - 1) fill = V1_DK;
      else if (r === 1 || r === n - 2 || c === 1 || c === n - 2) fill = V1_EM;
      else fill = V1_INNER[r - 2][c - 2];

      if (!fill) continue;
      const isCenter = r === 3 && c === 3;
      rects.push(
        <rect key={`${r}-${c}`} x={x} y={y} width={px} height={px} fill={fill}
          className={isCenter ? "cv-pulse" : undefined} />
      );
    }
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: spacing }}>
      <style>{`@keyframes cvPulse{0%,100%{opacity:1}50%{opacity:0.3}}.cv-pulse{animation:cvPulse 1.6s ease-in-out infinite}`}</style>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} style={{ display: "block", filter: "drop-shadow(0 0 6px rgba(168,85,247,0.55))" }}>
        {rects}
      </svg>
      <span style={{
        fontFamily: "'Press Start 2P', monospace", fontSize, letterSpacing: 3, lineHeight: 1,
        background: "linear-gradient(120deg,#a855f7 0%,#ec4899 55%,#f97316 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent",
      }}>CANVAS</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// V2 – "C-mark": Bold pixel-art "C" letterform (5×5) with rainbow gradient pixels + white wordmark
// ─────────────────────────────────────────────
type Cell = string | null;
const V2_GRID: Cell[][] = [
  ["#f97316", "#eab308", "#22c55e", "#10b981", null],  // top bar
  ["#ef4444", null,      null,      null,      null],
  ["#ec4899", null,      null,      null,      null],  // middle-left
  ["#8b5cf6", null,      null,      null,      null],
  ["#a855f7", "#6366f1", "#3b82f6", "#06b6d4", null],  // bottom bar
];

export function LogoV2({ scale = 1 }: { scale?: number }) {
  const px = Math.round(9 * scale);
  const gap = Math.round(2 * scale);
  const w = 5 * px + 4 * gap;
  const h = 5 * px + 4 * gap;
  const fontSize = Math.round(12 * scale);
  const spacing = Math.round(14 * scale);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: spacing }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
        style={{ display: "block", filter: "drop-shadow(0 0 8px rgba(168,85,247,0.65))" }}>
        {V2_GRID.map((row, r) =>
          row.map((color, c) =>
            color ? (
              <rect key={`${r}-${c}`} x={c * (px + gap)} y={r * (px + gap)}
                width={px} height={px} fill={color} />
            ) : null
          )
        )}
      </svg>
      <span style={{
        fontFamily: "'Press Start 2P', monospace", fontSize, letterSpacing: 3, lineHeight: 1,
        color: "#ffffff", textShadow: "0 0 14px rgba(168,85,247,0.8)",
      }}>CANVAS</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// V3 – "Crosshair": Pixel cursor/crosshair (place-pixel metaphor) + gradient wordmark
// ─────────────────────────────────────────────
const V3_CROSS_COLOR = "#a855f7";
const V3_CORNER_COLOR = "#4c1d95";
const V3_CENTER = "#ffffff";

export function LogoV3({ scale = 1 }: { scale?: number }) {
  const px = Math.round(5 * scale);
  const gap = Math.round(1 * scale);
  const n = 7;
  const dim = n * px + (n - 1) * gap;
  const fontSize = Math.round(12 * scale);
  const spacing = Math.round(10 * scale);

  // Crosshair pattern: cross arms + corner dots + bright center
  type XHCell = { x: number; y: number; color: string; pulse?: boolean };
  const cells: XHCell[] = [];
  const pos = (r: number, c: number) => ({ x: c * (px + gap), y: r * (px + gap) });

  // Cross arms (vertical: col 3, rows 0-2, 4-6; horizontal: row 3, cols 0-2, 4-6)
  for (let i = 0; i < n; i++) {
    if (i === 3) continue; // skip center row/col for the arm
    cells.push({ ...pos(i, 3), color: V3_CROSS_COLOR }); // vertical arm
    cells.push({ ...pos(3, i), color: V3_CROSS_COLOR }); // horizontal arm
  }
  // Corner accents (3 pixels in each corner)
  const corners = [[0,0],[0,1],[1,0],[0,6],[0,5],[1,6],[6,0],[6,1],[5,0],[6,6],[6,5],[5,6]];
  corners.forEach(([r,c]) => cells.push({ ...pos(r,c), color: V3_CORNER_COLOR }));
  // Center bright pixel
  cells.push({ ...pos(3, 3), color: V3_CENTER, pulse: true });

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: spacing }}>
      <style>{`@keyframes cvPulse3{0%,100%{opacity:1}50%{opacity:0.2}}.cv3-pulse{animation:cvPulse3 1.2s ease-in-out infinite}`}</style>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}
        style={{ display: "block", filter: "drop-shadow(0 0 6px rgba(168,85,247,0.5))" }}>
        {cells.map((cell, i) => (
          <rect key={i} x={cell.x} y={cell.y} width={px} height={px} fill={cell.color}
            className={cell.pulse ? "cv3-pulse" : undefined} />
        ))}
      </svg>
      <span style={{
        fontFamily: "'Press Start 2P', monospace", fontSize, letterSpacing: 3, lineHeight: 1,
        background: "linear-gradient(120deg,#c4b5fd 0%,#a855f7 40%,#ec4899 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent",
      }}>CANVAS</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// V4 – "Spectrum": No icon — each letter a different palette color with glow
// ─────────────────────────────────────────────
const SPECTRUM = [
  { ch: "C", color: "#ef4444", glow: "rgba(239,68,68,0.7)" },
  { ch: "A", color: "#f97316", glow: "rgba(249,115,22,0.7)" },
  { ch: "N", color: "#eab308", glow: "rgba(234,179,8,0.7)" },
  { ch: "V", color: "#22c55e", glow: "rgba(34,197,94,0.7)" },
  { ch: "A", color: "#3b82f6", glow: "rgba(59,130,246,0.7)" },
  { ch: "S", color: "#a855f7", glow: "rgba(168,85,247,0.7)" },
];

export function LogoV4({ scale = 1 }: { scale?: number }) {
  const fontSize = Math.round(13 * scale);
  const letterGap = Math.round(1 * scale);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: letterGap }}>
      {SPECTRUM.map(({ ch, color, glow }) => (
        <span key={ch + color} style={{
          fontFamily: "'Press Start 2P', monospace", fontSize, lineHeight: 1,
          color, textShadow: `0 0 10px ${glow}, 0 0 20px ${glow}`,
          letterSpacing: 0,
        }}>{ch}</span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// V5 – "Float": Floating 3×3 color grid (no frame) + gradient wordmark
//      More open and airy — modern app feel vs. retro game feel
// ─────────────────────────────────────────────
const V5_COLORS = [
  ["#ef4444", "#22c55e", "#3b82f6"],
  ["#f97316", "#ffffff", "#8b5cf6"],
  ["#eab308", "#06b6d4", "#ec4899"],
];

export function LogoV5({ scale = 1 }: { scale?: number }) {
  const px = Math.round(7 * scale);
  const gap = Math.round(3 * scale);
  const dim = 3 * px + 2 * gap;
  const fontSize = Math.round(12 * scale);
  const spacing = Math.round(12 * scale);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: spacing }}>
      <style>{`@keyframes cvPulse5{0%,100%{opacity:1}50%{opacity:0.15}}.cv5-pulse{animation:cvPulse5 1.8s ease-in-out infinite}`}</style>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}
        style={{ display: "block", filter: "drop-shadow(0 0 4px rgba(168,85,247,0.4))" }}>
        {V5_COLORS.map((row, r) =>
          row.map((color, c) => {
            const isCenter = r === 1 && c === 1;
            return (
              <rect key={`${r}-${c}`} x={c * (px + gap)} y={r * (px + gap)}
                width={px} height={px} fill={color} rx={Math.round(1.5 * scale)}
                className={isCenter ? "cv5-pulse" : undefined} />
            );
          })
        )}
      </svg>
      <span style={{
        fontFamily: "'Press Start 2P', monospace", fontSize, letterSpacing: 3, lineHeight: 1,
        background: "linear-gradient(120deg,#e2e8f0 0%,#a855f7 60%,#ec4899 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent",
      }}>CANVAS</span>
    </div>
  );
}
