"use client";
import Link from "next/link";
import { LogoV1, LogoV2, LogoV3, LogoV4, LogoV5 } from "../components/LogoVariants";

const variants = [
  {
    id: "v1",
    name: "Grid",
    tagline: "Iconic pixel canvas frame with rainbow inner matrix. Pulsing white center = live cursor.",
    pill: "Current",
    nav: <LogoV1 scale={1} />,
    hero: <LogoV1 scale={2.2} />,
    accent: "#a855f7",
  },
  {
    id: "v2",
    name: "C-mark",
    tagline: "Bold pixel-art C letterform — each arm a different palette color. Unmistakably game-native.",
    nav: <LogoV2 scale={1} />,
    hero: <LogoV2 scale={2.2} />,
    accent: "#f97316",
  },
  {
    id: "v3",
    name: "Crosshair",
    tagline: "Targeting cursor icon — the moment before you place a pixel. Minimal, precise.",
    nav: <LogoV3 scale={1} />,
    hero: <LogoV3 scale={2.2} />,
    accent: "#c4b5fd",
  },
  {
    id: "v4",
    name: "Spectrum",
    tagline: "No icon — each letter a different game palette color with individual glow. Pure type.",
    nav: <LogoV4 scale={1} />,
    hero: <LogoV4 scale={2.2} />,
    accent: "#eab308",
  },
  {
    id: "v5",
    name: "Float",
    tagline: "Open 3×3 floating color matrix — no heavy frame. Modern app feel over retro arcade.",
    nav: <LogoV5 scale={1} />,
    hero: <LogoV5 scale={2.2} />,
    accent: "#ec4899",
  },
];

export default function LogosPage() {
  return (
    <div style={{ background: "#07071a", minHeight: "100vh", color: "#e2e8f0", padding: "0 0 80px" }}>

      {/* Header bar */}
      <div style={{ borderBottom: "1px solid #1e1e3f", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#475569", letterSpacing: 2 }}>
          LOGO VARIANTS — PICK ONE
        </span>
        <Link href="/" style={{ fontSize: 12, color: "#475569", textDecoration: "none" }}>← back to site</Link>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px 0" }}>
        <p style={{ color: "#475569", fontSize: 13, marginBottom: 48, lineHeight: 1.7 }}>
          Five different directions. Each shown at nav size (top) and hero size (bottom). Font: Press Start 2P throughout.
        </p>

        {variants.map((v, i) => (
          <div key={v.id} style={{
            marginBottom: 56,
            borderRadius: 12,
            border: `1px solid ${v.accent}33`,
            overflow: "hidden",
            background: "#0a0a1a",
          }}>
            {/* Label row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 20px", borderBottom: "1px solid #1e1e3f",
              background: "#0d0d22",
            }}>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#64748b" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 11,
                color: v.accent,
              }}>{v.name.toUpperCase()}</span>
              {v.pill && (
                <span style={{
                  fontSize: 9, padding: "2px 8px", borderRadius: 99,
                  background: `${v.accent}22`, color: v.accent,
                  border: `1px solid ${v.accent}55`,
                }}>{v.pill}</span>
              )}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#475569", maxWidth: 340, textAlign: "right", lineHeight: 1.5 }}>
                {v.tagline}
              </span>
            </div>

            {/* Nav preview */}
            <div style={{
              padding: "16px 20px",
              background: "rgba(7,7,22,0.95)",
              borderBottom: "1px solid #1e1e3f",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>{v.nav}</div>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#475569" }}>Mechanics</span>
                <span style={{ fontSize: 12, color: "#475569" }}>Tokenomics</span>
                <span style={{ padding: "7px 18px", background: "#7c3aed", color: "#fff", borderRadius: 6, fontSize: 12 }}>
                  Play Demo
                </span>
              </div>
            </div>

            {/* Hero preview */}
            <div style={{
              padding: "52px 40px",
              background: "radial-gradient(ellipse at 30% 50%, #0f0a2e 0%, #07071a 60%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {v.hero}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
