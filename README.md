# CANVAS — Pixel War on Solana

> Place a pixel. Earn $CANVAS. Dominate the grid.

Interactive browser demo for Canvas — a 1,000×1,000 pixel war game launching on Solana with a fair-launch token ($CANVAS, 10B supply, 0% team/VC).

**[▶ Play the Demo →](https://canvas-demo.vercel.app)**

## What's in the demo

| Page | What you'll see |
|------|----------------|
| `/` | Landing page — hero, core loop, strike tiers, tokenomics, Holdr mechanic |
| `/play` | 80×80 interactive canvas — place pixels, 10s cooldown, earn $CANVAS, strikes, shield, leaderboard |

## Game mechanics shown

- **Pixel placement** → 10s demo cooldown (real game: 5 min base, reducible via referrals / $CANVAS burns)
- **Strike system** → Every placement rolls Pyth Entropy: Common 5%/5×, Rare 1%/25×, Legendary 0.1%/200×
- **Hold rewards** → 0.5 $CANVAS/hr per pixel owned, accruing live
- **Pixel Shield** → Burn 3× pixels_owned $CANVAS for 8h absolute protection (30s in demo)
- **Holdr class** → Wallets holding ≥10K $CANVAS earn 10% withdrawal tax redistribution from all players
- **Live bots** → Simulates real PVP competition on the grid

## Tech stack

- **Framework**: Next.js 16 (App Router, static export)
- **Styling**: Tailwind CSS v4
- **Fonts**: Press Start 2P + Share Tech Mono (pixel aesthetic)
- **Rendering**: HTML5 Canvas API (game grid), React state (UI)

## Run locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Build

```bash
npm run build   # static export → /out
```

## Deploy to Vercel

```bash
npx vercel
```

---

*Demo only — no wallet required, no blockchain. For the real game design doc, MVP scope, and QA plan, contact [@alnany](https://github.com/alnany).*
