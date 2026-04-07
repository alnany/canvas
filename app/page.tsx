'use client';
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PALETTE = [
  "#ef4444","#f97316","#f59e0b","#22c55e",
  "#06b6d4","#3b82f6","#8b5cf6","#ec4899",
  "#f1f5f9","#64748b","#1e293b","#ffffff",
];

const GAME_COLORS = [
  "#a855f7","#7c3aed","#22d3ee","#06b6d4","#ec4899",
  "#f43f5e","#f59e0b","#22c55e","#3b82f6","#ef4444",
  "#8b5cf6","#14b8a6","#fb923c","#e879f9","#a3e635",
];

function MiniCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [earned, setEarned] = useState(0);
  const [lastMsg, setLastMsg] = useState<{txt:string;key:number}|null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const SIZE = 40, PX = 7;
    const grid = Array.from({ length: SIZE * SIZE }, () =>
      GAME_COLORS[Math.floor(Math.random() * GAME_COLORS.length)]
    );
    const glow = new Float32Array(SIZE * SIZE);

    const drawPixel = (i: number) => {
      const x = (i % SIZE) * PX, y = Math.floor(i / SIZE) * PX;
      ctx.fillStyle = grid[i];
      ctx.fillRect(x, y, PX, PX);
      const g = glow[i];
      if (g > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${g.toFixed(2)})`;
        ctx.fillRect(x, y, PX, PX);
        glow[i] = Math.max(0, g - 0.07);
      }
    };

    grid.forEach((_, i) => drawPixel(i));

    const placeBet = () => {
      const count = [1, 10, 100][Math.floor(Math.random() * 3)];
      const color = GAME_COLORS[Math.floor(Math.random() * GAME_COLORS.length)];
      const cx = Math.floor(Math.random() * SIZE);
      const cy = Math.floor(Math.random() * SIZE);
      const radius = count === 1 ? 1 : count === 10 ? 2 : 5;
      let placed = 0;
      for (let dy = -radius; dy <= radius && placed < count; dy++) {
        for (let dx = -radius; dx <= radius && placed < count; dx++) {
          if (dx*dx+dy*dy > radius*radius) continue;
          const nx = (cx+dx+SIZE)%SIZE, ny = (cy+dy+SIZE)%SIZE;
          const i = ny*SIZE+nx;
          grid[i] = color; glow[i] = 1.0; placed++;
        }
      }
      const earn = count * 5 + Math.floor(Math.random() * count * 3);
      setEarned(e => e + earn);
      if (count === 100) setLastMsg({ txt: "🏛️ VAULT +50K", key: Date.now() });
      else if (count === 10) setLastMsg({ txt: `⚡ STRIKE +${earn}`, key: Date.now() });
      grid.forEach((_, i) => drawPixel(i));
    };

    const betIv = setInterval(placeBet, 600);
    const glowIv = setInterval(() => { grid.forEach((_, i) => { if (glow[i] > 0) drawPixel(i); }); }, 40);
    return () => { clearInterval(betIv); clearInterval(glowIv); };
  }, []);

  useEffect(() => {
    if (!lastMsg) return;
    const t = setTimeout(() => setLastMsg(null), 1200);
    return () => clearTimeout(t);
  }, [lastMsg?.key]);

  return (
    <div style={{ position:"relative", display:"inline-block" }}>
      <canvas ref={canvasRef} width={280} height={280}
        style={{ imageRendering:"pixelated", border:"1px solid #2d1b69", borderRadius:8, display:"block" }} />
      <div style={{ position:"absolute", top:8, right:8, background:"rgba(239,68,68,0.15)",
        border:"1px solid rgba(239,68,68,0.5)", borderRadius:4, padding:"2px 7px",
        display:"flex", alignItems:"center", gap:4 }}>
        <span style={{ width:5, height:5, background:"#ef4444", borderRadius:"50%",
          display:"inline-block", animation:"pulse 1.2s infinite" }} />
        <span style={{ fontSize:8, color:"#ef4444", letterSpacing:1 }}>LIVE</span>
      </div>
      <div style={{ position:"absolute", bottom:8, left:8, right:8,
        background:"rgba(7,7,16,0.88)", borderRadius:6, padding:"5px 10px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        backdropFilter:"blur(6px)", border:"1px solid rgba(124,58,237,0.35)" }}>
        <span style={{ fontSize:8.5, color:"#6d28d9", letterSpacing:1 }}>$CANVAS EARNED</span>
        <span style={{ fontSize:12, color:"#a855f7", fontWeight:"bold" }}>+{earned.toLocaleString()}</span>
      </div>
      {lastMsg && (
        <div key={lastMsg.key} style={{ position:"absolute", top:"40%", left:"50%",
          transform:"translate(-50%,-50%)", background:"rgba(124,58,237,0.9)", borderRadius:6,
          padding:"5px 12px", whiteSpace:"nowrap", fontSize:10, color:"#fff", fontWeight:"bold",
          pointerEvents:"none" }}>
          {lastMsg.txt}
        </div>
      )}
    </div>
  );
}

const STEPS = [
  { emoji:"🎮", label:"Pay SOL, claim pixels",  desc:"Choose your bet: 0.01 / 0.1 / 1 SOL for 1 / 10 / 100 pixels. Paint anywhere on the 1,000×1,000 grid. No cooldowns. No waiting." },
  { emoji:"💰", label:"Earn $CANVAS + SOL",     desc:"5 $CANVAS per pixel + 0.5/hr hold reward per pixel you own. Every bet also rolls a provably-fair SOL prize (up to 10×) and a $CANVAS strike up to 200×." },
  { emoji:"🏛️", label:"Crack The Vault",        desc:"Every bet has a 0.5% chance to win 10% of The Vault — a jackpot that starts at 9.2M $CANVAS and grows every second from ecosystem activity." },
  { emoji:"💎", label:"Become a Holdr",         desc:"Hold 10,000+ $CANVAS to earn a share of every withdrawal tax in the game — passive income from all players, forever." },
];

const TOKENOMICS = [
  { label:"Gameplay Emissions", pct:75, color:"#a855f7", sub:"7.5B - placement rewards, hold rewards, strikes" },
  { label:"Raydium LP (burned)", pct:15, color:"#22d3ee", sub:"1.5B - paired with SOL, LP tokens burned" },
  { label:"DAO Reserve",        pct:10, color:"#f59e0b", sub:"1B - community events, prizes, bounties" },
];

export default function Home() {
  const [count, setCount] = useState(1247903);
  useEffect(() => {
    const t = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3 + 1)), 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background:"#0a0a0f", color:"#e2e8f0", fontFamily:"'Share Tech Mono','Courier New',monospace", minHeight:"100vh" }}>
      {/* NAV */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 32px", borderBottom:"1px solid #1e1e3f", position:"sticky", top:0, zIndex:50, background:"rgba(10,10,15,0.95)", backdropFilter:"blur(12px)" }}>
        <span style={{ color:"#a855f7", fontFamily:"'Press Start 2P',monospace", fontSize:13, letterSpacing:2 }}>CANVAS</span>
        <div style={{ display:"flex", gap:24, alignItems:"center", fontSize:13 }}>
          <a href="#mechanics" style={{ color:"#94a3b8", textDecoration:"none" }}>Mechanics</a>
          <a href="#tokenomics" style={{ color:"#94a3b8", textDecoration:"none" }}>Tokenomics</a>
          <Link href="/play" style={{ padding:"8px 20px", background:"#7c3aed", color:"#fff", borderRadius:6, textDecoration:"none", fontWeight:"bold", fontSize:13 }}>
            Play Demo
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ display:"flex", alignItems:"center", justifyContent:"space-between", maxWidth:1100, margin:"0 auto", padding:"80px 32px", gap:48 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:"#22d3ee", marginBottom:12, letterSpacing:3, textTransform:"uppercase" }}>
            Fair Launch  /  Solana  /  10B $CANVAS
          </div>
          <h1 style={{ fontFamily:"'Press Start 2P',monospace", fontSize:"clamp(32px,5vw,60px)", color:"#a855f7", margin:"0 0 16px", lineHeight:1.3 }}>
            CANVAS
          </h1>
          <p style={{ fontSize:18, color:"#cbd5e1", marginBottom:8, maxWidth:480, lineHeight:1.6 }}>
            A <span style={{ color:"#a855f7" }}>pixel war game</span> on Solana.<br />
            Claim territory. Earn tokens. Survive the chaos.
          </p>
          <p style={{ fontSize:14, color:"#94a3b8", marginBottom:32, maxWidth:420, lineHeight:1.7 }}>
            1,000 × 1,000 grid. Real-time PVP. Every pixel has a price.
          </p>
          <div style={{ display:"flex", gap:12 }}>
            <Link href="/play" style={{
              padding:"14px 28px", background:"linear-gradient(135deg,#7c3aed,#a855f7)",
              color:"#fff", borderRadius:8, textDecoration:"none", fontWeight:"bold", fontSize:14,
              boxShadow:"0 0 24px rgba(168,85,247,0.45)"
            }}>Try the Demo</Link>
            <a href="#mechanics" style={{
              padding:"14px 28px", border:"1px solid #4c1d95",
              color:"#a855f7", borderRadius:8, textDecoration:"none", fontSize:14
            }}>How it works</a>
          </div>
          <div style={{ marginTop:24, fontSize:12, color:"#475569", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:8, height:8, background:"#22c55e", borderRadius:"50%", display:"inline-block", animation:"pulse 2s infinite" }} />
            <span style={{ color:"#22c55e" }}>{count.toLocaleString()}</span> pixels placed in demo
          </div>
        </div>
        <div style={{ flexShrink:0, position:"relative" }}>
          <div style={{ position:"absolute", inset:-32, background:"radial-gradient(circle,rgba(124,58,237,0.2),transparent 70%)", borderRadius:"50%" }} />
          <MiniCanvas />
        </div>
      </section>

      {/* CORE LOOP */}
      <section id="mechanics" style={{ maxWidth:1100, margin:"0 auto", padding:"60px 32px" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:11, color:"#a855f7", letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>Core Loop</div>
          <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize:18 }}>How it works</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
          {STEPS.map((s,i) => (
            <div key={i} style={{ padding:24, background:"#12121a", border:"1px solid #1e1e3f", borderRadius:12 }}>
              <div style={{ fontSize:28, marginBottom:12 }}>{s.emoji}</div>
              <div style={{ color:"#c084fc", fontWeight:"bold", marginBottom:8, fontSize:13 }}>{i+1}. {s.label}</div>
              <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STRIKES */}
      <section style={{ maxWidth:1100, margin:"0 auto", padding:"0 32px 60px" }}>
        <div style={{ background:"#0d1117", border:"1px solid #0e3a4f", borderRadius:16, padding:32 }}>
          <div style={{ fontSize:11, color:"#22d3ee", letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>Bonus Strikes</div>
          <p style={{ color:"#94a3b8", marginBottom:24, fontSize:13 }}>Every bet triggers a provably-fair $CANVAS strike roll on Pyth Entropy — on top of your SOL prize roll.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {[
              { tier:"Common",   chance:"5%",   mult:"5x",  color:"#64748b", glow:"rgba(100,116,139,0.3)" },
              { tier:"Rare",     chance:"1%",   mult:"25x", color:"#22d3ee", glow:"rgba(34,211,238,0.3)" },
              { tier:"Legendary",chance:"0.1%", mult:"200x",color:"#f59e0b", glow:"rgba(245,158,11,0.5)" },
            ].map(t => (
              <div key={t.tier} style={{ padding:20, borderRadius:12, textAlign:"center",
                border:`1px solid ${t.color}50`, boxShadow:`0 0 16px ${t.glow}` }}>
                <div style={{ fontSize:11, color:t.color, marginBottom:4 }}>{t.tier}</div>
                <div style={{ fontSize:32, fontWeight:"black", color:t.color }}>{t.mult}</div>
                <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>{t.chance} chance</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:11, color:"#475569", marginTop:16 }}>
            Expected multiplier across all placements: ~1.64x - on-chain verifiable, no admin key.
          </p>
        </div>
      </section>

      {/* TOKENOMICS */}
      <section id="tokenomics" style={{ maxWidth:1100, margin:"0 auto", padding:"0 32px 60px" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:11, color:"#a855f7", letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>Tokenomics</div>
          <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize:18 }}>$CANVAS - 10B Supply</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:16 }}>
          {TOKENOMICS.map(t => (
            <div key={t.label} style={{ padding:24, background:"#12121a", border:`1px solid ${t.color}30`, borderRadius:12 }}>
              <div style={{ fontSize:36, fontWeight:"black", color:t.color, marginBottom:4 }}>{t.pct}%</div>
              <div style={{ fontWeight:"bold", fontSize:13, color:t.color, marginBottom:6 }}>{t.label}</div>
              <p style={{ fontSize:13, color:"#94a3b8" }}>{t.sub}</p>
            </div>
          ))}
        </div>
        <div style={{ width:"100%", height:12, borderRadius:8, overflow:"hidden", display:"flex" }}>
          {TOKENOMICS.map(t => <div key={t.label} style={{ width:`${t.pct}%`, background:t.color, height:"100%" }} />)}
        </div>
        <div style={{ marginTop:12, fontSize:11, color:"#475569", textAlign:"center" }}>
          Fair launch  /  0% team  /  0% VC  /  LP tokens burned  /  Raydium DEX
        </div>
      </section>

      {/* HOLDR */}
      <section style={{ maxWidth:1100, margin:"0 auto", padding:"0 32px 60px" }}>
        <div style={{ background:"linear-gradient(135deg,#1a0533,#0f172a)", border:"1px solid #4c1d95", borderRadius:16, padding:32, display:"flex", gap:24, alignItems:"flex-start" }}>
          <div style={{ fontSize:40 }}>💎</div>
          <div>
            <h3 style={{ color:"#c084fc", fontWeight:"bold", fontSize:18, marginBottom:8 }}>Holdr Class</h3>
            <p style={{ color:"#cbd5e1", fontSize:13, lineHeight:1.7, marginBottom:16, maxWidth:600 }}>
              Hold 10,000+ $CANVAS in your in-game balance to qualify. Every time anyone withdraws,
              10% is taxed and redistributed to Holdrs, weighted by how much above 10K you hold.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {[
                { label:"Own 100 pixels (hold rewards)", val:"~8 days to Holdr" },
                { label:"Own 50 pixels (hold rewards)",  val:"~17 days to Holdr" },
                { label:"Withdrawal tax",                val:"10% to Holdrs" },
              ].map(r => (
                <div key={r.label} style={{ padding:"10px 14px", background:"rgba(124,58,237,0.1)", borderRadius:8 }}>
                  <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>{r.label}</div>
                  <div style={{ fontSize:12, color:"#c084fc", fontWeight:"bold" }}>{r.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign:"center", padding:"60px 32px 80px" }}>
        <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize:"clamp(18px,3vw,28px)", marginBottom:16 }}>
          Ready to claim your territory?
        </div>
        <p style={{ color:"#94a3b8", fontSize:14, marginBottom:28 }}>The demo runs in your browser - no wallet needed.</p>
        <Link href="/play" style={{
          display:"inline-block", padding:"16px 48px", fontFamily:"'Press Start 2P',monospace", fontSize:12,
          background:"linear-gradient(135deg,#7c3aed,#a855f7)", color:"#fff", borderRadius:10,
          textDecoration:"none", boxShadow:"0 0 48px rgba(168,85,247,0.55)"
        }}>PLAY NOW</Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid #1e1e3f", padding:"24px 32px", textAlign:"center", fontSize:11, color:"#475569" }}>
        <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:10 }}>CANVAS</span>
        {" "} Built on Solana  /  Fair launch  /  Demo only - not financial advice
      </footer>
    </div>
  );
}
