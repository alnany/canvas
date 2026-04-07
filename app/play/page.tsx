'use client';
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const GRID = 100;
const PX   = 10;
const COOLDOWN_SEC = 10;
const BASE_EARN = 5;
const HOLD_REWARD_RATE = 0.5 / 3600;

const PALETTE = [
  "#ef4444","#f97316","#f59e0b","#84cc16",
  "#22c55e","#06b6d4","#3b82f6","#6366f1",
  "#8b5cf6","#ec4899","#f43f5e","#ffffff",
  "#e2e8f0","#94a3b8","#475569","#1e293b",
];

type StrikeTier = "none"|"common"|"rare"|"legendary";
interface PxData { color: string; owner: string; }

function rollStrike(): StrikeTier {
  const r = Math.random();
  if (r < 0.001) return "legendary";
  if (r < 0.01)  return "rare";
  if (r < 0.05)  return "common";
  return "none";
}
function strikeBonus(t: StrikeTier) { return t==="legendary"?200:t==="rare"?25:t==="common"?5:1; }
function strikeStyle(t: StrikeTier): {bg:string;border:string;text:string;shadow:string} {
  if (t==="legendary") return {bg:"#1c0f00",border:"#f59e0b",text:"#fbbf24",shadow:"rgba(245,158,11,0.8)"};
  if (t==="rare")      return {bg:"#0c1a2e",border:"#22d3ee",text:"#67e8f9",shadow:"rgba(34,211,238,0.6)"};
  return                      {bg:"#12121a",border:"#64748b",text:"#94a3b8",shadow:"rgba(100,116,139,0.4)"};
}

const BOTS = ["0x7a3…b9f","0xaf1…c32","0x99d…441","0xb82…71a","0x55e…f90","0xcc4…d18"];
const rndOwner = () => BOTS[Math.floor(Math.random()*BOTS.length)];
const WALLET = "YOU (Demo_7f4…a9c)";

// ─── Pixel Art Seeding ────────────────────────────────────────────────────────

function px(g: (PxData|null)[], x: number, y: number, color: string, owner = "art") {
  if (x >= 0 && x < GRID && y >= 0 && y < GRID)
    g[y * GRID + x] = { color, owner };
}

function fillRect(g: (PxData|null)[], x: number, y: number, w: number, h: number, color: string) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      px(g, x + dx, y + dy, color);
}

function drawPattern(
  g: (PxData|null)[],
  ox: number, oy: number,
  rows: string[],
  palette: Record<string, string>
) {
  rows.forEach((row, dy) =>
    [...row].forEach((ch, dx) => {
      const c = palette[ch];
      if (c) px(g, ox + dx, oy + dy, c);
    })
  );
}

function seedCanvas(g: (PxData|null)[]) {
  // ── Faction territory backgrounds ─────────────────────────────────────────
  fillRect(g,  0,  0, 37, 46, "#1e3a5f"); // navy – top-left
  fillRect(g, 37,  0, 26, 46, "#180b35"); // dark purple – top-center
  fillRect(g, 63,  0, 37, 46, "#7f1d1d"); // crimson – top-right
  fillRect(g,  0, 48, 37, 32, "#14532d"); // forest green – mid-left
  fillRect(g, 37, 48, 26, 32, "#042f2e"); // deep teal – mid-center
  fillRect(g, 63, 48, 37, 32, "#0c4a6e"); // ocean blue – mid-right
  fillRect(g,  0, 82, 37, 18, "#f0f0f0"); // white – bottom-left (flag)
  fillRect(g, 37, 82, 26, 18, "#92400e"); // amber – bottom-center (text bg)
  fillRect(g, 63, 82, 37, 18, "#3b0764"); // deep purple – bottom-right

  // ── Rainbow separator band y:46–47 ────────────────────────────────────────
  const rainbows = ["#ef4444","#f97316","#f59e0b","#84cc16","#22c55e","#06b6d4","#3b82f6","#8b5cf6"];
  for (let x = 0; x < GRID; x++) {
    const ci = Math.min(Math.floor(x / (GRID / rainbows.length)), rainbows.length - 1);
    px(g, x, 46, rainbows[ci]);
    px(g, x, 47, rainbows[ci]);
  }

  // ── Large heart – center top (x:38, y:8) ──────────────────────────────────
  drawPattern(g, 38, 8, [
    ".RRR.RRR.",
    "RRRRRRRRR",
    "RRRRRRRRR",
    "RRRRRRRRR",
    ".RRRRRRR.",
    "..RRRRR..",
    "...RRR...",
    "....R....",
  ], { R: "#ef4444" });
  // Highlight
  drawPattern(g, 38, 8, [
    ".PPP.PPP.",
    "PPPPP.PPP",
    "PP.......",
  ], { P: "#fca5a5" });

  // ── Smiley face – navy zone (x:3, y:5) ────────────────────────────────────
  drawPattern(g, 3, 5, [
    "...YYYYY...",
    "..YYYYYYY..",
    ".YYYYYYYYY.",
    "YYYYYYYYYYY",
    "YYYYYYYYYYY",
    "YYYYYYYYYYY",
    "YYYYYYYYYYY",
    "YYYYYYYYYYY",
    "YYYYYYYYYYY",
    ".YYYYYYYYY.",
    "..YYYYYYY..",
    "...YYYYY...",
  ], { Y: "#f59e0b" });
  // Eyes
  drawPattern(g, 3, 5, [
    "...........",
    "...........",
    "...........",
    "..BB..BB...",
    "..BB..BB...",
    "...........",
    "...........",
    ".B.......B.",
    ".BB.....BB.",
    "...........",
    "...........",
    "...........",
  ], { B: "#1e293b" });

  // ── "PLACE" text – navy zone (x:2, y:21) ──────────────────────────────────
  const letterP = ["WW.","W.W","WW.","W..","W.."];
  const letterL = ["W..","W..","W..","W..","WWW"];
  const letterA = [".W.","W.W","WWW","W.W","W.W"];
  const letterC = [".WW","W..","W..","W..","..W",".WW"]; // unused but kept
  const letterE = ["WWW","W..","WW.","W..","WWW"];
  [letterP, letterL, letterA, letterC, letterE].forEach((ltr, i) => {
    drawPattern(g, 2 + i * 4, 21, ltr.slice(0,5), { W: "#ffffff" });
  });

  // ── Sun with rays – navy zone (x:27, y:5) ─────────────────────────────────
  // Rays
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    for (let r = 4; r <= 6; r++) {
      const rx = Math.round(Math.cos(angle) * r);
      const ry = Math.round(Math.sin(angle) * r);
      px(g, 31 + rx, 9 + ry, "#fbbf24");
    }
  }
  // Sun disk
  for (let dy = -3; dy <= 3; dy++)
    for (let dx = -3; dx <= 3; dx++)
      if (dx * dx + dy * dy <= 10) px(g, 31 + dx, 9 + dy, "#fef08a");

  // ── Among Us crewmate – crimson zone (x:67, y:3) ──────────────────────────
  drawPattern(g, 67, 3, [
    ".RRRRRR.",
    "RRRRRRRRR",
    "RBBBBBBBR",
    "RBWBBBBBR",
    "RBBBBBBBR",
    "RRRRRRRRR",
    "RRRRRRRRR",
    ".RR..RRR.",
    ".RR..RRR.",
    ".RRRRRR..",
  ], { R: "#ef4444", B: "#93c5fd", W: "#dbeafe" });
  // Backpack
  fillRect(g, 76, 6, 3, 4, "#dc2626");

  // ── Troll face – crimson zone (x:65, y:16) ────────────────────────────────
  drawPattern(g, 66, 17, [
    "..WWWWWWWWW..",
    ".WWWWWWWWWWW.",
    "WWWWWWWWWWWWW",
    "WW.WW.WW.WWWW",
    "WWWWWWWWWWWWW",
    "WWWWWWWWWWWWW",
    "W.WWWWWWWWW.W",
    "WW.........WW",
    "WWWWWWWWWWWWW",
    ".WWWWWWWWWWW.",
    "..WWWWWWWWW..",
  ], { W: "#fde68a" });
  // Eyes (dots)
  px(g, 69, 20, "#1e293b"); px(g, 70, 20, "#1e293b");
  px(g, 74, 20, "#1e293b"); px(g, 75, 20, "#1e293b");
  // Smile
  px(g, 68, 25, "#1e293b"); px(g, 77, 25, "#1e293b");
  for (let x = 69; x <= 76; x++) px(g, x, 26, "#1e293b");

  // ── Pixel trees – forest zone (x:2, y:52) ─────────────────────────────────
  // Tree 1
  drawPattern(g, 2, 52, [
    "....G....",
    "...GGG...",
    "..GGGGG..",
    ".GGGGGGG.",
    "GGGGGGGGG",
    "..GGGGG..",
    "....T....",
    "....T....",
    "....T....",
  ], { G: "#22c55e", T: "#a16207" });
  // Tree 2
  drawPattern(g, 15, 54, [
    "...G...",
    "..GGG..",
    ".GGGGG.",
    "GGGGGGG",
    "...T...",
    "...T...",
    "...T...",
  ], { G: "#16a34a", T: "#78350f" });
  // Tree 3 (darker)
  drawPattern(g, 25, 56, [
    "..D..",
    ".DDD.",
    "DDDDD",
    "..T..",
    "..T..",
  ], { D: "#15803d", T: "#7c2d12" });
  // Mushroom
  drawPattern(g, 8, 64, [
    ".RRR.",
    "RRRRR",
    "R.R.R",
    "WWWWW",
    ".WWW.",
  ], { R: "#ef4444", W: "#f8fafc" });
  // Star
  drawPattern(g, 28, 63, [
    "..S..",
    ".SSS.",
    "SSSSS",
    ".SSS.",
    "..S..",
  ], { S: "#fef08a" });

  // ── Rocket – teal zone (x:42, y:52) ───────────────────────────────────────
  drawPattern(g, 43, 52, [
    "..W..",
    ".WBW.",
    "WWWWW",
    "RWWWR",
    "RWWWR",
    "RRRRR",
    ".RRR.",
    "Y.R.Y",
  ], { W: "#e2e8f0", R: "#3b82f6", Y: "#f97316", B: "#dbeafe" });

  // ── r/CANVAS text – amber zone (x:38, y:84) ───────────────────────────────
  // r
  drawPattern(g, 38, 84, [".W.","WW.","W..","W..","W.."], { W: "#fff7ed" });
  // /
  drawPattern(g, 42, 84, ["..W",".W.",".W.","W..","W.."], { W: "#fde68a" });
  // C
  drawPattern(g, 46, 84, [".WW","W..","W..","W..",".WW"], { W: "#f59e0b" });
  // A
  drawPattern(g, 50, 84, [".W.","W.W","WWW","W.W","W.W"], { W: "#f59e0b" });
  // N
  drawPattern(g, 54, 84, ["W.W","WWW","WWW","W.W","W.W"], { W: "#f59e0b" });
  // V
  drawPattern(g, 58, 84, ["W.W","W.W","W.W",".W.",".W."], { W: "#f59e0b" });
  // A
  drawPattern(g, 62, 84, [".W.","W.W","WWW","W.W","W.W"], { W: "#f59e0b" });
  // S
  drawPattern(g, 66, 84, ["WW.","W..",".W.","..W",".WW"], { W: "#f59e0b" });

  // ── Japan flag – white zone (x:1, y:84) ───────────────────────────────────
  const jcx = 18, jcy = 91;
  for (let dy = -5; dy <= 5; dy++)
    for (let dx = -5; dx <= 5; dx++)
      if (dx * dx + dy * dy <= 26) px(g, jcx + dx, jcy + dy, "#ef4444");

  // ── Ocean waves + fish – ocean zone ────────────────────────────────────────
  // Wave line
  for (let x = 63; x < 100; x++) {
    const wy = 50 + Math.round(Math.sin((x - 63) * 0.55) * 2);
    px(g, x, wy, "#7dd3fc");
    px(g, x, wy + 1, "#38bdf8");
  }
  // Fish 1
  drawPattern(g, 67, 55, [
    "..FF.",
    "FFFFT",
    "FFFFF",
    "FFFFT",
    "..FF.",
  ], { F: "#f97316", T: "#fdba74" });
  // Fish 2
  drawPattern(g, 83, 62, [
    ".FF..",
    "TFFFF",
    "FFFFF",
    "TFFFF",
    ".FF..",
  ], { F: "#06b6d4", T: "#67e8f9" });
  // Fish 3 small
  drawPattern(g, 74, 69, [
    ".F.",
    "FFF",
    ".F.",
  ], { F: "#22c55e" });
  // Bubbles
  px(g, 72, 53, "#bfdbfe"); px(g, 73, 52, "#bfdbfe");
  px(g, 88, 60, "#bfdbfe"); px(g, 89, 59, "#bfdbfe");
  px(g, 78, 67, "#bfdbfe");

  // ── Checkered pattern – purple zone (x:63, y:82) ──────────────────────────
  for (let dy = 0; dy < 18; dy++)
    for (let dx = 0; dx < 37; dx++)
      px(g, 63 + dx, 82 + dy, (dx + dy) % 2 === 0 ? "#a855f7" : "#6d28d9");

  // ── "VOID" logo – purple zone (x:70, y:85) ────────────────────────────────
  // V
  drawPattern(g, 70, 85, ["W.W","W.W","W.W",".W.",".W."], { W: "#f8fafc" });
  // O
  drawPattern(g, 74, 85, [".W.","W.W","W.W","W.W",".W."], { W: "#f8fafc" });
  // I
  drawPattern(g, 78, 85, ["W","W","W","W","W"], { W: "#f8fafc" });
  // D
  drawPattern(g, 80, 85, ["WW.","W.W","W.W","W.W","WW."], { W: "#f8fafc" });

  // ── Scattered filler pixels (organic texture) ─────────────────────────────
  // Tiny pixel clusters to add r/place organic feel
  const scatterColors = [
    { cx: 5,  cy: 37, color: "#3b82f6" },
    { cx: 12, cy: 40, color: "#22c55e" },
    { cx: 20, cy: 38, color: "#f59e0b" },
    { cx: 30, cy: 42, color: "#ec4899" },
    { cx: 55, cy: 28, color: "#8b5cf6" },
    { cx: 55, cy: 35, color: "#06b6d4" },
    { cx: 55, cy: 42, color: "#84cc16" },
    { cx: 80, cy: 30, color: "#fbbf24" },
    { cx: 90, cy: 35, color: "#a3e635" },
  ];
  scatterColors.forEach(({ cx, cy, color }) => {
    for (let i = 0; i < 6; i++) {
      const ox = Math.round(Math.cos(i) * 2);
      const oy = Math.round(Math.sin(i) * 2);
      px(g, cx + ox, cy + oy, color, "scatter_art");
    }
  });
}

export default function Play() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const gridRef     = useRef<(PxData|null)[]>(Array(GRID*GRID).fill(null));
  const ownedRef    = useRef(0);

  const [color,     setColor]     = useState(PALETTE[6]);
  const [balance,   setBalance]   = useState(0);
  const [cooldown,  setCooldown]  = useState(0);
  const [shield,    setShield]    = useState(false);
  const [shieldT,   setShieldT]   = useState(0);
  const [owned,     setOwned]     = useState(0);
  const [placed,    setPlaced]    = useState(0);
  const [strike,    setStrike]    = useState<{tier:StrikeTier;earn:number}|null>(null);
  const [hovered,   setHovered]   = useState<{x:number;y:number;d:PxData|null}|null>(null);
  const [log,       setLog]       = useState<string[]>(["[CANVAS] Click any pixel to place."]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isMobile,  setIsMobile]  = useState(false);
  const [mobileTab, setMobileTab] = useState<'color'|'game'|'stats'|'log'>('color');

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current; if(!c) return;
    const ctx = c.getContext("2d")!;
    for (let i=0; i<GRID*GRID; i++) {
      const x=(i%GRID)*PX, y=Math.floor(i/GRID)*PX;
      const p = gridRef.current[i];
      ctx.fillStyle = p ? p.color : "#0f0f1e";
      ctx.fillRect(x,y,PX,PX);
      if (!p) {
        ctx.strokeStyle="#1a1a30";
        ctx.lineWidth=0.5;
        ctx.strokeRect(x+.5,y+.5,PX-1,PX-1);
      }
      if (p?.owner === WALLET) {
        ctx.strokeStyle="rgba(168,85,247,0.6)";
        ctx.lineWidth=1;
        ctx.strokeRect(x+.5,y+.5,PX-1,PX-1);
      }
    }
  },[]);

  // Seed canvas with preset artwork
  useEffect(() => {
    const g = gridRef.current;
    seedCanvas(g);
    draw();
  },[draw]);

  // Timer: cooldown + shield + hold rewards
  useEffect(() => {
    const t = setInterval(() => {
      setCooldown(c => Math.max(0,c-1));
      setShieldT(s => {
        if (s <= 1) { setShield(false); return 0; }
        return s-1;
      });
      setBalance(b => b + ownedRef.current * HOLD_REWARD_RATE);
    }, 1000);
    return () => clearInterval(t);
  },[]);

  // Bot activity
  useEffect(() => {
    const t = setInterval(() => {
      const g = gridRef.current;
      const idx = Math.floor(Math.random()*GRID*GRID);
      const cell = g[idx];
      if (cell?.owner === WALLET) return;
      const newOwner = rndOwner();
      const newColor = PALETTE[Math.floor(Math.random()*PALETTE.length)];
      g[idx] = { color:newColor, owner:newOwner };
      const c = canvasRef.current; if(!c) return;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = newColor;
      ctx.fillRect((idx%GRID)*PX, Math.floor(idx/GRID)*PX, PX, PX);
    }, 300);
    return () => clearInterval(t);
  },[]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (cooldown > 0) return;
    const rect2 = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const gx = Math.floor((e.clientX-rect2.left)/PX);
    const gy = Math.floor((e.clientY-rect2.top)/PX);
    if (gx<0||gy<0||gx>=GRID||gy>=GRID) return;
    const idx = gy*GRID+gx;
    const g = gridRef.current;
    const prev = g[idx];
    const wasOwn = prev?.owner===WALLET;
    g[idx] = {color, owner:WALLET};

    const c = canvasRef.current; if(!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(gx*PX, gy*PX, PX, PX);
    ctx.strokeStyle="rgba(168,85,247,0.6)";
    ctx.lineWidth=1;
    ctx.strokeRect(gx*PX+.5, gy*PX+.5, PX-1, PX-1);

    if (!wasOwn) {
      setOwned(o => { ownedRef.current = o+1; return o+1; });
    }
    setPlaced(p => p+1);
    setCooldown(COOLDOWN_SEC);

    const tier = rollStrike();
    const earn = BASE_EARN * strikeBonus(tier);
    setBalance(b => b+earn);
    if (tier !== "none") {
      setStrike({tier, earn});
      setTimeout(() => setStrike(null), 3000);
    }
    const msg = tier !== "none"
      ? `[STRIKE] ${tier.toUpperCase()}! +${earn} $CANVAS @ (${gx},${gy})`
      : `[PLACE] (${gx},${gy}) → +${BASE_EARN} $CANVAS`;
    setLog(l => [msg, ...l.slice(0,11)]);
  },[cooldown, color]);

  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect2 = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const gx = Math.floor((e.clientX-rect2.left)/PX);
    const gy = Math.floor((e.clientY-rect2.top)/PX);
    if (gx<0||gy<0||gx>=GRID||gy>=GRID) { setHovered(null); return; }
    setHovered({x:gx, y:gy, d:gridRef.current[gy*GRID+gx]});
  },[]);

  const shieldCost = 3*owned;
  const canShield = balance>=shieldCost && owned>0 && !shield;

  const activateShield = () => {
    if (!canShield) return;
    setBalance(b => b-shieldCost);
    setShield(true);
    setShieldT(30);
    setLog(l => [`[SHIELD] Active 30s · Cost: ${shieldCost.toFixed(0)} $CANVAS`, ...l.slice(0,11)]);
  };

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setWalletConnected(true);
      setLog(l => ["[WALLET] Demo_7f4…a9c connected · 0 SOL", ...l.slice(0,11)]);
    }, 1200);
  };

  const isHoldr = owned * 12 >= 10000;
  const holdrProgress = Math.min(100, (owned * 12 / 10000) * 100);

  return (
    <div style={{background:"#070710",height:"100vh",overflow:"hidden",color:"#e2e8f0",fontFamily:"'Share Tech Mono','Courier New',monospace",overflow:"hidden"}}>
      {/* Top bar */}
      <div style={{borderBottom:"1px solid #1e1e3f",padding:"9px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(7,7,16,0.95)",backdropFilter:"blur(8px)"}}>
        <Link href="/" style={{color:"#a855f7",fontFamily:"'Press Start 2P',monospace",fontSize:11,textDecoration:"none",letterSpacing:2}}>← CANVAS</Link>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:10,color:"#334155",background:"#0f0f1a",padding:"4px 12px",borderRadius:4,border:"1px solid #1e1e3f"}}>
            100×100 demo · 10s cooldown (real: 5 min) · no wallet needed
          </div>
          {walletConnected ? (
            <div style={{fontSize:10,display:"flex",alignItems:"center",gap:6,background:"#0f1a0f",border:"1px solid #166534",borderRadius:6,padding:"5px 12px"}}>
              <div style={{width:6,height:6,background:"#22c55e",borderRadius:"50%"}} />
              <span style={{color:"#22c55e"}}>Demo_7f4…a9c</span>
            </div>
          ) : (
            <button onClick={handleConnect} disabled={connecting} style={{
              fontSize:10,padding:"6px 14px",borderRadius:6,fontFamily:"inherit",cursor:"pointer",
              background:connecting?"#1a1a2e":"linear-gradient(135deg,#7c3aed,#a855f7)",
              color:"#fff",border:"none",
            }}>
              {connecting ? "Connecting…" : "🔗 Connect Wallet"}
            </button>
          )}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"calc(100vh - 46px)",overflow:"hidden"}}>
        {/* LEFT PANEL */}
        <div style={{width:188,borderRight:"1px solid #1e1e3f",padding:12,display:isMobile?"none":"flex",flexDirection:"column",gap:10,flexShrink:0,overflowY:"auto",background:"#070710"}}>
          {/* Balance */}
          <div style={{background:"#0d0d1a",border:"1px solid #2d1b69",borderRadius:8,padding:12}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:4,letterSpacing:1}}>$CANVAS BALANCE</div>
            <div style={{fontSize:26,fontWeight:"bold",color:"#a855f7",lineHeight:1}}>{Math.floor(balance).toLocaleString()}</div>
            {owned > 0 && (
              <div style={{fontSize:9,color:"#6d28d9",marginTop:3}}>
                +{(owned*HOLD_REWARD_RATE*60).toFixed(3)}/min hold
              </div>
            )}
          </div>

          {/* Cooldown */}
          <div style={{background:"#0d0d1a",border:`1px solid ${cooldown>0?"#7c3aed":"#166534"}`,borderRadius:8,padding:12}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:6,letterSpacing:1}}>COOLDOWN</div>
            {cooldown > 0 ? (
              <>
                <div style={{fontSize:22,fontWeight:"bold",color:"#f59e0b"}}>{cooldown}s</div>
                <div style={{marginTop:6,height:3,background:"#1e1e2e",borderRadius:2}}>
                  <div style={{height:"100%",background:"#7c3aed",width:`${(cooldown/COOLDOWN_SEC)*100}%`,transition:"width 1s linear",borderRadius:2}}/>
                </div>
              </>
            ) : (
              <div style={{fontSize:13,fontWeight:"bold",color:"#22c55e"}}>✓ READY</div>
            )}
          </div>

          {/* Stats */}
          <div style={{background:"#0d0d1a",border:"1px solid #1e1e3f",borderRadius:8,padding:12,fontSize:11}}>
            <div style={{color:"#64748b",marginBottom:8,fontSize:9,letterSpacing:1}}>YOUR STATS</div>
            {([
              ["Pixels owned", owned],
              ["Total placed", placed],
            ] as [string,number][]).map(([k,v]) => (
              <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:"#475569"}}>{k}</span>
                <span style={{color:"#22d3ee"}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:9,color:"#475569"}}>Holdr status</span>
                <span style={{fontSize:9,color:isHoldr?"#a855f7":"#334155"}}>{isHoldr?"✓ HOLDR":`${Math.floor(holdrProgress)}%`}</span>
              </div>
              <div style={{height:3,background:"#1e1e2e",borderRadius:2}}>
                <div style={{height:"100%",background:isHoldr?"#a855f7":"#4c1d95",width:`${holdrProgress}%`,borderRadius:2,transition:"width 0.3s"}}/>
              </div>
              {!isHoldr && (
                <div style={{fontSize:8,color:"#334155",marginTop:3}}>need {(10000-Math.floor(owned*12)).toLocaleString()} more $C</div>
              )}
            </div>
          </div>

          {/* Shield */}
          <div style={{background:"#0d0d1a",border:`1px solid ${shield?"#f59e0b":"#1e1e3f"}`,borderRadius:8,padding:12}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:8,letterSpacing:1}}>PIXEL SHIELD</div>
            {shield ? (
              <div>
                <div style={{color:"#f59e0b",fontSize:13,fontWeight:"bold"}}>🛡️ ACTIVE</div>
                <div style={{fontSize:9,color:"#92400e",marginTop:2}}>{shieldT}s remaining</div>
                <div style={{marginTop:6,height:3,background:"#1e1e2e",borderRadius:2}}>
                  <div style={{height:"100%",background:"#f59e0b",width:`${(shieldT/30)*100}%`,transition:"width 1s linear",borderRadius:2}}/>
                </div>
              </div>
            ) : (
              <>
                <div style={{fontSize:10,color:"#475569",marginBottom:8,lineHeight:1.6}}>
                  Cost: <span style={{color:"#a855f7"}}>{shieldCost} $CANVAS</span><br/>
                  <span style={{fontSize:8,color:"#334155"}}>3 × {owned} pixels · 8h real / 30s demo</span>
                </div>
                <button onClick={activateShield} disabled={!canShield} style={{
                  width:"100%",padding:"7px 0",borderRadius:6,fontSize:9,fontWeight:"bold",fontFamily:"inherit",
                  background:canShield?"linear-gradient(135deg,#7c3aed,#a855f7)":"#12121a",
                  color:canShield?"#fff":"#334155",border:"none",cursor:canShield?"pointer":"default",
                }}>
                  {owned===0?"Place pixels first":balance<shieldCost?`Need ${(shieldCost-balance).toFixed(0)} more`:"Activate Shield"}
                </button>
              </>
            )}
          </div>

          {/* Withdraw info */}
          <div style={{background:"#0a0a12",border:"1px solid #1a1a30",borderRadius:8,padding:10,fontSize:9,color:"#334155",lineHeight:1.8}}>
            <div style={{color:"#475569",marginBottom:2,letterSpacing:1,fontSize:8}}>WITHDRAW</div>
            Withdraw anytime to wallet.<br/>
            10% tax → <span style={{color:"#6d28d9"}}>Holdr pool</span><br/>
            Holdrs earn passively from<br/>all ecosystem withdrawals.
          </div>
        </div>

        {/* MOBILE CONTROLS STRIP */}
        {isMobile && (
          <div style={{flexShrink:0,borderBottom:"1px solid #1e1e3f",padding:"8px 10px",background:"#070710",display:"flex",gap:8,alignItems:"center"}}>
            {/* Color swatch */}
            <div style={{width:32,height:32,borderRadius:6,background:color,border:"2px solid #4c1d95",flexShrink:0,boxShadow:"0 0 8px rgba(168,85,247,0.4)"}}
              onClick={() => (document.getElementById('m-color-pick') as HTMLInputElement)?.click()}/>
            <input id="m-color-pick" type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{position:"absolute",opacity:0,pointerEvents:"none"}}/>
            {/* Cooldown / balance */}
            <div style={{flex:1,lineHeight:1.6}}>
              <div style={{fontSize:10,color:"#a855f7",fontWeight:"bold"}}>{Math.floor(balance).toLocaleString()} $CANVAS</div>
              {cooldown > 0
                ? <div style={{fontSize:10,color:"#f59e0b"}}>⏳ {cooldown}s cooldown</div>
                : <div style={{fontSize:10,color:"#22c55e"}}>✓ Ready to place</div>
              }
            </div>
            {/* Shield button compact */}
            {owned > 0 && (() => {
              const shieldCost = owned * 5;
              const canShield = !shield && !shieldT && balance >= shieldCost;
              return (
                <button onClick={() => {
                  if (!canShield) return;
                  const sc = owned * 5;
                  setBalance(b => b - sc);
                  setShield(true);
                  setShieldT(COOLDOWN_SEC * 3);
                  setLog(l => [`[SHIELD] Active for ${COOLDOWN_SEC*3}s`, ...l.slice(0,11)]);
                }} style={{
                  padding:"5px 8px",borderRadius:5,fontSize:9,fontFamily:"inherit",cursor:canShield?"pointer":"default",
                  background:shield?"#1a0a2e":canShield?"#2d1b69":"#0a0a14",
                  color:shield?"#a855f7":canShield?"#c4b5fd":"#334155",
                  border:`1px solid ${shield?"#7c3aed":canShield?"#4c1d95":"#1e1e3f"}`,
                  flexShrink:0,
                }}>
                  {shield ? "🛡️ ON" : "🛡️"}
                </button>
              );
            })()}
          </div>
        )}

        {/* CANVAS CENTER */}
        <div style={{flex:1,minHeight:0,display:"flex",alignItems:"flex-start",justifyContent:"flex-start",position:"relative",overflow:"auto",background:"radial-gradient(ellipse at center,#0d0d20,#070710)"}}>

          {/* Strike popup */}
          {strike && (() => {
            const sc = strikeStyle(strike.tier);
            return (
              <div style={{
                position:"absolute",top:"50%",left:"50%",
                transform:"translate(-50%,-60%)",
                zIndex:20,textAlign:"center",pointerEvents:"none",
              }}>
                <style>{`
                  @keyframes strikeIn {
                    0%   { opacity:0; transform:translate(-50%,-80%) scale(0.5); }
                    20%  { opacity:1; transform:translate(-50%,-55%) scale(1.1); }
                    80%  { opacity:1; transform:translate(-50%,-50%) scale(1); }
                    100% { opacity:0; transform:translate(-50%,-40%) scale(0.9); }
                  }
                `}</style>
                <div style={{
                  padding:"18px 36px",borderRadius:14,
                  background:sc.bg,border:`2px solid ${sc.border}`,
                  boxShadow:`0 0 ${strike.tier==="legendary"?"80px":strike.tier==="rare"?"50px":"30px"} ${sc.shadow}`,
                  fontFamily:"'Press Start 2P',monospace",
                  animation:"strikeIn 3s ease-out forwards",
                }}>
                  <div style={{fontSize:9,color:sc.text,marginBottom:6,letterSpacing:2}}>
                    {strike.tier.toUpperCase()} STRIKE
                  </div>
                  <div style={{fontSize:28,color:"#ffffff",fontWeight:"bold"}}>+{strike.earn}</div>
                  <div style={{fontSize:8,color:sc.text,marginTop:4}}>{strikeBonus(strike.tier)}× base · $CANVAS</div>
                </div>
              </div>
            );
          })()}

          <div style={{position:"relative"}}>
            {shield && (
              <div style={{
                position:"absolute",inset:-12,borderRadius:8,
                border:"2px solid #f59e0b",
                boxShadow:"0 0 60px rgba(245,158,11,0.5),inset 0 0 40px rgba(245,158,11,0.04)",
                pointerEvents:"none",zIndex:2,
              }}/>
            )}

            <canvas
              ref={canvasRef}
              width={GRID*PX}
              height={GRID*PX}
              onClick={handleClick}
              onMouseMove={handleMove}
              onMouseLeave={() => setHovered(null)}
              style={{
                cursor: cooldown>0 ? "not-allowed" : "crosshair",
                display:"block",
                border:"1px solid #1e1e3f",
                borderRadius:4,
                boxShadow:"0 0 60px rgba(88,28,235,0.15)",
              }}
            />

            {hovered && (
              <div style={{
                position:"absolute",
                left: Math.min(hovered.x*PX+14, GRID*PX-170),
                top:  Math.max(hovered.y*PX-38, 0),
                background:"#0d0d1a",border:"1px solid #2d1b69",
                borderRadius:6,padding:"5px 10px",
                fontSize:9,whiteSpace:"nowrap",pointerEvents:"none",zIndex:5,
              }}>
                ({hovered.x},{hovered.y}) ·{" "}
                {hovered.d
                  ? `${hovered.d.owner===WALLET?"YOUR PIXEL":hovered.d.owner}`
                  : "empty — click to claim"}
                {hovered.d && (
                  <span style={{
                    marginLeft:6,display:"inline-block",width:8,height:8,
                    background:hovered.d.color,borderRadius:2,verticalAlign:"middle",
                  }}/>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE BOTTOM TABS */}
        {isMobile && (
          <div style={{height:240,flexShrink:0,borderTop:"1px solid #1e1e3f",background:"#070710",display:"flex",flexDirection:"column"}}>
            {/* Tab nav */}
            <div style={{display:"flex",flexShrink:0,borderBottom:"1px solid #1e1e3f"}}>
              {([
                {id:"color", label:"🎨 Color"},
                {id:"game",  label:"⚡ Game"},
                {id:"stats", label:"👥 Stats"},
                {id:"log",   label:"📋 Log"},
              ] as {id:'color'|'game'|'stats'|'log';label:string}[]).map(t => (
                <button key={t.id} onClick={() => setMobileTab(t.id)} style={{
                  flex:1,padding:"7px 2px",fontSize:9,fontFamily:"inherit",
                  background:mobileTab===t.id?"#12121a":"transparent",
                  color:mobileTab===t.id?"#a855f7":"#475569",
                  border:"none",
                  borderBottom:mobileTab===t.id?"2px solid #a855f7":"2px solid transparent",
                  cursor:"pointer",
                }}>{t.label}</button>
              ))}
            </div>
            {/* Tab content */}
            <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>

              {mobileTab === "color" && (
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:4,marginBottom:10}}>
                    {PALETTE.map(c => (
                      <button key={c} onClick={() => setColor(c)} style={{
                        aspectRatio:"1",borderRadius:3,background:c,border:"none",cursor:"pointer",padding:0,
                        outline:color===c?"2px solid #fff":"2px solid transparent",outlineOffset:1,
                      }}/>
                    ))}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,fontSize:10}}>
                    <div style={{width:20,height:20,borderRadius:4,background:color,border:"1px solid #2d1b69",flexShrink:0}}/>
                    <span style={{color:"#475569"}}>{color}</span>
                    <label style={{marginLeft:"auto",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:9,color:"#64748b"}}>Custom</span>
                      <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{width:22,height:22,borderRadius:3,border:"none",cursor:"pointer",padding:0}}/>
                    </label>
                  </div>
                </div>
              )}

              {mobileTab === "game" && (() => {
                const shieldCost = owned * 5;
                const canShield = !shield && !shieldT && balance >= shieldCost;
                return (
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{background:"#0d0d1a",border:"1px solid #1e1e3f",borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:"#64748b",marginBottom:6,letterSpacing:1}}>STATUS</div>
                      <div style={{fontSize:12,color:"#a855f7",fontWeight:"bold",marginBottom:4}}>{Math.floor(balance).toLocaleString()} $CANVAS</div>
                      {owned > 0 && <div style={{fontSize:9,color:"#6d28d9"}}>+{(owned*HOLD_REWARD_RATE*60).toFixed(3)}/min hold</div>}
                      {cooldown > 0
                        ? <div style={{marginTop:6,fontSize:10,color:"#f59e0b"}}>⏳ {cooldown}s cooldown</div>
                        : <div style={{marginTop:6,fontSize:10,color:"#22c55e"}}>✓ Ready to place</div>
                      }
                      <div style={{marginTop:6,fontSize:9,color:"#475569"}}>Pixels owned: <span style={{color:"#22d3ee"}}>{owned}</span> · Placed: <span style={{color:"#22d3ee"}}>{placed}</span></div>
                    </div>
                    {owned > 0 && (
                      <div style={{background:"#0d0d1a",border:"1px solid #1e1e3f",borderRadius:8,padding:"8px 10px"}}>
                        <div style={{fontSize:9,color:"#64748b",marginBottom:6,letterSpacing:1}}>SHIELD</div>
                        <div style={{fontSize:9,color:"#334155",marginBottom:6,lineHeight:1.6}}>
                          Cost: {owned * 5} $CANVAS · Protects for {COOLDOWN_SEC*3}s
                          {isHoldr && " · 50% discount (Holdr)"}
                        </div>
                        <button onClick={() => {
                          if (!canShield) return;
                          setBalance(b => b - shieldCost);
                          setShield(true);
                          setShieldT(COOLDOWN_SEC * 3);
                          setLog(l => [`[SHIELD] Active for ${COOLDOWN_SEC*3}s`, ...l.slice(0,11)]);
                        }} style={{
                          width:"100%",padding:"8px",borderRadius:6,fontSize:10,fontFamily:"inherit",
                          background:shield?"linear-gradient(135deg,#2d1b69,#4c1d95)":canShield?"linear-gradient(135deg,#1e0a3e,#2d1b69)":"#0a0a14",
                          color:shield?"#a855f7":canShield?"#c4b5fd":"#334155",
                          border:`1px solid ${shield?"#7c3aed":canShield?"#4c1d95":"#1e1e3f"}`,
                          cursor:canShield?"pointer":"default",
                        }}>
                          {shield ? "🛡️ Shield Active" : owned===0 ? "Place pixels first" : balance<shieldCost ? `Need ${(shieldCost-balance).toFixed(0)} more` : "🛡️ Activate Shield"}
                        </button>
                      </div>
                    )}
                    <div style={{background:"#0d0d1a",border:"1px solid #0e2a36",borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:"#64748b",marginBottom:6,letterSpacing:1}}>STRIKE ODDS</div>
                      {[
                        {tier:"Common",  chance:"5%",   mult:"5×",   color:"#64748b"},
                        {tier:"Rare",    chance:"1%",   mult:"25×",  color:"#22d3ee"},
                        {tier:"Legendary",chance:"0.1%",mult:"200×", color:"#f59e0b"},
                      ].map(s => (
                        <div key={s.tier} style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:10}}>
                          <span style={{color:s.color}}>{s.tier}</span>
                          <span style={{color:"#334155"}}>{s.chance}</span>
                          <span style={{color:s.color,fontWeight:"bold"}}>{s.mult}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {mobileTab === "stats" && (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{background:"#0d0d1a",border:"1px solid #1e1e3f",borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:"#64748b",marginBottom:6,letterSpacing:1}}>TOP PLAYERS</div>
                    {[
                      {addr:"0xaf1…c32", px:1284, isYou:false},
                      {addr:"0x7a3…b9f", px:963,  isYou:false},
                      {addr:WALLET,      px:owned, isYou:true},
                      {addr:"0x99d…441", px:312,  isYou:false},
                      {addr:"0xb82…71a", px:148,  isYou:false},
                    ].sort((a,b)=>b.px-a.px).slice(0,5).map((p,i) => (
                      <div key={p.addr} style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:10,color:p.isYou?"#a855f7":i===0?"#f59e0b":"#475569"}}>
                        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{i+1}. {p.addr}</span>
                        <span style={{flexShrink:0,marginLeft:4}}>{p.px}px</span>
                      </div>
                    ))}
                  </div>
                  <div style={{background:"#0d0d1a",border:"1px solid #1e1e3f",borderRadius:8,padding:"8px 10px",fontSize:10}}>
                    <div style={{color:"#64748b",marginBottom:6,fontSize:9,letterSpacing:1}}>HOLDR STATUS</div>
                    <div style={{height:4,background:"#12121a",borderRadius:2,marginBottom:4}}>
                      <div style={{height:"100%",background:isHoldr?"#a855f7":"#4c1d95",width:`${holdrProgress}%`,borderRadius:2,transition:"width 0.5s"}}/>
                    </div>
                    <div style={{fontSize:9,color:isHoldr?"#a855f7":"#334155"}}>{isHoldr?"✓ HOLDR":`${Math.floor(holdrProgress)}% — need ${Math.max(0,Math.ceil((10000/12)-owned))} more px`}</div>
                  </div>
                </div>
              )}

              {mobileTab === "log" && (
                <div style={{fontSize:10,lineHeight:2}}>
                  {log.slice(0,12).map((l,i) => (
                    <div key={i} style={{color:i===0?"#a855f7":"#334155",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l}</div>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {/* RIGHT PANEL */}
        <div style={{width:196,borderLeft:"1px solid #1e1e3f",padding:12,display:isMobile?"none":"flex",flexDirection:"column",gap:10,flexShrink:0,background:"#070710"}}>
          {/* Color picker */}
          <div>
            <div style={{fontSize:9,color:"#64748b",marginBottom:8,letterSpacing:1}}>COLOR</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
              {PALETTE.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  aspectRatio:"1",borderRadius:4,background:c,border:"none",cursor:"pointer",
                  outline:color===c?"2px solid #ffffff":"2px solid transparent",
                  outlineOffset:2,transition:"outline 0.1s",
                }}/>
              ))}
            </div>
            <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6,fontSize:9}}>
              <div style={{width:14,height:14,borderRadius:3,background:color,flexShrink:0,border:"1px solid #2d1b69"}}/>
              <span style={{color:"#475569"}}>{color}</span>
            </div>
          </div>

          {/* Strike tiers */}
          <div style={{background:"#0d0d1a",border:"1px solid #0e2a36",borderRadius:8,padding:10}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:8,letterSpacing:1}}>STRIKE ODDS</div>
            {[
              {tier:"Common",  chance:"5%",   mult:"5×",   color:"#64748b"},
              {tier:"Rare",    chance:"1%",   mult:"25×",  color:"#22d3ee"},
              {tier:"Legendary",chance:"0.1%",mult:"200×", color:"#f59e0b"},
            ].map(s => (
              <div key={s.tier} style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:9}}>
                <span style={{color:s.color}}>{s.tier}</span>
                <span style={{color:"#334155"}}>{s.chance}</span>
                <span style={{color:s.color,fontWeight:"bold"}}>{s.mult}</span>
              </div>
            ))}
            <div style={{marginTop:6,fontSize:8,color:"#1e3a4f",lineHeight:1.6}}>
              Pyth Entropy RNG · on-chain verifiable
            </div>
          </div>

          {/* Activity log */}
          <div style={{background:"#0d0d1a",border:"1px solid #1e1e3f",borderRadius:8,padding:10,flex:1,overflow:"hidden"}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:8,letterSpacing:1}}>ACTIVITY LOG</div>
            <div style={{fontSize:8,lineHeight:2,overflow:"hidden"}}>
              {log.slice(0,8).map((l,i) => (
                <div key={i} style={{color:i===0?"#a855f7":"#334155",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l}</div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div style={{background:"#0d0d1a",border:"1px solid #1e1e3f",borderRadius:8,padding:10}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:10,letterSpacing:1}}>TOP PLAYERS</div>
            {[
              {addr:"0xaf1…c32", px:1284, earn:24680, isYou:false},
              {addr:"0x7a3…b9f", px:963,  earn:18420, isYou:false},
              {addr:WALLET,      px:owned, earn:Math.floor(balance), isYou:true},
              {addr:"0x99d…441", px:312,  earn:6180,  isYou:false},
              {addr:"0xb82…71a", px:148,  earn:2860,  isYou:false},
            ]
            .sort((a,b)=>b.px-a.px)
            .slice(0,5)
            .map((p,i) => (
              <div key={p.addr} style={{
                display:"flex",justifyContent:"space-between",
                marginBottom:6,fontSize:9,
                color:p.isYou?"#a855f7":i===0?"#f59e0b":"#475569",
              }}>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:90}}>
                  {i+1}. {p.addr}
                </span>
                <span style={{flexShrink:0,marginLeft:4}}>{p.px}px</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
